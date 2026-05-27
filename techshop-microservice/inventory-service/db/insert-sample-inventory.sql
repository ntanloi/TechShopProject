-- =====================================================
-- TẠO DỮ LIỆU TỒN KHO MẪU
-- =====================================================
-- Tạo thông tin tồn kho cho các sản phẩm hiện có
-- =====================================================

USE techshop_inventorydb;

-- Xóa dữ liệu cũ (nếu có)
DELETE FROM inventories;

-- Tạo inventory cho product ID 1 (TTTT)
INSERT INTO inventories (product_id, quantity, reserved_quantity, low_stock_threshold, updated_at)
VALUES (1, 100, 0, 10, NOW());

-- Tạo inventory cho product ID 2 (Tai Nghe)
INSERT INTO inventories (product_id, quantity, reserved_quantity, low_stock_threshold, updated_at)
VALUES (2, 50, 0, 5, NOW());

-- Thêm một số sản phẩm khác (nếu có)
INSERT INTO inventories (product_id, quantity, reserved_quantity, low_stock_threshold, updated_at)
VALUES 
(3, 75, 0, 10, NOW()),
(4, 200, 0, 20, NOW()),
(5, 30, 0, 5, NOW()),
(6, 150, 0, 15, NOW()),
(7, 80, 0, 10, NOW()),
(8, 120, 0, 12, NOW()),
(9, 60, 0, 8, NOW()),
(10, 90, 0, 10, NOW())
ON DUPLICATE KEY UPDATE 
    quantity = VALUES(quantity),
    low_stock_threshold = VALUES(low_stock_threshold),
    updated_at = NOW();

-- Kiểm tra kết quả
SELECT product_id, quantity, reserved_quantity, low_stock_threshold 
FROM inventories 
ORDER BY product_id;

-- =====================================================
-- GIẢI THÍCH
-- =====================================================
-- product_id: ID của sản phẩm (phải tồn tại trong product-service)
-- quantity: Số lượng tồn kho hiện có
-- reserved_quantity: Số lượng đã đặt trước (trong đơn hàng chưa hoàn thành)
-- low_stock_threshold: Ngưỡng cảnh báo hết hàng
-- =====================================================
