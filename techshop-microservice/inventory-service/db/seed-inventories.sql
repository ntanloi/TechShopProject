USE techshop_inventorydb;

DELETE FROM inventories;

-- Tạo thông tin tồn kho cho 19 sản phẩm trên với các mức số lượng khác nhau
INSERT INTO inventories (product_id, quantity, reserved_quantity, low_stock_threshold, updated_at) VALUES
(1, 80, 0, 5, NOW()),
(2, 45, 0, 5, NOW()),
(3, 30, 0, 5, NOW()),
(4, 25, 0, 3, NOW()),
(5, 40, 0, 3, NOW()),
(6, 35, 0, 3, NOW()),
(7, 15, 0, 2, NOW()),
(8, 20, 0, 2, NOW()),
(9, 60, 0, 8, NOW()),
(10, 50, 0, 5, NOW()),
(11, 120, 0, 10, NOW()),
(12, 90, 0, 10, NOW()),
(13, 150, 0, 15, NOW()),
(14, 200, 0, 20, NOW()),
(15, 80, 0, 10, NOW()),
(16, 70, 0, 8, NOW()),
(17, 12, 0, 2, NOW()),
(18, 18, 0, 2, NOW()),
(19, 250, 0, 25, NOW());
