package com.techshop.reviewservice.controller;

import com.techshop.reviewservice.model.Review;
import com.techshop.reviewservice.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // =================== PUBLIC ===================

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getByProduct(productId));
    }

    @GetMapping("/product/{productId}/rating")
    public ResponseEntity<Map<String, Object>> getRating(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductRating(productId));
    }

    // =================== USER ===================

    @GetMapping("/my")
    public ResponseEntity<List<Review>> getMyReviews(Authentication authentication,
                                                      @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(reviewService.getByUser(userId));
    }

    @PostMapping
    public ResponseEntity<Review> create(@RequestBody Review review,
                                          Authentication authentication,
                                          @RequestHeader("X-User-Id") Long userId) {
        review.setUserId(userId);
        review.setUserEmail(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(review));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id, Authentication authentication) {
        reviewService.delete(id, authentication.getName());
        return ResponseEntity.ok("Đã xóa review id=" + id);
    }

    // =================== ADMIN ===================

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<String> adminDelete(@PathVariable Long id) {
        reviewService.adminDelete(id);
        return ResponseEntity.ok("Admin đã xóa review id=" + id);
    }
}
