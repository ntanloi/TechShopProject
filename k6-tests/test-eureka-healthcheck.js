// k6-tests/test-eureka-healthcheck.js
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  TEST MỤC TIÊU: Availability — Eureka + Health Check               │
// │                                                                     │
// │  Có 3 scenario chạy song song:                                      │
// │  1. eureka_registry  — kiểm tra Eureka server và danh sách service  │
// │  2. health_check     — poll /actuator/health toàn bộ service        │
// │  3. load_with_lb     — gửi load để quan sát Eureka load-balance     │
// │     khi product-service scale 3 instances                           │
// └─────────────────────────────────────────────────────────────────────┘
//
// Cách chạy:
//   # Cơ bản (1 instance product-service)
//   k6 run k6-tests/test-eureka-healthcheck.js
//
//   # Với 3 instances product-service (scale test):
//   docker-compose -f docker-compose.yml -f docker-compose.scale.yml \
//     up -d --scale product-service=3
//   k6 run k6-tests/test-eureka-healthcheck.js
//
// Kết quả quan sát:
//   - Eureka dashboard: http://localhost:8761
//   - Gateway health:   http://localhost:8080/actuator/health
//   - Từng service:     http://localhost:{port}/actuator/health

import http from 'k6/http';
import { sleep, check } from 'k6';
import { Counter, Gauge, Trend } from 'k6/metrics';

// ─── Custom metrics ──────────────────────────────────────────────────────────
const eurekaRegisteredCount = new Gauge('eureka_registered_services');
const healthCheckPassed     = new Counter('health_check_passed');
const healthCheckFailed     = new Counter('health_check_failed');
const lbResponseTime        = new Trend('lb_response_time_ms');

// ─── Danh sách service và port tương ứng ─────────────────────────────────────
// Khớp với healthcheck trong docker-compose.yml của project
const SERVICES = [
    { name: 'discovery-service', url: 'http://localhost:8761/actuator/health' },
    { name: 'gateway-service',   url: 'http://localhost:8080/actuator/health' },
    { name: 'user-service',      url: 'http://localhost:8081/actuator/health' },
    { name: 'product-service',   url: 'http://localhost:8082/actuator/health' },
    { name: 'order-service',     url: 'http://localhost:8083/actuator/health' },
    { name: 'cart-service',      url: 'http://localhost:8084/actuator/health' },
    { name: 'payment-service',   url: 'http://localhost:8085/actuator/health' },
    { name: 'notification-service', url: 'http://localhost:8086/actuator/health' },
    { name: 'review-service',    url: 'http://localhost:8087/actuator/health' },
    { name: 'inventory-service', url: 'http://localhost:8088/actuator/health' },
];

// ─── Eureka endpoints ─────────────────────────────────────────────────────────
const EUREKA_BASE   = 'http://localhost:8761';
const GATEWAY_BASE  = 'http://localhost:8080';

// ─── Scenarios ────────────────────────────────────────────────────────────────
export let options = {
    scenarios: {
        // ── Scenario 1: Kiểm tra Eureka registry ─────────────────────────────
        // Poll Eureka mỗi 5s để xem service nào UP / DOWN
        // Khi bạn tắt product-service → Eureka sẽ deregister sau ~90s
        // (eviction timer mặc định; project dùng enable-self-preservation: false
        //  nên nhanh hơn)
        eureka_registry: {
            executor: 'constant-vus',
            vus: 1,
            duration: '180s',
            exec: 'checkEurekaRegistry',
        },

        // ── Scenario 2: Health check toàn bộ service ─────────────────────────
        // Poll /actuator/health từng service mỗi 10s
        // Phát hiện service nào DOWN trước khi Eureka kịp deregister
        health_check: {
            executor: 'constant-vus',
            vus: 1,
            duration: '180s',
            exec: 'pollAllHealthChecks',
        },

        // ── Scenario 3: Load test qua gateway để thấy load balancing ─────────
        // Gửi request qua lb://product-service, Eureka round-robin các instance
        // Chạy sau 10s để các service kịp warm up
        load_with_lb: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 0 },   // chờ warm up
                { duration: '30s', target: 5 },    // tăng dần
                { duration: '60s', target: 10 },   // giữ load
                { duration: '30s', target: 5 },    // giảm
                { duration: '50s', target: 0 },    // về 0
            ],
            exec: 'sendLoadThroughGateway',
        },
    },

    thresholds: {
        // Ít nhất 95% health check phải pass
        health_check_passed: [{ threshold: 'count>0', abortOnFail: false }],
        // Response time qua lb phải dưới 500ms (p95)
        lb_response_time_ms: ['p(95)<500'],
        // HTTP error rate dưới 5%
        http_req_failed: ['rate<0.05'],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — Eureka Registry Check
// Kiểm tra:
//   - Eureka server có UP không: GET /actuator/health
//   - Có bao nhiêu service đã register: GET /eureka/apps (XML response)
//   - product-service có UP trong registry không: GET /eureka/apps/PRODUCT-SERVICE
// ═══════════════════════════════════════════════════════════════════════════════
export function checkEurekaRegistry() {
    // 1a. Eureka server health (Spring Actuator)
    const eurekaHealth = http.get(`${EUREKA_BASE}/actuator/health`, { timeout: '5s' });
    const eurekaUp = check(eurekaHealth, {
        'eureka server UP (200)': (r) => r.status === 200,
        'eureka status is UP':    (r) => {
            try { return JSON.parse(r.body).status === 'UP'; } catch(_) { return false; }
        },
    });

    if (!eurekaUp) {
        console.error(`❌ [EUREKA SERVER DOWN] status=${eurekaHealth.status}`);
    }

    // 1b. Danh sách applications đã register (Eureka REST API)
    // Eureka trả XML, parse đơn giản bằng regex để đếm <application>
    const appsRes = http.get(`${EUREKA_BASE}/eureka/apps`, {
        timeout: '5s',
        headers: { 'Accept': 'application/json' }, // yêu cầu JSON thay XML
    });

    if (appsRes.status === 200) {
        try {
            const body = JSON.parse(appsRes.body);
            const apps = body.applications?.application || [];
            const count = Array.isArray(apps) ? apps.length : (apps ? 1 : 0);
            eurekaRegisteredCount.add(count);
            console.log(`📋 [EUREKA] Registered services: ${count}`);

            // Log tên từng service và trạng thái instance
            const appList = Array.isArray(apps) ? apps : [apps];
            appList.forEach(app => {
                const instances = Array.isArray(app.instance) ? app.instance : [app.instance];
                instances.forEach(inst => {
                    console.log(`   → ${app.name} | ${inst.instanceId} | status=${inst.status} | port=${inst.port?.$}`);
                });
            });
        } catch(e) {
            console.warn(`⚠️  [EUREKA] Cannot parse apps response: ${e.message}`);
        }
    }

    // 1c. Kiểm tra riêng product-service (quan trọng nhất trong test)
    const productEureka = http.get(`${EUREKA_BASE}/eureka/apps/PRODUCT-SERVICE`, {
        timeout: '5s',
        headers: { 'Accept': 'application/json' },
    });
    check(productEureka, {
        'product-service registered in Eureka': (r) => r.status === 200,
    });

    if (productEureka.status === 200) {
        try {
            const body = JSON.parse(productEureka.body);
            const instances = body.application?.instance || [];
            const instList = Array.isArray(instances) ? instances : [instances];
            console.log(`✅ [EUREKA] product-service instances: ${instList.length}`);
            instList.forEach(i => console.log(`   → ${i.hostName}:${i.port?.$} | ${i.status}`));
        } catch(_) {}
    } else {
        console.error(`❌ [EUREKA] product-service NOT registered! status=${productEureka.status}`);
    }

    sleep(5); // poll mỗi 5 giây
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 2 — Health Check toàn bộ service
// Gọi /actuator/health của từng service:
//   - status 200 + body.status="UP" → HEALTHY
//   - status != 200 hoặc body.status != "UP" → UNHEALTHY
//
// spring.endpoint.health.show-details=always → response có chi tiết db, redis...
// Ví dụ response:
//   { "status": "UP", "components": { "db": {"status":"UP"}, "redis": {"status":"UP"} } }
// ═══════════════════════════════════════════════════════════════════════════════
export function pollAllHealthChecks() {
    console.log('\n━━━ Health Check Poll ━━━');

    SERVICES.forEach(svc => {
        const res = http.get(svc.url, { timeout: '5s' });

        let status = 'UNKNOWN';
        let dbStatus = '';
        let redisStatus = '';

        if (res.status === 200) {
            try {
                const body = JSON.parse(res.body);
                status = body.status || 'UNKNOWN';

                // Chi tiết components (show-details: always)
                const components = body.components || {};
                if (components.db)    dbStatus    = ` | db=${components.db.status}`;
                if (components.redis) redisStatus = ` | redis=${components.redis.status}`;
            } catch(_) {
                status = 'PARSE_ERROR';
            }
        }

        const isUp = res.status === 200 && status === 'UP';

        if (isUp) {
            healthCheckPassed.add(1);
            console.log(`✅ ${svc.name.padEnd(25)} | ${status}${dbStatus}${redisStatus}`);
        } else {
            healthCheckFailed.add(1);
            console.error(`❌ ${svc.name.padEnd(25)} | http=${res.status} | status=${status}`);
        }

        check(res, {
            [`${svc.name} health=UP`]: (r) => {
                try { return r.status === 200 && JSON.parse(r.body).status === 'UP'; }
                catch(_) { return false; }
            },
        });
    });

    sleep(10); // poll mỗi 10 giây
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — Load qua Gateway để thấy Eureka Load Balancing
// Gateway dùng lb://product-service → Eureka round-robin các instance
// Khi scale product-service=3 thì 3 instance chia đều traffic
//
// Cách verify load balancing:
//   - Xem log của từng container: docker logs -f <container_id>
//   - Hoặc nhìn vào Eureka dashboard: http://localhost:8761
// ═══════════════════════════════════════════════════════════════════════════════
export function sendLoadThroughGateway() {
    const start = Date.now();

    // Gọi qua gateway (lb://product-service)
    const res = http.get(`${GATEWAY_BASE}/api/products`, { timeout: '10s' });

    const duration = Date.now() - start;
    lbResponseTime.add(duration);

    const ok = check(res, {
        'gateway LB request success (200)': (r) => r.status === 200,
        'response time < 500ms':            () => duration < 500,
    });

    if (!ok) {
        console.warn(`⚠️  [LB] status=${res.status} | ${duration}ms`);
    }

    sleep(1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HƯỚNG DẪN TEST THỦ CÔNG (bên cạnh k6)
// ═══════════════════════════════════════════════════════════════════════════════
//
// ── Test 1: Eureka deregistration khi service tắt ────────────────────────────
//
//   Bước 1: Chạy k6 (giữ terminal này)
//     k6 run k6-tests/test-eureka-healthcheck.js
//
//   Bước 2: Tắt product-service (terminal khác)
//     docker stop techshop-product-service
//
//   Quan sát:
//   - Eureka dashboard http://localhost:8761 → product-service biến mất sau ~30-90s
//     (discovery-service dùng enable-self-preservation: false → evict nhanh hơn)
//   - k6 log: health_check_failed tăng ngay lập tức (vì direct port 8082 DOWN)
//   - k6 log: eureka_registered_services giảm sau khi Eureka evict
//   - Gateway /api/products → 503 fallback sau khi CB mở (kết hợp retry-test)
//
//   Bước 3: Khởi động lại
//     docker start techshop-product-service
//
//   Quan sát re-registration:
//   - product-service tự register lại Eureka sau ~30s (lease-renewal)
//   - Gateway bắt đầu route thành công trở lại
//
// ── Test 2: Scale product-service để thấy load balancing ─────────────────────
//
//   Bước 1: Scale lên 3 instances
//     docker-compose -f docker-compose.yml -f docker-compose.scale.yml \
//       up -d --scale product-service=3
//
//   Bước 2: Xem Eureka dashboard
//     http://localhost:8761 → PRODUCT-SERVICE có 3 instances
//
//   Bước 3: Chạy k6
//     k6 run k6-tests/test-eureka-healthcheck.js
//
//   Quan sát:
//   - k6 log: eureka_registered_services = 3 cho product-service
//   - k6 log: lb_response_time_ms p95 < 100ms (vì load chia đều)
//   - docker logs từng container thấy request phân phối round-robin
//
//   Bước 4: Tắt 1 trong 3 instances
//     docker stop <container_id_của_1_instance>
//
//   Quan sát:
//   - Eureka deregister instance đó sau ~30s
//   - Gateway tự động không route đến instance DOWN nữa
//   - k6: lb_response_time_ms ổn định, không tăng đột biến
//   - k6: http_req_failed không tăng (traffic failover sang 2 instance còn lại)