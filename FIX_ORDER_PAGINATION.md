# Sửa lỗi chỉ hiển thị 1 đơn hàng thay vì 9 đơn hàng

## Nguyên nhân
Vấn đề xảy ra do sử dụng `FetchType.EAGER` với `@OneToMany` trong entity Order kết hợp với pagination. Khi Spring Data JPA fetch EAGER một collection trong pagination, nó tạo ra Cartesian product và làm cho pagination không hoạt động đúng.

## Các thay đổi đã thực hiện

### 1. Order.java
- Thay đổi `FetchType.EAGER` thành `FetchType.LAZY` cho quan hệ `items`
- Điều này ngăn chặn việc tự động load items và tránh vấn đề Cartesian product

### 2. OrderRepository.java
- Thêm custom query `findByIdInWithItems()` để fetch items khi cần:
```java
@Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o.id IN :ids")
List<Order> findByIdInWithItems(@Param("ids") List<Long> ids);
```

### 3. OrderService.java
- Cập nhật các method `getMyOrders()`, `getByUserId()`, và `getAll()` để:
  1. Lấy page orders trước (không có items)
  2. Lấy danh sách order IDs từ page
  3. Fetch items cho các orders đó bằng query riêng
  4. Map items vào orders trong page

## Cách áp dụng

### Bước 1: Build lại order-service
```bash
cd TechShopProject/techshop-microservice/order-service
mvn clean package -DskipTests
```

Hoặc nếu build từ root:
```bash
cd TechShopProject/techshop-microservice
mvn clean package -DskipTests -pl order-service
```

### Bước 2: Restart order-service
Nếu đang chạy bằng Docker:
```bash
docker-compose restart order-service
```

Nếu đang chạy trực tiếp:
```bash
# Stop service hiện tại (Ctrl+C)
# Chạy lại
java -jar target/order-service-0.0.1-SNAPSHOT.jar
```

### Bước 3: Kiểm tra
1. Đăng nhập với tài khoản Tan Loi
2. Vào trang "Đơn hàng của tôi"
3. Kiểm tra xem có hiển thị đủ 9 đơn hàng không

## Giải thích kỹ thuật

### Vấn đề với EAGER + Pagination
Khi sử dụng `FetchType.EAGER` với `@OneToMany`:
- JPA tạo JOIN để lấy cả parent và children
- Với pagination, nếu 1 order có 3 items, sẽ tạo ra 3 rows trong result set
- Spring Data đếm 3 rows này như 3 orders riêng biệt
- Kết quả: pagination bị sai, chỉ hiển thị 1 order thay vì nhiều orders

### Giải pháp với LAZY + Manual Fetch
- Dùng `FetchType.LAZY`: không tự động load items
- Pagination hoạt động đúng vì chỉ query bảng orders
- Sau khi có page, fetch items riêng bằng query với JOIN FETCH
- Tránh N+1 query problem vì fetch tất cả items trong 1 query

## Lợi ích
✅ Pagination hoạt động chính xác  
✅ Hiển thị đúng số lượng orders  
✅ Tránh N+1 query problem  
✅ Performance tốt hơn vì chỉ fetch items khi cần  
