package com.techshop.inventoryservice.controller;

import com.techshop.inventoryservice.model.Inventory;
import com.techshop.inventoryservice.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    @GetMapping("/product/{productId}")
    public ResponseEntity<Inventory> getByProduct(@PathVariable Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/product/{productId}/check")
    public ResponseEntity<Map<String, Object>> checkStock(@PathVariable Long productId,
                                                           @RequestParam Integer quantity) {
        return inventoryRepository.findByProductId(productId).map(inv -> {
            boolean available = inv.getAvailableQuantity() >= quantity;
            return ResponseEntity.ok(Map.of(
                    "productId", productId,
                    "available", available,
                    "stock", inv.getAvailableQuantity()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Inventory> create(@RequestBody Inventory inventory) {
        return ResponseEntity.ok(inventoryRepository.save(inventory));
    }

    @PutMapping("/product/{productId}/adjust")
    public ResponseEntity<Inventory> adjustStock(@PathVariable Long productId,
                                                  @RequestParam Integer delta) {
        return inventoryRepository.findByProductId(productId).map(inv -> {
            inv.setQuantity(inv.getQuantity() + delta);
            return ResponseEntity.ok(inventoryRepository.save(inv));
        }).orElse(ResponseEntity.notFound().build());
    }
}
