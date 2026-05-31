/***
 * K6 Scalability Test - TechShop Microservices
 *
 * Mục tiêu: Kiểm tra khả năng scale của hệ thống khi tăng tải
 * - Horizontal Scaling: product-service chạy nhiều replicas (qua docker-compose.scale.yml)
 * - Load Balancing: Gateway dùng lb://product-service (Eureka round-robin)
 * - Vertical Scaling: Tăng mem_limit / cpus trong docker-compose.scale.yml
 *
 * Cách chạy:
 *
 *  [Bước 1] Chạy hệ thống với 1 replica (baseline):
 *    docker-compose up -d
 *    k6 run k6-tests/test-scalability.js
 *
 *  [Bước 2] Scale lên 3 replicas rồi chạy lại:
 *    docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3
 *    k6 run k6-tests/test-scalability.js
 *
 *  [Bước 3] So sánh: throughput, p95 latency, error rate giữa 2 lần chạy
 *
 *  Truyền BASE_URL nếu dùng IP khác:
 *    k6 run -e BASE_URL=http://192.168.1.100:8080 k6-tests/test-scalability.js
 *
 *  Ghi kết quả ra file JSON:
 *    k6 run --out json=results/scalability-1replica.json k6-tests/test-scalability.js
 *    k6 run --out json=results/scalability-3replicas.json k6-tests/test-scalability.js
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// ============================================================
// Custom Metrics
// ============================================================
const successCounter    = new Counter("scalability_success_total");
const errorCounter      = new Counter("scalability_error_total");
const successRate       = new Rate("scalability_success_rate");
const throughputTrend   = new Trend("scalability_response_time");
const p95Trend          = new Trend("scalability_p95_latency");

// ============================================================
// Config
// ============================================================
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Token giả — Gateway của project chỉ kiểm tra token tồn tại, không verify signature
const MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ0ZXN0dXNlciIsInJvbGUiOiJVU0VSIn0." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${MOCK_JWT}`,
};

// ============================================================
// Load Stages — Mô phỏng tải tăng dần (Ramp-up Pattern)
//
//  0-1m  : Warm-up nhẹ (10 VUs)   → kiểm tra hệ thống ổn định
//  1-3m  : Tải vừa (50 VUs)       → baseline throughput
//  3-5m  : Tải cao (100 VUs)      → stress, đo khi scale
//  5-6m  : Peak (150 VUs)         → tìm điểm giới hạn
//  6-7m  : Cool-down (10 VUs)     → hệ thống có recover không
// ============================================================
export const options = {
  stages: [
    { duration: "1m",  target: 10  }, // Warm-up
    { duration: "2m",  target: 50  }, // Tải vừa
    { duration: "2m",  target: 100 }, // Tải cao — scale horizontal có hiệu quả ở đây
    { duration: "1m",  target: 150 }, // Peak load
    { duration: "1m",  target: 10  }, // Cool-down
  ],

  // Ngưỡng pass/fail — điều chỉnh theo SLA của bạn
  thresholds: {
    // Ít nhất 95% request thành công
    "scalability_success_rate": ["rate>0.95"],

    // p95 response time < 2s dưới tải cao
    "http_req_duration": ["p(95)<2000"],

    // Error rate < 5%
    "http_req_failed": ["rate<0.05"],
  },
};

// ============================================================
// Helper
// ============================================================
function getTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:` +
         `${String(now.getMinutes()).padStart(2,"0")}:` +
         `${String(now.getSeconds()).padStart(2,"0")}.` +
         `${String(now.getMilliseconds()).padStart(3,"0")}`;
}

function doRequest(method, url, body = null) {
  const params = { headers: HEADERS, timeout: "10s" };
  let res;
  if (method === "GET")  res = http.get(url, params);
  if (method === "POST") res = http.post(url, JSON.stringify(body), params);

  const ok = res.status >= 200 && res.status < 300;
  successRate.add(ok);
  throughputTrend.add(res.timings.duration);
  p95Trend.add(res.timings.duration);

  if (ok) {
    successCounter.add(1);
  } else {
    errorCounter.add(1);
    // Chỉ log lỗi thật (5xx, timeout) — bỏ qua 401/403/429 vì đó là auth/rate-limit, không phải scalability issue
    if (res.status >= 500 || res.status === 0) {
      console.error(`[${getTimestamp()}] ${method} ${url} → ${res.status}`);
    }
  }
  return res;
}

// ============================================================
// Main VU Function
// ============================================================
export default function () {
  // Mỗi VU chạy luân phiên các nhóm endpoint để phân tải thực tế

  // ── Group 1: Product Service (endpoint được cấu hình scale) ──────────────
  group("product_service", () => {
    const res = doRequest("GET", `${BASE_URL}/api/products`);
    check(res, {
      "products: status 200": (r) => r.status === 200,
      "products: response time < 1s": (r) => r.timings.duration < 1000,
      "products: has body": (r) => r.body && r.body.length > 0,
    });
    sleep(0.2);

    // Lấy detail 1 sản phẩm — test Eureka round-robin khi có 3 replicas
    const detailRes = doRequest("GET", `${BASE_URL}/api/products/1`);
    check(detailRes, {
      "product detail: 200 hoặc 404": (r) => r.status === 200 || r.status === 404,
      "product detail: response time < 1s": (r) => r.timings.duration < 1000,
    });
  });

  sleep(0.1);

  // ── Group 2: Gateway Health & Discovery ──────────────────────────────────
  group("gateway_health", () => {
    const res = doRequest("GET", `${BASE_URL}/actuator/health`);
    check(res, {
      "gateway health: 200": (r) => r.status === 200,
      "gateway health: < 500ms": (r) => r.timings.duration < 500,
    });
  });

  sleep(0.1);

  // ── Group 3: Các service khác — chỉ dùng public endpoint (không cần auth) ─
  group("other_services", () => {
    // Category — public endpoint, không cần JWT
    const catRes = doRequest("GET", `${BASE_URL}/api/categories`);
    check(catRes, {
      "category service reachable": (r) => r.status !== 502 && r.status !== 503,
      "category: < 1.5s": (r) => r.timings.duration < 1500,
    });

    sleep(0.1);

    // Inventory — public read endpoint
    const invRes = doRequest("GET", `${BASE_URL}/api/inventory/check?productId=1`);
    check(invRes, {
      "inventory service reachable": (r) => r.status !== 502 && r.status !== 503,
    });
  });

  sleep(0.3);
}

// ============================================================
// Lifecycle hooks
// ============================================================
export function setup() {
  console.log("=".repeat(60));
  console.log("  TechShop Scalability Test");
  console.log(`  Target: ${BASE_URL}`);
  console.log("  Stages: Warm-up → Ramp-up → Peak → Cool-down");
  console.log("=".repeat(60));

  // Smoke test trước khi chạy toàn bộ
  const probe = http.get(`${BASE_URL}/api/products`, { headers: HEADERS, timeout: "5s" });
  if (probe.status === 0 || probe.status >= 500) {
    console.error(`[SETUP] Gateway không phản hồi! Status: ${probe.status}`);
    console.error("  → Kiểm tra: docker-compose up -d đã chạy chưa?");
  } else {
    console.log(`[SETUP] Gateway OK — Status ${probe.status}, ${probe.timings.duration.toFixed(0)}ms`);
  }
}

export function teardown() {
  console.log("");
  console.log("=".repeat(60));
  console.log("  Test hoàn tất.");
  console.log("  Xem kết quả JSON: --out json=results/scalability.json");
  console.log("");
  console.log("  Gợi ý so sánh kết quả:");
  console.log("  • http_req_duration{p95}: thấp hơn khi scale = tốt");
  console.log("  • scalability_success_rate: phải > 95%");
  console.log("  • http_reqs (throughput): cao hơn khi scale = tốt");
  console.log("=".repeat(60));
}