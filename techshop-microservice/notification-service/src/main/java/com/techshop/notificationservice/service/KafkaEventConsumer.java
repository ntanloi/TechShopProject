package com.techshop.notificationservice.service;

import com.techshop.notificationservice.dto.OrderConfirmEmailRequest;
import com.techshop.notificationservice.event.OrderPlacedEvent;
import com.techshop.notificationservice.event.OtpRequestedEvent;
import com.techshop.notificationservice.event.PaymentCompletedEvent;
import com.techshop.notificationservice.event.UserRegisteredEvent;
import com.techshop.notificationservice.model.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Kafka Consumer cho Notification Service.
 * Lắng nghe các topic và xử lý tương ứng:
 *
 * - user-registered-topic  → Gửi email Welcome
 * - order-placed-topic     → Gửi email xác nhận đơn hàng + thông báo in-app
 * - payment-completed-topic → Gửi email xác nhận thanh toán + thông báo in-app
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    // Service gửi email HTML
    private final EmailService emailService;

    // Service lưu thông báo in-app vào DB và push WebSocket
    private final NotificationService notificationService;

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 1: Lắng nghe sự kiện người dùng đăng ký mới
    // ──────────────────────────────────────────────────────────────

    @KafkaListener(
            topics = "user-registered-topic",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("[Kafka Consumer] Nhận event UserRegistered: userId={}, email={}",
                event.getUserId(), event.getEmail());

        try {
            emailService.sendWelcomeEmail(event.getEmail(), event.getFullName());
            log.info("[Kafka Consumer] Đã gửi email Welcome cho userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi email Welcome cho userId={}: {}",
                    event.getUserId(), e.getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 1b: Lắng nghe sự kiện yêu cầu gửi OTP
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe topic 'otp-requested-topic'.
     * Khi nhận được message, gửi email chứa mã OTP 6 số cho user.
     *
     * Luồng: user-service tạo OTP → lưu OutboxEvent → OutboxPublisher
     *        publish lên Kafka → consumer này nhận → sendOtpEmail()
     *
     * KHÔNG gửi lại ACK thủ công — Spring Kafka tự ACK sau khi method return bình thường.
     * Nếu method throw exception, Kafka sẽ retry theo cấu hình error handler.
     */
    @KafkaListener(
            topics = "otp-requested-topic",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOtpRequested(OtpRequestedEvent event) {
        log.info("[Kafka Consumer] Nhận event OtpRequested: email={}", event.getEmail());

        try {
            emailService.sendOtpEmail(event.getEmail(), event.getOtpCode(), event.getExpiresInMinutes());
            log.info("[Kafka Consumer] Đã gửi email OTP tới email={}", event.getEmail());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi email OTP tới email={}: {}",
                    event.getEmail(), e.getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 2: Lắng nghe sự kiện đặt đơn hàng mới
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe topic 'order-placed-topic'.
     * Khi nhận được message:
     * 1. Gửi email xác nhận đơn hàng
     * 2. Gửi thông báo in-app (lưu DB + push WebSocket)
     */
    @KafkaListener(
            topics = "order-placed-topic",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("[Kafka Consumer] Nhận event OrderPlaced: orderId={}, orderCode={}, email={}",
                event.getOrderId(), event.getOrderCode(), event.getUserEmail());

        // Gửi email xác nhận đơn hàng
        try {
            OrderConfirmEmailRequest emailRequest = new OrderConfirmEmailRequest();
            emailRequest.setOrderId(event.getOrderId());
            emailRequest.setEmail(event.getUserEmail());
            emailRequest.setCustomerName(event.getReceiverName());
            emailRequest.setOrderCode(event.getOrderCode());
            emailRequest.setTotalAmount(event.getTotalAmount());
            emailRequest.setShippingAddress(event.getShippingAddress());
            emailRequest.setPaymentMethod(event.getPaymentMethod());

            emailService.sendOrderConfirmEmail(emailRequest);
            log.info("[Kafka Consumer] Đã gửi email xác nhận đơn hàng={}", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi email xác nhận đơn hàng={}: {}",
                    event.getOrderCode(), e.getMessage());
        }

        // Gửi thông báo in-app
        try {
            notificationService.send(
                    event.getUserId(),
                    "Đặt hàng thành công",
                    String.format("Đơn hàng #%s đã được tạo. Tổng tiền: %,.0f VNĐ. Cảm ơn bạn đã mua sắm!",
                            event.getOrderCode(), event.getTotalAmount()),
                    NotificationType.ORDER_CONFIRMATION
            );
            log.info("[Kafka Consumer] Đã gửi in-app notification cho userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi in-app notification cho userId={}: {}",
                    event.getUserId(), e.getMessage());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 3: Lắng nghe sự kiện thanh toán thành công
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe topic 'payment-completed-topic'.
     * Khi nhận được message:
     * 1. Gửi email xác nhận thanh toán thành công
     * 2. Gửi thông báo in-app
     */
    @KafkaListener(
            topics = "payment-completed-topic",
            groupId = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("[Kafka Consumer] Nhận event PaymentCompleted: orderId={}, orderCode={}, userId={}",
                event.getOrderId(), event.getOrderCode(), event.getUserId());

        // Gửi email xác nhận thanh toán
        try {
            OrderConfirmEmailRequest emailRequest = new OrderConfirmEmailRequest();
            emailRequest.setOrderId(event.getOrderId());
            emailRequest.setEmail(event.getUserEmail());
            emailRequest.setCustomerName(event.getReceiverName());
            emailRequest.setOrderCode(event.getOrderCode());
            emailRequest.setTotalAmount(event.getAmount());

            emailService.sendPaymentSuccessEmail(emailRequest);
            log.info("[Kafka Consumer] Đã gửi email thanh toán thành công cho đơn hàng={}", event.getOrderCode());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi email thanh toán cho đơn hàng={}: {}",
                    event.getOrderCode(), e.getMessage());
        }

        // Gửi thông báo in-app
        try {
            notificationService.send(
                    event.getUserId(),
                    "Thanh toán thành công",
                    String.format("Đơn hàng #%s đã được thanh toán. Số tiền: %,.0f VNĐ. Chúng tôi đang chuẩn bị hàng!",
                            event.getOrderCode(), event.getAmount()),
                    NotificationType.PAYMENT_SUCCESS
            );
            log.info("[Kafka Consumer] Đã gửi in-app notification thanh toán cho userId={}", event.getUserId());
        } catch (Exception e) {
            log.error("[Kafka Consumer] Lỗi gửi in-app notification thanh toán cho userId={}: {}",
                    event.getUserId(), e.getMessage());
        }
    }
}
