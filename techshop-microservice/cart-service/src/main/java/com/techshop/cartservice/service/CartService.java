package com.techshop.cartservice.service;

import com.techshop.cartservice.client.InventoryClient;
import com.techshop.cartservice.client.ProductClient;
import com.techshop.cartservice.dto.ProductDto;
import com.techshop.cartservice.model.CartItem;
import com.techshop.cartservice.repository.CartItemRepository;
import feign.FeignException;
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
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;

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
        // Validate quantity > 0
        if (item.getQuantity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số lượng phải lớn hơn 0");
        }

        // Check product exists
        ProductDto product;
        try {
            product = productClient.getProductById(item.getProductId());
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sản phẩm không tồn tại");
        } catch (FeignException e) {
            log.error("Error calling product-service: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi kiểm tra sản phẩm");
        }

        // Check price changes and update to newest price
        if (product.getPrice() != null) {
            if (item.getUnitPrice() != null && item.getUnitPrice().compareTo(product.getPrice()) != 0) {
                log.info("Price changed for product {}: old={}, new={}", item.getProductId(), item.getUnitPrice(), product.getPrice());
            }
            item.setUnitPrice(product.getPrice());
        }

        // Determine total requested quantity (existing in cart + new quantity)
        int currentQuantity = cartItemRepository.findByUserIdAndProductId(item.getUserId(), item.getProductId())
                .map(CartItem::getQuantity)
                .orElse(0);
        int totalRequestedQty = currentQuantity + item.getQuantity();

        // Check stock available
        try {
            Map<String, Object> stockCheck = inventoryClient.checkStock(item.getProductId(), totalRequestedQty);
            boolean available = Boolean.TRUE.equals(stockCheck.get("available"));
            if (!available) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm không đủ số lượng trong kho");
            }
        } catch (FeignException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm chưa có thông tin tồn kho");
        } catch (FeignException e) {
            log.error("Error calling inventory-service: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi kiểm tra tồn kho");
        }

        return cartItemRepository.findByUserIdAndProductId(item.getUserId(), item.getProductId())
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + item.getQuantity());
                    existing.setUnitPrice(item.getUnitPrice());
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
