package com.techshop.paymentservice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techshop.paymentservice.config.KafkaTopicConstants;
import com.techshop.paymentservice.dto.CreatePaymentRequest;
import com.techshop.paymentservice.dto.PaymentResponse;
import com.techshop.paymentservice.enums.ErrorCode;
import com.techshop.paymentservice.event.PaymentCompletedEvent;
import com.techshop.paymentservice.event.PaymentFailedEvent;
import com.techshop.paymentservice.exception.AppException;
import com.techshop.paymentservice.model.Payment;
import com.techshop.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final VNPayService vnPayService;
    private final OutboxService outboxService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        log.info("Tạo payment cho đơn hàng: orderId={}, method={}", request.getOrderId(), request.getMethod());

        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(p -> {
            throw new AppException(ErrorCode.INVALID_AMOUNT);
        });

        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .method(request.getMethod())
                .status(Payment.PaymentStatus.PENDING)
                .transactionId(UUID.randomUUID().toString())
                .orderCode(request.getOrderCode())
                .userEmail(request.getUserEmail())
                .receiverName(request.getReceiverName())
                .itemsJson(serializeItems(request.getItems()))
                .build();

        if (payment.getMethod() == Payment.PaymentMethod.COD) {
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
        }

        if (payment.getMethod() == Payment.PaymentMethod.VNPAY) {
            String paymentUrl = vnPayService.createPaymentUrl(
                    payment.getTransactionId(),
                    request.getAmount(),
                    "Thanh toan don hang " + request.getOrderId(),
                    request.getReturnUrl()
            );
            payment.setPaymentUrl(paymentUrl);
        }

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Đã lưu payment: paymentId={}, status={}", savedPayment.getId(), savedPayment.getStatus());

        if (savedPayment.getStatus() == Payment.PaymentStatus.PAID) {
            publishPaymentCompletedEvent(savedPayment);
        }

        return mapToResponse(savedPayment);
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        return mapToResponse(payment);
    }

    public PaymentResponse getByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse updateStatus(Long id, Payment.PaymentStatus status) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        payment.setStatus(status);
        if (status == Payment.PaymentStatus.PAID) {
            payment.setPaidAt(LocalDateTime.now());
        }

        Payment updatedPayment = paymentRepository.save(payment);

        if (status == Payment.PaymentStatus.PAID) {
            publishPaymentCompletedEvent(updatedPayment);
        } else if (status == Payment.PaymentStatus.FAILED) {
            publishPaymentFailedEvent(updatedPayment, "Admin manual update");
        }

        return mapToResponse(updatedPayment);
    }

    @Transactional
    public PaymentResponse verifyPayment(String transactionId, String vnpResponseCode) {
        log.info("Xác minh payment VNPay: transactionId={}, responseCode={}", transactionId, vnpResponseCode);

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if ("00".equals(vnpResponseCode)) {
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            Payment updatedPayment = paymentRepository.save(payment);
            publishPaymentCompletedEvent(updatedPayment);
            log.info("VNPay thanh toán thành công: orderId={}, transactionId={}",
                    payment.getOrderId(), transactionId);
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            Payment updatedPayment = paymentRepository.save(payment);
            String reason = String.format("VNPay response code: %s", vnpResponseCode);
            publishPaymentFailedEvent(updatedPayment, reason);
            log.warn("VNPay thanh toán thất bại: orderId={}, responseCode={}",
                    payment.getOrderId(), vnpResponseCode);
        }

        return mapToResponse(payment);
    }

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

        outboxService.saveEvent(
                "Payment",
                payment.getOrderCode(),
                "PaymentCompleted",
                KafkaTopicConstants.PAYMENT_COMPLETED_TOPIC,
                payment.getOrderCode(),
                event
        );
    }

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

        outboxService.saveEvent(
                "Payment",
                payment.getOrderCode(),
                "PaymentFailed",
                KafkaTopicConstants.PAYMENT_FAILED_TOPIC,
                payment.getOrderCode(),
                event
        );
    }

    private String serializeItems(List<CreatePaymentRequest.OrderItemDto> items) {
        if (items == null || items.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            log.warn("Không thể serialize items: {}", e.getMessage());
            return null;
        }
    }

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
