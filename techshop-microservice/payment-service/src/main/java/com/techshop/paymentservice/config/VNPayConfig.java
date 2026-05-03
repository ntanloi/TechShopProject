package com.techshop.paymentservice.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * VNPay Configuration
 * Manages VNPay payment gateway settings and utility methods
 */
@Configuration
@ConfigurationProperties(prefix = "vnpay")
@Getter
@Setter
public class VNPayConfig {

    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String returnUrl;
    private String apiUrl;
    private String version = "2.1.0";
    private String command = "pay";
    private String orderType = "other";

    /**
     * Generate HMAC-SHA512 hash for VNPay signature
     * 
     * @param key Secret key
     * @param data Data to hash
     * @return Hashed string in hexadecimal format
     */
    public String hmacSHA512(String key, String data) {
        try {
            if (key == null || data == null) {
                throw new IllegalArgumentException("Key and data must not be null");
            }
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating HMAC-SHA512", e);
        }
    }

    /**
     * Build query string from parameters (sorted alphabetically)
     * 
     * @param fields Map of field names and values
     * @return URL-encoded query string
     */
    public String hashAllFields(Map<String, String> fields) {
        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder sb = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                sb.append(fieldName).append("=")
                  .append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                if (itr.hasNext()) {
                    sb.append("&");
                }
            }
        }
        return sb.toString();
    }

    /**
     * Get random transaction reference number
     * 
     * @param len Length of random number
     * @return Random numeric string
     */
    public String getRandomNumber(int len) {
        Random rnd = new Random();
        String chars = "0123456789";
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
