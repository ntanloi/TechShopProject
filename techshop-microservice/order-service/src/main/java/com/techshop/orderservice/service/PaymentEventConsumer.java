package com.techshop.orderservice.service;

import com.techshop.orderservice.event.PaymentCompletedEvent;
import com.techshop.orderservice.event.PaymentFailedEvent;
import com.techshop.orderservice.model.Order;
import com.techshop.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Kafka Consumer cho Order Service.
 * Lắng nghe các event từ Payment Service để cập nhật trạng thái đơn hàng.
 *
 * Đây là phần triển khai Saga Pattern:
 * - Nếu Payment thành công → Order chuyển sang CONFIRMED + PAID
 * - Nếu Payment thất bại  → Order chuyển sang CANCELLED + FAILED (rollback)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    // Truy cập DB trực tiếp thay vì gọi qua OrderService
    // để tránh circular dependency và giữ logic đơn giản
    private final OrderRepository orderRepository;

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 1: Lắng nghe thanh toán thành công
    // ──────────────────────────────────────────────────────────────

    /**
     * Nhận event khi thanh toán hoàn thành.
     * Cập nhật đơn hàng: paymentStatus = PAID, status = CONFIRMED.
     *
     * @Transactional đảm bảo nếu lưu DB thất bại sẽ rollback.
     * Kafka sẽ retry message nếu có exception được throw.
     */
    @Transactional
    @KafkaListener(
            topics = "payment-completed-topic",
            groupId = "order-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("[Kafka Consumer] Nhận event PaymentCompleted: orderId={}, orderCode={}",
                event.getOrderId(), event.getOrderCode());

        try {
            // Tìm đơn hàng theo ID
            Order order = orderRepository.findById(event.getOrderId())
                    .orElse(null);

            if (order == null) {
                log.error("[Kafka Consumer] Không tìm thấy đơn hàng với id={}", event.getOrderId());
                return; // Bỏ qua message, tránh retry vô hạn
            }

            // Kiểm tra đơn hàng chưa được xử lý để tránh duplicate processing
            if (order.getPaymentStatus() == Order.PaymentStatus.PAID) {
                log.warn("[Kafka Consumer] Đơn hàng {} đã được xử lý thanh toán trước đó. Bỏ qua.", event.getOrderCode());
                return;
            }

            // Cập nhật trạng thái đơn hàng
            order.setPaymentStatus(Order.PaymentStatus.PAID);
            order.setStatus(Order.OrderStatus.CONFIRMED);

            orderRepository.save(order);

            log.info("[Kafka Consumer] Đã cập nhật đơn hàng {} → CONFIRMED, PAID", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi xử lý PaymentCompleted cho orderId={}: {}",
                    event.getOrderId(), e.getMessage());
            // Re-throw để Kafka retry (quan trọng: không bỏ qua lỗi DB)
            throw new RuntimeException("Lỗi cập nhật trạng thái đơn hàng sau khi thanh toán thành công", e);
        }
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 2: Lắng nghe thanh toán thất bại (Saga rollback)
    // ──────────────────────────────────────────────────────────────

    /**
     * Nhận event khi thanh toán thất bại.
     * Cập nhật đơn hàng: paymentStatus = FAILED, status = CANCELLED.
     *
     * Đây là bước "compensating transaction" trong Saga Pattern:
     * Nếu thanh toán không thành công, đơn hàng phải bị hủy.
     * Inventory Service cũng sẽ nhận event này để release stock.
     */
    @Transactional
    @KafkaListener(
            topics = "payment-failed-topic",
            groupId = "order-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.info("[Kafka Consumer] Nhận event PaymentFailed: orderId={}, reason={}",
                event.getOrderId(), event.getReason());

        try {
            Order order = orderRepository.findById(event.getOrderId())
                    .orElse(null);

            if (order == null) {
                log.error("[Kafka Consumer] Không tìm thấy đơn hàng với id={}", event.getOrderId());
                return;
            }

            // Tránh duplicate: chỉ xử lý nếu đơn chưa bị hủy
            if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                log.warn("[Kafka Consumer] Đơn hàng {} đã bị hủy trước đó. Bỏ qua.", event.getOrderCode());
                return;
            }

            // Saga rollback: hủy đơn hàng
            order.setPaymentStatus(Order.PaymentStatus.FAILED);
            order.setStatus(Order.OrderStatus.CANCELLED);

            orderRepository.save(order);

            log.info("[Kafka Consumer] Đã hủy đơn hàng {} do thanh toán thất bại (lý do: {})",
                    event.getOrderCode(), event.getReason());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi xử lý PaymentFailed cho orderId={}: {}",
                    event.getOrderId(), e.getMessage());
            throw new RuntimeException("Lỗi hủy đơn hàng sau khi thanh toán thất bại", e);
        }
    }
}
