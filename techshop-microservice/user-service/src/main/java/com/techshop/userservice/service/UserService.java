package com.techshop.userservice.service;

import com.techshop.userservice.dto.UpdateProfileRequest;
import com.techshop.userservice.model.User;
import com.techshop.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user id=" + id));
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user: " + email));
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User updateProfile(Long id, UpdateProfileRequest request) {
        User user = getById(id);
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        return userRepository.save(user);
    }

    public void toggleEnabled(Long id) {
        User user = getById(id);
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        log.info("User {} enabled={}", user.getEmail(), user.isEnabled());
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user id=" + id);
        }
        userRepository.deleteById(id);
    }
}
