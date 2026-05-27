package com.techshop.gatewayservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Logs every attempt the Gateway makes to forward a request to a downstream service.
 * Useful to visually confirm Retry filter behavior (3 attempts with backoff 3s/6s/10s).
 */
@Component
@Slf4j
public class RetryLoggingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Spring Cloud Gateway exposes the current iteration index via this attribute when Retry filter re-runs.
        Integer iteration = exchange.getAttribute(ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR + ".retryIteration");
        AtomicInteger counter = exchange.getAttribute("retry.counter");
        if (counter == null) {
            counter = new AtomicInteger(0);
            exchange.getAttributes().put("retry.counter", counter);
        }
        int attempt = counter.incrementAndGet();
        String path = exchange.getRequest().getURI().getPath();
        Instant start = Instant.now();

        log.info("➡️  [Attempt #{}] {} {} at {}",
                attempt,
                exchange.getRequest().getMethod(),
                path,
                start);

        final int finalAttempt = attempt;
        return chain.filter(exchange).doFinally(signal -> {
            long ms = java.time.Duration.between(start, Instant.now()).toMillis();
            int status = exchange.getResponse().getStatusCode() != null
                    ? exchange.getResponse().getStatusCode().value() : -1;
            if (status >= 500 || status == -1) {
                log.warn("⬅️  [Attempt #{}] {} → status={} ({} ms)", finalAttempt, path, status, ms);
            } else {
                log.info("⬅️  [Attempt #{}] {} → status={} ({} ms)", finalAttempt, path, status, ms);
            }
        });
    }

    @Override
    public int getOrder() {
        // Run before route forwarding so we can see each retry pass through here
        return -1;
    }
}
