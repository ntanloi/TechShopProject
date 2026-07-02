package com.techshop.userservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request gửi OTP — dùng chung cho REGISTER, LOGIN, FORGOT_PASSWORD.
 *
 * REGISTER:        email, password, fullName, phone (optional)
 * LOGIN:           email, password
 * FORGOT_PASSWORD: chỉ email (password để trống / null)
 */
@Data
public class OtpSendRequest {

    @NotBlank(message = "Type không được để trống")
    private String type;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    // Bắt buộc với REGISTER + LOGIN, bỏ qua với FORGOT_PASSWORD
    private String password;

    // Chỉ REGISTER
    private String fullName;
    private String phone;
    private String address;
}
