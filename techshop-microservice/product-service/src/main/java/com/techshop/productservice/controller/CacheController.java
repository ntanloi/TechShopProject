package com.techshop.productservice.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Cache Management Controller
 * Provides endpoints to monitor and manage Redis cache
 */
@RestController
@RequestMapping("/cache")
@RequiredArgsConstructor
@Slf4j
public class CacheController {

    private final CacheManager cacheManager;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * Get all cache names
     */
    @GetMapping("/names")
    public ResponseEntity<Collection<String>> getCacheNames() {
        return ResponseEntity.ok(cacheManager.getCacheNames());
    }

    /**
     * Get all keys in a specific cache
     */
    @GetMapping("/{cacheName}/keys")
    public ResponseEntity<Set<String>> getCacheKeys(@PathVariable String cacheName) {
        Set<String> keys = redisTemplate.keys(cacheName + "::*");
        return ResponseEntity.ok(keys != null ? keys : Collections.emptySet());
    }

    /**
     * Get cache statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        
        cacheManager.getCacheNames().forEach(cacheName -> {
            Set<String> keys = redisTemplate.keys(cacheName + "::*");
            stats.put(cacheName, Map.of(
                "totalKeys", keys != null ? keys.size() : 0,
                "keys", keys != null ? keys : Collections.emptySet()
            ));
        });
        
        return ResponseEntity.ok(stats);
    }

    /**
     * Clear specific cache
     */
    @DeleteMapping("/{cacheName}")
    public ResponseEntity<String> clearCache(@PathVariable String cacheName) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.info("Cache '{}' cleared", cacheName);
            return ResponseEntity.ok("Cache '" + cacheName + "' đã được xóa");
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Clear all caches
     */
    @DeleteMapping("/all")
    public ResponseEntity<String> clearAllCaches() {
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        });
        log.info("All caches cleared");
        return ResponseEntity.ok("Tất cả cache đã được xóa");
    }

    /**
     * Get value from cache by key
     */
    @GetMapping("/{cacheName}/key/{key}")
    public ResponseEntity<Object> getCacheValue(
            @PathVariable String cacheName,
            @PathVariable String key) {
        var cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            var value = cache.get(key);
            if (value != null) {
                return ResponseEntity.ok(value.get());
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Check Redis connection
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> checkRedisHealth() {
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            return ResponseEntity.ok(Map.of(
                "status", "UP",
                "message", "Redis connection is healthy"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "status", "DOWN",
                "message", "Redis connection failed: " + e.getMessage()
            ));
        }
    }
}
