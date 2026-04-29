# 🤖 HƯỚNG DẪN CHO AI

## 📋 Khi được yêu cầu implement Cloudinary cho 1 service

### ✅ CHECKLIST

**Bước 1: Đọc documentation**
- [ ] Đọc `common-lib/README.md` - Hướng dẫn chi tiết
- [ ] Đọc `CLOUDINARY_SETUP.md` - Quick start
- [ ] Xem code mẫu trong `CloudinaryService.java`

**Bước 2: Kiểm tra service**
- [ ] Service này có cần upload ảnh không?
  - Product Service → CÓ (ảnh sản phẩm, danh mục)
  - User Service → CÓ (avatar)
  - Review Service → TÙY CHỌN (ảnh review)
  - Các service khác → KHÔNG

**Bước 3: Thêm dependency**
- [ ] Thêm vào `pom.xml`:
```xml
<dependency>
    <groupId>com.techshop</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

**Bước 4: Thêm config**
- [ ] Tạo file `src/main/resources/application-local.yml`
- [ ] Copy từ `application-template.yml`
- [ ] Điền Cloudinary credentials

**Bước 5: Enable component scan**
- [ ] Sửa `Application.java`:
```java
@ComponentScan(basePackages = {
    "com.techshop.xxxservice",  // Package của service
    "com.techshop.common"        // Package của common-lib
})
```

**Bước 6: Update Controller**
- [ ] Inject `CloudinaryService`
- [ ] Thêm `@RequestPart("image") MultipartFile image`
- [ ] Gọi `cloudinaryService.uploadImage(image, "folder-name")`
- [ ] Set imageUrl vào request/entity

**Bước 7: Handle delete**
- [ ] Khi xóa entity, gọi `cloudinaryService.deleteImage(imageUrl)`

---

## 📝 CODE TEMPLATE

### Controller với upload ảnh

```java
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final CloudinaryService cloudinaryService;
    private final ProductService productService;

    // CREATE với ảnh
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> create(
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        
        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image, null);
            request.setImageUrl(imageUrl);
        }
        
        Product product = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    // UPDATE với ảnh mới
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        
        Product existing = productService.getById(id);
        
        if (image != null && !image.isEmpty()) {
            // Xóa ảnh cũ
            if (existing.getImageUrl() != null) {
                cloudinaryService.deleteImage(existing.getImageUrl());
            }
            
            // Upload ảnh mới
            String imageUrl = cloudinaryService.uploadImage(image, null);
            request.setImageUrl(imageUrl);
        }
        
        Product updated = productService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    // DELETE - xóa cả ảnh
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        Product product = productService.getById(id);
        
        // Xóa ảnh từ Cloudinary
        if (product.getImageUrl() != null) {
            cloudinaryService.deleteImage(product.getImageUrl());
        }
        
        productService.delete(id);
        return ResponseEntity.ok("Đã xóa sản phẩm");
    }
}
```

---

## 🎯 FOLDER

**Tất cả ảnh upload vào:** `Home/techshop/`

**Không cần truyền folder name** - Chỉ cần:
```java
cloudinaryService.uploadImage(file, null);
```

Hoặc truyền bất kỳ string nào (sẽ bị ignore):
```java
cloudinaryService.uploadImage(file, "anything");  // "anything" bị ignore
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Validation tự động:**
   - CloudinaryService đã validate file type, size
   - Không cần validate lại trong Controller

2. **Error handling:**
   - `uploadImage()` throws IOException
   - Controller phải handle hoặc throws

3. **Delete gracefully:**
   - `deleteImage()` không throw exception
   - Chỉ log error nếu fail
   - Không làm fail request delete entity

4. **Optional image:**
   - Dùng `required = false` cho @RequestPart
   - Check `image != null && !image.isEmpty()`

5. **Update image:**
   - Luôn xóa ảnh cũ trước khi upload ảnh mới
   - Tránh rác trên Cloudinary

---

## 🔍 DEBUGGING

Nếu gặp lỗi:

1. **Bean not found:**
   - Check `@ComponentScan` có `"com.techshop.common"` chưa

2. **Config not found:**
   - Check file `application-local.yml` có đúng vị trí không
   - Check credentials có đúng không

3. **Upload fail:**
   - Check file có phải ảnh không
   - Check file size < 5MB
   - Check Cloudinary credentials

4. **Delete fail:**
   - Không quan trọng, chỉ log warning
   - Không làm fail request

---

## 📚 REFERENCES

- Cloudinary Java SDK: https://cloudinary.com/documentation/java_integration
- Spring MultipartFile: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/multipart/MultipartFile.html
