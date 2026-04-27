package com.techshop.reviewservice.service;

import com.techshop.reviewservice.model.Review;
import com.techshop.reviewservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
        Double avg = reviewRepository.getAverageRating(productId);
        long count = reviewRepository.countByProductId(productId);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("productId", productId);
        result.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        result.put("totalReviews", count);
        return result;
    }

    public Review create(Review review) {
        if (review.getRating() < 1 || review.getRating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating phải từ 1 đến 5");
        }
        return reviewRepository.save(review);
    }

    public void delete(Long id, String userEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy review id=" + id));

        if (!review.getUserEmail().equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền xóa review này");
        }

        reviewRepository.deleteById(id);
        log.info("Review {} deleted by {}", id, userEmail);
    }

    public void adminDelete(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy review id=" + id);
        }
        reviewRepository.deleteById(id);
    }
}
