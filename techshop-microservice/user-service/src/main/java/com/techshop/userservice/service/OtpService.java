package com.techshop.userservice.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techshop.userservice.config.KafkaTopicConstants;
import com.techshop.userservice.dto.*;
import com.techshop.userservice.event.OtpRequestedEvent;
import com.techshop.userservice.event.UserRegisteredEvent;
import com.techshop.userservice.model.OtpToken;
import com.techshop.userservice.model.OtpType;
import com.techshop.userservice.model.Role;
import com.techshop.userservice.model.User;
import com.techshop.userservice.repository.OtpTokenRepository;
import com.techshop.userservice.repository.UserRepository;
import com.techshop.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * OTP Service — Luồng 2 bước cho đăng nhập / đăng ký.
 *
 * Bước 1 (sendOtp):
 *   - Validate thông tin đầu vào
 *   - Tạo OTP 6 số, hash BCrypt lưu DB
 *   - Lưu OtpRequestedEvent vào Outbox (cùng transaction) → OutboxPublisher
 *     publish lên Kafka → notification-service nhận → gửi email
 *
 * Bước 2 (verifyOtp):
 *   - Tra tempToken → so khớp OTP hash
 *   - REGISTER: tạo User, publish UserRegisteredEvent (Welcome email)
 *   - LOGIN: lấy User, trả JWT
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final int OTP_EXPIRE_SECONDS = 300; // 5 phút
    private static final int OTP_EXPIRE_MINUTES = OTP_EXPIRE_SECONDS / 60;
    private static final int MAX_FAIL_ATTEMPTS  = 5;
    private static final int RATE_LIMIT_PER_MIN = 3;   // tối đa 3 OTP/phút/email

    private final OtpTokenRepository otpRepo;
    private final UserRepository     userRepo;
    private final PasswordEncoder    passwordEncoder;
    private final JwtUtil            jwtUtil;
    private final OutboxService      outboxService;
    private final ObjectMapper       objectMapper;

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 1 — SEND OTP
    // ─────────────────────────────────────────────────────────────

    /**
     * Validate → tạo OTP → lưu Outbox → trả tempToken cho frontend.
     * Dùng chung cho REGISTER, LOGIN, FORGOT_PASSWORD.
     */
    @Transactional
    public OtpSendResponse sendOtp(OtpSendRequest req) {
        OtpType type = parseType(req.getType());

        // Rate limiting
        long recent = otpRepo.countRecentByEmail(req.getEmail(),
                LocalDateTime.now().minusMinutes(1));
        if (recent >= RATE_LIMIT_PER_MIN) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã gửi quá nhiều yêu cầu OTP. Vui lòng chờ 1 phút.");
        }

        String payload = switch (type) {
            case REGISTER        -> buildRegisterPayload(req);
            case LOGIN           -> buildLoginPayload(req);
            case FORGOT_PASSWORD -> buildForgotPasswordPayload(req);
        };

        String rawOtp    = generateOtp();
        String otpHash   = passwordEncoder.encode(rawOtp);
        String tempToken = UUID.randomUUID().toString().replace("-", "");

        OtpToken otpToken = OtpToken.builder()
                .email(req.getEmail())
                .otpHash(otpHash)
                .tempToken(tempToken)
                .type(type)
                .payload(payload)
                .expiresAt(LocalDateTime.now().plusSeconds(OTP_EXPIRE_SECONDS))
                .build();
        otpRepo.save(otpToken);

        // Publish OtpRequestedEvent qua Outbox → Kafka → notification-service
        OtpRequestedEvent event = OtpRequestedEvent.builder()
                .email(req.getEmail())
                .otpCode(rawOtp)
                .expiresInMinutes(OTP_EXPIRE_MINUTES)
                .build();

        outboxService.saveEvent(
                "OtpToken", tempToken, "OtpRequested",
                KafkaTopicConstants.OTP_REQUESTED_TOPIC,
                req.getEmail(), event
        );

        log.info("[OTP] OTP tạo thành công cho email={}, type={}", req.getEmail(), type);

        return OtpSendResponse.builder()
                .tempToken(tempToken)
                .expiresIn(OTP_EXPIRE_SECONDS)
                .maskedEmail(maskEmail(req.getEmail()))
                .message("Mã OTP đã được gửi tới email của bạn")
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // BƯỚC 2 — VERIFY OTP → trả AuthResponse (JWT)
    // ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse verifyOtp(OtpVerifyRequest req) {
        OtpToken otp = otpRepo.findByTempToken(req.getTempToken())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Mã xác thực không hợp lệ hoặc đã hết hạn!"));

        if (otp.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã OTP này đã được sử dụng!");
        }
        if (otp.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }
        if (otp.getFailCount() >= MAX_FAIL_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã OTP mới.");
        }

        // Kiểm tra mã
        if (!passwordEncoder.matches(req.getCode(), otp.getOtpHash())) {
            otp.setFailCount(otp.getFailCount() + 1);
            otpRepo.save(otp);
            int remaining = MAX_FAIL_ATTEMPTS - otp.getFailCount();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    remaining > 0
                            ? "Mã OTP không chính xác! Còn " + remaining + " lần thử."
                            : "Mã OTP không chính xác! Đã hết lượt thử.");
        }

        // Đánh dấu đã dùng
        otp.setUsed(true);
        otpRepo.save(otp);

        return (otp.getType() == OtpType.REGISTER)
                ? handleRegister(otp)
                : handleLogin(otp);
    }

    // ─────────────────────────────────────────────────────────────
    // RESET PASSWORD — verify OTP + đặt mật khẩu mới (1 bước)
    // ─────────────────────────────────────────────────────────────

    /**
     * Kết hợp verify OTP + cập nhật password trong 1 request.
     * Chỉ dùng cho type=FORGOT_PASSWORD.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        OtpToken otp = otpRepo.findByTempToken(req.getTempToken())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Mã xác thực không hợp lệ hoặc đã hết hạn!"));

        if (otp.getType() != OtpType.FORGOT_PASSWORD) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Token không hợp lệ cho thao tác đặt lại mật khẩu!");
        }
        if (otp.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã OTP này đã được sử dụng!");
        }
        if (otp.isExpired()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }
        if (otp.getFailCount() >= MAX_FAIL_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã OTP mới.");
        }

        if (!passwordEncoder.matches(req.getCode(), otp.getOtpHash())) {
            otp.setFailCount(otp.getFailCount() + 1);
            otpRepo.save(otp);
            int remaining = MAX_FAIL_ATTEMPTS - otp.getFailCount();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    remaining > 0
                            ? "Mã OTP không chính xác! Còn " + remaining + " lần thử."
                            : "Mã OTP không chính xác! Đã hết lượt thử.");
        }

        // OTP hợp lệ → đặt lại mật khẩu
        otp.setUsed(true);
        otpRepo.save(otp);

        Map<String, String> data = parsePayload(otp.getPayload());
        String email = data.get("email");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Tài khoản không tồn tại!"));

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepo.save(user);

        log.info("[OTP] Đặt lại mật khẩu thành công: email={}", email);
    }

    // ─────────────────────────────────────────────────────────────
    // REGISTER — tạo User sau khi OTP hợp lệ
    // ─────────────────────────────────────────────────────────────

    private AuthResponse handleRegister(OtpToken otp) {
        Map<String, String> data = parsePayload(otp.getPayload());
        String email = data.get("email");

        if (userRepo.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại!");
        }

        User user = User.builder()
                .fullName(data.get("fullName"))
                .email(email)
                .password(data.get("passwordHash"))   // đã hash lúc sendOtp
                .phone(data.get("phone"))
                .address(data.get("address"))
                .role(Role.CUSTOMER)
                .build();
        user = userRepo.save(user);

        log.info("[OTP] Đăng ký thành công: userId={}, email={}", user.getId(), email);

        // Welcome email qua Outbox/Kafka
        outboxService.saveEvent(
                "User",
                String.valueOf(user.getId()),
                "UserRegistered",
                KafkaTopicConstants.USER_REGISTERED_TOPIC,
                String.valueOf(user.getId()),
                UserRegisteredEvent.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .build()
        );

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return AuthResponse.builder()
                .token(token).id(user.getId()).email(user.getEmail())
                .fullName(user.getFullName()).phone(user.getPhone())
                .address(user.getAddress()).role(user.getRole().name())
                .message("Đăng ký thành công!")
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // LOGIN — xác thực User đã tồn tại
    // ─────────────────────────────────────────────────────────────

    private AuthResponse handleLogin(OtpToken otp) {
        Map<String, String> data = parsePayload(otp.getPayload());
        String email = data.get("email");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại!"));
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa!");
        }

        log.info("[OTP] Đăng nhập thành công: userId={}, email={}", user.getId(), email);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return AuthResponse.builder()
                .token(token).id(user.getId()).email(user.getEmail())
                .fullName(user.getFullName()).phone(user.getPhone())
                .address(user.getAddress()).role(user.getRole().name())
                .message("Đăng nhập thành công!")
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // CLEANUP — chạy mỗi 10 phút
    // ─────────────────────────────────────────────────────────────

    @Scheduled(fixedDelay = 600_000)
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepo.deleteExpiredAndUsed(LocalDateTime.now());
        log.debug("[OTP] Cleanup: đã xóa các OTP hết hạn/đã dùng");
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private String generateOtp() {
        return String.valueOf(new SecureRandom().nextInt(900_000) + 100_000);
    }

    private OtpType parseType(String type) {
        try {
            return OtpType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Type phải là REGISTER hoặc LOGIN");
        }
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return email;
        return email.charAt(0) + "***" + email.substring(at);
    }

    /** Validate FORGOT_PASSWORD — chỉ cần email tồn tại */
    private String buildForgotPasswordPayload(OtpSendRequest req) {
        if (!userRepo.existsByEmail(req.getEmail())) {
            // Trả về thành công giả để không lộ thông tin user có/không có
            // Nhưng vẫn lưu OTP với payload giả — khi verify sẽ fail
            // Cách an toàn hơn: silent success
            log.warn("[OTP] FORGOT_PASSWORD: email không tồn tại, silent ignore: {}", req.getEmail());
        }
        try {
            return objectMapper.writeValueAsString(Map.of("email", req.getEmail()));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo payload FORGOT_PASSWORD", e);
        }
    }

    /** Validate REGISTER + hash password → trả payload JSON */
    private String buildRegisterPayload(OtpSendRequest req) {
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Họ tên không được để trống khi đăng ký");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mật khẩu tối thiểu 6 ký tự");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại!");
        }
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "fullName",     req.getFullName(),
                    "email",        req.getEmail(),
                    "passwordHash", passwordEncoder.encode(req.getPassword()),
                    "phone",        req.getPhone()   != null ? req.getPhone()   : "",
                    "address",      req.getAddress() != null ? req.getAddress() : ""
            ));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo payload REGISTER", e);
        }
    }

    /** Validate LOGIN (email/password) → trả payload JSON chứa email */
    private String buildLoginPayload(OtpSendRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu!"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu!");
        }
        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa!");
        }
        try {
            return objectMapper.writeValueAsString(Map.of("email", req.getEmail()));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo payload LOGIN", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> parsePayload(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi parse OTP payload", e);
        }
    }
}
