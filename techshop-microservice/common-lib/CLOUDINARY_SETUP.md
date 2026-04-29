# 🚀 HƯỚNG DẪN SETUP CLOUDINARY - NHANH

## 📌 Cho AI/Developer mới

**Đọc file chi tiết:** `common-lib/README.md`

---

## ⚡ QUICK START (3 bước)

### **Bước 1: Build common-lib**
```bash
cd techshop-microservice/common-lib
mvn clean install
```

### **Bước 2: Thêm vào service cần dùng**

**Ví dụ: Product Service**

**File:** `product-service/pom.xml`
```xml
<dependency>
    <groupId>com.techshop</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

**File:** `product-service/src/main/resources/application-local.yml`
```yaml
cloudinary:
  cloud-name: your-cloud-name
  api-key: your-api-key
  api-secret: your-api-secret
```

**File:** `ProductServiceApplication.java`
```java
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.techshop.productservice",
    "com.techshop.common"  // ← Thêm dòng này
})
public class ProductServiceApplication {
    // ...
}
```

### **Bước 3: Sử dụng trong Controller**

```java
@RestController
@RequiredArgsConstructor
public class ProductController {
    
    private final CloudinaryService cloudinaryService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> create(
            @RequestPart("product") ProductRequest request,
            @RequestPart("image") MultipartFile image
    ) throws IOException {
        
        // Upload ảnh lên Cloudinary
        String imageUrl = cloudinaryService.uploadImage(image, "products");
        request.setImageUrl(imageUrl);
        
        Product product = productService.create(request);
        return ResponseEntity.ok(product);
    }
}
```

---

## 🎯 Services cần dùng Cloudinary

- ✅ **Product Service** - Upload ảnh sản phẩm & danh mục
- ✅ **User Service** - Upload avatar
- ⚠️ **Review Service** - Upload ảnh review (optional)

---

## 🔑 Lấy Cloudinary Credentials

1. Truy cập: https://cloudinary.com/console
2. Đăng ký/Đăng nhập
3. Copy: Cloud name, API Key, API Secret
4. Paste vào `application-local.yml`

---

## ⚠️ LƯU Ý

- ❌ **KHÔNG commit** file `application-local.yml` (đã có trong .gitignore)
- ✅ Dùng file `application-template.yml` làm mẫu
- ✅ Mỗi developer tự tạo `application-local.yml` riêng

---

## 📚 Đọc thêm

- Chi tiết: `common-lib/README.md`
- API Methods: `CloudinaryService.java`
- Config: `CloudinaryConfig.java`
