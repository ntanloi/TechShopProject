package com.techshop.userservice.controller;

import com.techshop.userservice.dto.*;
import com.techshop.userservice.service.AuthService;
import com.techshop.userservice.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final OtpService  otpService;

    // =================== REGISTER (legacy — giữ lại cho backward compat) ===================
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // =================== LOGIN (legacy) ===================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // =================== OTP: GỬI MÃ ===================
    /**
     * Bước 1: Validate thông tin → tạo OTP → gửi email.
     * Body: { type: "REGISTER"|"LOGIN", email, password, fullName?, phone? }
     * Response: { tempToken, expiresIn, maskedEmail, message }
     */
    @PostMapping("/otp/send")
    public ResponseEntity<OtpSendResponse> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        log.info("[AuthController] sendOtp: type={}, email={}", request.getType(), request.getEmail());
        return ResponseEntity.ok(otpService.sendOtp(request));
    }

    // =================== OTP: XÁC THỰC ===================
    /**
     * Bước 2: Xác thực OTP → trả JWT + thông tin user.
     * Body: { tempToken, code }
     * Response: AuthResponse (token, id, email, fullName, role, ...)
     */
    @PostMapping("/otp/verify")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        log.info("[AuthController] verifyOtp: tempToken={}", request.getTempToken());
        return ResponseEntity.ok(otpService.verifyOtp(request));
    }

    // =================== QUÊN MẬT KHẨU: GỬI OTP ===================
    /**
     * Bước 1: Nhập email → gửi OTP reset password qua Kafka.
     * Body: { email }
     */
    @PostMapping("/otp/forgot-password")
    public ResponseEntity<OtpSendResponse> forgotPassword(@Valid @RequestBody OtpSendRequest request) {
        request.setType("FORGOT_PASSWORD");
        log.info("[AuthController] forgotPassword: email={}", request.getEmail());
        return ResponseEntity.ok(otpService.sendOtp(request));
    }

    // =================== QUÊN MẬT KHẨU: ĐẶT LẠI ===================
    /**
     * Bước 2+3 gộp: Verify OTP + đặt mật khẩu mới.
     * Body: { tempToken, code, newPassword }
     */
    @PostMapping("/otp/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("[AuthController] resetPassword: tempToken={}", request.getTempToken());
        otpService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    // =================== CHECK TOKEN (Gateway gọi nội bộ) ===================
    @GetMapping("/check")
    public ResponseEntity<AuthResponse> checkToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(authService.checkToken(authHeader));
    }
}
