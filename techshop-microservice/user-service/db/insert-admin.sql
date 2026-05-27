-- =====================================================
-- TÀI KHOẢN ADMIN - TECHSHOP
-- =====================================================
-- Tạo tài khoản admin mặc định cho hệ thống
-- Password đã được mã hóa bằng BCrypt
-- =====================================================

USE techshop_userdb;

-- Xóa admin cũ nếu có (để tránh duplicate)
DELETE FROM users WHERE email = 'admin@techshop.com';

-- Tạo tài khoản ADMIN
INSERT INTO users (
    full_name, 
    email, 
    password, 
    phone, 
    address, 
    avatar_url, 
    role, 
    enabled, 
    created_at, 
    updated_at
) VALUES (
    'Administrator',
    'admin@techshop.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Admin@123
    '0123456789',
    'TechShop Headquarters',
    NULL,
    'ADMIN',
    TRUE,
    NOW(),
    NOW()
);

-- =====================================================
-- THÔNG TIN ĐĂNG NHẬP
-- =====================================================
-- Email:    admin@techshop.com
-- Password: Admin@123
-- Role:     ADMIN
-- =====================================================

-- Tạo thêm một số tài khoản test (optional)
INSERT INTO users (
    full_name, 
    email, 
    password, 
    phone, 
    address, 
    avatar_url, 
    role, 
    enabled, 
    created_at, 
    updated_at
) VALUES 
(
    'Nguyễn Văn A',
    'customer1@techshop.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Admin@123
    '0987654321',
    'Hà Nội',
    NULL,
    'CUSTOMER',
    TRUE,
    NOW(),
    NOW()
),
(
    'Trần Thị B',
    'customer2@techshop.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Admin@123
    '0912345678',
    'Hồ Chí Minh',
    NULL,
    'CUSTOMER',
    TRUE,
    NOW(),
    NOW()
),
(
    'Lê Văn C',
    'staff@techshop.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Password: Admin@123
    '0901234567',
    'Đà Nẵng',
    NULL,
    'STAFF',
    TRUE,
    NOW(),
    NOW()
);

-- Kiểm tra kết quả
SELECT id, full_name, email, role, enabled, created_at 
FROM users 
ORDER BY id;
