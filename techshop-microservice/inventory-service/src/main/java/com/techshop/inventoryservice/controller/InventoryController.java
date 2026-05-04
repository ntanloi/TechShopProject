package com.techshop.inventoryservice.controller;

import com.techshop.inventoryservice.dto.InventoryResponse;
import com.techshop.inventoryservice.dto.StockOperationResult;
import com.techshop.inventoryservice.dto.StockRequest;
import com.techshop.inventoryservice.model.Inventory;
import com.techshop.inventoryservice.repository.InventoryRepository;
import com.techshop.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryService inventoryService;

    // ─────────────────────────────────────────────
    // QUERY ENDPOINTS
    // ─────────────────────────────────────────────

    /**
     * GET /inventory/all
     * Lấy toàn bộ danh sách tồn kho (dùng cho trang admin)
     */
    @GetMapping("/all")
    public ResponseEntity<List<InventoryResponse>> getAll() {
        List<InventoryResponse> items = inventoryRepository.findAll()
                .stream()
                .map(InventoryResponse::from)
                .toList();
        return ResponseEntity.ok(items);
    }

    /**
     * GET /inventory/product/{productId}
     * Lấy thông tin tồn kho của một sản phẩm
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryResponse> getByProduct(@PathVariable Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(inv -> ResponseEntity.ok(InventoryResponse.from(inv)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /inventory/product/{productId}/check?quantity=5
     * Kiểm tra xem có đủ hàng để đặt không
     */
    @GetMapping("/product/{productId}/check")
    public ResponseEntity<Map<String, Object>> checkStock(@PathVariable Long productId,
                                                           @RequestParam Integer quantity) {
        return inventoryRepository.findByProductId(productId).map(inv -> {
            boolean available = inv.getAvailableQuantity() >= quantity;
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("productId", productId);
            body.put("requested", quantity);
            body.put("available", available);
            body.put("availableStock", inv.getAvailableQuantity());
            body.put("totalStock", inv.getQuantity());
            body.put("reservedStock", inv.getReservedQuantity());
            body.put("lowStockThreshold", inv.getLowStockThreshold());
            return ResponseEntity.ok(body);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /inventory/low-stock
     * Lấy danh sách sản phẩm sắp hết hàng
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStock() {
        List<InventoryResponse> lowStockItems = inventoryService.getLowStock();
        return ResponseEntity.ok(lowStockItems);
    }

    // ─────────────────────────────────────────────
    // STOCK OPERATION ENDPOINTS
    // ─────────────────────────────────────────────

    /**
     * POST /inventory/product/{productId}/reserve
     * Giữ hàng khi khách đặt đơn (tăng reservedQuantity)
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/product/{productId}/reserve")
    public ResponseEntity<StockOperationResult> reserveStock(@PathVariable Long productId,
                                                              @RequestBody StockRequest request) {
        StockOperationResult result = inventoryService.reserveStock(productId, request.getQuantity());
        return result.isSuccess()
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.CONFLICT).body(result);
    }

    /**
     * POST /inventory/product/{productId}/release
     * Trả hàng về kho khi hủy đơn (giảm reservedQuantity)
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/product/{productId}/release")
    public ResponseEntity<StockOperationResult> releaseStock(@PathVariable Long productId,
                                                              @RequestBody StockRequest request) {
        StockOperationResult result = inventoryService.releaseStock(productId, request.getQuantity());
        return result.isSuccess()
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
    }

    /**
     * POST /inventory/product/{productId}/commit
     * Xác nhận trừ hàng thực tế khi đơn hoàn thành (giảm cả quantity và reservedQuantity)
     * Body: { "quantity": 2, "orderId": "ORD-001" }
     */
    @PostMapping("/product/{productId}/commit")
    public ResponseEntity<StockOperationResult> commitStock(@PathVariable Long productId,
                                                             @RequestBody StockRequest request) {
        StockOperationResult result = inventoryService.commitStock(productId, request.getQuantity());
        return result.isSuccess()
                ? ResponseEntity.ok(result)
                : ResponseEntity.status(HttpStatus.CONFLICT).body(result);
    }

    // ─────────────────────────────────────────────
    // MANAGEMENT ENDPOINTS
    // ─────────────────────────────────────────────

    /**
     * POST /inventory
     * Tạo mới bản ghi tồn kho cho sản phẩm
     */
    @PostMapping
    public ResponseEntity<InventoryResponse> create(@RequestBody Inventory inventory) {
        Inventory saved = inventoryRepository.save(inventory);
        return ResponseEntity.status(HttpStatus.CREATED).body(InventoryResponse.from(saved));
    }

    /**
     * PUT /inventory/product/{productId}/adjust?delta=10
     * Điều chỉnh tồn kho thủ công (nhập hàng: delta dương, xuất kho: delta âm)
     */
    @PutMapping("/product/{productId}/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(@PathVariable Long productId,
                                                          @RequestParam Integer delta) {
        return inventoryRepository.findByProductId(productId).map(inv -> {
            int newQty = inv.getQuantity() + delta;
            if (newQty < 0) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .<InventoryResponse>build();
            }
            inv.setQuantity(newQty);
            return ResponseEntity.ok(InventoryResponse.from(inventoryRepository.save(inv)));
        }).orElse(ResponseEntity.notFound().build());
    }
}
