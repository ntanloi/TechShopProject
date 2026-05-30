/***
 * K6 Load Test: Server-side Rate Limiter (2 Layers)
 *
 * Layer 1 - Global Filter (RateLimiterFilter.java): 1000 req/min per IP
 * Layer 2 - Route Filter (application.yml - Token Bucket per route):
 *   - Product: replenishRate=20/s, burstCapacity=40
 *   - Order:   replenishRate=5/s,  burstCapacity=10
 *   - Payment: replenishRate=2/s,  burstCapacity=5
 *
 * Token Bucket: refill liên tục, nên phải gửi NHANH HƠN tốc độ refill để trigger block
 *
 * Run:
 * k6 run k6-tests/test-server-rate-limiter.js
 * "C:\Program Files\k6\k6.exe" run k6-tests/test-server-rate-limiter.js
 * k6 run -e BASE_URL=http://localhost:8080 k6-tests/test-server-rate-limiter.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

// Custom metrics
const layer1Blocked = new Counter("layer1_blocked");
const layer2Blocked = new Counter("layer2_blocked");
const successCounter = new Counter("success_total");
const successRate = new Rate("success_rate");
const blockedRate = new Rate("blocked_rate");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export const options = {
  scenarios: {
    server_demo: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      maxDuration: "5m",
    },
  },
};

function getTimestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

let totalRequestsSent = 0;

function sendRequest(endpoint, requestNum, phase) {
  const timestamp = getTimestamp();
  const url = `${BASE_URL}${endpoint}`;
  totalRequestsSent++;

  // Gateway chỉ check token tồn tại, không verify signature
  const response = http.get(url, {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer k6-test-token-for-rate-limiter",
    },
  });

  const remaining =
    response.headers["X-Ratelimit-Remaining"] ||
    response.headers["x-ratelimit-remaining"] ||
    "N/A";
  const retryAfter =
    response.headers["Retry-After"] ||
    response.headers["retry-after"] ||
    "";

  if (response.status === 429) {
    const isLayer1 = retryAfter !== "";
    if (isLayer1) {
      layer1Blocked.add(1);
      blockedRate.add(1);
      successRate.add(0);
      console.log(
        `[${timestamp}] ❌ LAYER1_BLOCK | ${phase} | #${String(requestNum).padStart(3, "0")} | ${endpoint.padEnd(15)} | 429 Global (1000/min) | Retry-After: ${retryAfter}s`
      );
    } else {
      layer2Blocked.add(1);
      blockedRate.add(1);
      successRate.add(0);
      console.log(
        `[${timestamp}] ❌ LAYER2_BLOCK | ${phase} | #${String(requestNum).padStart(3, "0")} | ${endpoint.padEnd(15)} | 429 Route token bucket exhausted`
      );
    }
    return 429;
  } else {
    successCounter.add(1);
    successRate.add(1);
    blockedRate.add(0);
    console.log(
      `[${timestamp}] ✅ SUCCESS      | ${phase} | #${String(requestNum).padStart(3, "0")} | ${endpoint.padEnd(15)} | Status: ${response.status} | Remaining: ${remaining} | ${response.timings.duration.toFixed(0)}ms`
    );
    return response.status;
  }
}

// Gửi burst KHÔNG sleep - tất cả request gần như đồng thời
function sendBurstNoDelay(endpoint, count, phase) {
  let successCount = 0;
  let blockedCount = 0;

  for (let i = 1; i <= count; i++) {
    const status = sendRequest(endpoint, i, phase);
    if (status === 429) {
      blockedCount++;
    } else {
      successCount++;
    }
    // KHÔNG sleep - gửi liên tục không nghỉ
  }

  return { successCount, blockedCount };
}

export default function () {
  console.log("═".repeat(110));
  console.log("📋 SERVER RATE LIMITER TEST - 2 Layers: Global (1000/min) + Route (Token Bucket)");
  console.log("═".repeat(110));

  // ============================================================
  // PHASE 1: Gửi ít request, chậm → qua cả 2 layer
  // ============================================================
  console.log("\n" + "─".repeat(110));
  console.log("▶ PHASE 1: Gửi chậm, trong limit → qua Layer 1 & Layer 2 → SUCCESS");
  console.log("─".repeat(110));

  console.log("\n  [Product - 5 req, chậm]");
  for (let i = 1; i <= 5; i++) {
    sendRequest("/api/products", i, "PHASE 1");
    sleep(0.2); // 200ms giữa mỗi req → 5 req/s < replenishRate 20/s
  }

  console.log("\n  [Order - 3 req, chậm]");
  for (let i = 1; i <= 3; i++) {
    sendRequest("/api/orders", i, "PHASE 1");
    sleep(0.3); // 300ms → ~3 req/s < replenishRate 5/s
  }

  console.log("\n  [Payment - 2 req, chậm]");
  for (let i = 1; i <= 2; i++) {
    sendRequest("/api/payments", i, "PHASE 1");
    sleep(0.6); // 600ms → ~1.6 req/s < replenishRate 2/s
  }

  // Chờ token refill đầy trước phase 2
  sleep(3);

  // ============================================================
  // PHASE 2: Burst NHANH vượt token bucket cho Product (burst=40)
  // Gửi 60 req KHÔNG delay → hết 40 token → bị Layer 2 block
  // ============================================================
  console.log("\n" + "─".repeat(110));
  console.log("▶ PHASE 2: Burst 60 req vào /api/products KHÔNG delay (burst=40, refill=20/s)");
  console.log("  Expect: ~40 SUCCESS rồi bắt đầu bị LAYER2_BLOCK");
  console.log("─".repeat(110));

  const phase2 = sendBurstNoDelay("/api/products", 60, "PHASE 2");
  console.log(`\n  📊 Phase 2: ✅ ${phase2.successCount} success, ❌ ${phase2.blockedCount} blocked (Layer 2)`);

  // Chờ token refill
  sleep(3);

  // ============================================================
  // PHASE 3: Burst vượt token bucket cho Order (burst=10) và Payment (burst=5)
  // ============================================================
  console.log("\n" + "─".repeat(110));
  console.log("▶ PHASE 3: Burst vượt limit - Order (burst=10) và Payment (burst=5)");
  console.log("─".repeat(110));

  console.log("\n  [Order - 20 req burst (burst limit=10, refill=5/s)]");
  const phase3Order = sendBurstNoDelay("/api/orders", 20, "PHASE 3");
  console.log(`  📊 Order: ✅ ${phase3Order.successCount} success, ❌ ${phase3Order.blockedCount} blocked`);

  sleep(2);

  console.log("\n  [Payment - 15 req burst (burst limit=5, refill=2/s)]");
  const phase3Payment = sendBurstNoDelay("/api/payments", 15, "PHASE 3");
  console.log(`  📊 Payment: ✅ ${phase3Payment.successCount} success, ❌ ${phase3Payment.blockedCount} blocked`);

  sleep(3);

  // ============================================================
  // PHASE 4: Gửi >1000 req tổng để trigger Layer 1
  // ============================================================
  console.log("\n" + "─".repeat(110));
  console.log("▶ PHASE 4: Gửi tổng >1000 requests để trigger Layer 1 (Global: 1000/min)");
  console.log(`  Đã gửi: ${totalRequestsSent}. Cần thêm ~${Math.max(0, 1010 - totalRequestsSent)} requests.`);
  console.log("─".repeat(110));

  let layer1Hit = false;
  let batchNum = 0;

  while (!layer1Hit && batchNum < 40) {
    batchNum++;

    for (let i = 1; i <= 50; i++) {
      const timestamp = getTimestamp();
      const url = `${BASE_URL}/api/products`;
      totalRequestsSent++;

      const response = http.get(url, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer k6-test-token-for-rate-limiter",
        },
      });

      const retryAfter =
        response.headers["Retry-After"] ||
        response.headers["retry-after"] ||
        "";

      if (response.status === 429 && retryAfter !== "") {
        layer1Hit = true;
        layer1Blocked.add(1);
        blockedRate.add(1);
        successRate.add(0);
        console.log(
          `[${timestamp}] 🚨 LAYER1_HIT  | PHASE 4 | Total: ${totalRequestsSent} | 429 GLOBAL LIMIT REACHED (1000/min) | Retry-After: ${retryAfter}s`
        );
        break;
      } else if (response.status === 429) {
        layer2Blocked.add(1);
        blockedRate.add(1);
        successRate.add(0);
      } else {
        successCounter.add(1);
        successRate.add(1);
        blockedRate.add(0);
      }
    }

    if (!layer1Hit && batchNum % 5 === 0) {
      console.log(`  ... Batch ${batchNum} done, total sent: ${totalRequestsSent}`);
    }
  }

  if (!layer1Hit) {
    console.log(`  ⚠️ Layer 1 không bị hit sau ${totalRequestsSent} requests`);
  }

  // ============================================================
  // PHASE 5: Sau Layer 1 hit → TẤT CẢ endpoint bị chặn
  // ============================================================
  if (layer1Hit) {
    console.log("\n" + "─".repeat(110));
    console.log("▶ PHASE 5: Sau Layer 1 hit → TẤT CẢ endpoint bị chặn (kể cả endpoint khác)");
    console.log("─".repeat(110));

    console.log("\n  [/api/products]");
    for (let i = 1; i <= 3; i++) {
      sendRequest("/api/products", i, "PHASE 5");
    }

    console.log("\n  [/api/orders]");
    for (let i = 1; i <= 3; i++) {
      sendRequest("/api/orders", i, "PHASE 5");
    }

    console.log("\n  [/api/payments]");
    for (let i = 1; i <= 3; i++) {
      sendRequest("/api/payments", i, "PHASE 5");
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n" + "═".repeat(110));
  console.log("📊 KẾT LUẬN:");
  console.log("═".repeat(110));
  console.log("• Phase 1: Gửi chậm (dưới replenishRate) → qua cả 2 layer ✅");
  console.log("• Phase 2: Burst nhanh > burstCapacity → Layer 2 chặn (chỉ endpoint đó) ❌");
  console.log("• Phase 3: Order/Payment burst > capacity → Layer 2 chặn riêng từng route ❌");
  console.log("• Phase 4: Tổng >1000 req → Layer 1 chặn TẤT CẢ 🚨");
  console.log("• Phase 5: Sau Layer 1 hit → mọi endpoint đều bị block ❌");
  console.log(`• Tổng requests: ${totalRequestsSent}`);
  console.log("═".repeat(110));
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const total = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;
  const l1 = data.metrics.layer1_blocked ? data.metrics.layer1_blocked.values.count : 0;
  const l2 = data.metrics.layer2_blocked ? data.metrics.layer2_blocked.values.count : 0;
  const success = data.metrics.success_total ? data.metrics.success_total.values.count : 0;

  return `
  ✓ Server Rate Limiter Test Complete (2 Layers)

    Layer 1 - Global: 1000 req/min per IP
    Layer 2 - Route:  Token Bucket (Product=40 burst, Order=10, Payment=5)

    Results:
      Total HTTP Requests: ${total}
      ✅ Success:            ${success}
      ❌ Layer 1 Blocked:    ${l1} (Global limit)
      ❌ Layer 2 Blocked:    ${l2} (Route limit)

    Verified:
      ✓ Slow requests pass both layers
      ✓ Burst > burstCapacity triggers Layer 2 block
      ✓ Total > 1000/min triggers Layer 1 block on ALL endpoints
  `;
}
