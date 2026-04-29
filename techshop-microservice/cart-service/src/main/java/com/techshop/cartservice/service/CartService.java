package com.techshop.cartservice.service;

import com.techshop.cartservice.model.CartItem;
import com.techshop.cartservice.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartItemRepository cartItemRepository;

    public List<CartItem> getCart(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public Map<String, Object> getCartSummary(Long userId) {
        List<CartItem> items = getCart(userId);
        BigDecimal total = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("items", items);
        result.put("totalItems", items.size());
        result.put("totalAmount", total);
        return result;
    }

    public CartItem addToCart(CartItem item) {
        return cartItemRepository.findByUserIdAndProductId(item.getUserId(), item.getProductId())
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + item.getQuantity());
                    // Cập nhật giá mới nhất
                    if (item.getUnitPrice() != null) existing.setUnitPrice(item.getUnitPrice());
                    return cartItemRepository.save(existing);
                })
                .orElseGet(() -> cartItemRepository.save(item));
    }

    public CartItem updateQuantity(Long id, Integer quantity) {
        CartItem item = cartItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Không tìm thấy cart item id=" + id));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
            throw new ResponseStatusException(HttpStatus.NO_CONTENT, "Item removed");
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    public void removeItem(Long id) {
        if (!cartItemRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cart item id=" + id);
        }
        cartItemRepository.deleteById(id);
    }

    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
        log.info("Cart cleared for user {}", userId);
    }
}
