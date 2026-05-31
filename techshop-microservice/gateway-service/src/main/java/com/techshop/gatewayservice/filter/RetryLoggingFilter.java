package com.techshop.gatewayservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Retry Logging Filter
 * Log chi tiết từng lần retry với thời gian thực, backoff, lỗi và kết quả cuối cùng.
 */
@Component
@Slf4j
public class RetryLoggingFilter implements GlobalFilter, Ordered {

    private static final int MAX_RETRIES = 3;
    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("HH:mm:ss.SSS").withZone(ZoneId.systemDefault());

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Track attempt counter per request
        AtomicInteger counter = exchange.getAttribute("retry.counter");
        if (counter == null) {
            counter = new AtomicInteger(0);
            exchange.getAttributes().put("retry.counter", counter);
        }

        // Track first attempt time for backoff calculation
        AtomicLong firstAttemptTime = exchange.getAttribute("retry.firstAttemptTime");
        if (firstAttemptTime == null) {
            firstAttemptTime = new AtomicLong(System.currentTimeMillis());
            exchange.getAttributes().put("retry.firstAttemptTime", firstAttemptTime);
        }

        int attempt = counter.incrementAndGet();
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();
        Instant start = Instant.now();
        String startTs = FMT.format(start);
        long sinceFirst = start.toEpochMilli() - firstAttemptTime.get();

        // Log header khi bắt đầu attempt
        if (attempt == 1) {
            log.info("┌─────────────────────────────────────────────────────────────");
            log.info("│ 🚀 NEW REQUEST: {} {}", method, path);
            log.info("│ Max retries: {}, Backoff: 1s → 2s → 4s → max 5s (factor=2)", MAX_RETRIES);
            log.info("├─────────────────────────────────────────────────────────────");
        } else {
            // Tính backoff dự kiến
            long expectedBackoff = getExpectedBackoff(attempt);
            log.info("├─────────────────────────────────────────────────────────────");
            log.info("│ ⏳ BACKOFF: ~{}s elapsed since last attempt (expected: {}s)",
                    String.format("%.1f", sinceFirst / 1000.0),
                    expectedBackoff);
            log.info("├─────────────────────────────────────────────────────────────");
        }

        log.info("│ ➡️  [Attempt {}/{}] {} {} at {}",
                attempt, MAX_RETRIES + 1, method, path, startTs);

        final int finalAttempt = attempt;
        final long firstTime = firstAttemptTime.get();

        return chain.filter(exchange).doFinally(signal -> {
            long ms = System.currentTimeMillis() - start.toEpochMilli();
            long totalMs = System.currentTimeMillis() - firstTime;
            int status = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value() : -1;
            String endTs = FMT.format(Instant.now());

            if (status >= 200 && status < 400) {
                // Thành công
                log.info("│ ⬅️  [Attempt {}/{}] ✅ SUCCESS → status={} ({} ms) at {}",
                        finalAttempt, MAX_RETRIES + 1, status, ms, endTs);
                if (finalAttempt > 1) {
                    log.info("│ 🎉 Recovered after {} attempt(s), total time: {} ms",
                            finalAttempt, totalMs);
                }
                log.info("└─────────────────────────────────────────────────────────────");
            } else if (status == 503 || status == 502) {
                if (finalAttempt <= MAX_RETRIES) {
                    // Còn retry
                    long nextBackoff = getExpectedBackoff(finalAttempt + 1);
                    log.warn("│ ⬅️  [Attempt {}/{}] ❌ FAILED → status={} ({} ms) at {}",
                            finalAttempt, MAX_RETRIES + 1, status, ms, endTs);
                    log.warn("│ 🔄 Will retry in ~{}s (attempt {}/{})",
                            nextBackoff, finalAttempt + 1, MAX_RETRIES + 1);
                } else {
                    // Hết retry
                    log.error("│ ⬅️  [Attempt {}/{}] ❌ FAILED → status={} ({} ms) at {}",
                            finalAttempt, MAX_RETRIES + 1, status, ms, endTs);
                    log.error("│ 💀 ALL {} RETRIES EXHAUSTED after {} ms total",
                            MAX_RETRIES, totalMs);
                    log.error("│ 📋 Summary: {} {} → {} (after {} attempts)",
                            method, path, status, finalAttempt);
                    log.error("└─────────────────────────────────────────────────────────────");
                }
            } else {
                log.warn("│ ⬅️  [Attempt {}/{}] ⚠️  status={} ({} ms) at {}",
                        finalAttempt, MAX_RETRIES + 1, status, ms, endTs);
                log.info("└─────────────────────────────────────────────────────────────");
            }
        });
    }

    /**
     * Tính backoff dự kiến theo attempt number
     * firstBackoff=3s, factor=2, maxBackoff=10s
     */
    private long getExpectedBackoff(int attempt) {
        if (attempt <= 1) return 0;
        long backoff = (long) (1 * Math.pow(2, attempt - 2)); // 1s, 2s, 4s...
        return Math.min(backoff, 5); // max 5s
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
