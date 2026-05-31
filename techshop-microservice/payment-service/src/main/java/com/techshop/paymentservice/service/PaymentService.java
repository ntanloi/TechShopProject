package com.techshop.paymentservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techshop.paymentservice.dto.CreatePaymentRequest;
import com.techshop.paymentservice.dto.PaymentResponse;
import com.techshop.paymentservice.event.PaymentCompletedEvent;
import com.techshop.paymentservice.event.PaymentFailedEvent;
import com.techshop.paymentservice.model.Payment;
import com.techshop.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ thanh toán.
 *
 * Thay đổi so với phiên bản cũ (Event-Driven refactor):
 * - Bỏ OrderClient: Không còn gọi đồng bộ để update Order status
 * - Bỏ InventoryClient: Không còn gọi đồng bộ để commit Inventory
 * - Thay bằng Kafka events:
 *   + PaymentCompletedEvent → Order Service + Inventory Service + Notification Service tự xử lý
 *   + PaymentFailedEvent    → Order Service + Inventory Service rollback (Saga Pattern)
 *
 * Lợi ích:
 * - Giảm coupling: Payment Service không cần biết chi tiết của Order/Inventory/Notification
 * - Tăng resilience: Nếu Order Service tạm thời down, Kafka lưu event, xử lý sau khi up lại
 * - Tránh cascading failure: Payment đã lưu PAID không bị rollback dù downstream lỗi
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final VNPayService vnPayService;

    // Kafka producer để bắn event sau khi payment hoàn tất
    private final PaymentEventProducer paymentEventProducer;

    // ObjectMapper để serialize/deserialize items JSON
    private final ObjectMapper objectMapper;

    /**
     * Tạo payment mới cho đơn hàng.
     *
     * Luồng:
     * 1. Kiểm tra đơn hàng chưa có payment
     * 2. Tạo Payment entity và lưu vào DB
     * 3. Nếu COD → tự động PAID, bắn PaymentCompletedEvent
     * 4. Nếu VNPAY → tạo URL redirect, trả về cho frontend
     */
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        log.info("Tạo payment cho đơn hàng: orderId={}, method={}", request.getOrderId(), request.getMethod());

        // Kiểm tra đơn hàng chưa có payment để tránh duplicate
        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(p -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Đơn hàng này đã có payment tồn tại");
        });

        // Tạo Payment entity với thông tin từ request
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .method(request.getMethod())
                .status(Payment.PaymentStatus.PENDING)
                .transactionId(UUID.randomUUID().toString())
                // Lưu thông tin snapshot để dùng khi bắn event
                .orderCode(request.getOrderCode())
                .userEmail(request.getUserEmail())
                .receiverName(request.getReceiverName())
                // Serialize items thành JSON để dùng khi bắn PaymentFailedEvent
                .itemsJson(serializeItems(request.getItems()))
                .build();

        // ─────────────────────────────────────────────
        // Xử lý theo phương thức thanh toán
        // ─────────────────────────────────────────────

        if (payment.getMethod() == Payment.PaymentMethod.COD) {
            // COD: Tự động đánh dấu PAID vì khách sẽ trả tiền khi nhận hàng
            // Trong thực tế, COD sẽ được xác nhận khi giao hàng,
            // nhưng ở đây ta coi như đã xác nhận để đơn hàng tiến vào quy trình
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
        }

        if (payment.getMethod() == Payment.PaymentMethod.VNPAY) {
            // VNPAY: Tạo URL redirect đến cổng thanh toán VNPay
            // User sẽ được redirect sang trang VNPay để điền thông tin thẻ
            String paymentUrl = vnPayService.createPaymentUrl(
                    payment.getTransactionId(),
                    request.getAmount(),
                    "Thanh toan don hang " + request.getOrderId(),
                    request.getReturnUrl()
            );
            payment.setPaymentUrl(paymentUrl);
        }

        // Lưu payment vào DB
        Payment savedPayment = paymentRepository.save(payment);
        log.info("Đã lưu payment: paymentId={}, status={}", savedPayment.getId(), savedPayment.getStatus());

        // ─────────────────────────────────────────────
        // Bắn Kafka event nếu payment thành công ngay (COD)
        // VNPAY sẽ bắn event sau khi user confirm payment và callback về
        // ─────────────────────────────────────────────
        if (savedPayment.getStatus() == Payment.PaymentStatus.PAID) {
            publishPaymentCompletedEvent(savedPayment);
        }

        return mapToResponse(savedPayment);
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy payment"));
        return mapToResponse(payment);
    }

    public PaymentResponse getByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy payment cho đơn hàng: " + orderId));
        return mapToResponse(payment);
    }

    /**
     * Cập nhật trạng thái payment thủ công (dùng bởi Admin).
     * Tự động bắn Kafka event nếu chuyển sang PAID.
     */
    @Transactional
    public PaymentResponse updateStatus(Long id, Payment.PaymentStatus status) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy payment"));

        payment.setStatus(status);
        if (status == Payment.PaymentStatus.PAID) {
            payment.setPaidAt(LocalDateTime.now());
        }

        Payment updatedPayment = paymentRepository.save(payment);

        // Bắn event tương ứng
        if (status == Payment.PaymentStatus.PAID) {
            publishPaymentCompletedEvent(updatedPayment);
        } else if (status == Payment.PaymentStatus.FAILED) {
            publishPaymentFailedEvent(updatedPayment, "Admin manual update");
        }

        return mapToResponse(updatedPayment);
    }

    /**
     * Xác minh kết quả thanh toán VNPay (callback từ VNPay sau khi user thanh toán).
     *
     * VNPay gửi callback về với mã phản hồi:
     * - "00" → Thanh toán thành công → bắn PaymentCompletedEvent
     * - Khác → Thanh toán thất bại  → bắn PaymentFailedEvent (Saga rollback)
     */
    @Transactional
    public PaymentResponse verifyPayment(String transactionId, String vnpResponseCode) {
        log.info("Xác minh payment VNPay: transactionId={}, responseCode={}", transactionId, vnpResponseCode);

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy payment với transactionId: " + transactionId));

        if ("00".equals(vnpResponseCode)) {
            // ── THANH TOÁN THÀNH CÔNG ──
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            Payment updatedPayment = paymentRepository.save(payment);

            // Bắn event: Order Service sẽ CONFIRMED, Inventory confirm reserve,
            // Notification Service gửi email xác nhận
            publishPaymentCompletedEvent(updatedPayment);

            log.info("VNPay thanh toán thành công: orderId={}, transactionId={}",
                    payment.getOrderId(), transactionId);
        } else {
            // ── THANH TOÁN THẤT BẠI ── (Saga rollback)
            payment.setStatus(Payment.PaymentStatus.FAILED);
            Payment updatedPayment = paymentRepository.save(payment);

            // Bắn event: Order Service sẽ CANCELLED, Inventory release stock
            String reason = String.format("VNPay response code: %s", vnpResponseCode);
            publishPaymentFailedEvent(updatedPayment, reason);

            log.warn("VNPay thanh toán thất bại: orderId={}, responseCode={}",
                    payment.getOrderId(), vnpResponseCode);
        }

        return mapToResponse(payment);
    }

    // ──────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Build và bắn PaymentCompletedEvent lên Kafka.
     * Được gọi sau khi lưu payment thành công vào DB.
     */
    private void publishPaymentCompletedEvent(Payment payment) {
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .userId(payment.getUserId())
                .userEmail(payment.getUserEmail())
                .receiverName(payment.getReceiverName())
                .amount(payment.getAmount())
                .paymentMethod(payment.getMethod().name())
                .build();

        paymentEventProducer.publishPaymentCompleted(event);
    }

    /**
     * Build và bắn PaymentFailedEvent lên Kafka.
     * Trigger Saga rollback ở Order Service và Inventory Service.
     * Bao gồm danh sách items để Inventory Service tự động release stock.
     */
    private void publishPaymentFailedEvent(Payment payment, String reason) {
        List<PaymentFailedEvent.OrderItemEvent> items = deserializeItems(payment.getItemsJson());

        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .paymentId(payment.getId())
                .orderId(payment.getOrderId())
                .orderCode(payment.getOrderCode())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .reason(reason)
                .items(items)
                .build();

        paymentEventProducer.publishPaymentFailed(event);
    }

    // ──────────────────────────────────────────────────────────────
    // SERIALIZATION HELPERS
    // ──────────────────────────────────────────────────────────────

    /**
     * Serialize danh sách items từ request thành JSON string để lưu vào DB.
     */
    private String serializeItems(List<CreatePaymentRequest.OrderItemDto> items) {
        if (items == null || items.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            log.warn("Không thể serialize items: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Deserialize JSON string từ DB thành danh sách OrderItemEvent.
     * Trả về empty list nếu không có dữ liệu hoặc lỗi parse.
     */
    private List<PaymentFailedEvent.OrderItemEvent> deserializeItems(String itemsJson) {
        if (itemsJson == null || itemsJson.isBlank()) return Collections.emptyList();
        try {
            List<CreatePaymentRequest.OrderItemDto> dtos = objectMapper.readValue(
                    itemsJson,
                    new TypeReference<List<CreatePaymentRequest.OrderItemDto>>() {}
            );
            return dtos.stream()
                    .map(dto -> PaymentFailedEvent.OrderItemEvent.builder()
                            .productId(dto.getProductId())
                            .productName(dto.getProductName())
                            .quantity(dto.getQuantity())
                            .unitPrice(dto.getUnitPrice())
                            .subtotal(dto.getSubtotal())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Không thể deserialize items từ JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Map Payment entity sang PaymentResponse DTO.
     */
    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .transactionId(payment.getTransactionId())
                .paymentUrl(payment.getPaymentUrl())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
