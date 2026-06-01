package com.techshop.userservice.service;

import com.techshop.userservice.config.KafkaTopicConstants;
import com.techshop.userservice.dto.AuthResponse;
import com.techshop.userservice.dto.LoginRequest;
import com.techshop.userservice.dto.RegisterRequest;
import com.techshop.userservice.event.UserRegisteredEvent;
import com.techshop.userservice.model.Role;
import com.techshop.userservice.model.User;
import com.techshop.userservice.repository.UserRepository;
import com.techshop.userservice.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Outbox service: lưu event vào bảng outbox cùng transaction với việc tạo User.
    // OutboxPublisher (scheduler) sẽ publish lên Kafka sau đó.
    // → Đảm bảo email Welcome luôn được gửi, dù Kafka có tạm thời down.
    private final OutboxService outboxService;

    @Transactional
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

        // Lưu UserRegisteredEvent vào OUTBOX (cùng transaction với việc save User).
        // OutboxPublisher sẽ publish lên Kafka sau, không bị mất nếu Kafka down.
        UserRegisteredEvent event = UserRegisteredEvent.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();

        outboxService.saveEvent(
                "User",
                String.valueOf(user.getId()),
                "UserRegistered",
                KafkaTopicConstants.USER_REGISTERED_TOPIC,
                String.valueOf(user.getId()),  // partition key = userId
                event
        );

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(user.getAddress())
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
                .phone(user.getPhone())
                .address(user.getAddress())
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
                .phone(user.getPhone())
                .address(user.getAddress())
                .role(role)
                .build();
    }
}
