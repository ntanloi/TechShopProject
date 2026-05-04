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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        
        // Lấy thông tin tồn kho thực tế cho từng sản phẩm trong giỏ hàng
        items.forEach(item -> {
            try {
                // Gọi sang inventory-service để lấy số lượng tồn kho hiện tại
                Map<String, Object> stockInfo = inventoryClient.checkStock(item.getProductId(), 1);
                
                // Nếu service trả về số lượng, gán vào field transient để hiển thị ở frontend
                if (stockInfo != null) {
                    log.info("StockInfo received for product {}: {}", item.getProductId(), stockInfo);
                    
                    if (stockInfo.containsKey("availableStock")) {
                        Object stockVal = stockInfo.get("availableStock");
                        item.setAvailableStock(stockVal instanceof Number ? ((Number) stockVal).intValue() : 0);
                    }
                    
                    // Lấy ngưỡng cảnh báo từ inventory-service, mặc định là 5 nếu thiếu key
                    Object thresholdVal = stockInfo.getOrDefault("lowStockThreshold", 5);
                    item.setLowStockThreshold(thresholdVal instanceof Number ? ((Number) thresholdVal).intValue() : 5);
                }
            } catch (Exception e) {
                log.error("Lỗi khi lấy thông tin tồn kho cho sản phẩm {}: {}", item.getProductId(), e.getMessage());
                item.setAvailableStock(0); // Mặc định là 0 nếu không lấy được thông tin
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
        items.forEach(i -> log.info("Item {}: stock={}, threshold={}", i.getProductName(), i.getAvailableStock(), i.getLowStockThreshold()));
        
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

        // Kiểm tra tồn kho khi tăng số lượng
        try {
            Map<String, Object> stockCheck = inventoryClient.checkStock(item.getProductId(), quantity);
            boolean available = Boolean.TRUE.equals(stockCheck.get("available"));
            if (!available) {
                Object availStock = stockCheck.get("availableStock");
                int maxPossible = availStock instanceof Number ? ((Number) availStock).intValue() : 0;
                
                if (maxPossible > 0) {
                    item.setQuantity(maxPossible);
                    cartItemRepository.save(item);
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                        "Số lượng tồn kho không đủ.");
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm hiện tại đã hết hàng");
                }
            }
        } catch (FeignException e) {
            log.error("Lỗi kiểm tra kho khi cập nhật số lượng: {}", e.getMessage());
            if (e.status() == 503 || e.status() == -1) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                    "Dịch vụ kiểm tra kho hiện không khả dụng. Vui lòng kiểm tra lại inventory-service.");
            }
            if (e.status() == 404) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sản phẩm chưa có thông tin tồn kho");
            }
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
