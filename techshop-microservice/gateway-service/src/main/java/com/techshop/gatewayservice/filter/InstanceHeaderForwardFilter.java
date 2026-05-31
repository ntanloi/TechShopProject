package com.techshop.gatewayservice.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Forward X-Instance-ID và X-Served-By headers từ upstream response về client.
 *
 * Spring Cloud Gateway mặc định không tự động forward custom response headers
 * từ upstream service. Filter này đọc headers đó từ upstream và ghi vào
 * response trả về client — giúp k6 test biết request được xử lý bởi
 * product-service instance nào khi scale lên 3 replicas.
 */
@Component
public class InstanceHeaderForwardFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).then(Mono.fromRunnable(() -> {
            ServerHttpResponse response = exchange.getResponse();

            // Lấy headers từ upstream (đã được Spring Cloud Gateway lưu vào response)
            String instanceId = response.getHeaders().getFirst("X-Instance-ID");
            String servedBy   = response.getHeaders().getFirst("X-Served-By");

            // Nếu upstream chưa set (ví dụ service chưa rebuild), thử lấy từ exchange attributes
            if (instanceId == null) {
                Object attr = exchange.getAttributes().get("X-Instance-ID");
                if (attr != null) instanceId = attr.toString();
            }

            // Đảm bảo header được expose ra ngoài (CORS)
            if (instanceId != null) {
                response.getHeaders().set("X-Instance-ID", instanceId);
            }
            if (servedBy != null) {
                response.getHeaders().set("X-Served-By", servedBy);
            }

            // Luôn expose headers này qua CORS
            response.getHeaders().add("Access-Control-Expose-Headers", "X-Instance-ID, X-Served-By");
        }));
    }

    @Override
    public int getOrder() {
        // Chạy sau tất cả filters khác để đảm bảo upstream đã response
        return Ordered.LOWEST_PRECEDENCE - 1;
    }
}
