package com.techshop.userservice.controller;

import com.techshop.userservice.dto.UpdateProfileRequest;
import com.techshop.userservice.model.User;
import com.techshop.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // =================== GET MY PROFILE ===================
    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getByEmail(email));
    }

    // =================== UPDATE MY PROFILE ===================
    @PutMapping("/me")
    public ResponseEntity<User> updateMyProfile(Authentication authentication,
                                                 @RequestBody UpdateProfileRequest request) {
        String email = authentication.getName();
        User user = userService.getByEmail(email);
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    // =================== GET BY ID (internal) ===================
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    // =================== ADMIN: GET ALL ===================
    @GetMapping("/admin/all")
    public ResponseEntity<List<User>> getAll() {
        return ResponseEntity.ok(userService.getAll());
    }

    // =================== ADMIN: TOGGLE LOCK ===================
    @PutMapping("/admin/{id}/toggle")
    public ResponseEntity<String> toggleEnabled(@PathVariable Long id) {
        userService.toggleEnabled(id);
        return ResponseEntity.ok("Đã cập nhật trạng thái tài khoản");
    }

    // =================== ADMIN: DELETE ===================
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Đã xóa user id=" + id);
    }
}
