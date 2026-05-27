package com.techshop.gatewayservice.filter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.cloud.gateway.support.NotFoundException;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global Error Handler for Gateway
 * Handles rate limit exceeded and other gateway errors
 */
@Component
@Order(-1)
@Slf4j
public class RateLimitErrorHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        
        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        // Set content type
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        HttpStatus status;
        String message;
        String error;

        // Handle different exception types
        if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.valueOf(rse.getStatusCode().value());
            message = rse.getReason() != null ? rse.getReason() : status.getReasonPhrase();
            error = status.getReasonPhrase();
            
            // Check if it's a rate limit error (429)
            if (status == HttpStatus.TOO_MANY_REQUESTS) {
                message = "Bạn đã vượt quá giới hạn số lượng request. Vui lòng thử lại sau.";
                error = "Rate Limit Exceeded";
                log.warn("Rate limit exceeded for IP: {}", 
                    exchange.getRequest().getRemoteAddress());
            }
        } else if (ex instanceof NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            message = "Service không tồn tại hoặc không khả dụng";
            error = "Service Not Found";
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Đã xảy ra lỗi không mong muốn";
            error = "Internal Server Error";
            log.error("Unexpected error in gateway", ex);
        }

        response.setStatusCode(status);

        // Build error response
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now().toString());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", exchange.getRequest().getPath().value());

        // Add retry-after header for rate limit errors
        if (status == HttpStatus.TOO_MANY_REQUESTS) {
            response.getHeaders().add("X-RateLimit-Retry-After-Seconds", "60");
            errorResponse.put("retryAfter", "60 seconds");
        }

        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(errorResponse);
        } catch (JsonProcessingException e) {
            bytes = "{\"error\":\"Error processing error response\"}".getBytes(StandardCharsets.UTF_8);
        }

        DataBuffer buffer = response.bufferFactory().wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
