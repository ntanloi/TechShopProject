package com.techshop.productservice.service;

import com.techshop.productservice.enums.ErrorCode;
import com.techshop.productservice.exception.AppException;
import com.techshop.productservice.model.Review;
import com.techshop.productservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public List<Review> getByProduct(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public List<Review> getByUser(Long userId) {
        return reviewRepository.findByUserId(userId);
    }

    public Map<String, Object> getProductRating(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        long count = reviews.size();
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("productId", productId);
        result.put("averageRating", Math.round(avg * 10.0) / 10.0);
        result.put("totalReviews", count);
        return result;
    }

    public Review create(Review review) {
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new AppException(ErrorCode.INVALID_RATING);
        }
        return reviewRepository.save(review);
    }

    public void delete(Long id, String userEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getUserEmail().equals(userEmail)) {
            throw new AppException(ErrorCode.FORBIDDEN_REVIEW_DELETE);
        }

        reviewRepository.deleteById(id);
        log.info("Review {} deleted by {}", id, userEmail);
    }

    public void adminDelete(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new AppException(ErrorCode.REVIEW_NOT_FOUND);
        }
        reviewRepository.deleteById(id);
    }
}
