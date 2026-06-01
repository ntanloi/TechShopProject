// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  test-overload-product-direct.js                                             ║
// ║                                                                              ║
// ║  MỤC TIÊU: Ép QUÁ TẢI product-service bằng cách gọi THẲNG vào service        ║
// ║            (BỎ QUA gateway → KHÔNG có token bucket / rate limiter)           ║
// ║  ─────────────────────────────────────────────────────────────────────────   ║
// ║  • Gọi trực tiếp cổng service (mặc định 8082) → không bị Layer 2 chặn       ║
// ║  • Path KHÔNG có prefix /api (vì StripPrefix là của gateway):                ║
// ║       /products, /products/:id, /products/search, /products/category/:id    ║
// ║  • Tải tăng dần & dồn dập để thấy: latency tăng, 5xx, timeout, service đuối ║
// ║                                                                              ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║  CHẠY:                                                                       ║
// ║                                                                              ║
// ║  # Mặc định gọi thẳng product-service ở localhost:8082                       ║
// ║  k6 run k6-tests/test-overload-product-direct.js                            ║
// ║                                                                              ║
// ║  # Chỉ định cổng/host khác                                                  ║
// ║  k6 run -e BASE_URL=http://localhost:8082 \                                 ║
// ║         k6-tests/test-overload-product-direct.js                            ║
// ║                                                                              ║
// ║  # Windows                                                                   ║
// ║  "C:\Program Files\k6\k6.exe" run k6-tests/test-overload-product-direct.js  ║
// ║                                                                              ║
// ║  LƯU Ý: KHÔNG scale nhiều instance cho test này. Gọi thẳng 8082 chỉ tới     ║
// ║         ĐÚNG 1 instance → mới ép được 1 service tới giới hạn xử lý.          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import exec from 'k6/execution';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Gọi THẲNG service, KHÔNG qua gateway 8080 → không có rate limiter.
const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:8082';
// Timeout/req: request treo lâu hơn ngưỡng này coi như service đuối.
const REQ_TIMEOUT = __ENV.REQ_TIMEOUT || '10s';

// ─── LOG CONFIG ──────────────────────────────────────────────────────────────
// LOG_SUCCESS: cách log request THÀNH CÔNG
//   'sample' (mặc định) → log 3 request đầu của mỗi VU + cứ mỗi LOG_SAMPLE_N request 1 dòng
//   'all'               → log MỌI request thành công (rất nhiều dòng ở tải cao, có thể làm chậm k6)
//   'off'               → không log request thành công (chỉ log overload)
const LOG_SUCCESS  = (__ENV.LOG_SUCCESS || 'sample').toLowerCase();
const LOG_SAMPLE_N = parseInt(__ENV.LOG_SAMPLE_N || '200', 10);

// ─── SAMPLE DATA ─────────────────────────────────────────────────────────────
const SAMPLE_PRODUCT_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SEARCH_KEYWORDS    = ['laptop', 'phone', 'tablet', 'watch', 'headphone', 'camera'];
const CATEGORY_IDS       = [1, 2, 3, 4];

// ─── CUSTOM METRICS ──────────────────────────────────────────────────────────
const listLatency     = new Trend('latency_list_ms',     true);
const detailLatency   = new Trend('latency_detail_ms',   true);
const searchLatency   = new Trend('latency_search_ms',   true);
const categoryLatency = new Trend('latency_category_ms', true);

const totalRequests   = new Counter('product_total_requests');
const successRate     = new Rate('product_success_rate');
const serverErrors    = new Counter('product_5xx_errors');   // 500/502/503/504 = service đuối
const timeouts        = new Counter('product_timeouts');     // status 0 = treo/đứt kết nối
const overloadRate    = new Rate('product_overload_rate');   // tỉ lệ 5xx + timeout

// Ghi nhận BỐI CẢNH ngay tại request đầu tiên bị đuối (5xx/timeout).
// Dùng Trend + min để lấy giá trị nhỏ nhất across mọi VU vào cuối test.
// Vì tải tăng dần (monotonic), request đuối SỚM NHẤT cũng có số VU & thời điểm nhỏ nhất.
const firstOverloadAt  = new Trend('product_first_overload_request'); // số thứ tự request
const firstOverloadVUs = new Trend('product_first_overload_vus');     // số người gửi đồng thời
const firstOverloadSec = new Trend('product_first_overload_sec');     // giây kể từ khi test bắt đầu
// Cờ per-VU: mỗi VU chỉ ghi mốc 1 lần để tránh đếm trùng.
let firstOverloadRecorded = false;

// ─── REQUEST SEQUENCE NUMBER ──────────────────────────────────────────────────
function reqSeq() {
  return `REQ #${__VU}-${__ITER + 1}`;
}

// ─── HELPER: suy ra GIAI ĐOẠN theo số giây (khớp với cấu hình scenarios) ──────
function phaseFromSec(sec) {
  if (sec < 20) return 'Warmup (0–20s, tải nhẹ)';
  if (sec < 50) return 'Ramp   (20–50s, 100→1000 VUs)';
  if (sec < 85) return 'Stress (50–85s, 1000→3000 VUs)';
  return            'Spike  (85s+, 2000→12000 req/s)';
}

// ─── HELPER: quyết định có log request thành công không ───────────────────────
// Lấy mẫu để tránh ngập terminal ở tải cao: log 3 request đầu mỗi VU,
// sau đó cứ mỗi LOG_SAMPLE_N request mới log 1 dòng.
function shouldLogSuccess() {
  if (LOG_SUCCESS === 'off')  return false;
  if (LOG_SUCCESS === 'all')  return true;
  // 'sample'
  if (__ITER < 3) return true;
  return (__ITER % LOG_SAMPLE_N) === 0;
}

// ─── HELPER: phân loại response & ghi metric ──────────────────────────────────
// Trả về true nếu là dấu hiệu QUÁ TẢI (5xx hoặc timeout).
function classify(operation, res, latencyTrend) {
  totalRequests.add(1);
  latencyTrend.add(res.timings.duration);

  const isTimeout = res.status === 0;                       // treo / đứt kết nối
  const is5xx     = res.status >= 500 && res.status <= 599; // service trả lỗi
  const overload  = isTimeout || is5xx;

  if (isTimeout) timeouts.add(1);
  if (is5xx)     serverErrors.add(1);

  overloadRate.add(overload ? 1 : 0);
  // 2xx/3xx/4xx (trừ 5xx) coi như service vẫn xử lý được
  successRate.add(overload ? 0 : 1);

  const prefix =
    `[${reqSeq().padEnd(12)}][VU:${String(__VU).padStart(4, '0')}][ITER:${String(__ITER).padStart(5, '0')}] ` +
    `${operation.padEnd(20)} → HTTP ${res.status} | ${Math.round(res.timings.duration)}ms`;

  if (overload) {
    // Ghi BỐI CẢNH lúc service bắt đầu đuối (mỗi VU 1 lần, ngay error ĐẦU TIÊN).
    // - globalReqNo: số thứ tự request toàn cục (mỗi iteration = 1 request).
    // - vusActive  : số "người" đang gửi request đồng thời tại thời điểm đó.
    // - elapsedSec : số giây kể từ khi test bắt đầu → suy ra đang ở giai đoạn nào.
    if (!firstOverloadRecorded) {
      const globalReqNo = exec.instance.iterationsCompleted + 1;
      const vusActive   = exec.instance.vusActive;
      const elapsedSec  = exec.instance.currentTestRunDuration / 1000;
      firstOverloadAt.add(globalReqNo);
      firstOverloadVUs.add(vusActive);
      firstOverloadSec.add(elapsedSec);
      firstOverloadRecorded = true;
      console.error(
        `\n🔥 [ĐUỐI LẦN ĐẦU] tại ${phaseFromSec(elapsedSec)} | ` +
        `~${vusActive} người gửi đồng thời | request thứ ~${globalReqNo} | ` +
        `t=${elapsedSec.toFixed(1)}s | ${operation} → HTTP ${res.status}\n`
      );
    }
    // Luôn log dấu hiệu quá tải (5xx hoặc connection refused/timeout)
    console.error(
      `${prefix} | ⚠ OVERLOAD | ` +
      (res.error ? res.error : (res.body ? String(res.body).substring(0, 80) : 'no body'))
    );
  } else if (shouldLogSuccess()) {
    // Log request được xử lý: phân biệt 2xx (OK) và 4xx (vd 404 không có data)
    const mark = res.status >= 200 && res.status < 300 ? '✅ OK     '
               : res.status >= 400 && res.status < 500 ? `↪ ${res.status}    `
               : `· ${res.status}    `;
    console.log(`${prefix} | ${mark}`);
  }
  return overload;
}

// ─── OPTIONS: ép tải tăng dần rồi dồn dập (KHÔNG rate limiter cản đường) ───────
export const options = {
  // Cho phép k6 mở nhiều kết nối/việc hơn để không tự nghẽn phía client.
  noConnectionReuse: false,
  scenarios: {
    // GIAI ĐOẠN 1 — Warmup: 0 → 100 VUs (0:00 – 0:20)
    warmup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '10s', target: 100 },
      ],
      exec: 'productWorkload',
      gracefulStop: '5s',
      tags: { phase: 'warmup' },
    },

    // GIAI ĐOẠN 2 — Ramp: 100 → 1000 VUs (0:20 – 0:50)
    ramp: {
      executor: 'ramping-vus',
      startVUs: 100,
      startTime: '20s',
      stages: [
        { duration: '15s', target: 500 },
        { duration: '15s', target: 1000 },
      ],
      exec: 'productWorkload',
      gracefulStop: '5s',
      tags: { phase: 'ramp' },
    },

    // GIAI ĐOẠN 3 — Stress: 1000 → 3000 VUs (0:50 – 1:25)
    stress: {
      executor: 'ramping-vus',
      startVUs: 1000,
      startTime: '50s',
      stages: [
        { duration: '15s', target: 2000 },
        { duration: '20s', target: 3000 },
      ],
      exec: 'productWorkload',
      gracefulStop: '5s',
      tags: { phase: 'stress' },
    },

    // GIAI ĐOẠN 4 — Spike: leo tốc độ tới 12000 req/s để ép service GÃY (1:25 – 2:20)
    // Dùng ramping-arrival-rate: k6 cố giữ ĐÚNG tốc độ này bất kể response chậm,
    // nên nếu service đuối sẽ lộ ra ngay (5xx, timeout, dropped_iterations).
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 2000,
      timeUnit: '1s',
      startTime: '85s',
      preAllocatedVUs: 3000,
      maxVUs: 10000,
      stages: [
        { duration: '10s', target: 5000 },
        { duration: '10s', target: 8000 },
        { duration: '10s', target: 12000 },
        { duration: '15s', target: 12000 },  // giữ đỉnh 15s để service ngấm tải
      ],
      exec: 'productWorkload',
      gracefulStop: '5s',
      tags: { phase: 'spike' },
    },
  },

  thresholds: {
    // Khi service đuối, các ngưỡng này sẽ FAIL → đó chính là bằng chứng quá tải.
    'latency_list_ms':         ['p(95)<3000'],
    'latency_detail_ms':       ['p(95)<2000'],
    'product_overload_rate':   ['rate<0.10'],   // >10% lỗi 5xx/timeout = service quá tải
    'product_total_requests':  ['count>100'],
  },
};

// ─── MAIN WORKLOAD ────────────────────────────────────────────────────────────
// LƯU Ý PATH: gọi thẳng service nên KHÔNG có prefix /api (StripPrefix là của gateway).
export function productWorkload() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      'X-Request-Id': `k6-vu${__VU}-iter${__ITER}-${Date.now()}`,
    },
    timeout: REQ_TIMEOUT,
  };

  const rand = Math.random();

  if (rand < 0.40) {
    // ── 40%: Xem danh sách sản phẩm ─────────────────────────────────────
    group('LIST /products', () => {
      const page = Math.floor(Math.random() * 5);
      const size = [10, 20][Math.floor(Math.random() * 2)];
      const res  = http.get(
        `${BASE_URL}/products?page=${page}&size=${size}`,
        { ...params, tags: { operation: 'list' } }
      );
      classify('LIST products', res, listLatency);
      check(res, {
        'list: không 5xx':     (r) => !(r.status >= 500),
        'list: không timeout': (r) => r.status !== 0,
      });
    });

  } else if (rand < 0.60) {
    // ── 20%: Xem chi tiết sản phẩm ───────────────────────────────────────
    group('DETAIL /products/:id', () => {
      const id  = SAMPLE_PRODUCT_IDS[Math.floor(Math.random() * SAMPLE_PRODUCT_IDS.length)];
      const res = http.get(
        `${BASE_URL}/products/${id}`,
        { ...params, tags: { operation: 'detail' } }
      );
      classify(`DETAIL product/${id}`, res, detailLatency);
      check(res, {
        'detail: không 5xx':     (r) => !(r.status >= 500),
        'detail: không timeout': (r) => r.status !== 0,
      });
    });

  } else if (rand < 0.90) {
    // ── 30%: Tìm kiếm sản phẩm (endpoint NẶNG nhất — ép DB/CPU) ───────────
    group('SEARCH /products/search', () => {
      const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
      const res = http.get(
        `${BASE_URL}/products/search?keyword=${encodeURIComponent(keyword)}&page=0&size=20`,
        { ...params, tags: { operation: 'search' } }
      );
      classify(`SEARCH "${keyword}"`, res, searchLatency);
      check(res, {
        'search: không 5xx':     (r) => !(r.status >= 500),
        'search: không timeout': (r) => r.status !== 0,
      });
    });

  } else {
    // ── 10%: Lọc theo danh mục ───────────────────────────────────────────
    group('CATEGORY /products/category/:id', () => {
      const catId = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
      const res = http.get(
        `${BASE_URL}/products/category/${catId}?page=0&size=20`,
        { ...params, tags: { operation: 'category' } }
      );
      classify(`CATEGORY/${catId}`, res, categoryLatency);
      check(res, {
        'category: không 5xx':     (r) => !(r.status >= 500),
        'category: không timeout': (r) => r.status !== 0,
      });
    });
  }

  // Think time ngắn dần khi VU tăng để dồn áp lực lên service.
  const thinkTime = __VU < 500   ? Math.random() * 0.2 + 0.05
                  : __VU < 2000  ? Math.random() * 0.05 + 0.01
                  : 0;  // VU rất cao: không nghỉ, bắn liên tục
  if (thinkTime > 0) sleep(thinkTime);
}

// ─── SETUP ────────────────────────────────────────────────────────────────────
export function setup() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║   K6 OVERLOAD TEST — Gọi THẲNG product-service (BỎ QUA gateway)      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Target URL   : ${BASE_URL.padEnd(51)}║
║  Req timeout  : ${String(REQ_TIMEOUT).padEnd(51)}║
║  Log success  : ${String(`${LOG_SUCCESS} (mỗi ${LOG_SAMPLE_N} req / 3 req đầu mỗi VU)`).padEnd(51)}║
║  Tổng thời gian   : ~2 phút 20 giây                                 ║
║  KHÔNG có rate limiter → đo được giới hạn xử lý thật của service     ║
╠══════════════════════════════════════════════════════════════════════╣
║  GIAI ĐOẠN 1 — Warmup  0:00–0:20     0 →  100 VUs                 ║
║  GIAI ĐOẠN 2 — Ramp    0:20–0:50   100 → 1000 VUs                 ║
║  GIAI ĐOẠN 3 — Stress  0:50–1:25  1000 → 3000 VUs                 ║
║  GIAI ĐOẠN 4 — Spike   1:25–2:20  2000 → 12000 req/s (leo+giữ)    ║
╠══════════════════════════════════════════════════════════════════════╣
║  PATH (KHÔNG /api vì gọi thẳng, không qua StripPrefix của gateway): ║
║    40% GET /products           xem danh sách (phân trang)         ║
║    20% GET /products/:id        xem chi tiết                       ║
║    30% GET /products/search     tìm kiếm (NẶNG — ép DB/CPU)        ║
║    10% GET /products/category   lọc theo danh mục                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  DẤU HIỆU QUÁ TẢI: HTTP 5xx, timeout (status 0), p95 latency tăng   ║
╚══════════════════════════════════════════════════════════════════════╝`);

  console.log('\n[SETUP] Kiểm tra service online (gọi thẳng, không qua gateway)...');
  const res = http.get(`${BASE_URL}/actuator/health`, { timeout: '5s' });
  if (res.status === 200) {
    console.log(`[SETUP] ✓ Service online: ${BASE_URL}`);
  } else {
    console.warn(
      `[SETUP] ⚠ Service không phản hồi tại ${BASE_URL}/actuator/health — HTTP ${res.status}.\n` +
      `         Đảm bảo product-service đang chạy và cổng đã expose (docker-compose.yml: 8082).\n` +
      `         KHÔNG scale nhiều instance cho test này (gọi thẳng chỉ tới 1 instance).`
    );
  }
  return { startTime: Date.now() };
}

// ─── TEARDOWN ────────────────────────────────────────────────────────────────
export function teardown(data) {
  const sec = Math.round((Date.now() - data.startTime) / 1000);
  const min = Math.floor(sec / 60);
  const s   = sec % 60;
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                  KẾT QUẢ OVERLOAD TEST (gọi thẳng)                   ║
╠══════════════════════════════════════════════════════════════════════╣
║  Thời gian chạy  : ${String(`${min}p ${s}s`).padEnd(49)}║
║                                                                      ║
║  Đọc kết quả:                                                       ║
║   • product_5xx_errors      → số request service trả lỗi 5xx        ║
║   • product_timeouts        → số request treo/đứt (status 0)        ║
║   • product_overload_rate   → tỉ lệ quá tải (5xx + timeout)         ║
║   • latency_*_ms p95/p99    → độ trễ tăng dần khi service đuối      ║
║                                                                      ║
║  Nếu overload_rate cao & latency p95 vượt ngưỡng ở Stress/Spike     ║
║  → đã chạm giới hạn xử lý của 1 instance product-service.           ║
╚══════════════════════════════════════════════════════════════════════╝`);
}

// ─── HANDLE SUMMARY ───────────────────────────────────────────────────────────
// In bảng summary mặc định + kết luận: service bắt đầu đuối ở đâu, bao nhiêu người
// gửi đồng thời, đang nhận bao nhiêu request/giây.
export function handleSummary(data) {
  const firstOv   = data.metrics['product_first_overload_request'];
  const firstVUs  = data.metrics['product_first_overload_vus'];
  const firstSec  = data.metrics['product_first_overload_sec'];
  const total     = data.metrics['product_total_requests'];
  const t5xx      = data.metrics['product_5xx_errors'];
  const tTimeout  = data.metrics['product_timeouts'];
  const ovRate    = data.metrics['product_overload_rate'];
  const httpReqs  = data.metrics['http_reqs'];

  const totalReqs = total    ? Math.round(total.values.count)    : 0;
  const num5xx    = t5xx     ? Math.round(t5xx.values.count)     : 0;
  const numTo     = tTimeout ? Math.round(tTimeout.values.count) : 0;
  const ovCount   = num5xx + numTo;
  const ovPct     = ovRate ? (ovRate.values.rate * 100).toFixed(2) : '0.00';
  // Throughput TRUNG BÌNH toàn test (req/s service nhận). Đỉnh thật cao hơn nhiều.
  const avgRps    = httpReqs ? Math.round(httpReqs.values.rate) : 0;

  // phaseFromSec lặp lại ở đây vì handleSummary chạy ở context riêng của k6.
  const phaseOf = (sec) =>
      sec < 20 ? 'Warmup (0–20s, tải nhẹ)'
    : sec < 50 ? 'Ramp (20–50s, 100→1000 VUs)'
    : sec < 85 ? 'Stress (50–85s, 1000→3000 VUs)'
    :            'Spike (85s+, 2000→12000 req/s)';

  let line;
  // CHỐT NGAY tại error ĐẦU TIÊN (1 timeout/5xx là đủ), không chờ vượt ngưỡng %.
  if (ovCount > 0 && firstOv && firstOv.values && firstOv.values.min != null) {
    const at   = Math.round(firstOv.values.min);
    const vus  = firstVUs && firstVUs.values.min != null ? Math.round(firstVUs.values.min) : '?';
    const sec  = firstSec && firstSec.values.min != null ? firstSec.values.min : null;
    const when = sec != null ? `t≈${sec.toFixed(1)}s` : 't≈?';
    const ph   = sec != null ? phaseOf(sec) : 'không xác định';

    line =
      `\n🔴 SERVICE BẮT ĐẦU ĐUỐI (error đầu tiên xuất hiện):\n` +
      `   • Giai đoạn          : ${ph}\n` +
      `   • Số người gửi đồng thời (VUs active) : ~${vus}\n` +
      `   • Thời điểm          : ${when} | tại request thứ ~${at} / tổng ${totalReqs}\n` +
      `   • Throughput TB toàn test            : ~${avgRps} request/giây service nhận\n` +
      `   • Tổng lỗi quá tải   : ${ovCount} (${ovPct}%) = ${num5xx} lỗi 5xx + ${numTo} timeout/đứt kết nối\n`;
  } else {
    line =
      `\n🟢 KHÔNG phát hiện đuối: ${totalReqs} request đều được xử lý ` +
      `(không có 5xx/timeout), throughput TB ~${avgRps} req/s.\n` +
      `   Service chịu tải tốt — thử tăng spike để ép mạnh hơn.\n`;
  }

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }) + '\n' + line,
  };
}
