package com.techshop.inventoryservice.service;

import com.techshop.inventoryservice.dto.InventoryResponse;
import com.techshop.inventoryservice.dto.StockOperationResult;
import com.techshop.inventoryservice.model.Inventory;
import com.techshop.inventoryservice.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    // ─────────────────────────────────────────────
    // RESERVE: Giữ hàng khi khách đặt đơn
    // ─────────────────────────────────────────────

    /**
     * Giữ (reserve) một lượng hàng cho đơn đặt hàng.
     * Tăng reservedQuantity, không giảm quantity thực tế.
     * Trả về lỗi nếu không đủ hàng khả dụng.
     */
    @Transactional
    public StockOperationResult reserveStock(Long productId, Integer quantity) {
        log.info("Reserving {} units for productId={}", quantity, productId);

        Inventory inv = findByProductId(productId);
        if (inv == null) {
            return StockOperationResult.fail("Không tìm thấy tồn kho cho sản phẩm ID: " + productId);
        }

        if (inv.getAvailableQuantity() < quantity) {
            return StockOperationResult.fail(
                    String.format("Không đủ hàng. Yêu cầu: %d, Khả dụng: %d", quantity, inv.getAvailableQuantity())
            );
        }

        inv.setReservedQuantity(inv.getReservedQuantity() + quantity);
        Inventory saved = inventoryRepository.save(inv);

        log.info("Reserved {} units for productId={}. Available now: {}", quantity, productId, saved.getAvailableQuantity());
        return StockOperationResult.ok(
                String.format("Đã giữ %d sản phẩm thành công", quantity),
                InventoryResponse.from(saved)
        );
    }

    // ─────────────────────────────────────────────
    // RELEASE: Trả hàng khi hủy đơn
    // ─────────────────────────────────────────────

    /**
     * Giải phóng (release) hàng đã giữ khi đơn hàng bị hủy.
     * Giảm reservedQuantity về lại, hàng trở thành khả dụng.
     */
    @Transactional
    public StockOperationResult releaseStock(Long productId, Integer quantity) {
        log.info("Releasing {} units for productId={}", quantity, productId);

        Inventory inv = findByProductId(productId);
        if (inv == null) {
            return StockOperationResult.fail("Không tìm thấy tồn kho cho sản phẩm ID: " + productId);
        }

        int newReserved = inv.getReservedQuantity() - quantity;
        if (newReserved < 0) {
            log.warn("Release amount {} exceeds reserved {} for productId={}, clamping to 0", quantity, inv.getReservedQuantity(), productId);
            newReserved = 0;
        }

        inv.setReservedQuantity(newReserved);
        Inventory saved = inventoryRepository.save(inv);

        log.info("Released {} units for productId={}. Available now: {}", quantity, productId, saved.getAvailableQuantity());
        return StockOperationResult.ok(
                String.format("Đã trả lại %d sản phẩm vào kho", quantity),
                InventoryResponse.from(saved)
        );
    }

    // ─────────────────────────────────────────────
    // COMMIT: Xác nhận trừ hàng khi đơn hoàn thành
    // ─────────────────────────────────────────────

    /**
     * Xác nhận trừ hàng thực tế sau khi đơn hàng hoàn thành.
     * Giảm cả quantity lẫn reservedQuantity.
     */
    @Transactional
    public StockOperationResult commitStock(Long productId, Integer quantity) {
        log.info("Committing {} units for productId={}", quantity, productId);

        Inventory inv = findByProductId(productId);
        if (inv == null) {
            return StockOperationResult.fail("Không tìm thấy tồn kho cho sản phẩm ID: " + productId);
        }

        if (inv.getReservedQuantity() < quantity) {
            return StockOperationResult.fail(
                    String.format("Số lượng commit (%d) vượt quá số đang giữ (%d)", quantity, inv.getReservedQuantity())
            );
        }

        if (inv.getQuantity() < quantity) {
            return StockOperationResult.fail(
                    String.format("Tồn kho thực tế (%d) không đủ để commit (%d)", inv.getQuantity(), quantity)
            );
        }

        inv.setQuantity(inv.getQuantity() - quantity);
        inv.setReservedQuantity(inv.getReservedQuantity() - quantity);
        Inventory saved = inventoryRepository.save(inv);

        log.info("Committed {} units for productId={}. Remaining stock: {}", quantity, productId, saved.getQuantity());
        return StockOperationResult.ok(
                String.format("Đã xác nhận trừ %d sản phẩm khỏi kho", quantity),
                InventoryResponse.from(saved)
        );
    }

    // ─────────────────────────────────────────────
    // LOW STOCK: Cảnh báo hàng sắp hết
    // ─────────────────────────────────────────────

    /**
     * Lấy danh sách sản phẩm có tồn kho khả dụng <= ngưỡng cảnh báo.
     */
    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStock() {
        log.info("Fetching low stock items");
        return inventoryRepository.findAll().stream()
                .filter(Inventory::isLowStock)
                .map(InventoryResponse::from)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    private Inventory findByProductId(Long productId) {
        return inventoryRepository.findByProductId(productId).orElse(null);
    }
}
