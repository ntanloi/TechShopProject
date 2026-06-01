// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  test-loadbalancer-product.js                                                ║
// ║                                                                              ║
// ║  MỤC TIÊU: Kiểm chứng SCALE 2 instance product + LOAD BALANCER chia đều       ║
// ║  ─────────────────────────────────────────────────────────────────────────   ║
// ║  • Gọi QUA nginx-lb (cổng 8090) — load balancer THUẦN, KHÔNG rate limit.     ║
// ║    nginx forward thẳng tới product-service, KHÔNG qua gateway/token bucket    ║
// ║    → không bị 429 chặn → đo được capacity thật khi scale.                    ║
// ║  • nginx round-robin giữa 2 instance (qua Docker DNS) và gắn header           ║
// ║    X-Upstream-Addr = IP:port instance đã phục vụ → biết CHÍNH XÁC request     ║
// ║    do instance nào xử lý (không cần sửa code Java).                           ║
// ║  • Log + summary giống test-overload, BỔ SUNG: request đi về instance nào +   ║
// ║    bảng phân phối tải giữa các instance.                                      ║
// ║                                                                              ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║  CHUẨN BỊ (KHÔNG build lại service Java nào):                                ║
// ║   docker-compose -f docker-compose.yml -f docker-compose.lb.yml \             ║
// ║     up -d --scale product-service=2                                           ║
// ║   # chờ ~30s cho 2 instance product khởi động + kết nối DB                   ║
// ║                                                                              ║
// ║  CHẠY:                                                                        ║
// ║   k6 run k6-tests/test-loadbalancer-product.js                               ║
// ║   k6 run -e BASE_URL=http://localhost:8090 k6-tests/test-loadbalancer-product.js ║
// ║                                                                              ║
// ║  LƯU Ý: PHẢI gọi qua nginx-lb (8090). nginx forward thẳng tới product nên     ║
// ║         path KHÔNG có prefix /api (đó là của gateway).                        ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:8090';
const REQ_TIMEOUT = __ENV.REQ_TIMEOUT || '10s';
const LOG_SUCCESS  = (__ENV.LOG_SUCCESS || 'sample').toLowerCase();
const LOG_SAMPLE_N = parseInt(__ENV.LOG_SAMPLE_N || '50', 10);

const SAMPLE_PRODUCT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SEARCH_KEYWORDS    = ['laptop', 'phone', 'tablet', 'watch', 'headphone', 'camera'];
const CATEGORY_IDS       = [1, 2, 3, 4];

const listLatency     = new Trend('latency_list_ms', true);
const detailLatency   = new Trend('latency_detail_ms', true);
const searchLatency   = new Trend('latency_search_ms', true);
const categoryLatency = new Trend('latency_category_ms', true);
const totalRequests   = new Counter('product_total_requests');
const successRate     = new Rate('product_success_rate');
const serverErrors    = new Counter('product_5xx_errors');
const timeouts        = new Counter('product_timeouts');
const overloadRate    = new Rate('product_overload_rate');
const MAX_INSTANCE_SLOTS = 12;
const perInstanceHits = new Counter('lb_instance_hits');
const unknownInstance = new Counter('lb_instance_unknown');
const firstOverloadAt  = new Trend('product_first_overload_request');
const firstOverloadVUs = new Trend('product_first_overload_vus');
const firstOverloadSec = new Trend('product_first_overload_sec');
let firstOverloadRecorded = false;

function reqSeq() { return `REQ #${__VU}-${__ITER + 1}`; }

function hashSlot(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return Math.abs(h) % MAX_INSTANCE_SLOTS;
}

function getInstance(res) {
  const addr = res.headers['X-Upstream-Addr'] || res.headers['x-upstream-addr'];
  if (addr && addr.length > 0) {
    const last = addr.split(',').pop().trim();
    return { full: last, slot: hashSlot(last), known: true };
  }
  return { full: 'UNKNOWN', slot: -1, known: false };
}

const slotToName = {};

function shouldLogSuccess() {
  if (LOG_SUCCESS === 'off') return false;
  if (LOG_SUCCESS === 'all') return true;
  if (__ITER < 3) return true;
  return (__ITER % LOG_SAMPLE_N) === 0;
}

function classify(operation, res, latencyTrend) {
  totalRequests.add(1);
  latencyTrend.add(res.timings.duration);
  const isTimeout = res.status === 0;
  const is5xx = res.status >= 500 && res.status <= 599;
  const overload = isTimeout || is5xx;
  if (isTimeout) timeouts.add(1);
  if (is5xx) serverErrors.add(1);
  overloadRate.add(overload ? 1 : 0);
  successRate.add(overload ? 0 : 1);

  let instLabel = '—';
  if (!isTimeout) {
    const inst = getInstance(res);
    if (inst.known) {
      perInstanceHits.add(1, { slot: String(inst.slot) });
      if (slotToName[inst.slot] === undefined) {
        slotToName[inst.slot] = inst.full;
        console.log(`  [LB-MAP] slot ${inst.slot} = instance ${inst.full}`);
      }
      instLabel = `inst ${inst.full} (slot ${inst.slot})`;
    } else {
      unknownInstance.add(1);
      instLabel = 'inst UNKNOWN';
    }
  }

  const prefix =
    `[${reqSeq().padEnd(12)}][VU:${String(__VU).padStart(4, '0')}][ITER:${String(__ITER).padStart(5, '0')}] ` +
    `${operation.padEnd(20)} → HTTP ${res.status} | ${Math.round(res.timings.duration)}ms`;

  if (overload) {
    if (!firstOverloadRecorded) {
      const globalReqNo = exec.instance.iterationsCompleted + 1;
      const vusActive = exec.instance.vusActive;
      const elapsedSec = exec.instance.currentTestRunDuration / 1000;
      firstOverloadAt.add(globalReqNo);
      firstOverloadVUs.add(vusActive);
      firstOverloadSec.add(elapsedSec);
      firstOverloadRecorded = true;
      console.error(
        `\n🔥 [ĐUỐI LẦN ĐẦU] ~${vusActive} VUs đồng thời | t=${elapsedSec.toFixed(1)}s | ${operation} → HTTP ${res.status}\n`
      );
    }
    console.error(`${prefix} | ⚠ OVERLOAD | ${res.error || (res.body ? String(res.body).substring(0, 80) : 'no body')}`);
  } else if (shouldLogSuccess()) {
    const mark = res.status >= 200 && res.status < 300 ? '✅ OK  '
               : res.status >= 400 && res.status < 500 ? `↪ ${res.status} `
               : `· ${res.status} `;
    console.log(`${prefix} | ${mark} | 🖥  ${instLabel}`);
  }
  return overload;
}

export const options = {
  noConnectionReuse: false,
  scenarios: {
    warmup: {
      executor: 'ramping-vus', startVUs: 0,
      stages: [{ duration: '8s', target: 200 }, { duration: '7s', target: 200 }],
      exec: 'productWorkload', gracefulStop: '5s', tags: { phase: 'warmup' },
    },
    ramp: {
      executor: 'ramping-vus', startVUs: 200, startTime: '15s',
      stages: [{ duration: '10s', target: 1000 }, { duration: '10s', target: 2000 }],
      exec: 'productWorkload', gracefulStop: '5s', tags: { phase: 'ramp' },
    },
    stress: {
      executor: 'ramping-vus', startVUs: 2000, startTime: '35s',
      stages: [{ duration: '10s', target: 3000 }, { duration: '10s', target: 4000 }],
      exec: 'productWorkload', gracefulStop: '5s', tags: { phase: 'stress' },
    },
    peak: {
      executor: 'constant-vus', vus: 4000, startTime: '55s', duration: '15s',
      exec: 'productWorkload', gracefulStop: '5s', tags: { phase: 'peak' },
    },
  },
  thresholds: (function () {
    const t = {
      'latency_list_ms': ['p(95)<3000'],
      'latency_detail_ms': ['p(95)<2000'],
      'product_overload_rate': ['rate<0.10'],
      'product_total_requests': ['count>100'],
      'lb_instance_hits': ['count>0'],
    };
    for (let i = 0; i < MAX_INSTANCE_SLOTS; i++) {
      t[`lb_instance_hits{slot:${i}}`] = ['count>=0'];
    }
    return t;
  })(),
};

export function productWorkload() {
  const params = {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Request-Id': `k6-vu${__VU}-iter${__ITER}-${Date.now()}` },
    timeout: REQ_TIMEOUT,
  };
  const rand = Math.random();
  if (rand < 0.40) {
    group('LIST /products', () => {
      const page = Math.floor(Math.random() * 5);
      const size = [10, 20][Math.floor(Math.random() * 2)];
      const res = http.get(`${BASE_URL}/products?page=${page}&size=${size}`, { ...params, tags: { operation: 'list' } });
      classify('LIST products', res, listLatency);
      check(res, { 'list: không 5xx': (r) => !(r.status >= 500), 'list: không timeout': (r) => r.status !== 0 });
    });
  } else if (rand < 0.60) {
    group('DETAIL /products/:id', () => {
      const id = SAMPLE_PRODUCT_IDS[Math.floor(Math.random() * SAMPLE_PRODUCT_IDS.length)];
      const res = http.get(`${BASE_URL}/products/${id}`, { ...params, tags: { operation: 'detail' } });
      classify(`DETAIL product/${id}`, res, detailLatency);
      check(res, { 'detail: không 5xx': (r) => !(r.status >= 500), 'detail: không timeout': (r) => r.status !== 0 });
    });
  } else if (rand < 0.90) {
    group('SEARCH /products/search', () => {
      const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
      const res = http.get(`${BASE_URL}/products/search?keyword=${encodeURIComponent(keyword)}&page=0&size=20`, { ...params, tags: { operation: 'search' } });
      classify(`SEARCH "${keyword}"`, res, searchLatency);
      check(res, { 'search: không 5xx': (r) => !(r.status >= 500), 'search: không timeout': (r) => r.status !== 0 });
    });
  } else {
    group('CATEGORY /products/category/:id', () => {
      const catId = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
      const res = http.get(`${BASE_URL}/products/category/${catId}?page=0&size=20`, { ...params, tags: { operation: 'category' } });
      classify(`CATEGORY/${catId}`, res, categoryLatency);
      check(res, { 'category: không 5xx': (r) => !(r.status >= 500), 'category: không timeout': (r) => r.status !== 0 });
    });
  }
  const thinkTime = __VU < 500 ? Math.random() * 0.3 + 0.1
                  : __VU < 1000 ? Math.random() * 0.15 + 0.05
                  : Math.random() * 0.08 + 0.02;
  sleep(thinkTime);
}

export function setup() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║   K6 LOAD BALANCER TEST — product-service (QUA nginx-lb, KHÔNG limit)║
╠══════════════════════════════════════════════════════════════════════╣
║  nginx-lb URL : ${BASE_URL.padEnd(51)}║
║  Tổng thời gian   : ~1 phút 10 giây                                 ║
║  Mục tiêu     : scale + LB chia đều + đo capacity (không rate limit)║
╠══════════════════════════════════════════════════════════════════════╣
║  Warmup  0:00–0:15     0 →  200 VUs                                ║
║  Ramp    0:15–0:35   200 → 2000 VUs                                ║
║  Stress  0:35–0:55  2000 → 4000 VUs                                ║
║  Peak    0:55–1:10   giữ 4000 VUs                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║  PATH: /products, /products/:id, /products/search, /products/category║
║  LOG: 🖥 inst <ip:port> — request do instance nào phục vụ            ║
╚══════════════════════════════════════════════════════════════════════╝`);

  console.log('\n[SETUP] Kiểm tra nginx-lb...');
  const lb = http.get(`${BASE_URL}/lb-health`, { timeout: '5s' });
  if (lb.status === 200) console.log(`[SETUP] ✓ nginx-lb online: ${BASE_URL}`);
  else console.warn(`[SETUP] ⚠ nginx-lb không phản hồi — HTTP ${lb.status}. Chạy: docker-compose -f docker-compose.yml -f docker-compose.lb.yml up -d --scale product-service=2`);

  const probe = http.get(`${BASE_URL}/products?page=0&size=1`, { timeout: '5s' });
  const addr = probe.headers['X-Upstream-Addr'] || probe.headers['x-upstream-addr'];
  if (addr) console.log(`[SETUP] ✓ X-Upstream-Addr: ${addr}`);
  else console.warn(`[SETUP] ⚠ Không thấy header X-Upstream-Addr`);

  return { startTime: Date.now() };
}

export function teardown(data) {
  const sec = Math.round((Date.now() - data.startTime) / 1000);
  console.log(`\n╔══════════════════════════════════════════════════════════════════════╗
║  KẾT QUẢ LOAD BALANCER TEST — ${String(Math.floor(sec/60) + 'p ' + (sec%60) + 's').padEnd(38)}║
╚══════════════════════════════════════════════════════════════════════╝`);
}

export function handleSummary(data) {
  const total    = data.metrics['product_total_requests'];
  const t5xx     = data.metrics['product_5xx_errors'];
  const tTimeout = data.metrics['product_timeouts'];
  const ovRate   = data.metrics['product_overload_rate'];
  const unknown  = data.metrics['lb_instance_unknown'];
  const firstVUs = data.metrics['product_first_overload_vus'];
  const firstSec = data.metrics['product_first_overload_sec'];

  const totalReqs  = total    ? Math.round(total.values.count)    : 0;
  const num5xx     = t5xx     ? Math.round(t5xx.values.count)     : 0;
  const numTo      = tTimeout ? Math.round(tTimeout.values.count) : 0;
  const ovCount    = num5xx + numTo;
  const ovPct      = ovRate ? (ovRate.values.rate * 100).toFixed(2) : '0.00';
  const numUnknown = unknown ? Math.round(unknown.values.count) : 0;

  // Bảng phân phối instance
  const perInst = [];
  let lbTotal = 0;
  for (const key of Object.keys(data.metrics)) {
    const mtag = key.match(/^lb_instance_hits\{slot:(\d+)\}$/);
    if (mtag) {
      const cnt = Math.round(data.metrics[key].values.count);
      if (cnt > 0) { perInst.push({ slot: mtag[1], count: cnt }); lbTotal += cnt; }
    }
  }
  perInst.sort((a, b) => b.count - a.count);

  let lbBlock = '\n📊 PHÂN PHỐI TẢI GIỮA CÁC INSTANCE (Load Balancer):\n';
  if (perInst.length === 0) {
    lbBlock += '   ⚠ Không đọc được header X-Upstream-Addr.\n';
  } else {
    for (const inst of perInst) {
      const pct = lbTotal > 0 ? ((inst.count / lbTotal) * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 2));
      lbBlock += '   • slot ' + String(inst.slot).padEnd(3) + ' : ' + String(inst.count).padStart(7) + ' req (' + pct.toFixed(1) + '%) ' + bar + '\n';
    }
    lbBlock += '   ─ Instance: ' + perInst.length + ' | tổng ' + lbTotal + ' req' + (numUnknown ? ' | ' + numUnknown + ' unknown\n' : '\n');
    lbBlock += '   (Xem [LB-MAP] phía trên để biết slot = IP:port nào)\n';
    if (perInst.length >= 2) {
      const maxPct = (perInst[0].count / lbTotal) * 100;
      lbBlock += maxPct <= 65
        ? '   ✅ LB phân phối CÂN BẰNG (' + maxPct.toFixed(1) + '% ≤ 65%).\n'
        : '   ⚠ LB LỆCH: 1 instance chiếm ' + maxPct.toFixed(1) + '%.\n';
    } else {
      lbBlock += '   ⚠ CHỈ thấy 1 instance → chưa scale đủ 2.\n';
    }
  }

  // Kết luận đuối
  let ovBlock;
  if (ovCount > 0 && firstVUs && firstVUs.values && firstVUs.values.min != null) {
    const vus = Math.round(firstVUs.values.min);
    const sec = firstSec && firstSec.values.min != null ? firstSec.values.min.toFixed(1) : '?';
    const pending = vus;
    ovBlock =
      '\n🔴 SERVICE BẮT ĐẦU ĐUỐI khi có ~' + vus + ' người gửi đồng thời (VUs)\n' +
      '   • Số request chưa xử lý xong lúc đó : ~' + pending + ' request (mỗi VU 1 request đang chờ)\n' +
      '   • Thời điểm : t=' + sec + 's kể từ khi test bắt đầu\n' +
      '   • Tổng lỗi : ' + ovCount + ' (' + ovPct + '%) = ' + num5xx + ' lỗi 5xx + ' + numTo + ' timeout\n';
  } else {
    ovBlock = '\n🟢 KHÔNG phát hiện đuối: ' + totalReqs + ' request đều xử lý OK.\n';
  }

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }) + '\n' + lbBlock + ovBlock,
  };
}
