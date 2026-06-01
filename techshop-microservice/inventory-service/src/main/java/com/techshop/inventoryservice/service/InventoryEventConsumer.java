package com.techshop.inventoryservice.service;

import com.techshop.inventoryservice.event.OrderPlacedEvent;
import com.techshop.inventoryservice.event.PaymentCompletedEvent;
import com.techshop.inventoryservice.event.PaymentFailedEvent;
import com.techshop.inventoryservice.model.Inventory;
import com.techshop.inventoryservice.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Kafka Consumer cho Inventory Service.
 *
 * Lắng nghe các event và thực hiện Saga Pattern cho tồn kho:
 *
 * 1. order-placed-topic:
 *    - (Hiện tại) Reserve stock đã được thực hiện đồng bộ bởi Order Service
 *    - Consumer này dùng để LOG và có thể mở rộng về sau
 *
 * 2. payment-completed-topic:
 *    - Thanh toán thành công: Log xác nhận (stock đang ở trạng thái reserved)
 *    - Khi admin set DELIVERED → Order Service gọi Feign để commit stock
 *
 * 3. payment-failed-topic (Saga Rollback):
 *    - Thanh toán thất bại → RELEASE tất cả stock đã reserve cho đơn hàng
 *    - Đây là compensating transaction: undo bước reserve khi tạo đơn
 *
 * LƯU Ý:
 * Với thiết kế hiện tại (hybrid), Order Service vẫn gọi Inventory qua Feign để
 * reserve/release/commit khi admin thao tác. Kafka chỉ handle rollback khi payment thất bại.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryEventConsumer {

    private final InventoryRepository inventoryRepository;

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 1: Lắng nghe đơn hàng mới (dùng để log/monitoring)
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe khi có đơn hàng mới được tạo.
     * Reserve stock đã được thực hiện đồng bộ bởi Order Service via Feign.
     * Consumer này chỉ dùng để log xác nhận và có thể dùng cho audit/monitoring.
     */
    @KafkaListener(
            topics = "order-placed-topic",
            groupId = "inventory-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("[Kafka Consumer] Nhận event OrderPlaced: orderId={}, orderCode={}, {} sản phẩm",
                event.getOrderId(), event.getOrderCode(),
                event.getItems() != null ? event.getItems().size() : 0);

        // Log từng sản phẩm đã được reserve (đã xử lý đồng bộ bởi Order Service)
        if (event.getItems() != null) {
            event.getItems().forEach(item ->
                    log.info("[Kafka Consumer] Xác nhận reserve: productId={}, productName={}, quantity={}",
                            item.getProductId(), item.getProductName(), item.getQuantity())
            );
        }

        log.info("[Kafka Consumer] Đơn hàng {} đã được xác nhận reserve stock thành công", event.getOrderCode());
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 2: Lắng nghe thanh toán thành công (dùng để log)
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe khi thanh toán thành công.
     * Stock vẫn ở trạng thái RESERVED cho đến khi admin set DELIVERED.
     * Khi DELIVERED, Order Service gọi Feign để commit (trừ hàng thực tế).
     *
     * Consumer này log để xác nhận luồng hoạt động đúng.
     */
    @KafkaListener(
            topics = "payment-completed-topic",
            groupId = "inventory-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentCompleted(PaymentCompletedEvent event) {
        log.info("[Kafka Consumer] Nhận event PaymentCompleted: orderId={}, orderCode={}",
                event.getOrderId(), event.getOrderCode());

        // Stock vẫn đang reserve, chờ giao hàng thành công mới commit
        log.info("[Kafka Consumer] Stock cho đơn hàng {} vẫn giữ trạng thái RESERVED. " +
                "Sẽ commit (trừ hàng thực tế) khi đơn chuyển sang DELIVERED.", event.getOrderCode());
    }

    // ──────────────────────────────────────────────────────────────
    // CONSUMER 3: Lắng nghe thanh toán thất bại → SAGA ROLLBACK
    // ──────────────────────────────────────────────────────────────

    /**
     * Lắng nghe khi thanh toán thất bại → AUTO-RELEASE tất cả stock đã reserve.
     *
     * Đây là bước quan trọng nhất: Compensating Transaction trong Saga Pattern.
     * Mục tiêu: Không để hàng bị "nhốt" khi đơn hàng bị hủy do payment thất bại.
     *
     * Luồng:
     * 1. Nhận PaymentFailedEvent với danh sách items
     * 2. Với mỗi item, gọi releaseStock(productId, quantity)
     * 3. Log kết quả từng sản phẩm
     */
    @Transactional
    @KafkaListener(
            topics = "payment-failed-topic",
            groupId = "inventory-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("[Kafka Consumer] Nhận event PaymentFailed: orderId={}, orderCode={}, lý do: {}",
                event.getOrderId(), event.getOrderCode(), event.getReason());

        if (event.getItems() == null || event.getItems().isEmpty()) {
            log.warn("[Kafka Consumer] PaymentFailed event cho orderId={} không có danh sách items. " +
                    "Không thể auto-release stock. Vui lòng kiểm tra thủ công.", event.getOrderId());
            return;
        }

        log.info("[Kafka Consumer] Bắt đầu auto-release stock cho {} sản phẩm của đơn hàng {}",
                event.getItems().size(), event.getOrderCode());

        int successCount = 0;
        int failCount = 0;

        for (PaymentFailedEvent.OrderItemEvent item : event.getItems()) {
            Optional<Inventory> inventoryOpt = inventoryRepository.findByProductId(item.getProductId());

            if (inventoryOpt.isEmpty()) {
                log.warn("[Kafka Consumer] Không tìm thấy inventory cho productId={}. Bỏ qua.", item.getProductId());
                failCount++;
                continue;
            }

            Inventory inv = inventoryOpt.get();
            int newReserved = inv.getReservedQuantity() - item.getQuantity();
            if (newReserved < 0) {
                log.warn("[Kafka Consumer] Release amount {} vượt quá reserved {} cho productId={}, clamp về 0",
                        item.getQuantity(), inv.getReservedQuantity(), item.getProductId());
                newReserved = 0;
            }

            inv.setReservedQuantity(newReserved);
            inventoryRepository.save(inv);

            log.info("[Kafka Consumer] Đã release {} units cho productId={} ({}). Available now: {}",
                    item.getQuantity(), item.getProductId(), item.getProductName(), inv.getAvailableQuantity());
            successCount++;
        }

        log.info("[Kafka Consumer] Hoàn tất release stock cho đơn hàng {}: {} thành công, {} thất bại",
                event.getOrderCode(), successCount, failCount);
    }
}
