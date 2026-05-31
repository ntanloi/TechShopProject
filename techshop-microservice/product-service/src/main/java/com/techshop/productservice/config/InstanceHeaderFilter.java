package com.techshop.productservice.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.InetAddress;

/**
 * Filter thêm X-Instance-ID header vào mọi response.
 * Giúp k6 test xác định request được xử lý bởi instance nào
 * khi scale product-service lên nhiều replicas (Round Robin load balancing).
 */
@Component
public class InstanceHeaderFilter implements Filter {

    private final String instanceId;

    public InstanceHeaderFilter() {
        String hostname = "unknown";
        try {
            hostname = InetAddress.getLocalHost().getHostName();
        } catch (Exception ignored) {}
        // Format: hostname:port — dễ phân biệt giữa các container
        this.instanceId = hostname + ":" + System.getProperty("server.port", "8082");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        if (response instanceof HttpServletResponse httpResponse) {
            httpResponse.setHeader("X-Instance-ID", instanceId);
            httpResponse.setHeader("X-Served-By", instanceId);
        }
        chain.doFilter(request, response);
    }
}
