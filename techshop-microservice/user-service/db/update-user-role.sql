-- =====================================================
-- CẬP NHẬT ROLE CỦA USER
-- =====================================================
-- Hướng dẫn: Thay đổi email hoặc điều kiện WHERE phù hợp
-- =====================================================

USE techshop_userdb;

-- Xem danh sách users hiện tại
SELECT id, full_name, email, role, enabled FROM users;

-- =====================================================
-- CÁCH 1: Cập nhật theo EMAIL
-- =====================================================
-- Bỏ comment dòng dưới và thay email phù hợp
-- UPDATE users SET role = 'ADMIN' WHERE email = 'user@techshop.com';

-- =====================================================
-- CÁCH 2: Cập nhật theo TÊN (tìm kiếm gần đúng)
-- =====================================================
-- Bỏ comment dòng dưới và thay tên phù hợp
-- UPDATE users SET role = 'ADMIN' WHERE full_name LIKE '%tên_user%';

-- =====================================================
-- CÁCH 3: Cập nhật theo ID
-- =====================================================
-- Bỏ comment dòng dưới và thay ID phù hợp
-- UPDATE users SET role = 'ADMIN' WHERE id = 1;

-- =====================================================
-- CÁCH 4: Cập nhật tất cả users thành ADMIN (NGUY HIỂM!)
-- =====================================================
-- UPDATE users SET role = 'ADMIN';

-- =====================================================
-- Kiểm tra lại sau khi update
-- =====================================================
SELECT id, full_name, email, role, enabled FROM users;

-- =====================================================
-- CÁC ROLE HỢP LỆ
-- =====================================================
-- ADMIN    - Quản trị viên (full quyền)
-- STAFF    - Nhân viên
-- CUSTOMER - Khách hàng
-- =====================================================
