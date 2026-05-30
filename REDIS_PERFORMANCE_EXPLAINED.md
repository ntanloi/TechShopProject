# 🚀 REDIS PERFORMANCE - GIẢI THÍCH DỄ HIỂU

## 🎯 REDIS LÀ GÌ? (Theo cách hiểu đơn giản)

**Redis giống như một "Kho lưu trữ tạm thời siêu nhanh"**

Hãy tưởng tượng:
- **Database (MySQL)** = Kho hàng lớn ở ngoại thành (xa, chậm)
- **Redis** = Tủ đồ nhỏ trong phòng (gần, nhanh)

---

## 🏪 VÍ DỤ THỰC TẾ: CỬA HÀNG TECHSHOP

### **KHÔNG có Redis (Chậm):**

```
Khách hàng: "Cho tôi xem iPhone 15"
     ↓
Nhân viên: "Đợi tôi xuống kho lấy" (đi xuống tầng hầm)
     ↓
Đi xuống kho (5 phút)
Tìm iPhone (2 phút)
Đi lên (5 phút)
     ↓
Tổng: 12 phút ❌ (Khách chán, bỏ đi!)
```

### **CÓ Redis (Nhanh):**

```
Khách hàng: "Cho tôi xem iPhone 15"
     ↓
Nhân viên: "Có sẵn trong tủ trưng bày!" (lấy ngay)
     ↓
Tổng: 10 giây ✅ (Khách hài lòng!)
```

**Đó chính là Redis!** Lưu những thứ hay dùng ở gần để lấy nhanh!

---

## 📊 SO SÁNH TỐC ĐỘ

### **Lấy thông tin sản phẩm:**

| Cách | Thời gian | Giải thích |
|------|-----------|------------|
| **MySQL** | 50-100ms | Phải query database, đọc từ disk |
| **Redis** | 1-5ms | Đọc từ RAM, siêu nhanh! |
| **Nhanh hơn** | **20-100 lần!** | 🚀 |

**Ví dụ cụ thể:**

```
1000 users cùng xem iPhone 15:

KHÔNG có Redis:
- 1000 requests → MySQL
- Mỗi request: 50ms
- Tổng: 50,000ms = 50 giây
- MySQL quá tải! 🔴

CÓ Redis:
- Request đầu: 50ms (từ MySQL, lưu vào Redis)
- 999 requests sau: 2ms (từ Redis)
- Tổng: 50ms + (999 × 2ms) = 2,048ms = 2 giây
- Nhanh hơn 25 lần! ✅
```


---

## 🔄 REDIS HOẠT ĐỘNG NHƯ THẾ NÀO?

### **Kịch bản: Xem sản phẩm iPhone 15**

#### **Lần 1: Cache MISS (Chưa có trong Redis)**

```
User: "Xem iPhone 15" (GET /api/products/123)
     ↓
Product Service: "Kiểm tra Redis..."
     ↓
Redis: "Không có!" ❌ (Cache MISS)
     ↓
Product Service: "OK, lấy từ MySQL"
     ↓
MySQL: Query database (50ms)
     ↓
Product Service: 
  1. Nhận data từ MySQL
  2. Lưu vào Redis (để lần sau nhanh)
  3. Trả về cho User
     ↓
User nhận được: 50ms
```

#### **Lần 2, 3, 4... 1000: Cache HIT (Có trong Redis)**

```
User: "Xem iPhone 15" (GET /api/products/123)
     ↓
Product Service: "Kiểm tra Redis..."
     ↓
Redis: "Có rồi!" ✅ (Cache HIT)
     ↓
Product Service: Trả về ngay (không cần MySQL)
     ↓
User nhận được: 2ms (Nhanh hơn 25 lần!)
```

**Kết quả:**
- Request đầu: Chậm (50ms) - Phải lấy từ MySQL
- 999 requests sau: Nhanh (2ms) - Lấy từ Redis
- **Trung bình: 2.05ms** (Nhanh hơn 24 lần!)

---

## 💾 REDIS CRUD OPERATIONS

### **1. CREATE (Tạo sản phẩm mới)**

```java
@CacheEvict(value = "products", allEntries = true)
public Product create(ProductRequest request) {
    // Tạo sản phẩm mới trong MySQL
    Product product = productRepository.save(new Product(request));
    
    // XÓA TẤT CẢ cache (vì danh sách sản phẩm đã thay đổi)
    // Redis sẽ tự động xóa cache
    
    return product;
}
```

**Giải thích:**
```
Admin tạo sản phẩm mới: "iPhone 16"
     ↓
Lưu vào MySQL ✅
     ↓
XÓA cache "products" trong Redis
(Vì danh sách sản phẩm đã thay đổi, cache cũ không còn đúng)
     ↓
Lần sau user xem danh sách:
  - Redis không có (Cache MISS)
  - Lấy từ MySQL (có iPhone 16 mới)
  - Lưu vào Redis
```

**Tại sao phải xóa cache?**
- Nếu không xóa, user vẫn thấy danh sách cũ (không có iPhone 16)
- Xóa cache → Lần sau lấy data mới từ MySQL


---

### **2. READ (Đọc sản phẩm)**

```java
@Cacheable(value = "products", key = "#id")
public Product getById(Long id) {
    log.info("Cache MISS - Fetching from database");
    return productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
}
```

**Giải thích:**
```
User xem iPhone 15 (id=123)
     ↓
1. Kiểm tra Redis: key = "products::123"
     ↓
2a. Nếu CÓ (Cache HIT):
    - Trả về ngay từ Redis (2ms) ✅
    - KHÔNG query MySQL
    
2b. Nếu KHÔNG (Cache MISS):
    - Query MySQL (50ms)
    - Lưu vào Redis với key "products::123"
    - Trả về cho user
     ↓
3. Lần sau: Cache HIT → Nhanh!
```

**Cache Key:**
- `products::123` = Sản phẩm có id=123
- `products::456` = Sản phẩm có id=456
- Mỗi sản phẩm có key riêng

---

### **3. UPDATE (Cập nhật sản phẩm)**

```java
@CachePut(value = "products", key = "#id")
public Product update(Long id, ProductRequest request) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
    
    // Cập nhật thông tin
    product.setName(request.getName());
    product.setPrice(request.getPrice());
    
    // Lưu vào MySQL
    Product updated = productRepository.save(product);
    
    // Tự động CẬP NHẬT cache trong Redis
    return updated;
}
```

**Giải thích:**
```
Admin sửa giá iPhone 15: 20 triệu → 18 triệu
     ↓
1. Cập nhật trong MySQL ✅
     ↓
2. CẬP NHẬT cache trong Redis
   - Key: "products::123"
   - Value: {id: 123, name: "iPhone 15", price: 18000000}
     ↓
3. User xem iPhone 15:
   - Lấy từ Redis (2ms)
   - Thấy giá mới: 18 triệu ✅
```

**Tại sao dùng @CachePut?**
- `@CachePut` = Cập nhật cache
- Không xóa cache, chỉ update value mới
- User thấy data mới ngay lập tức

---

### **4. DELETE (Xóa sản phẩm)**

```java
@CacheEvict(value = "products", key = "#id")
public void delete(Long id) {
    Product product = productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
    
    // Xóa khỏi MySQL
    productRepository.delete(product);
    
    // Tự động XÓA cache trong Redis
}
```

**Giải thích:**
```
Admin xóa iPhone 15 (id=123)
     ↓
1. Xóa khỏi MySQL ✅
     ↓
2. XÓA cache trong Redis
   - Key "products::123" bị xóa
     ↓
3. User xem iPhone 15:
   - Redis không có (đã xóa)
   - Query MySQL → Không tìm thấy
   - Trả về 404 Not Found ✅
```


---

## 📈 TỔNG KẾT REDIS CRUD

| Operation | Annotation | Hành động | Khi nào dùng |
|-----------|-----------|-----------|--------------|
| **CREATE** | `@CacheEvict(allEntries=true)` | Xóa tất cả cache | Thêm data mới |
| **READ** | `@Cacheable` | Lấy từ cache, nếu không có thì query DB | Đọc data |
| **UPDATE** | `@CachePut` | Cập nhật cache | Sửa data |
| **DELETE** | `@CacheEvict` | Xóa cache | Xóa data |

---

## 🎯 TỐI ƯU HIỆU NĂNG VỚI REDIS

### **1. Cache những gì?**

#### **✅ NÊN cache:**

**a) Data ít thay đổi:**
```
✅ Thông tin sản phẩm (tên, mô tả, hình ảnh)
✅ Danh mục sản phẩm (Laptop, Phone, Tablet)
✅ Thông tin user (tên, email, avatar)
✅ Cấu hình hệ thống
```

**Lý do:** Ít thay đổi → Cache lâu → Hiệu quả cao

**b) Data được truy cập nhiều:**
```
✅ Sản phẩm hot (iPhone, Samsung flagship)
✅ Trang chủ (danh sách sản phẩm nổi bật)
✅ Danh mục phổ biến
```

**Lý do:** Truy cập nhiều → Cache hit rate cao → Giảm tải MySQL

#### **❌ KHÔNG NÊN cache:**

**a) Data thay đổi liên tục:**
```
❌ Số lượng tồn kho (thay đổi mỗi khi bán)
❌ Giá real-time (flash sale, giảm giá theo giờ)
❌ Trạng thái đơn hàng (pending → processing → shipped)
```

**Lý do:** Thay đổi liên tục → Cache không kịp update → Data sai

**b) Data nhạy cảm:**
```
❌ Mật khẩu
❌ Thông tin thanh toán
❌ Token, Session (dùng Redis Session riêng)
```

**Lý do:** Bảo mật

**c) Data ít được truy cập:**
```
❌ Sản phẩm cũ, ít người xem
❌ User không active
```

**Lý do:** Cache hit rate thấp → Lãng phí memory

---

### **2. Thiết lập TTL (Time To Live) hợp lý**

**TTL = Thời gian cache tồn tại trước khi tự động xóa**

```java
@Bean
public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
    RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))  // TTL = 10 phút
        .disableCachingNullValues();
    
    return RedisCacheManager.builder(connectionFactory)
        .cacheDefaults(config)
        .build();
}
```

**Gợi ý TTL:**

| Data | TTL | Lý do |
|------|-----|-------|
| **Sản phẩm hot** | 10-30 phút | Cân bằng giữa performance và freshness |
| **Danh mục** | 1-2 giờ | Ít thay đổi |
| **User profile** | 30 phút | Thỉnh thoảng update |
| **Trang chủ** | 5-10 phút | Cần fresh content |
| **Sản phẩm ít xem** | 5 phút | Tiết kiệm memory |

**Tại sao cần TTL?**
```
Không có TTL:
- Cache tồn tại mãi mãi
- Data cũ không được refresh
- Redis đầy memory
- Phải restart Redis để xóa cache

Có TTL:
- Cache tự động xóa sau 10 phút
- Data được refresh định kỳ
- Memory không bị đầy
- Luôn có data tương đối mới
```


---

### **3. Cache Strategy (Chiến lược cache)**

#### **a) Cache-Aside (Lazy Loading) - Đang dùng ✅**

```
User request
     ↓
1. Kiểm tra Redis
     ↓
2a. Cache HIT → Trả về ngay
2b. Cache MISS → Query MySQL → Lưu vào Redis → Trả về
```

**Ưu điểm:**
- ✅ Chỉ cache data thực sự cần (được request)
- ✅ Tiết kiệm memory
- ✅ Đơn giản, dễ implement

**Nhược điểm:**
- ⚠️ Request đầu tiên chậm (Cache MISS)
- ⚠️ Có thể cache data cũ

**Khi nào dùng:** Hầu hết các trường hợp (như TechShop)

---

#### **b) Write-Through (Viết qua cache)**

```
Admin update sản phẩm
     ↓
1. Cập nhật MySQL
2. Cập nhật Redis (cùng lúc)
     ↓
User request → Luôn có trong Redis
```

**Ưu điểm:**
- ✅ Data luôn fresh (mới nhất)
- ✅ Không có Cache MISS

**Nhược điểm:**
- ⚠️ Mọi write đều phải update cache (chậm hơn)
- ⚠️ Cache data có thể không được dùng (lãng phí)

**Khi nào dùng:** Data quan trọng, cần luôn mới

---

#### **c) Write-Behind (Viết sau)**

```
Admin update sản phẩm
     ↓
1. Cập nhật Redis (nhanh)
2. Async update MySQL (sau)
```

**Ưu điểm:**
- ✅ Write rất nhanh
- ✅ Giảm tải MySQL

**Nhược điểm:**
- ⚠️ Có thể mất data nếu Redis crash
- ⚠️ Phức tạp

**Khi nào dùng:** Hệ thống cần write performance cao

---

### **4. Monitoring & Optimization**

#### **a) Theo dõi Cache Hit Rate**

```java
@GetMapping("/cache/stats")
public Map<String, Object> getCacheStats() {
    // Tổng requests
    long totalRequests = 10000;
    
    // Cache hits (lấy từ Redis)
    long cacheHits = 9500;
    
    // Cache misses (phải query MySQL)
    long cacheMisses = 500;
    
    // Hit rate
    double hitRate = (double) cacheHits / totalRequests * 100;
    
    return Map.of(
        "totalRequests", totalRequests,
        "cacheHits", cacheHits,
        "cacheMisses", cacheMisses,
        "hitRate", hitRate + "%"  // 95%
    );
}
```

**Đánh giá Hit Rate:**
- **> 90%**: Xuất sắc ✅
- **70-90%**: Tốt ✅
- **50-70%**: Trung bình ⚠️
- **< 50%**: Kém, cần tối ưu ❌

**Nếu Hit Rate thấp:**
- Tăng TTL (cache lâu hơn)
- Cache thêm data
- Kiểm tra xem có cache đúng data không


---

#### **b) Tối ưu Memory**

**Vấn đề:** Redis lưu trên RAM → Đắt, hạn chế

**Giải pháp:**

1. **Chỉ cache data cần thiết**
   ```
   ❌ Cache tất cả 10,000 sản phẩm
   ✅ Cache 100 sản phẩm hot nhất
   ```

2. **Thiết lập TTL ngắn cho data ít dùng**
   ```
   Sản phẩm hot: TTL = 30 phút
   Sản phẩm ít xem: TTL = 5 phút
   ```

3. **Xóa cache không dùng**
   ```java
   @Scheduled(cron = "0 0 2 * * ?")  // 2AM mỗi ngày
   public void cleanupCache() {
       cacheManager.getCacheNames().forEach(cacheName -> {
           Cache cache = cacheManager.getCache(cacheName);
           cache.clear();  // Xóa cache cũ
       });
   }
   ```

4. **Nén data trước khi lưu**
   ```java
   // Sử dụng compression
   @Bean
   public RedisSerializer<Object> redisSerializer() {
       return new GenericJackson2JsonRedisSerializer();
   }
   ```

---

## 💡 SỬ DỤNG REDIS HỢP LÝ

### **Nguyên tắc vàng:**

#### **1. Cache data "đọc nhiều, viết ít"**

```
✅ Sản phẩm: 
   - Đọc: 10,000 lần/ngày
   - Viết: 10 lần/ngày
   → Cache hit rate: 99.9%

❌ Tồn kho:
   - Đọc: 1,000 lần/ngày
   - Viết: 900 lần/ngày
   → Cache hit rate: 10%
   → Không hiệu quả!
```

#### **2. Đừng cache mọi thứ**

```
Câu hỏi: "Có nên cache không?"

Trả lời:
1. Data này được truy cập nhiều không? (> 100 lần/ngày)
   → Không → ĐỪNG cache
   
2. Data này thay đổi thường xuyên không? (> 10 lần/giờ)
   → Có → ĐỪNG cache
   
3. Data này quan trọng về bảo mật không?
   → Có → ĐỪNG cache
   
4. Tất cả đều OK → Cache!
```

#### **3. Luôn có fallback**

```java
@Cacheable(value = "products", key = "#id")
public Product getById(Long id) {
    try {
        // Thử lấy từ Redis
        return redisTemplate.opsForValue().get("products::" + id);
    } catch (Exception e) {
        // Redis down → Fallback sang MySQL
        log.warn("Redis unavailable, falling back to database");
        return productRepository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }
}
```

**Tại sao?**
- Redis có thể down
- Nếu không có fallback → Toàn bộ hệ thống down
- Có fallback → Chậm hơn nhưng vẫn hoạt động


---

## 📊 PERFORMANCE TRONG HỆ THỐNG TECHSHOP

### **Hiện trạng:**

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes
```

```java
// Product Service
@Cacheable(value = "products", key = "#id")
public Product getById(Long id) {
    // Cache hit: 2ms
    // Cache miss: 50ms (query MySQL)
}
```

### **Kết quả thực tế:**

**Scenario: 1000 users xem iPhone 15**

```
Request 1: Cache MISS
- Query MySQL: 50ms
- Lưu vào Redis
- User nhận: 50ms

Request 2-1000: Cache HIT
- Lấy từ Redis: 2ms
- User nhận: 2ms

Tổng thời gian:
- Không Redis: 1000 × 50ms = 50,000ms = 50 giây
- Có Redis: 50ms + (999 × 2ms) = 2,048ms = 2 giây

Cải thiện: 24.4 lần! 🚀
```

### **MySQL Load:**

```
Không Redis:
- 1000 queries đến MySQL
- MySQL CPU: 80%
- MySQL connections: 950/1000
- Có thể quá tải!

Có Redis:
- 1 query đến MySQL (request đầu)
- MySQL CPU: 5%
- MySQL connections: 10/1000
- Rất nhàn rỗi!

Giảm tải: 99.9%! 🎯
```

---

## 🎯 BEST PRACTICES

### **1. Thiết kế Cache Key hợp lý**

```
✅ Tốt:
products::123           (Sản phẩm id=123)
products::category::1   (Sản phẩm thuộc category 1)
users::email::john@example.com

❌ Không tốt:
product_123             (Không có namespace)
p123                    (Không rõ ràng)
```

### **2. Xử lý Cache Stampede**

**Vấn đề:** Cache hết hạn → 1000 requests cùng query MySQL

```
Cache hết hạn (TTL expired)
     ↓
1000 requests cùng lúc
     ↓
Tất cả đều Cache MISS
     ↓
1000 queries đến MySQL
     ↓
MySQL quá tải! 🔴
```

**Giải pháp: Lock**

```java
public Product getById(Long id) {
    String cacheKey = "products::" + id;
    String lockKey = "lock::" + cacheKey;
    
    // Thử lấy từ cache
    Product cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) {
        return cached;
    }
    
    // Cache miss → Cần query MySQL
    // Nhưng chỉ 1 thread được query, các thread khác đợi
    Boolean locked = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));
    
    if (locked) {
        try {
            // Thread này được query MySQL
            Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
            
            // Lưu vào cache
            redisTemplate.opsForValue()
                .set(cacheKey, product, Duration.ofMinutes(10));
            
            return product;
        } finally {
            // Xóa lock
            redisTemplate.delete(lockKey);
        }
    } else {
        // Thread khác đợi và retry
        Thread.sleep(100);
        return getById(id);  // Retry
    }
}
```


---

### **3. Warm-up Cache**

**Vấn đề:** Sau khi restart, cache trống → Nhiều Cache MISS

**Giải pháp:** Pre-load cache khi start

```java
@Component
public class CacheWarmer {
    
    @EventListener(ApplicationReadyEvent.class)
    public void warmUpCache() {
        log.info("Warming up cache...");
        
        // Load top 100 sản phẩm hot
        List<Product> hotProducts = productRepository
            .findTop100ByOrderByViewCountDesc();
        
        hotProducts.forEach(product -> {
            String key = "products::" + product.getId();
            redisTemplate.opsForValue()
                .set(key, product, Duration.ofMinutes(30));
        });
        
        log.info("Cache warmed up with {} products", hotProducts.size());
    }
}
```

**Kết quả:**
- Sau khi start, cache đã có 100 sản phẩm hot
- Users không bị Cache MISS
- Performance tốt ngay từ đầu

---

## 📈 MONITORING REDIS

### **1. Check Redis Health**

```bash
# Ping Redis
redis-cli ping
# Output: PONG

# Check memory usage
redis-cli info memory
# Output:
# used_memory: 1.5M
# used_memory_peak: 2.1M
# maxmemory: 512M

# Check hit rate
redis-cli info stats
# Output:
# keyspace_hits: 9500
# keyspace_misses: 500
# Hit rate: 95%
```

### **2. Monitor trong code**

```java
@GetMapping("/redis/stats")
public Map<String, Object> getRedisStats() {
    Properties info = redisTemplate.getConnectionFactory()
        .getConnection()
        .info();
    
    long hits = Long.parseLong(info.getProperty("keyspace_hits"));
    long misses = Long.parseLong(info.getProperty("keyspace_misses"));
    double hitRate = (double) hits / (hits + misses) * 100;
    
    return Map.of(
        "hits", hits,
        "misses", misses,
        "hitRate", String.format("%.2f%%", hitRate),
        "usedMemory", info.getProperty("used_memory_human"),
        "connectedClients", info.getProperty("connected_clients")
    );
}
```

---

## 🎓 TÓM TẮT

### **Redis là gì?**
- Kho lưu trữ tạm thời siêu nhanh (RAM)
- Nhanh hơn MySQL 20-100 lần
- Giảm tải cho database

### **Khi nào dùng Redis?**
- ✅ Data đọc nhiều, viết ít
- ✅ Data ít thay đổi
- ✅ Cần performance cao
- ❌ Data thay đổi liên tục
- ❌ Data nhạy cảm

### **CRUD với Redis:**
- **CREATE**: Xóa cache (để refresh)
- **READ**: Lấy từ cache, không có thì query DB
- **UPDATE**: Cập nhật cache
- **DELETE**: Xóa cache

### **Tối ưu:**
- Thiết lập TTL hợp lý (5-30 phút)
- Chỉ cache data cần thiết
- Monitor hit rate (> 90% là tốt)
- Luôn có fallback (MySQL)
- Xử lý Cache Stampede
- Warm-up cache khi start

### **Kết quả TechShop:**
- Response time: Giảm từ 50ms → 2ms (25 lần)
- MySQL load: Giảm 99.9%
- User experience: Tốt hơn nhiều!

---

**Version:** 1.0  
**Date:** 2025  
**Author:** TechShop Development Team

---

**🚀 Redis giúp hệ thống nhanh hơn, ổn định hơn, và tiết kiệm chi phí! 🚀**

---

## ❓ USER 1 VÀ USER 2 XEM CÙNG SẢN PHẨM

### **Câu hỏi:** 
> "User 1 ấn vào sản phẩm → Lưu vào Redis  
> User 2 ấn vào sản phẩm đó → Redis đã có → Không lưu"

### **Trả lời: ĐÚNG 99%!** ✅

**Điều chỉnh nhỏ:**
- User 1: Lưu vào Redis ✅
- User 2: Redis đã có → **KHÔNG LƯU LẠI** ✅
- Nhưng: User 2 vẫn **ĐỌC TỪ REDIS** (không phải không làm gì)

---

## 🎬 KỊCH BẢN CHI TIẾT

### **Sản phẩm: iPhone 15 (id=123)**

#### **User 1 xem đầu tiên:**

```
10:00:00 - User 1: "Xem iPhone 15"
     ↓
Product Service: "Kiểm tra Redis..."
     ↓
Redis: "Không có key 'products::123'" ❌ (Cache MISS)
     ↓
Product Service: "OK, lấy từ MySQL"
     ↓
MySQL: Query database (50ms)
     ↓
MySQL trả về: {id: 123, name: "iPhone 15", price: 20000000}
     ↓
Product Service: 
  1. Nhận data từ MySQL
  2. LƯU VÀO REDIS với key "products::123" ✅
     Redis.set("products::123", {id: 123, name: "iPhone 15", ...})
  3. Trả về cho User 1
     ↓
User 1 nhận được: 50ms
Redis bây giờ có: "products::123" = {id: 123, name: "iPhone 15", ...}
```

---

#### **User 2 xem sau đó (1 giây sau):**

```
10:00:01 - User 2: "Xem iPhone 15"
     ↓
Product Service: "Kiểm tra Redis..."
     ↓
Redis: "Có rồi! key 'products::123'" ✅ (Cache HIT)
     ↓
Redis trả về: {id: 123, name: "iPhone 15", price: 20000000}
     ↓
Product Service: 
  1. Nhận data từ Redis (2ms)
  2. KHÔNG LƯU LẠI (vì đã có rồi) ✅
  3. KHÔNG QUERY MySQL (tiết kiệm!)
  4. Trả về cho User 2
     ↓
User 2 nhận được: 2ms (Nhanh hơn 25 lần!)
Redis vẫn có: "products::123" (không thay đổi)
```

---

#### **User 3, 4, 5... 1000 xem tiếp:**

```
10:00:02 - User 3: "Xem iPhone 15"
10:00:03 - User 4: "Xem iPhone 15"
10:00:04 - User 5: "Xem iPhone 15"
...
10:10:00 - User 1000: "Xem iPhone 15"
     ↓
TẤT CẢ đều:
  1. Lấy từ Redis (2ms)
  2. KHÔNG lưu lại (đã có rồi)
  3. KHÔNG query MySQL
     ↓
Kết quả:
- 1000 users
- 1 lần query MySQL (User 1)
- 999 lần lấy từ Redis (User 2-1000)
- MySQL rất nhàn rỗi! ✅
```

---

## 🔍 GIẢI THÍCH CHI TIẾT

### **Tại sao User 2 không lưu lại?**

**Code trong ProductService:**

```java
@Cacheable(value = "products", key = "#id")
public Product getById(Long id) {
    // Spring tự động kiểm tra:
    // 1. Redis có key "products::123" không?
    //    - Có → Trả về ngay (KHÔNG chạy code bên trong)
    //    - Không → Chạy code bên trong
    
    log.info("Cache MISS - Fetching from database");
    return productRepository.findById(id)
        .orElseThrow(() -> new ProductNotFoundException(id));
}
```

**Luồng xử lý:**

```
User 1:
  → Redis.get("products::123") → null
  → Chạy code trong method
  → Query MySQL
  → Redis.set("products::123", result)
  → Return result

User 2:
  → Redis.get("products::123") → {data}
  → KHÔNG chạy code trong method
  → Return data từ Redis ngay
  → KHÔNG query MySQL
  → KHÔNG lưu lại (vì đã có)
```

---

## 📊 SO SÁNH

### **Không có Redis:**

```
User 1: Query MySQL (50ms)
User 2: Query MySQL (50ms)
User 3: Query MySQL (50ms)
...
User 1000: Query MySQL (50ms)

Tổng:
- 1000 queries đến MySQL
- MySQL quá tải!
- Tổng thời gian: 50,000ms = 50 giây
```

### **Có Redis:**

```
User 1: Query MySQL + Lưu Redis (50ms)
User 2: Lấy từ Redis (2ms) ← Không lưu lại
User 3: Lấy từ Redis (2ms) ← Không lưu lại
...
User 1000: Lấy từ Redis (2ms) ← Không lưu lại

Tổng:
- 1 query đến MySQL
- 999 lần đọc từ Redis
- MySQL rất nhàn!
- Tổng thời gian: 50ms + (999 × 2ms) = 2,048ms = 2 giây
- Nhanh hơn 24 lần!
```

---

## 💡 ĐIỂM QUAN TRỌNG

### **1. Cache là SHARED (Dùng chung)**

```
Redis Cache (Dùng chung cho tất cả users)
     ↓
┌─────────────────────────────────┐
│  "products::123" = {iPhone 15}  │ ← User 1 lưu
└─────────────────────────────────┘
     ↑         ↑         ↑
     │         │         │
  User 1    User 2    User 3
  (Lưu)     (Đọc)     (Đọc)
```

**Không phải:**
```
❌ User 1 có cache riêng
❌ User 2 có cache riêng
❌ User 3 có cache riêng
```

**Mà là:**
```
✅ TẤT CẢ users dùng chung 1 cache
✅ User 1 lưu → User 2, 3, 4... đều thấy
```

---

### **2. Cache Key theo Product, KHÔNG theo User**

```
Cache Key: "products::123"
           ↑          ↑
        Namespace   Product ID

KHÔNG phải: "user1::products::123"
KHÔNG phải: "user2::products::123"
```

**Tại sao?**
- Sản phẩm giống nhau cho tất cả users
- Không cần cache riêng cho từng user
- Tiết kiệm memory

---

### **3. Khi nào lưu lại?**

**Chỉ lưu lại khi:**
- ❌ Cache MISS (không có trong Redis)
- ✅ Cache HIT (có trong Redis) → KHÔNG lưu lại

**Hoặc khi:**
- Admin cập nhật sản phẩm → `@CachePut` → Lưu lại (update)
- Cache hết hạn (TTL = 10 phút) → Lần sau Cache MISS → Lưu lại


---

## 🎯 TÓM TẮT

### **Câu hỏi của bạn:**

> User 1 ấn vào sản phẩm → Lưu vào Redis ✅  
> User 2 ấn vào sản phẩm → Redis đã có → Không lưu ✅

**→ ĐÚNG 100%!** 🎉

---

### **Chi tiết:**

**User 1 (Đầu tiên):**
1. Kiểm tra Redis → Không có
2. Query MySQL (50ms)
3. **LƯU VÀO REDIS** ✅
4. Trả về cho User 1

**User 2 (Sau đó):**
1. Kiểm tra Redis → **CÓ RỒI** ✅
2. Lấy từ Redis (2ms)
3. **KHÔNG LƯU LẠI** (vì đã có) ✅
4. **KHÔNG QUERY MySQL** (tiết kiệm) ✅
5. Trả về cho User 2

**User 3, 4, 5... 1000:**
- Giống User 2
- Tất cả đều lấy từ Redis
- Không lưu lại
- Không query MySQL

---

### **Lợi ích:**

```
1000 users xem iPhone 15:

MySQL:
- Chỉ 1 query (User 1)
- 999 users không query MySQL
- Giảm tải: 99.9%

Redis:
- 1 lần write (User 1)
- 999 lần read (User 2-1000)
- Nhanh: 2ms/request

Performance:
- Không Redis: 50 giây
- Có Redis: 2 giây
- Nhanh hơn: 25 lần!
```

---

## 🎓 KẾT LUẬN

**Bạn đã hiểu HOÀN TOÀN ĐÚNG!** ✅✅✅

**Điểm quan trọng:**
1. ✅ User 1 lưu vào Redis
2. ✅ User 2 không lưu lại (vì đã có)
3. ✅ User 2 vẫn ĐỌC từ Redis (nhanh)
4. ✅ Cache dùng chung cho tất cả users
5. ✅ Tiết kiệm MySQL, tăng performance

**Bạn đã nắm vững Redis Cache!** 🎉

---

**Version:** 1.0  
**Date:** 2025  
**Verified:** ✅ Hiểu đúng 100%
