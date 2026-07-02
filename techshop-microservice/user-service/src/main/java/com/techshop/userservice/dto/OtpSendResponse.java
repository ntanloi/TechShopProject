package com.techshop.userservice.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Trả về sau khi gửi OTP thành công.
 * Frontend giữ tempToken để gửi kèm lúc verify.
 */
@Data
@Builder
public class OtpSendResponse {
    private String tempToken;   // UUID token map với OTP trong DB
    private int    expiresIn;   // Giây còn lại (300 = 5 phút)
    private String maskedEmail; // "n***@gmail.com" — hiện trên UI
    private String message;
}
