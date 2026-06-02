// k6-tests/retry-test.js
import http from 'k6/http';
import { sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const retryDetected = new Counter('retry_detected');
const cbDetected    = new Counter('cb_detected');
const responseTime  = new Trend('response_time_ms');

// ─── PHASES (dựa trên __ITER — số vòng lặp, không phải wall-clock) ────────────
// sleep(2) mỗi iter → mỗi iter ~2s
// Phase 1: iter 0-29   (~0-60s)   → warm up, service đang chạy bình thường
// Phase 2: iter 30-59  (~60-120s) → TẮT product-service trong khoảng này
// Phase 3: iter 60+    (~120s+)   → CB nên OPEN, quan sát fail fast
// ─────────────────────────────────────────────────────────────────────────────
export let options = {
    vus: 1,
    duration: '180s',
};

const BASE_URL = 'http://localhost:8080/api/products';

// ── Nhận diện CB OPEN ─────────────────────────────────────────────────────────
// Khi CB open, gateway forward đến FallbackController
// FallbackController trả body JSON có "fallback": true
// Duration rất thấp (< 200ms) vì không cần chờ upstream
function isCbOpen(res, duration) {
    if (!res || res.status === 0) return false; // timeout thuần — chưa phải CB

    // Ưu tiên check body JSON
    try {
        const body = JSON.parse(res.body);
        if (body.fallback === true) return true;
    } catch (_) {}

    // Fallback heuristic: 4xx/5xx trả về rất nhanh (< 200ms)
    // Lúc service chết bình thường phải đợi timeout + retry → tốn nhiều giây
    // CB open thì fail ngay lập tức
    const isFastFail = duration < 200;
    const isErrorStatus = res.status >= 400;
    return isFastFail && isErrorStatus;
}

function requestWithRetry(url, iter) {
    const start    = Date.now();
    const res      = http.get(url, {
        timeout: '30s',  // đủ dài để gateway hoàn tất retry (3 × 5s backoff = ~13s)
    });
    const duration = Date.now() - start;

    responseTime.add(duration);

    // ── CB OPEN → fail fast ──
    if (isCbOpen(res, duration)) {
        console.log(`⚡ [CB OPEN] status=${res.status} | ${duration}ms | fallback=true`);
        cbDetected.add(1);
        return;
    }

    // ── SUCCESS ──
    if (res.status === 200) {
        if (iter === 0) {
            console.log(`✅ SUCCESS | ${duration}ms`);
        } else {
            console.log(`✅ SUCCESS | ${duration}ms`);
        }
        return;
    }

    // ── TIMEOUT (status=0) ──
    if (res.status === 0) {
        console.log(`⏱ TIMEOUT | ${duration}ms | gateway retrying upstream...`);
        retryDetected.add(1);
        return;
    }

    // ── FAIL thông thường (5xx sau khi gateway retry xong, CB chưa mở) ──
    console.log(`❌ FAILED | status=${res.status} | ${duration}ms | retries exhausted, CB chưa đủ ngưỡng`);
    retryDetected.add(1);
}

export default function () {
    // __ITER là biến built-in của k6: 0, 1, 2, ... tăng mỗi iteration
    const iter = __ITER;

    if (iter < 30) {
        if (iter === 0)  console.log('\n WARM-UP — service đang chạy bình thường');
    } else if (iter < 60) {

    } else {
    }

    requestWithRetry(BASE_URL, iter);
    sleep(2);
}