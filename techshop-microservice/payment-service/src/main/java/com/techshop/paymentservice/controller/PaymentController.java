package com.techshop.paymentservice.controller;

import com.techshop.paymentservice.model.Payment;
import com.techshop.paymentservice.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;

    @PostMapping
    public ResponseEntity<Payment> createPayment(@RequestBody Payment payment) {
        // TODO: integrate VNPay, generate paymentUrl for VNPAY method
        return ResponseEntity.ok(paymentRepository.save(payment));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Payment> getByOrder(@PathVariable Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Payment> getByUser(@PathVariable Long userId) {
        return paymentRepository.findByUserId(userId);
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<String> vnpayReturn(@RequestParam java.util.Map<String, String> params) {
        // TODO: verify VNPay signature and update payment status
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String transactionId = params.get("vnp_TxnRef");

        if ("00".equals(vnpResponseCode)) {
            paymentRepository.findByTransactionId(transactionId).ifPresent(p -> {
                p.setStatus(Payment.PaymentStatus.PAID);
                p.setPaidAt(java.time.LocalDateTime.now());
                paymentRepository.save(p);
            });
            return ResponseEntity.ok("Payment successful");
        }
        return ResponseEntity.ok("Payment failed");
    }
}
