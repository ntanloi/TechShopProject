# 🔧 HƯỚNG DẪN SETUP REDIS - DỄ HIỂU

## ✅ CÂU TRẢ LỜI NHANH

**Redis cần:**
1. ✅ **Cài thư viện** (Dependencies trong pom.xml)
2. ✅ **Cấu hình** (application.yml)
3. ✅ **Redis Server** (Docker container)

**→ Hệ thống TechShop ĐÃ CÀI ĐẶT ĐẦY ĐỦ!** ✅

---

## 📦 BƯỚC 1: CÀI THƯ VIỆN (Dependencies)

### **Trong file `pom.xml`:**

```xml
<!-- Redis Cache -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**Giải thích:**

1. **`spring-boot-starter-data-redis`**
   - Thư viện để kết nối với Redis
   - Cung cấp `RedisTemplate`, `StringRedisTemplate`
   - Xử lý serialization/deserialization

2. **`spring-boot-starter-cache`**
   - Thư viện Spring Cache
   - Cung cấp annotations: `@Cacheable`, `@CacheEvict`, `@CachePut`
   - Quản lý cache tự động

**Ví dụ thực tế:**
```
Giống như:
- Mua tủ lạnh (Redis Server)
- Mua dây điện và ổ cắm (Dependencies)
→ Cần cả 2 mới dùng được!
```

**✅ TechShop đã có:** Kiểm tra trong `product-service/pom.xml` → Đã có!

---

## ⚙️ BƯỚC 2: CẤU HÌNH (application.yml)

### **Trong file `application.yml`:**

```yaml
spring:
  # Redis Configuration
  data:
    redis:
      host: localhost      # Địa chỉ Redis server
      port: 6379          # Port mặc định của Redis
      timeout: 60000      # Timeout 60 giây
  
  # Cache Configuration
  cache:
    type: redis           # Sử dụng Redis làm cache
    redis:
      time-to-live: 600000  # TTL = 10 phút (600,000ms)
      cache-null-values: false  # Không cache giá trị null
```

**Giải thích từng dòng:**

| Cấu hình | Giá trị | Ý nghĩa |
|----------|---------|---------|
| `host` | `localhost` | Redis chạy ở đâu? (localhost = máy local) |
| `port` | `6379` | Redis lắng nghe port nào? (6379 = mặc định) |
| `timeout` | `60000` | Timeout bao lâu? (60 giây) |
| `type` | `redis` | Dùng Redis làm cache (không phải Ehcache, Caffeine...) |
| `time-to-live` | `600000` | Cache tồn tại bao lâu? (10 phút) |
| `cache-null-values` | `false` | Có cache giá trị null không? (Không) |

**Ví dụ thực tế:**
```
Giống như cấu hình WiFi:
- host: Tên WiFi (TechShop-WiFi)
- port: Kênh WiFi (Channel 6)
- timeout: Thời gian chờ kết nối
```

**✅ TechShop đã có:** Kiểm tra trong `product-service/application.yml` → Đã có!


---

## 🐳 BƯỚC 3: REDIS SERVER (Docker)

### **Trong file `docker-compose.yml`:**

```yaml
redis:
  image: redis:7-alpine        # Image Redis version 7
  container_name: techshop-redis
  ports:
    - "6379:6379"              # Expose port 6379
  volumes:
    - redis-data:/data         # Lưu data vào volume
  networks:
    - techshop-network
  command: redis-server --appendonly yes  # Enable persistence
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Giải thích:**

| Cấu hình | Giá trị | Ý nghĩa |
|----------|---------|---------|
| `image` | `redis:7-alpine` | Dùng Redis version 7, Alpine Linux (nhẹ) |
| `ports` | `6379:6379` | Map port 6379 của container ra host |
| `volumes` | `redis-data:/data` | Lưu data vào volume (không mất khi restart) |
| `command` | `--appendonly yes` | Enable AOF persistence (lưu data vào disk) |
| `healthcheck` | `redis-cli ping` | Kiểm tra Redis có sống không |

**Ví dụ thực tế:**
```
Giống như:
- image: Mua tủ lạnh Samsung (model cụ thể)
- ports: Cắm vào ổ điện nhà (6379)
- volumes: Ngăn đá riêng (lưu data)
- command: Bật chế độ tiết kiệm điện
- healthcheck: Kiểm tra tủ lạnh còn chạy không
```

**✅ TechShop đã có:** Kiểm tra trong `docker-compose.yml` → Đã có!

---

## 🔧 BƯỚC 4: CẤU HÌNH REDIS (RedisConfig.java)

### **Tạo file `RedisConfig.java`:**

```java
@Configuration
@EnableCaching  // Bật tính năng caching
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(
        RedisConnectionFactory connectionFactory
    ) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Serializer cho key (String)
        template.setKeySerializer(new StringRedisSerializer());
        
        // Serializer cho value (JSON)
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        return template;
    }
    
    @Bean
    public RedisCacheManager cacheManager(
        RedisConnectionFactory connectionFactory
    ) {
        RedisCacheConfiguration config = RedisCacheConfiguration
            .defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))  // TTL = 10 phút
            .disableCachingNullValues();       // Không cache null
        
        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .build();
    }
}
```

**Giải thích:**

1. **`@EnableCaching`**
   - Bật tính năng caching của Spring
   - Cho phép dùng `@Cacheable`, `@CacheEvict`, `@CachePut`

2. **`RedisTemplate`**
   - Bean để thao tác với Redis
   - Cấu hình serializer (chuyển Object → JSON)

3. **`RedisCacheManager`**
   - Quản lý cache
   - Cấu hình TTL, null values

**Ví dụ thực tế:**
```
Giống như:
- @EnableCaching: Bật công tắc tủ lạnh
- RedisTemplate: Remote điều khiển tủ lạnh
- RedisCacheManager: Cài đặt nhiệt độ, chế độ
```

**✅ TechShop đã có:** Kiểm tra trong `product-service/config/RedisConfig.java` → Đã có!


---

## 💻 BƯỚC 5: SỬ DỤNG REDIS (Code)

### **Trong Service class:**

```java
@Service
public class ProductService {
    
    // READ - Lấy từ cache
    @Cacheable(value = "products", key = "#id")
    public Product getById(Long id) {
        // Nếu có trong Redis → Trả về ngay
        // Nếu không → Query MySQL → Lưu vào Redis → Trả về
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }
    
    // CREATE - Xóa cache
    @CacheEvict(value = "products", allEntries = true)
    public Product create(ProductRequest request) {
        // Tạo sản phẩm mới
        Product product = productRepository.save(new Product(request));
        // Xóa tất cả cache (vì danh sách đã thay đổi)
        return product;
    }
    
    // UPDATE - Cập nhật cache
    @CachePut(value = "products", key = "#id")
    public Product update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        product.setName(request.getName());
        product.setPrice(request.getPrice());
        
        // Lưu vào MySQL và cập nhật cache
        return productRepository.save(product);
    }
    
    // DELETE - Xóa cache
    @CacheEvict(value = "products", key = "#id")
    public void delete(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
        
        // Xóa khỏi MySQL và xóa cache
        productRepository.delete(product);
    }
}
```

**Giải thích annotations:**

| Annotation | Khi nào dùng | Hành động |
|------------|--------------|-----------|
| `@Cacheable` | READ | Lấy từ cache, không có thì query DB |
| `@CacheEvict` | CREATE, DELETE | Xóa cache |
| `@CachePut` | UPDATE | Cập nhật cache |

**✅ TechShop đã có:** Kiểm tra trong `product-service/service/ProductService.java` → Đã có!

---

## 🚀 BƯỚC 6: CHẠY HỆ THỐNG

### **1. Start Redis:**

```bash
# Start Redis container
docker-compose up -d redis

# Kiểm tra Redis đã chạy chưa
docker ps | grep redis

# Test Redis
docker exec -it techshop-redis redis-cli ping
# Output: PONG (Redis đang chạy!)
```

### **2. Start Product Service:**

```bash
# Build và start
docker-compose up -d product-service

# Kiểm tra logs
docker logs -f techshop-product-service

# Nếu thấy:
# "Connected to Redis at localhost:6379"
# → Redis đã kết nối thành công!
```

### **3. Test Redis:**

```bash
# Xem sản phẩm lần 1 (Cache MISS)
curl http://localhost:8082/api/products/1
# Response time: ~50ms

# Xem sản phẩm lần 2 (Cache HIT)
curl http://localhost:8082/api/products/1
# Response time: ~2ms (Nhanh hơn 25 lần!)

# Kiểm tra cache trong Redis
docker exec -it techshop-redis redis-cli
> KEYS *
# Output: "products::1"

> GET products::1
# Output: JSON của sản phẩm
```


---

## 📋 CHECKLIST: REDIS SETUP

### **Hệ thống TechShop:**

- [x] **Dependencies** (pom.xml)
  - [x] `spring-boot-starter-data-redis`
  - [x] `spring-boot-starter-cache`

- [x] **Configuration** (application.yml)
  - [x] Redis host, port
  - [x] Cache type = redis
  - [x] TTL = 10 phút

- [x] **Redis Server** (docker-compose.yml)
  - [x] Redis container
  - [x] Port 6379
  - [x] Volume persistence
  - [x] Health check

- [x] **Redis Config** (RedisConfig.java)
  - [x] `@EnableCaching`
  - [x] `RedisTemplate`
  - [x] `RedisCacheManager`

- [x] **Usage** (ProductService.java)
  - [x] `@Cacheable` cho READ
  - [x] `@CacheEvict` cho CREATE/DELETE
  - [x] `@CachePut` cho UPDATE

**Kết luận: ✅ ĐÃ SETUP ĐẦY ĐỦ!**

---

## 🎯 TÓM TẮT

### **Redis cần gì?**

**1. Thư viện (Dependencies):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**2. Cấu hình (application.yml):**
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
  cache:
    type: redis
    redis:
      time-to-live: 600000
```

**3. Redis Server (docker-compose.yml):**
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

**4. Config class (RedisConfig.java):**
```java
@Configuration
@EnableCaching
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Object> redisTemplate(...) { ... }
    
    @Bean
    public RedisCacheManager cacheManager(...) { ... }
}
```

**5. Sử dụng (Service.java):**
```java
@Cacheable(value = "products", key = "#id")
public Product getById(Long id) { ... }
```

---

## 💡 GIẢI THÍCH ĐƠN GIẢN

**Redis giống như:**

1. **Thư viện** = Dây điện, ổ cắm
2. **Cấu hình** = Cài đặt WiFi (tên, mật khẩu)
3. **Redis Server** = Tủ lạnh (phần cứng)
4. **Config class** = Remote điều khiển
5. **Sử dụng** = Bật/tắt, điều chỉnh nhiệt độ

**Cần đủ 5 thứ mới hoạt động!**

---

## 🔍 KIỂM TRA HỆ THỐNG TECHSHOP

### **Đã có đầy đủ:**

✅ **Dependencies:** Có trong `pom.xml`  
✅ **Configuration:** Có trong `application.yml`  
✅ **Redis Server:** Có trong `docker-compose.yml`  
✅ **Config class:** Có trong `RedisConfig.java`  
✅ **Usage:** Có trong `ProductService.java`  

**→ HỆ THỐNG ĐÃ SETUP REDIS HOÀN CHỈNH!** 🎉

---

## 🚨 TROUBLESHOOTING

### **Lỗi: Cannot connect to Redis**

```
Error: Could not connect to Redis at localhost:6379
```

**Nguyên nhân:** Redis chưa chạy

**Giải pháp:**
```bash
# Start Redis
docker-compose up -d redis

# Kiểm tra
docker ps | grep redis
```

---

### **Lỗi: Cache not working**

```
Logs: Cache MISS every time
```

**Nguyên nhân:** Chưa có `@EnableCaching`

**Giải pháp:**
```java
@Configuration
@EnableCaching  // ← Thêm dòng này!
public class RedisConfig { ... }
```

---

### **Lỗi: Serialization error**

```
Error: Cannot serialize Product to Redis
```

**Nguyên nhân:** Product class chưa Serializable

**Giải pháp:**
```java
@Entity
public class Product implements Serializable {  // ← Thêm Serializable
    private static final long serialVersionUID = 1L;
    // ...
}
```

---

**Version:** 1.0  
**Date:** 2025  
**Author:** TechShop Development Team

---

**🎉 Redis đã được setup đầy đủ trong hệ thống TechShop! 🎉**

---

## 📍 VỊ TRÍ FILE TRONG HỆ THỐNG TECHSHOP

### **File `application.yml` nằm ở:**

```
TechShopProject/
└── techshop-microservice/
    └── product-service/
        └── src/
            └── main/
                └── resources/
                    └── application.yml  ← ĐÂY!
```

**Đường dẫn đầy đủ:**
```
e:\TanTai\HK2(2025-2026)\minhchung\KienTrucPhanMem\TechShopProject\
techshop-microservice\product-service\src\main\resources\application.yml
```

---

### **Nội dung file hiện tại:**

```yaml
server:
  port: 8082

spring:
  application:
    name: product-service
  
  datasource:
    url: jdbc:mysql://localhost:3306/techshop_productdb?...
    username: root
    password: 123456
  
  # ============================================
  # REDIS CONFIGURATION (Phần này!)
  # ============================================
  data:
    redis:
      host: localhost      # ← Redis ở localhost
      port: 6379          # ← Port 6379
      timeout: 60000      # ← Timeout 60 giây
  
  cache:
    type: redis           # ← Dùng Redis làm cache
    redis:
      time-to-live: 600000  # ← TTL = 10 phút
      cache-null-values: false  # ← Không cache null
  
  # ... các config khác
```

---

### **Giải thích:**

**1. Tại sao trong `product-service`?**
- Vì chỉ Product Service dùng Redis cache
- Các service khác (User, Order, Cart) không dùng Redis
- Mỗi service có file `application.yml` riêng

**2. Cấu trúc thư mục:**

```
techshop-microservice/
├── product-service/
│   └── src/main/resources/
│       └── application.yml  ← Có Redis config
│
├── user-service/
│   └── src/main/resources/
│       └── application.yml  ← KHÔNG có Redis config
│
├── order-service/
│   └── src/main/resources/
│       └── application.yml  ← KHÔNG có Redis config
│
└── cart-service/
    └── src/main/resources/
        └── application.yml  ← KHÔNG có Redis config
```

**3. Khi chạy Docker:**

```yaml
# docker-compose.yml
product-service:
  environment:
    - SPRING_DATA_REDIS_HOST=redis  # ← Override localhost → redis
    - SPRING_DATA_REDIS_PORT=6379
```

**Giải thích:**
- Trong `application.yml`: `host: localhost` (cho dev local)
- Trong Docker: Override thành `host: redis` (tên container)

---

### **Xem file thực tế:**

**Cách 1: Dùng VS Code**
```
1. Mở VS Code
2. File Explorer → Tìm đường dẫn:
   techshop-microservice/product-service/src/main/resources/
3. Click vào application.yml
```

**Cách 2: Dùng Command Line**
```bash
# Xem nội dung file
cat "e:\TanTai\HK2(2025-2026)\minhchung\KienTrucPhanMem\TechShopProject\techshop-microservice\product-service\src\main\resources\application.yml"

# Hoặc mở bằng notepad
notepad "e:\TanTai\HK2(2025-2026)\minhchung\KienTrucPhanMem\TechShopProject\techshop-microservice\product-service\src\main\resources\application.yml"
```

---

### **Nếu muốn thêm Redis cho service khác:**

**Ví dụ: Thêm Redis cho User Service**

**Bước 1:** Thêm dependencies vào `user-service/pom.xml`
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

**Bước 2:** Thêm config vào `user-service/src/main/resources/application.yml`
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
  cache:
    type: redis
    redis:
      time-to-live: 600000
```

**Bước 3:** Tạo `RedisConfig.java` trong user-service

**Bước 4:** Dùng `@Cacheable` trong UserService

---

**🎯 Kết luận:** File `application.yml` với Redis config nằm trong **`product-service/src/main/resources/`** và đây là file CỦA HỆ THỐNG BẠN! ✅
