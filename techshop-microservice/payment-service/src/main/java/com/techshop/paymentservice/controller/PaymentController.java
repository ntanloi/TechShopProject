package com.techshop.paymentservice.controller;

import com.techshop.paymentservice.dto.CreatePaymentRequest;
import com.techshop.paymentservice.dto.PaymentResponse;
import com.techshop.paymentservice.dto.VNPayRequest;
import com.techshop.paymentservice.dto.VNPayResponse;
import com.techshop.paymentservice.model.Payment;
import com.techshop.paymentservice.service.PaymentService;
import com.techshop.paymentservice.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Payment Controller
 * Handles payment operations including VNPay integration
 */
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayService vnPayService;

    /**
     * Create a new payment
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody CreatePaymentRequest request) {
        log.info("Creating payment for order: {}", request.getOrderId());
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get payment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getById(@PathVariable Long id) {
        PaymentResponse response = paymentService.getById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get payment by order ID
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getByOrderId(@PathVariable Long orderId) {
        PaymentResponse response = paymentService.getByOrderId(orderId);
        return ResponseEntity.ok(response);
    }

    /**
     * Update payment status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<PaymentResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Payment.PaymentStatus status) {
        PaymentResponse response = paymentService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    /**
     * Create VNPay payment URL
     * This endpoint can be used to create a payment URL without creating an order first
     */
    @PostMapping("/vnpay/create")
    public ResponseEntity<VNPayResponse> createVNPayPayment(
            @RequestBody VNPayRequest request,
            HttpServletRequest httpRequest) {
        log.info("Creating VNPay payment URL for order: {}", request.getOrderId());
        VNPayResponse response = vnPayService.createPaymentUrl(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay return callback (GET request from VNPay redirect)
     * This is called when user completes payment on VNPay and is redirected back
     */
    @GetMapping("/vnpay/callback")
    public ResponseEntity<VNPayResponse> handleVNPayCallback(@RequestParam Map<String, String> params) {
        log.info("VNPay callback received for transaction: {}", params.get("vnp_TxnRef"));
        
        VNPayResponse response = vnPayService.processCallback(params);
        
        if (response.isSuccess()) {
            // Update payment status in database
            String transactionId = params.get("vnp_TxnRef");
            String vnpResponseCode = params.get("vnp_ResponseCode");
            
            try {
                PaymentResponse payment = paymentService.verifyPayment(transactionId, vnpResponseCode);
                log.info("Payment verified and updated for transaction: {}, orderId: {}", transactionId, payment.getOrderId());
                
                // Set the actual order ID in the response so frontend can redirect correctly
                response = VNPayResponse.builder()
                        .success(response.isSuccess())
                        .message(response.getMessage())
                        .transactionNo(response.getTransactionNo())
                        .orderId(String.valueOf(payment.getOrderId()))
                        .build();
                
            } catch (Exception e) {
                log.error("Error updating payment status for transaction: {}", transactionId, e);
                return ResponseEntity.ok(VNPayResponse.builder()
                        .success(false)
                        .message("Error verifying payment: " + e.getMessage())
                        .build());
            }
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay IPN (Instant Payment Notification)
     * This is called by VNPay server to notify payment result
     */
    @PostMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIPN(@RequestParam Map<String, String> params) {
        log.info("VNPay IPN received for transaction: {}", params.get("vnp_TxnRef"));
        
        VNPayResponse response = vnPayService.processCallback(params);

        if (response.isSuccess()) {
            // Update payment status in database
            String transactionId = params.get("vnp_TxnRef");
            String vnpResponseCode = params.get("vnp_ResponseCode");
            
            try {
                PaymentResponse payment = paymentService.verifyPayment(transactionId, vnpResponseCode);
                log.info("IPN processed successfully for transaction: {}, orderId: {}", transactionId, payment.getOrderId());
                return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
            } catch (Exception e) {
                log.error("Error processing VNPay IPN", e);
                return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
            }
        } else {
            return ResponseEntity.ok(Map.of("RspCode", "97", "Message", response.getMessage()));
        }
    }

    /**
     * Legacy endpoint for backward compatibility
     * @deprecated Use /vnpay/callback instead
     */
    @GetMapping("/vnpay-return")
    @Deprecated
    public ResponseEntity<String> vnpayReturn(@RequestParam Map<String, String> params) {
        log.info("VNPay return callback received (legacy endpoint)");
        
        // Verify signature
        if (!vnPayService.verifyPayment(params)) {
            log.error("Invalid VNPay signature");
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        String vnpResponseCode = params.get("vnp_ResponseCode");
        String transactionId = params.get("vnp_TxnRef");

        // Verify payment
        PaymentResponse payment = paymentService.verifyPayment(transactionId, vnpResponseCode);

        if ("00".equals(vnpResponseCode)) {
            log.info("Payment successful for transaction: {}", transactionId);
            return ResponseEntity.ok("Payment successful! Transaction ID: " + transactionId);
        } else {
            log.warn("Payment failed for transaction: {}, code: {}", transactionId, vnpResponseCode);
            return ResponseEntity.ok("Payment failed! Please try again.");
        }
    }
}
