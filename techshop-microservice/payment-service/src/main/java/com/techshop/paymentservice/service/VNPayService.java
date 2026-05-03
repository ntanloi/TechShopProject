package com.techshop.paymentservice.service;

import com.techshop.paymentservice.config.VNPayConfig;
import com.techshop.paymentservice.dto.VNPayRequest;
import com.techshop.paymentservice.dto.VNPayResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * VNPay Payment Service
 * Handles VNPay payment URL creation and callback verification
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private final VNPayConfig vnpayConfig;
    private static final Integer VALID_MINUTE = 15;

    /**
     * Create VNPay payment URL
     * 
     * @param transactionId Unique transaction reference
     * @param amount Payment amount in VND
     * @param orderInfo Order description
     * @param returnUrl URL to redirect after payment
     * @return Payment URL string
     */
    public String createPaymentUrl(String transactionId, BigDecimal amount, String orderInfo, String returnUrl) {
        try {
            String vnp_IpAddr = "127.0.0.1"; // Default IP, should be replaced with actual client IP

            // Amount must be multiplied by 100 (VNPay's requirement)
            long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnpayConfig.getVersion());
            vnp_Params.put("vnp_Command", vnpayConfig.getCommand());
            vnp_Params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
            vnp_Params.put("vnp_Amount", String.valueOf(amountInCents));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", transactionId);
            vnp_Params.put("vnp_OrderInfo", orderInfo);
            vnp_Params.put("vnp_OrderType", vnpayConfig.getOrderType());
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", returnUrl != null ? returnUrl : vnpayConfig.getReturnUrl());
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            // Force NCB bank code for sandbox testing (shows test card form directly)
            vnp_Params.put("vnp_BankCode", "NCB");

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, VALID_MINUTE);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // Build data to hash and query string
            String queryUrl = vnpayConfig.hashAllFields(vnp_Params);
            String vnp_SecureHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), queryUrl);
            queryUrl += "&vnp_SecureHashType=SHA512&vnp_SecureHash=" + vnp_SecureHash;

            String paymentUrl = vnpayConfig.getPayUrl() + "?" + queryUrl;

            log.info("Created VNPay payment URL for transaction: {}", transactionId);
            return paymentUrl;

        } catch (Exception e) {
            log.error("Error creating VNPay payment URL: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Create VNPay payment URL with full request details
     * 
     * @param request VNPay request with order details
     * @param httpServletRequest HTTP request to extract client IP
     * @return VNPayResponse with payment URL
     */
    public VNPayResponse createPaymentUrl(VNPayRequest request, HttpServletRequest httpServletRequest) {
        try {
            String vnp_TxnRef = vnpayConfig.getRandomNumber(8);
            String vnp_IpAddr = getClientIP(httpServletRequest);

            // Amount must be multiplied by 100 (VNPay's requirement)
            long amount = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnpayConfig.getVersion());
            vnp_Params.put("vnp_Command", vnpayConfig.getCommand());
            vnp_Params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", request.getOrderInfo());
            vnp_Params.put("vnp_OrderType", vnpayConfig.getOrderType());
            vnp_Params.put("vnp_Locale", request.getLanguage() != null ? request.getLanguage() : "vn");
            vnp_Params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            // Force a specific payment method to avoid the generic option list on VNPay
            String bankCode = (request.getBankCode() != null && !request.getBankCode().isBlank())
                    ? request.getBankCode().trim()
                    : "NCB"; // default to NCB test card form for sandbox testing
            vnp_Params.put("vnp_BankCode", bankCode);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, VALID_MINUTE);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // Build data to hash and query string
            String queryUrl = vnpayConfig.hashAllFields(vnp_Params);
            String vnp_SecureHash = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), queryUrl);
            queryUrl += "&vnp_SecureHashType=SHA512&vnp_SecureHash=" + vnp_SecureHash;

            String paymentUrl = vnpayConfig.getPayUrl() + "?" + queryUrl;

            log.info("Created VNPay payment URL for order: {}, txnRef: {}", request.getOrderId(), vnp_TxnRef);

            return VNPayResponse.builder()
                    .paymentUrl(paymentUrl)
                    .transactionNo(vnp_TxnRef)
                    .orderId(String.valueOf(request.getOrderId()))
                    .success(true)
                    .message("Payment URL created successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error creating VNPay payment URL: {}", e.getMessage(), e);
            return VNPayResponse.builder()
                    .success(false)
                    .message("Error creating payment URL: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Verify VNPay payment callback signature
     * 
     * @param params Callback parameters from VNPay
     * @return true if signature is valid
     */
    public boolean verifyPayment(Map<String, String> params) {
        try {
            String vnp_SecureHash = params.get("vnp_SecureHash");

            // Remove secure hash from params to validate
            Map<String, String> paramsToVerify = new HashMap<>(params);
            paramsToVerify.remove("vnp_SecureHash");
            paramsToVerify.remove("vnp_SecureHashType");

            // Verify signature
            String signValue = vnpayConfig.hashAllFields(paramsToVerify);
            String checkSum = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), signValue);

            boolean isValid = checkSum.equalsIgnoreCase(vnp_SecureHash);
            
            if (!isValid) {
                log.warn("Invalid VNPay signature for transaction: {}", params.get("vnp_TxnRef"));
            }
            
            return isValid;

        } catch (Exception e) {
            log.error("Error verifying VNPay payment", e);
            return false;
        }
    }

    /**
     * Process VNPay callback and return response
     * 
     * @param params Callback parameters from VNPay
     * @return VNPayResponse with payment result
     */
    public VNPayResponse processCallback(Map<String, String> params) {
        try {
            String vnp_SecureHash = params.get("vnp_SecureHash");

            // Remove secure hash from params to validate
            Map<String, String> paramsToVerify = new HashMap<>(params);
            paramsToVerify.remove("vnp_SecureHash");
            paramsToVerify.remove("vnp_SecureHashType");

            // Verify signature
            String signValue = vnpayConfig.hashAllFields(paramsToVerify);
            String checkSum = vnpayConfig.hmacSHA512(vnpayConfig.getHashSecret(), signValue);

            if (!checkSum.equalsIgnoreCase(vnp_SecureHash)) {
                log.warn("Invalid VNPay signature for transaction: {}", params.get("vnp_TxnRef"));
                return VNPayResponse.builder()
                        .success(false)
                        .message("Invalid signature")
                        .build();
            }

            String txnRef = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            String bankTranNo = params.get("vnp_BankTranNo");

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                // Payment successful
                log.info("Payment successful for txnRef: {}", txnRef);
                
                return VNPayResponse.builder()
                        .success(true)
                        .transactionNo(bankTranNo)
                        .orderId(txnRef)
                        .message("Payment successful")
                        .build();
            } else {
                // Payment failed
                log.info("Payment failed for txnRef: {}, responseCode: {}", txnRef, responseCode);
                
                return VNPayResponse.builder()
                        .success(false)
                        .transactionNo(bankTranNo)
                        .orderId(txnRef)
                        .message("Payment failed with response code: " + responseCode)
                        .build();
            }

        } catch (Exception e) {
            log.error("Error processing VNPay callback: {}", e.getMessage(), e);
            return VNPayResponse.builder()
                    .success(false)
                    .message("Error processing payment callback: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get client IP address from HTTP request
     * 
     * @param request HTTP servlet request
     * @return Client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
