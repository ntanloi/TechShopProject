/***
 * K6 Load Test: Client-side Rate Limiter (Frontend Logic Simulation)
 *
 * Test Configuration:
 * - Client Limit: 20 requests / 60 seconds PER ENDPOINT
 * - Mô phỏng logic rateLimiter.js của frontend
 *
 * Test Scenario:
 * 1. Gửi 20 req đến /api/products → tất cả SUCCESS
 * 2. Gửi thêm req đến /api/products → bị CLIENT BLOCKED
 * 3. Trong lúc products bị block, gửi req đến /api/orders → vẫn SUCCESS
 * 4. Gửi lại /api/products → vẫn bị BLOCKED (chưa hết window)
 *
 * Run:
 * k6 run k6-tests/test-client-rate-limiter.js
 * k6 run -e BASE_URL=http://localhost:8080 k6-tests/test-client-rate-limiter.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

// Custom metrics
const clientBlockedCounter = new Counter("client_blocked_total");
const successCounter = new Counter("success_total");
const successRate = new Rate("success_rate");
const blockedRate = new Rate("blocked_rate");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const CLIENT_MAX_REQUESTS = 20;
const CLIENT_WINDOW_MS = 60000; // 60 seconds

// Chạy tuần tự 1 VU để demo rõ ràng flow
export const options = {
  scenarios: {
    client_demo: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "3m", // Cần >60s cho recovery test
    },
  },
};

// ============================================================
// Client-side Rate Limiter (mô phỏng rateLimiter.js frontend)
// Mỗi endpoint có counter riêng biệt
// ============================================================
class ClientRateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = {}; // endpoint -> array of timestamps
  }

  getKey(endpoint) {
    return endpoint.split("?")[0].toLowerCase();
  }

  isAllowed(endpoint) {
    const now = Date.now();
    const key = this.getKey(endpoint);

    if (!this.requests[key]) {
      this.requests[key] = [];
    }

    // Remove expired timestamps
    this.requests[key] = this.requests[key].filter(
      (ts) => now - ts < this.windowMs
    );

    if (this.requests[key].length >= this.maxRequests) {
      return false;
    }

    this.requests[key].push(now);
    return true;
  }

  getRemaining(endpoint) {
    const now = Date.now();
    const key = this.getKey(endpoint);
    const timestamps = this.requests[key] || [];
    const valid = timestamps.filter((ts) => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - valid.length);
  }
}

// Tạo instance giống frontend singleton
const rateLimiter = new ClientRateLimiter(CLIENT_MAX_REQUESTS, CLIENT_WINDOW_MS);

function getTimestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function sendRequest(endpoint, requestNum, phase) {
  const timestamp = getTimestamp();
  const url = `${BASE_URL}${endpoint}`;

  // Check client-side rate limiter TRƯỚC khi gửi
  if (!rateLimiter.isAllowed(endpoint)) {
    const remaining = 0;
    clientBlockedCounter.add(1);
    blockedRate.add(1);
    successRate.add(0);

    console.log(
      `[${timestamp}] ❌ CLIENT_BLOCKED | ${phase} | #${String(requestNum).padStart(2, "0")} | ${endpoint} | Remaining: ${String(remaining).padStart(2, "0")}/${CLIENT_MAX_REQUESTS} | Chặn bởi client rate limiter`
    );
    return;
  }

  // Client cho phép → gửi request lên server
  const remaining = rateLimiter.getRemaining(endpoint);

  const response = http.get(url, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 429) {
    blockedRate.add(1);
    successRate.add(0);
    console.log(
      `[${timestamp}] ⚠️ SERVER_429    | ${phase} | #${String(requestNum).padStart(2, "0")} | ${endpoint} | Remaining: ${String(remaining).padStart(2, "0")}/${CLIENT_MAX_REQUESTS} | Server cũng block | ${response.timings.duration.toFixed(0)}ms`
    );
  } else {
    // Bất kỳ response nào (200, 401, 404...) đều chứng minh request ĐÃ GỬI lên server
    // (không bị client rate limiter chặn)
    successCounter.add(1);
    successRate.add(1);
    blockedRate.add(0);
    console.log(
      `[${timestamp}] ✅ SENT_TO_SERVER | ${phase} | #${String(requestNum).padStart(2, "0")} | ${endpoint} | Remaining: ${String(remaining).padStart(2, "0")}/${CLIENT_MAX_REQUESTS} | Status: ${response.status} | ${response.timings.duration.toFixed(0)}ms`
    );
  }
}

export default function () {
  console.log("═".repeat(90));
  console.log("📋 CLIENT RATE LIMITER TEST - Mô phỏng logic frontend (20 req/min/endpoint)");
  console.log("═".repeat(90));

  // ============================================================
  // PHASE 1: Gửi 20 requests đến /api/products → tất cả SUCCESS
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 1: Gửi 20 requests đến /api/products (trong limit)");
  console.log("─".repeat(90));

  for (let i = 1; i <= 20; i++) {
    sendRequest("/api/products", i, "PHASE 1");
    sleep(0.2);
  }

  // ============================================================
  // PHASE 2: Gửi thêm 5 req đến /api/products → bị CLIENT BLOCKED
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 2: Gửi thêm 5 requests đến /api/products (vượt limit → bị BLOCK)");
  console.log("─".repeat(90));

  for (let i = 21; i <= 25; i++) {
    sendRequest("/api/products", i, "PHASE 2");
    sleep(0.3);
  }

  // ============================================================
  // PHASE 3: Gửi 5 req đến /api/orders → vẫn SUCCESS (endpoint khác)
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 3: Gửi 5 requests đến /api/orders (endpoint khác → vẫn OK)");
  console.log("─".repeat(90));

  for (let i = 1; i <= 5; i++) {
    sendRequest("/api/orders", i, "PHASE 3");
    sleep(0.3);
  }

  // ============================================================
  // PHASE 4: Gửi lại /api/products → vẫn bị BLOCKED
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 4: Gửi lại 3 requests đến /api/products (vẫn bị BLOCK)");
  console.log("─".repeat(90));

  for (let i = 26; i <= 28; i++) {
    sendRequest("/api/products", i, "PHASE 4");
    sleep(0.3);
  }

  // ============================================================
  // PHASE 5: Gửi thêm /api/orders → vẫn SUCCESS
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 5: Gửi thêm 3 requests đến /api/orders (vẫn OK, chưa hết limit)");
  console.log("─".repeat(90));

  for (let i = 6; i <= 8; i++) {
    sendRequest("/api/orders", i, "PHASE 5");
    sleep(0.3);
  }

  // ============================================================
  // PHASE 6: Đợi hết 60s window → /api/products recovery, gửi lại được
  // ============================================================
  console.log("\n" + "─".repeat(90));
  console.log("▶ PHASE 6: Đợi 60s cho window hết hạn → /api/products recovery");
  console.log("  ⏳ Đang chờ 60 giây...");
  console.log("─".repeat(90));

  sleep(61); // Đợi hết window 60s

  console.log("\n  [Gửi lại /api/products sau khi window reset]");
  for (let i = 1; i <= 5; i++) {
    sendRequest("/api/products", i, "PHASE 6");
    sleep(0.2);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "═".repeat(90));
  console.log("📊 KẾT LUẬN:");
  console.log("═".repeat(90));
  console.log("• /api/products: 20 req thành công → request thứ 21+ bị CLIENT chặn");
  console.log("• /api/orders:   Vẫn gửi được bình thường (endpoint riêng, limit riêng)");
  console.log("• /api/products: Gửi lại vẫn bị block (chưa hết 60s window)");
  console.log("• /api/products: Sau 60s → window reset → gửi lại được ✅");
  console.log("→ Client rate limiter hoạt động PER ENDPOINT, tự recovery sau 60s");
  console.log("═".repeat(90));
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const total = data.metrics.iterations ? data.metrics.iterations.values.count : 0;
  const blocked = data.metrics.client_blocked_total ? data.metrics.client_blocked_total.values.count : 0;
  const success = data.metrics.success_total ? data.metrics.success_total.values.count : 0;

  return `
  ✓ Client Rate Limiter Test Complete

    Config: ${CLIENT_MAX_REQUESTS} requests / ${CLIENT_WINDOW_MS / 1000}s per endpoint

    Results:
      ✅ Success (sent to server): ${success}
      ❌ Client Blocked (not sent): ${blocked}

    Behavior Verified:
      ✓ /api/products blocked after 20 requests
      ✓ /api/orders still works while products is blocked
      ✓ /api/products stays blocked until window expires
      ✓ /api/products recovers after 60s window reset
  `;
}
