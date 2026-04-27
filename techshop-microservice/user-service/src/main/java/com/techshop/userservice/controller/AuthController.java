package com.techshop.userservice.controller;

import com.techshop.userservice.dto.AuthResponse;
import com.techshop.userservice.dto.LoginRequest;
import com.techshop.userservice.dto.RegisterRequest;
import com.techshop.userservice.service.AuthService;
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

    // =================== REGISTER ===================
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    // =================== LOGIN ===================
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // =================== CHECK TOKEN (Gateway gọi nội bộ) ===================
    @GetMapping("/check")
    public ResponseEntity<AuthResponse> checkToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(authService.checkToken(authHeader));
    }
}
