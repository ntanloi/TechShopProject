package com.techshop.userservice.service;

import com.techshop.userservice.dto.AuthResponse;
import com.techshop.userservice.dto.LoginRequest;
import com.techshop.userservice.dto.RegisterRequest;
import com.techshop.userservice.model.Role;
import com.techshop.userservice.model.User;
import com.techshop.userservice.repository.UserRepository;
import com.techshop.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.techshop.userservice.client.NotificationClient;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final NotificationClient notificationClient;

    public AuthResponse register(RegisterRequest request) {
        log.info("Register request: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã tồn tại!");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(Role.CUSTOMER)
                .build();

        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        // Gửi email chào mừng (Async-like via try-catch)
        try {
            log.info("Sending welcome email to: {}", user.getEmail());
            notificationClient.sendWelcomeEmail(user.getEmail(), user.getFullName());
        } catch (Exception e) {
            log.error("Failed to send welcome email for {}: {}", user.getEmail(), e.getMessage());
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .message("Đăng ký thành công!")
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login request: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai email hoặc mật khẩu!");
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa!");
        }

        // Subject = email để Authentication.getName() trả về email
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .message("Đăng nhập thành công!")
                .build();
    }

    public AuthResponse checkToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Thiếu token xác thực!");
        }

        String token = authHeader.substring(7);
        String email = jwtUtil.extractUsername(token);
        String role = jwtUtil.extractRole(token);

        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User không tồn tại!"));

        return AuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(role)
                .build();
    }
}
