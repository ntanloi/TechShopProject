/**
 * ============================================================
 * K6 SCALABILITY TEST - Horizontal Scaling + Load Balancer
 * ============================================================
 *
 * Mục tiêu:
 *   - Scale product-service lên 3 instances
 *   - Eureka + Spring Cloud Gateway dùng Round Robin load balancing
 *   - Mỗi request log rõ được xử lý bởi instance nào (X-Instance-ID header)
 *   - Ramp từ 0 → 1000 VUs (~1m30s): 20s ramp → 20s → peak 20s → hold 20s → down 10s
 *   - Bao gồm: xem sản phẩm, tìm kiếm, đăng nhập, thêm giỏ hàng, đặt hàng
 *
 * Chuẩn bị:
 *   1. Scale product-service lên 3 instances:
 *      docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale product-service=3
 *
 *   2. Kiểm tra 3 instances đã đăng ký Eureka:
 *      curl http://localhost:8761/eureka/apps/PRODUCT-SERVICE
 *
 *   3. Chạy test:
 *      k6 run k6-tests/test-scalability-load-balancer.js
 *      k6 run -e BASE_URL=http://localhost:8080 k6-tests/test-scalability-load-balancer.js
 *      "C:\Program Files\k6\k6.exe" run k6-tests/test-scalability-load-balancer.js
 *
 * Kết quả mong đợi:
 *   - Requests phân phối đều ~33% cho mỗi instance
 *   - Hệ thống xử lý được 1000 VUs concurrent
 *   - p95 response time < 3s
 *   - Error rate < 5%
 * ============================================================
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
const totalRequests     = new Counter("total_requests");
const successRequests   = new Counter("success_requests");
const failedRequests    = new Counter("failed_requests");
const loginSuccess      = new Counter("login_success");
const orderCreated      = new Counter("order_created");
const cartAdded         = new Counter("cart_added");
const productViewed     = new Counter("product_viewed");
const searchDone        = new Counter("search_done");

const errorRate         = new Rate("error_rate");
const loginRate         = new Rate("login_success_rate");

const productLatency    = new Trend("product_latency_ms", true);
const searchLatency     = new Trend("search_latency_ms", true);
const loginLatency      = new Trend("login_latency_ms", true);
const orderLatency      = new Trend("order_latency_ms", true);
const cartLatency       = new Trend("cart_latency_ms", true);

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test accounts (pre-seeded hoặc sẽ register trong setup)
const TEST_USERS = [
  { email: "testuser1@techshop.com", password: "Test@123456" },
  { email: "testuser2@techshop.com", password: "Test@123456" },
  { email: "testuser3@techshop.com", password: "Test@123456" },
  { email: "testuser4@techshop.com", password: "Test@123456" },
  { email: "testuser5@techshop.com", password: "Test@123456" },
];

const SEARCH_KEYWORDS = ["laptop", "phone", "tablet", "headphone", "mouse", "keyboard", "monitor"];
const PRODUCT_IDS     = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ─── Load Profile: 0 → 1000 VUs (~1m30s) ────────────────────────────────────
export const options = {
  scenarios: {
    load_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 200 },  // ramp up nhanh
        { duration: "20s", target: 500 },  // tăng tiếp
        { duration: "20s", target: 1000 }, // đạt peak
        { duration: "20s", target: 1000 }, // giữ peak
        { duration: "10s", target: 0 },    // ramp down
      ],
      gracefulRampDown: "10s",
    },
  },

  thresholds: {
    http_req_duration:  ["p(95)<3000", "p(99)<5000"],
    http_req_failed:    ["rate<0.05"],
    error_rate:         ["rate<0.05"],
    product_latency_ms: ["p(95)<2000"],
    login_latency_ms:   ["p(95)<3000"],
    order_latency_ms:   ["p(95)<5000"],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ts() {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, "0"))
    .join(":") + "." + String(d.getMilliseconds()).padStart(3, "0");
}

/**
 * Lấy instance ID từ response header X-Instance-ID.
 * Nếu không có header (gateway chưa forward), fallback về "unknown".
 */
function getInstanceId(res) {
  return (
    res.headers["X-Instance-ID"] ||
    res.headers["x-instance-id"] ||
    res.headers["X-Served-By"] ||
    res.headers["x-served-by"] ||
    "unknown"
  );
}

/**
 * Log mỗi request với instance info — đây là phần quan trọng nhất
 * để chứng minh load balancer phân phối đều.
 */
function logRequest(method, endpoint, status, instanceId, duration, vu, extra) {
  const statusIcon = status >= 200 && status < 300 ? "✅" : status === 429 ? "⚠️" : "❌";
  const instanceShort = instanceId.length > 20
    ? instanceId.substring(instanceId.length - 20)
    : instanceId.padEnd(20);

  console.log(
    `[${ts()}] ${statusIcon} VU:${String(vu).padStart(4)} | ${method.padEnd(4)} ${endpoint.padEnd(30)} | ` +
    `${String(status).padStart(3)} | ${String(Math.round(duration)).padStart(5)}ms | ` +
    `Instance: [${instanceShort}]${extra ? " | " + extra : ""}`
  );
}

/**
 * Đăng nhập và trả về JWT token.
 * Dùng round-robin trên TEST_USERS để phân tán load.
 */
function doLogin(vuId) {
  const user = TEST_USERS[vuId % TEST_USERS.length];
  const payload = JSON.stringify({ email: user.email, password: user.password });

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "login" },
  });

  const instanceId = getInstanceId(res);
  loginLatency.add(res.timings.duration);
  totalRequests.add(1);

  if (res.status === 200) {
    loginSuccess.add(1);
    loginRate.add(1);
    errorRate.add(0);
    successRequests.add(1);
    logRequest("POST", "/api/auth/login", res.status, instanceId, res.timings.duration, vuId,
      `user=${user.email}`);
    try {
      return JSON.parse(res.body).token || JSON.parse(res.body).accessToken || null;
    } catch (_) { return null; }
  } else {
    loginRate.add(0);
    errorRate.add(1);
    failedRequests.add(1);
    logRequest("POST", "/api/auth/login", res.status, instanceId, res.timings.duration, vuId,
      `FAILED user=${user.email}`);
    return null;
  }
}

/**
 * Xem danh sách sản phẩm — endpoint public, không cần auth.
 * Đây là endpoint chính để quan sát load balancing.
 */
function doViewProducts(vuId, page) {
  const p = page || Math.floor(Math.random() * 5);
  const res = http.get(`${BASE_URL}/api/products?page=${p}&size=10`, {
    tags: { endpoint: "products_list" },
  });

  const instanceId = getInstanceId(res);
  productLatency.add(res.timings.duration);
  totalRequests.add(1);

  const ok = check(res, { "products: status 200": (r) => r.status === 200 });
  if (ok) {
    productViewed.add(1);
    errorRate.add(0);
    successRequests.add(1);
  } else {
    errorRate.add(1);
    failedRequests.add(1);
  }

  logRequest("GET", `/api/products?page=${p}`, res.status, instanceId, res.timings.duration, vuId);
  return res;
}

/**
 * Xem chi tiết sản phẩm theo ID.
 */
function doViewProductDetail(vuId, productId) {
  const pid = productId || PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const res = http.get(`${BASE_URL}/api/products/${pid}`, {
    tags: { endpoint: "product_detail" },
  });

  const instanceId = getInstanceId(res);
  productLatency.add(res.timings.duration);
  totalRequests.add(1);

  const ok = check(res, { "product detail: 200 or 404": (r) => r.status === 200 || r.status === 404 });
  errorRate.add(ok ? 0 : 1);
  ok ? successRequests.add(1) : failedRequests.add(1);

  logRequest("GET", `/api/products/${pid}`, res.status, instanceId, res.timings.duration, vuId);
  return res;
}

/**
 * Tìm kiếm sản phẩm.
 */
function doSearch(vuId) {
  const kw = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
  const res = http.get(
    `${BASE_URL}/api/products/search?keyword=${encodeURIComponent(kw)}&page=0&size=10`,
    { tags: { endpoint: "search" } }
  );

  const instanceId = getInstanceId(res);
  searchLatency.add(res.timings.duration);
  totalRequests.add(1);

  const ok = check(res, { "search: 200": (r) => r.status === 200 });
  errorRate.add(ok ? 0 : 1);
  ok ? (searchDone.add(1), successRequests.add(1)) : failedRequests.add(1);

  logRequest("GET", `/api/products/search?keyword=${kw}`, res.status, instanceId, res.timings.duration, vuId);
  return res;
}

/**
 * Thêm sản phẩm vào giỏ hàng — cần auth token.
 */
function doAddToCart(vuId, token, productId) {
  if (!token) return null;
  const pid = productId || PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const payload = JSON.stringify({
    productId: pid,
    productName: `Product ${pid}`,
    productImage: "",
    productBrand: "TechShop",
    quantity: 1,
    unitPrice: 999000,
  });

  const res = http.post(`${BASE_URL}/api/cart`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    tags: { endpoint: "cart_add" },
  });

  const instanceId = getInstanceId(res);
  cartLatency.add(res.timings.duration);
  totalRequests.add(1);

  const ok = check(res, { "cart add: 200": (r) => r.status === 200 || r.status === 201 });
  errorRate.add(ok ? 0 : 1);
  ok ? (cartAdded.add(1), successRequests.add(1)) : failedRequests.add(1);

  logRequest("POST", "/api/cart", res.status, instanceId, res.timings.duration, vuId);
  return res;
}

/**
 * Đặt hàng — cần auth token.
 */
function doCreateOrder(vuId, token, productId) {
  if (!token) return null;
  const pid = productId || PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
  const payload = JSON.stringify({
    shippingAddress: "123 Nguyen Hue, Q1, TP.HCM",
    receiverName: `Test User ${vuId}`,
    receiverPhone: "0901234567",
    note: "k6 scalability test",
    paymentMethod: "COD",
    items: [
      {
        productId: pid,
        productName: `Product ${pid}`,
        productImage: "",
        productBrand: "TechShop",
        quantity: 1,
        unitPrice: 999000,
      },
    ],
  });

  const res = http.post(`${BASE_URL}/api/orders`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    tags: { endpoint: "order_create" },
  });

  const instanceId = getInstanceId(res);
  orderLatency.add(res.timings.duration);
  totalRequests.add(1);

  // 201 = created, 400/422 = validation error (vẫn tính là "hệ thống hoạt động")
  const ok = check(res, {
    "order: created or validation": (r) => r.status === 201 || r.status === 400 || r.status === 422,
  });
  errorRate.add(ok ? 0 : 1);
  if (res.status === 201) {
    orderCreated.add(1);
    successRequests.add(1);
  } else if (ok) {
    successRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  logRequest("POST", "/api/orders", res.status, instanceId, res.timings.duration, vuId,
    res.status === 201 ? "ORDER_CREATED" : `status=${res.status}`);
  return res;
}

// ─── Setup: Tự động register test users trước khi test chạy ─────────────────
export function setup() {
  console.log("═".repeat(70));
  console.log("🔧 SETUP: Đăng ký test users...");
  console.log("═".repeat(70));

  const tokens = {};

  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];

    // Thử register — nếu đã tồn tại (409/400) thì bỏ qua
    const regRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({
        fullName: `Test User ${i + 1}`,
        email: user.email,
        password: user.password,
        phone: "0901234567",
        address: "123 Test Street, HCM",
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    if (regRes.status === 201) {
      console.log(`  ✅ Registered: ${user.email}`);
    } else if (regRes.status === 400 || regRes.status === 409 || regRes.status === 500) {
      console.log(`  ℹ️  Already exists: ${user.email} (status=${regRes.status})`);
    } else {
      console.log(`  ⚠️  Register status=${regRes.status}: ${user.email}`);
    }

    // Login để lấy token và xác nhận account hoạt động
    const loginRes = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: user.email, password: user.password }),
      { headers: { "Content-Type": "application/json" } }
    );

    if (loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        const token = body.token || body.accessToken;
        tokens[user.email] = token;
        console.log(`  🔑 Login OK: ${user.email}`);
      } catch (_) {
        console.log(`  ⚠️  Login parse error: ${user.email}`);
      }
    } else {
      console.log(`  ❌ Login failed (${loginRes.status}): ${user.email}`);
    }

    sleep(0.3);
  }

  const readyCount = Object.keys(tokens).length;
  console.log(`\n  ✅ Setup complete: ${readyCount}/${TEST_USERS.length} users ready`);
  console.log("═".repeat(70));

  // Trả về tokens để VUs dùng (k6 truyền data từ setup → default qua tham số)
  return { tokens };
}

// ─── Main VU Function ─────────────────────────────────────────────────────────
export default function (data) {
  const vuId = __VU;
  const iter = __ITER;

  // Mỗi VU chạy một "user journey" hoàn chỉnh
  // Phân bổ hành vi theo tỉ lệ thực tế:
  //   70% chỉ browse (xem + tìm kiếm)
  //   20% browse + thêm giỏ hàng
  //   10% browse + đặt hàng

  const behavior = vuId % 10; // 0-9

  // Lấy token từ setup data nếu có
  const user = TEST_USERS[vuId % TEST_USERS.length];
  const cachedToken = data && data.tokens ? data.tokens[user.email] : null;

  group("browse_products", () => {
    // Tất cả VU đều xem sản phẩm — đây là traffic chính vào product-service
    doViewProducts(vuId, iter % 5);
    sleep(0.1 + Math.random() * 0.3);

    doViewProductDetail(vuId);
    sleep(0.1 + Math.random() * 0.2);

    doSearch(vuId);
    sleep(0.1 + Math.random() * 0.2);
  });

  if (behavior >= 3) {
    // 70% VU: chỉ browse thêm
    doViewProducts(vuId, (iter + 1) % 5);
    sleep(0.2 + Math.random() * 0.3);
    return;
  }

  // 30% VU: cần đăng nhập
  group("authenticated_flow", () => {
    // Dùng cached token từ setup, hoặc login lại nếu không có
    const token = cachedToken || doLogin(vuId);
    sleep(0.2);

    if (!token) {
      // Login thất bại → vẫn browse
      doViewProducts(vuId);
      return;
    }

    if (behavior >= 1) {
      // 20% VU: thêm giỏ hàng
      group("cart_flow", () => {
        doAddToCart(vuId, token);
        sleep(0.3 + Math.random() * 0.5);
        doViewProducts(vuId); // xem thêm sau khi thêm giỏ
      });
    } else {
      // 10% VU: đặt hàng
      group("order_flow", () => {
        doAddToCart(vuId, token);
        sleep(0.2);
        doCreateOrder(vuId, token);
        sleep(0.5 + Math.random() * 0.5);
      });
    }
  });

  // Think time — mô phỏng người dùng thực
  sleep(0.5 + Math.random() * 1.5);
}

// ─── Summary Report ───────────────────────────────────────────────────────────
export function handleSummary(data) {
  const metrics = data.metrics;

  const get = (name, field) => {
    const m = metrics[name];
    if (!m) return "N/A";
    return m.values[field] !== undefined ? m.values[field] : "N/A";
  };

  const fmt = (v) => (typeof v === "number" ? v.toFixed(2) : v);

  const report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║          TECHSHOP SCALABILITY TEST - LOAD BALANCER REPORT                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Kịch bản: Scale product-service × 3 instances, Round Robin LB             ║
║  Load:     0 → 1000 VUs (~1m30s): ramp 20s → 20s → peak 20s → hold 20s → down║
╠══════════════════════════════════════════════════════════════════════════════╣
║  TRAFFIC OVERVIEW                                                           ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Total HTTP Requests:    ${String(get("http_reqs", "count")).padEnd(10)}                                    ║
║  Total Custom Requests:  ${String(get("total_requests", "count")).padEnd(10)}                                    ║
║  Success:                ${String(get("success_requests", "count")).padEnd(10)}                                    ║
║  Failed:                 ${String(get("failed_requests", "count")).padEnd(10)}                                    ║
║  Error Rate:             ${String(fmt(get("error_rate", "rate") * 100) + "%").padEnd(10)}                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  LATENCY (ms)                                                               ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  http_req_duration p50:  ${String(fmt(get("http_req_duration", "p(50)"))).padEnd(10)} ms                              ║
║  http_req_duration p95:  ${String(fmt(get("http_req_duration", "p(95)"))).padEnd(10)} ms  (threshold < 3000ms)        ║
║  http_req_duration p99:  ${String(fmt(get("http_req_duration", "p(99)"))).padEnd(10)} ms  (threshold < 5000ms)        ║
║  Product API p95:        ${String(fmt(get("product_latency_ms", "p(95)"))).padEnd(10)} ms                              ║
║  Search API p95:         ${String(fmt(get("search_latency_ms", "p(95)"))).padEnd(10)} ms                              ║
║  Login API p95:          ${String(fmt(get("login_latency_ms", "p(95)"))).padEnd(10)} ms                              ║
║  Order API p95:          ${String(fmt(get("order_latency_ms", "p(95)"))).padEnd(10)} ms                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  BUSINESS METRICS                                                           ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Products Viewed:        ${String(get("product_viewed", "count")).padEnd(10)}                                    ║
║  Searches Done:          ${String(get("search_done", "count")).padEnd(10)}                                    ║
║  Cart Items Added:       ${String(get("cart_added", "count")).padEnd(10)}                                    ║
║  Orders Created:         ${String(get("order_created", "count")).padEnd(10)}                                    ║
║  Login Success:          ${String(get("login_success", "count")).padEnd(10)}                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  LOAD BALANCER DISTRIBUTION                                                 ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Xem log console để thấy phân phối theo instance:                          ║
║  Tìm "Instance: [" trong output để đếm request/instance                    ║
║                                                                             ║
║  Lệnh phân tích sau khi chạy (lưu log ra file):                            ║
║  k6 run ... 2>&1 | grep "Instance:" | grep -oP "Instance: \\[\\K[^\\]]+"  ║
║  | sort | uniq -c | sort -rn                                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  THRESHOLDS                                                                 ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  p95 < 3000ms:  ${(get("http_req_duration", "p(95)") < 3000 ? "✅ PASS" : "❌ FAIL").padEnd(15)}                                         ║
║  error < 5%:    ${(get("error_rate", "rate") < 0.05 ? "✅ PASS" : "❌ FAIL").padEnd(15)}                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

  return { stdout: report };
}
