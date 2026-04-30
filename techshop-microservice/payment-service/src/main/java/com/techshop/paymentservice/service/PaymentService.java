package com.techshop.paymentservice.service;

import com.techshop.paymentservice.client.InventoryClient;
import com.techshop.paymentservice.client.OrderClient;
import com.techshop.paymentservice.dto.CreatePaymentRequest;
import com.techshop.paymentservice.dto.PaymentResponse;
import com.techshop.paymentservice.model.Payment;
import com.techshop.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final InventoryClient inventoryClient;
    private final VNPayService vnPayService;

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        log.info("Creating payment for order: {}", request.getOrderId());

        // Kiểm tra xem order đã có payment chưa
        paymentRepository.findByOrderId(request.getOrderId()).ifPresent(p -> {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment already exists for this order");
        });

        // Tạo payment
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .userId(request.getUserId())
                .amount(request.getAmount())
                .method(request.getMethod())
                .status(Payment.PaymentStatus.PENDING)
                .transactionId(UUID.randomUUID().toString())
                .build();

        // Nếu là COD, tự động set PAID
        if (request.getMethod() == Payment.PaymentMethod.COD) {
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
        }

        // Nếu là VNPAY, tạo payment URL
        if (request.getMethod() == Payment.PaymentMethod.VNPAY) {
            String paymentUrl = vnPayService.createPaymentUrl(
                    payment.getTransactionId(),
                    request.getAmount(),
                    "Thanh toan don hang " + request.getOrderId(),
                    request.getReturnUrl()
            );
            payment.setPaymentUrl(paymentUrl);
        }

        Payment savedPayment = paymentRepository.save(payment);

        // Nếu payment thành công (COD), update order và commit inventory
        if (savedPayment.getStatus() == Payment.PaymentStatus.PAID) {
            updateOrderAndInventory(savedPayment.getOrderId());
        }

        return mapToResponse(savedPayment);
    }

    public PaymentResponse getById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        return mapToResponse(payment);
    }

    public PaymentResponse getByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for order: " + orderId));
        return mapToResponse(payment);
    }

    @Transactional
    public PaymentResponse updateStatus(Long id, Payment.PaymentStatus status) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        payment.setStatus(status);
        if (status == Payment.PaymentStatus.PAID) {
            payment.setPaidAt(LocalDateTime.now());
            updateOrderAndInventory(payment.getOrderId());
        }

        Payment updatedPayment = paymentRepository.save(payment);
        return mapToResponse(updatedPayment);
    }

    @Transactional
    public PaymentResponse verifyPayment(String transactionId, String vnpResponseCode) {
        log.info("Verifying payment: {}, response code: {}", transactionId, vnpResponseCode);

        Payment payment = paymentRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

        // VNPay response code "00" = success
        if ("00".equals(vnpResponseCode)) {
            payment.setStatus(Payment.PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            
            // Update order và commit inventory
            updateOrderAndInventory(payment.getOrderId());
        } else {
            payment.setStatus(Payment.PaymentStatus.FAILED);
        }

        Payment updatedPayment = paymentRepository.save(payment);
        return mapToResponse(updatedPayment);
    }

    private void updateOrderAndInventory(Long orderId) {
        try {
            log.info("Updating order status and committing inventory for order: {}", orderId);
            
            // Update order status to PAID
            orderClient.updatePaymentStatus(orderId, "PAID");
            
            // Commit inventory (chuyển reserved -> sold)
            inventoryClient.commitInventory(orderId);
            
            log.info("Successfully updated order and inventory for order: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to update order/inventory for order: {}", orderId, e);
            // Không throw exception để không rollback payment
            // Có thể implement retry mechanism hoặc manual reconciliation
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
