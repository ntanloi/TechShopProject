USE techshop_productdb;

-- 1. Xóa dữ liệu cũ để tránh lỗi xung đột ràng buộc
DELETE FROM products;
DELETE FROM categories;

-- 2. Thêm danh mục sản phẩm (Categories)
INSERT INTO categories (id, name, slug, description, image_url) VALUES
(1, 'Laptop Văn Phòng', 'laptop', 'Laptop phục vụ công việc, học tập, mỏng nhẹ thời trang', '/product_image/laptop_main.png'),
(2, 'Laptop Gaming', 'laptop-gaming', 'Laptop cấu hình cao, đồ họa mạnh mẽ, tản nhiệt tối ưu', '/product_image/laptop_gaming_main.png'),
(3, 'PC Đồng Bộ TechShop', 'pc', 'Máy tính để bàn phục vụ Gaming, Thiết kế đồ họa và Văn phòng', '/product_image/pc_main.png'),
(4, 'Màn Hình Máy Tính', 'monitor', 'Màn hình hiển thị độ phân giải cao, tần số quét lớn cho game thủ', '/product_image/monitor_main.png'),
(5, 'Bàn Phím Cơ', 'keyboard', 'Bàn phím cơ chính hãng, switch gõ êm ái, đèn LED RGB', '/product_image/keyboard_main.png'),
(6, 'Chuột Gaming & Văn Phòng', 'mouse', 'Chuột chơi game siêu nhạy, chuột văn phòng không dây bluetooth', '/product_image/mouse_main.png'),
(7, 'Tai Nghe Gaming', 'headphone', 'Tai nghe Over-ear cách âm tốt, âm thanh vòm sống động', '/product_image/headphone_main.png'),
(8, 'Bàn Ghế Gaming', 'chair', 'Ghế chơi game công thái học, nâng đỡ cột sống tốt', '/product_image/chair_main.png'),
(9, 'Máy Chơi Game Console', 'console', 'Máy chơi game cầm tay thế hệ mới, tay cầm điều khiển chính hãng', '/product_image/console_main.png'),
(10, 'Phụ Kiện Máy Tính', 'accessory', 'Cáp kết nối, cổng chuyển đổi hub USB-C, củ sạc nhanh', '/product_image/accessory_main.png');

-- 3. Thêm sản phẩm mẫu (Products)
INSERT INTO products (id, name, description, price, sale_price, image_url, brand, sku, slug, category_id, active, specifications, created_at, updated_at) VALUES
-- Laptop Văn Phòng (category_id = 1)
(1, 'Laptop ASUS Vivobook 14 X1404VA-NK123W', 'Laptop ASUS Vivobook 14 mỏng nhẹ, hiệu năng văn phòng tốt với chip Core i3 thế hệ 12.', 12490000, 10990000, '/product_image/vivobook.png', 'ASUS', 'ASUS-X1404VA', 'asus-vivobook-14-x1404va', 1, 1, '{"CPU":"Intel Core i3-1215U","RAM":"8GB DDR4","SSD":"256GB NVMe","Màn hình":"14.0 inch FHD IPS","Trọng lượng":"1.4 kg"}', NOW(), NOW()),
(2, 'Laptop HP Pavilion 15-eg3093TU 8C5L6PA', 'Thiết kế kim loại sang trọng, màn hình viền mỏng sắc nét phù hợp cho sinh viên và người làm văn phòng.', 18990000, 16990000, '/product_image/hp_pavilion.png', 'HP', 'HP-PAVILION-15', 'hp-pavilion-15-eg3093tu', 1, 1, '{"CPU":"Intel Core i5-1335U","RAM":"16GB DDR4","SSD":"512GB NVMe","Màn hình":"15.6 inch FHD IPS","Trọng lượng":"1.74 kg"}', NOW(), NOW()),
(3, 'Laptop Lenovo ThinkBook 14 G6+ IMH', 'ThinkBook siêu bền, bàn phím gõ êm ái hàng đầu, trang bị chip Intel Core Ultra mới nhất.', 22990000, 20990000, '/product_image/thinkbook.png', 'Lenovo', 'LENOVO-TB14G6', 'lenovo-thinkbook-14-g6', 1, 1, '{"CPU":"Intel Core Ultra 5-125H","RAM":"16GB LPDDR5X","SSD":"512GB NVMe","Màn hình":"14.0 inch 2.5K 90Hz","Trọng lượng":"1.43 kg"}', NOW(), NOW()),

-- Laptop Gaming (category_id = 2)
(4, 'Laptop Gaming ASUS TUF Gaming A15 FA507NU-LP034W', 'Chiến binh gaming quốc dân với card đồ họa RTX 4050 mạnh mẽ và màn hình 144Hz mượt mà.', 26990000, 23990000, '/product_image/tuf_gaming.png', 'ASUS', 'ASUS-TUF-A15', 'asus-tuf-gaming-a15-fa507nu', 2, 1, '{"CPU":"AMD Ryzen 5 7535HS","RAM":"16GB DDR5","SSD":"512GB NVMe","VGA":"NVIDIA RTX 4050 6GB","Màn hình":"15.6 inch FHD 144Hz"}', NOW(), NOW()),
(5, 'Laptop Gaming Acer Nitro V ANV15-51-57B4', 'Nitro V thế hệ mới sở hữu thiết kế vuông vắn, tản nhiệt kép và cấu hình mạnh mẽ.', 23490000, 21490000, '/product_image/nitro_v.png', 'Acer', 'ACER-NITRO-V', 'acer-nitro-v-anv15', 2, 1, '{"CPU":"Intel Core i5-13420H","RAM":"8GB DDR5","SSD":"512GB NVMe","VGA":"NVIDIA RTX 4050 6GB","Màn hình":"15.6 inch FHD 144Hz"}', NOW(), NOW()),
(6, 'Laptop Gaming Lenovo LOQ 15IAX9 83GS001RVN', 'LOQ thừa hưởng thiết kế cao cấp từ dòng Legion danh tiếng, hiệu năng cực đỉnh trong tầm giá.', 21990000, 19990000, '/product_image/lenovo_loq.png', 'Lenovo', 'LENOVO-LOQ-15', 'lenovo-loq-15iax9', 2, 1, '{"CPU":"Intel Core i5-12450HX","RAM":"12GB DDR5","SSD":"512GB NVMe","VGA":"NVIDIA RTX 3050 6GB","Màn hình":"15.6 inch FHD 144Hz"}', NOW(), NOW()),

-- PC Đồng Bộ TechShop (category_id = 3)
(7, 'PC TechShop Gaming GVN Minotaur i4060', 'Dàn PC lắp sẵn tối ưu cho nhu cầu chơi game Esport và đồ họa bán chuyên.', 20500000, 18900000, '/product_image/pc_minotaur.png', 'TechShop', 'GVN-MINOTAUR-I4060', 'pc-techshop-gvn-minotaur-i4060', 3, 1, '{"CPU":"Intel Core i5-12400F","Main":"B760 DDR4","RAM":"16GB RGB 3200MHz","VGA":"NVIDIA RTX 4060 8GB","SSD":"512GB NVMe","Nguồn":"650W 80 Plus"}', NOW(), NOW()),
(8, 'PC TechShop Văn Phòng GVN Office i3', 'PC văn phòng nhỏ gọn, hoạt động ổn định, tiết kiệm điện năng cho văn phòng công ty.', 7500000, 6900000, '/product_image/pc_office.png', 'TechShop', 'GVN-OFFICE-I3', 'pc-techshop-gvn-office-i3', 3, 1, '{"CPU":"Intel Core i3-12100","Main":"H610 DDR4","RAM":"8GB 3200MHz","VGA":"Intel UHD Graphics 730","SSD":"256GB SATA III","Nguồn":"400W"}', NOW(), NOW()),

-- Màn Hình (category_id = 4)
(9, 'Màn hình ASUS TUF Gaming VG249Q3A 24" IPS 180Hz', 'Tần số quét cao 180Hz mang lại phản hồi game cực nhanh, tấm nền IPS màu sắc chân thực.', 4500000, 3690000, '/product_image/monitor_asus.png', 'ASUS', 'ASUS-VG249Q3A', 'man-hinh-asus-tuf-gaming-vg249q3a', 4, 1, '{"Kích thước":"23.8 inch","Tấm nền":"IPS","Độ phân giải":"FHD (1920 x 1080)","Tần số quét":"180Hz","Thời gian phản hồi":"1ms GtG"}', NOW(), NOW()),
(10, 'Màn hình Dell UltraSharp U2422H 24" IPS FHD', 'Màn hình chuyên đồ họa với viền siêu mỏng, độ chuẩn màu delta E < 2 cho trải nghiệm thị giác tuyệt vời.', 6990000, 5990000, '/product_image/monitor_dell.png', 'Dell', 'DELL-U2422H', 'man-hinh-dell-ultrasharp-u2422h', 4, 1, '{"Kích thước":"23.8 inch","Tấm nền":"IPS sRGB 100%","Độ phân giải":"FHD (1920 x 1080)","Tần số quét":"60Hz","Cổng kết nối":"HDMI, DP, USB-C"}', NOW(), NOW()),

-- Bàn Phím Cơ (category_id = 5)
(11, 'Bàn phím cơ AKKO 3087 v2 DS Midnight (Akko Switch)', 'Bàn phím cơ layout Tenkeyless gọn nhẹ, keycap PBT Double-shot cực bền.', 1290000, 990000, '/product_image/keyboard_akko.png', 'AKKO', 'AKKO-3087-MN', 'ban-phim-co-akko-3087-v2-midnight', 5, 1, '{"Kiểu layout":"TKL (87 phím)","Switch":"Akko Pink v2","Keycap":"PBT Double-Shot","Kết nối":"Dây cáp USB Type-C rời"}', NOW(), NOW()),
(12, 'Bàn phím cơ không dây Aula F75 Black RGB', 'Bàn phím Gasket mount gõ siêu êm, tích hợp núm xoay đa phương tiện cao cấp.', 1790000, 1390000, '/product_image/keyboard_aula.png', 'Aula', 'AULA-F75-BLK', 'ban-phim-co-không-day-aula-f75', 5, 1, '{"Kiểu layout":"75% (80 phím)","Switch":"LEOBOG Reaper","Kết nối":"3 Mode (Type-C / 2.4G / Bluetooth)","Pin":"4000mAh"}', NOW(), NOW()),

-- Chuột (category_id = 6)
(13, 'Chuột không dây Logitech G304 LightSpeed Black', 'Chuột gaming quốc dân không dây siêu nhạy, thời lượng pin sử dụng lên đến 250 giờ.', 1090000, 890000, '/product_image/mouse_logitech.png', 'Logitech', 'LOGITECH-G304', 'chuot-khong-day-logitech-g304', 6, 1, '{"Mắt đọc":"HERO 12K DPI","Kết nối":"Không dây Lightspeed 2.4G","Trọng lượng":"99g","Số nút bấm":"6"}', NOW(), NOW()),
(14, 'Chuột Razer DeathAdder Essential Black', 'Form tay cầm công thái học hoàn hảo cho game thủ, mắt đọc quang học 6400 DPI chính xác.', 690000, 390000, '/product_image/mouse_razer.png', 'Razer', 'RAZER-DA-ESSENTIAL', 'chuot-razer-deathadder-essential', 6, 1, '{"Mắt đọc":"Optital 6400 DPI","Kết nối":"Dây cáp USB","Trọng lượng":"96g","Switch":"Razer Mechanical"}', NOW(), NOW()),

-- Tai Nghe (category_id = 7)
(15, 'Tai nghe Gaming Kingston HyperX Cloud II Red', 'Tai nghe chơi game đỉnh cao với âm thanh vòm 7.1 ảo và khung nhôm siêu chắc chắn.', 2490000, 1790000, '/product_image/headphone_hyperx.png', 'HyperX', 'HYPERX-CLOUD-II', 'tai-nghe-hyperx-cloud-ii', 7, 1, '{"Driver":"Động 53mm với nam châm đất hiếm","Kết nối":"Jack 3.5mm & Soundcard USB 7.1","Trọng lượng":"320g","Đệm tai":"Da cao cấp giả lập"}', NOW(), NOW()),
(16, 'Tai nghe không dây Logitech G435 Lightspeed Wireless', 'Trọng lượng siêu nhẹ chỉ 165g, kết nối không dây kép Lightspeed và Bluetooth tiện dụng.', 2290000, 1690000, '/product_image/headphone_g435.png', 'Logitech', 'LOGITECH-G435', 'tai-nghe-khong-day-logitech-g435', 7, 1, '{"Driver":"40mm","Kết nối":"Không dây Lightspeed & Bluetooth","Trọng lượng":"165g","Thời gian pin":"Lên đến 18 giờ"}', NOW(), NOW()),

-- Ghế Gaming (category_id = 8)
(17, 'Ghế chơi game Warrior Raider Series WGC206 Black/Red', 'Khung kim loại vững chắc, đệm đúc nguyên khối chống xẹp lún và da PU cao cấp chống xước.', 3290000, 2790000, '/product_image/chair_warrior.png', 'Warrior', 'WARRIOR-WGC206', 'ghe-gaming-warrior-raider-wgc206', 8, 1, '{"Chất liệu":"Da PU cao cấp","Trọng tải tối đa":"120kg","Góc ngả lưng":"135 độ","Trục thủy lực":"Class 4 nâng hạ mượt"}', NOW(), NOW()),

-- Máy Chơi Game (category_id = 9)
(18, 'Máy chơi game cầm tay ASUS ROG Ally RC71L', 'Trải nghiệm game PC mượt mà mọi lúc mọi nơi trên màn hình 120Hz sắc nét chạy hệ điều hành Windows 11.', 19990000, 15990000, '/product_image/rog_ally.png', 'ASUS', 'ASUS-ROG-ALLY', 'may-choi-game-asus-rog-ally', 9, 1, '{"CPU":"AMD Ryzen Z1 Extreme","RAM":"16GB LPDDR5","SSD":"512GB PCIe 4.0 NVMe","Màn hình":"7 inch FHD 120Hz Touch","OS":"Windows 11 Home"}', NOW(), NOW()),

-- Phụ Kiện (category_id = 10)
(19, 'Cáp sạc Hub chuyển đổi Ugreen USB-C sang HDMI 4K & USB 3.0', 'Bộ hub 5 trong 1 chuyển đổi đa năng từ USB-C sang các cổng kết nối phổ thông tốc độ cao.', 690000, 490000, '/product_image/hub_ugreen.png', 'Ugreen', 'UGREEN-5IN1-HUB', 'hub-ugreen-usb-c-to-hdmi', 10, 1, '{"Cổng kết nối vào":"USB-C","Cổng ra":"1x HDMI 4K @30Hz, 3x USB 3.0, 1x PD 100W","Chất liệu vỏ":"Hợp kim nhôm tản nhiệt"}', NOW(), NOW());
