package com.techshop.gatewayservice.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Objects;

/**
 * Rate Limiter Filter using Redis
 * Implements Fault Tolerance requirement: Rate Limiter Server (API call 1 service)
 * 
 * Limits: 100 requests per minute per IP address
 */
@Component
@Slf4j
public class RateLimiterFilter implements GlobalFilter, Ordered {

    private static final int MAX_REQUESTS_PER_MINUTE = 1000; // Increased for development
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    @Autowired
    private ReactiveRedisTemplate<String, String> redisTemplate;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = getClientIp(exchange);
        String key = "rate_limit:" + clientIp;

        if (redisTemplate == null) {
            log.error("Rate limiter error: redisTemplate is null! Component scanning or Autowiring failed.");
            return chain.filter(exchange);
        }

        return redisTemplate.opsForValue()
                .increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        // First request in window - set TTL atomically
                        // Use expire to ensure the key will be cleaned up after 1 minute
                        return redisTemplate.expire(key, WINDOW_DURATION)
                                .then(Mono.defer(() -> processRequest(exchange, chain, count)));
                    } else if (count > MAX_REQUESTS_PER_MINUTE) {
                        // Rate limit exceeded - block until window expires
                        log.warn("Rate limit exceeded for IP: {} (count: {}/{})", clientIp, count, MAX_REQUESTS_PER_MINUTE);
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE));
                        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", "0");
                        // Get actual TTL remaining for Retry-After header
                        return redisTemplate.getExpire(key)
                                .flatMap(ttl -> {
                                    long retryAfter = ttl != null ? ttl.getSeconds() : 60;
                                    exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(retryAfter));
                                    return exchange.getResponse().setComplete();
                                })
                                .switchIfEmpty(Mono.defer(() -> {
                                    exchange.getResponse().getHeaders().add("Retry-After", "60");
                                    return exchange.getResponse().setComplete();
                                }));
                    } else {
                        // Within limit - ensure TTL exists (防止 TTL 丢失)
                        return redisTemplate.getExpire(key)
                                .flatMap(ttl -> {
                                    if (ttl == null || ttl.getSeconds() < 0) {
                                        // Key lost its TTL somehow, re-set it
                                        return redisTemplate.expire(key, WINDOW_DURATION)
                                                .then(Mono.defer(() -> processRequest(exchange, chain, count)));
                                    }
                                    return processRequest(exchange, chain, count);
                                })
                                .switchIfEmpty(Mono.defer(() -> processRequest(exchange, chain, count)));
                    }
                })
                .onErrorResume(e -> {
                    // If Redis is down, allow request to pass through
                    log.error("Rate limiter error (Redis unavailable)", e);
                    return chain.filter(exchange);
                });
    }

    private Mono<Void> processRequest(ServerWebExchange exchange, GatewayFilterChain chain, Long count) {
        // Add rate limit headers
        exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(MAX_REQUESTS_PER_MINUTE));
        exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", 
                String.valueOf(Math.max(0, MAX_REQUESTS_PER_MINUTE - count)));
        
        log.debug("Request allowed for IP: {} (count: {}/{})", 
                getClientIp(exchange), count, MAX_REQUESTS_PER_MINUTE);
        
        return chain.filter(exchange);
    }

    private String getClientIp(ServerWebExchange exchange) {
        String ip = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = Objects.requireNonNull(exchange.getRequest().getRemoteAddress()).getAddress().getHostAddress();
        }
        return ip;
    }

    @Override
    public int getOrder() {
        return -100; // High priority, run before other filters
    }
}
