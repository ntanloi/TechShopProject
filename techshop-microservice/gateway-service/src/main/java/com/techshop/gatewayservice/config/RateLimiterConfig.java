package com.techshop.gatewayservice.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

/**
 * Rate Limiter Configuration
 * Configures rate limiting strategies based on IP address and user
 */
@Configuration
public class RateLimiterConfig {

    /**
     * Rate limit by IP address
     * Each IP can make limited requests per second
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(ip);
        };
    }

    /**
     * Rate limit by user (from JWT token or session)
     * Each authenticated user can make limited requests
     */
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // Try to get user from JWT token in Authorization header
            String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // Extract user identifier from token (simplified - in production parse JWT)
                return Mono.just(authHeader.substring(7, Math.min(authHeader.length(), 50)));
            }
            // Fallback to IP if no user found
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "anonymous";
            return Mono.just(ip);
        };
    }

    /**
     * Rate limit by API path
     * Different endpoints can have different rate limits
     */
    @Bean
    public KeyResolver pathKeyResolver() {
        return exchange -> Mono.just(exchange.getRequest().getPath().value());
    }
}
