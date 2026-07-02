package com.techshop.orderservice.service;

import com.techshop.orderservice.client.InventoryClient;
import com.techshop.orderservice.client.ProductClient;
import com.techshop.orderservice.dto.ProductDto;
import com.techshop.orderservice.enums.ErrorCode;
import com.techshop.orderservice.exception.AppException;
import com.techshop.orderservice.model.CartItem;
import com.techshop.orderservice.repository.CartItemRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductClient productClient;
    private final InventoryClient inventoryClient;

    public List<CartItem> getCart(Long userId) {
        return cartItemRepository.findByUserId(userId);
    }

    public Map<String, Object> getCartSummary(Long userId) {
        List<CartItem> items = getCart(userId);
        
        items.forEach(item -> {
            try {
                ResponseEntity<Map<String, Object>> response = inventoryClient.checkStock(item.getProductId(), 1);
                Map<String, Object> stockInfo = response != null ? response.getBody() : null;
                
                if (stockInfo != null) {
                    log.info("StockInfo received for product {}: {}", item.getProductId(), stockInfo);
                    
                    if (stockInfo.containsKey("availableStock")) {
                        Object stockVal = stockInfo.get("availableStock");
                        item.setAvailableStock(stockVal instanceof Number ? ((Number) stockVal).intValue() : 0);
                    }
                    
                    Object thresholdVal = stockInfo.getOrDefault("lowStockThreshold", 5);
                    item.setLowStockThreshold(thresholdVal instanceof Number ? ((Number) thresholdVal).intValue() : 5);
                }
            } catch (Exception e) {
                log.error("Lỗi khi lấy thông tin tồn kho cho sản phẩm {}: {}", item.getProductId(), e.getMessage());
                item.setAvailableStock(0);
            }
        });

        BigDecimal total = items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("items", items);
        result.put("totalItems", items.size());
        result.put("totalAmount", total);
        
        log.info("Returning cart summary for user {}: {} items", userId, items.size());
        
        return result;
    }

    public CartItem addToCart(CartItem item) {
        if (item.getQuantity() <= 0) {
            throw new AppException(ErrorCode.INVALID_QUANTITY);
        }

        ProductDto product;
        try {
            product = productClient.getProductById(item.getProductId());
        } catch (FeignException.NotFound e) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXIST);
        } catch (FeignException e) {
            log.error("Error calling product-service: {}", e.getMessage());
            throw new AppException(ErrorCode.PRODUCT_CHECK_ERROR);
        }

        if (product.getPrice() != null) {
            item.setUnitPrice(product.getPrice());
        }

        int currentQuantity = cartItemRepository.findByUserIdAndProductId(item.getUserId(), item.getProductId())
                .map(CartItem::getQuantity)
                .orElse(0);
        int totalRequestedQty = currentQuantity + item.getQuantity();

        try {
            ResponseEntity<Map<String, Object>> response = inventoryClient.checkStock(item.getProductId(), totalRequestedQty);
            Map<String, Object> stockCheck = response != null ? response.getBody() : null;
            boolean available = stockCheck != null && Boolean.TRUE.equals(stockCheck.get("available"));
            if (!available) {
                throw new AppException(ErrorCode.OUT_OF_STOCK);
            }
        } catch (FeignException.NotFound e) {
            throw new AppException(ErrorCode.NO_STOCK_INFO);
        } catch (FeignException e) {
            log.error("Error calling inventory-service: {}", e.getMessage());
            throw new AppException(ErrorCode.STOCK_CHECK_ERROR);
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
                .orElseThrow(() -> new AppException(ErrorCode.CART_ITEM_NOT_FOUND));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
            throw new AppException(ErrorCode.INVALID_QUANTITY);
        }

        try {
            ResponseEntity<Map<String, Object>> response = inventoryClient.checkStock(item.getProductId(), quantity);
            Map<String, Object> stockCheck = response != null ? response.getBody() : null;
            boolean available = stockCheck != null && Boolean.TRUE.equals(stockCheck.get("available"));
            if (!available) {
                Object availStock = stockCheck != null ? stockCheck.get("availableStock") : 0;
                int maxPossible = availStock instanceof Number ? ((Number) availStock).intValue() : 0;
                
                if (maxPossible > 0) {
                    item.setQuantity(maxPossible);
                    cartItemRepository.save(item);
                    throw new AppException(ErrorCode.OUT_OF_STOCK);
                } else {
                    throw new AppException(ErrorCode.OUT_OF_STOCK);
                }
            }
        } catch (FeignException e) {
            log.error("Lỗi kiểm tra kho khi cập nhật số lượng: {}", e.getMessage());
            if (e.status() == 503 || e.status() == -1) {
                throw new AppException(ErrorCode.SERVICE_UNAVAILABLE);
            }
            if (e.status() == 404) {
                throw new AppException(ErrorCode.NO_STOCK_INFO);
            }
        }

        item.setQuantity(quantity);
        return cartItemRepository.save(item);
    }

    public void removeItem(Long id) {
        if (!cartItemRepository.existsById(id)) {
            throw new AppException(ErrorCode.CART_ITEM_NOT_FOUND);
        }
        cartItemRepository.deleteById(id);
    }

    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
        log.info("Cart cleared for user {}", userId);
    }
}
