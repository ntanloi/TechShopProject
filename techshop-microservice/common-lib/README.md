# TechShop Common Library

Thư viện chung cho tất cả microservices trong TechShop project.

## 📦 Cài đặt

### Bước 1: Build common-lib
```bash
cd techshop-microservice/common-lib
mvn clean install
```

### Bước 2: Thêm dependency vào service cần dùng

Ví dụ trong `product-service/pom.xml`:

```xml
<dependency>
    <groupId>com.techshop</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Bước 3: Thêm config Cloudinary vào `application.yml`

```yaml
cloudinary:
  cloud-name: your-cloud-name
  api-key: your-api-key
  api-secret: your-api-secret
```

**Lấy credentials từ:** https://cloudinary.com/console

### Bước 4: Enable component scan

Trong `Application.java` của service:

```java
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.techshop.productservice",  // Package của service
    "com.techshop.common"            // Package của common-lib
})
public class ProductServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
```

## 🚀 Sử dụng CloudinaryService

### Upload ảnh trong Controller

```java
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final CloudinaryService cloudinaryService;
    private final ProductService productService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Product> create(
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        
        // Upload image to Cloudinary (vào Home/techshop/)
        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(image, null);
            request.setImageUrl(imageUrl);
        }
        
        Product product = productService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(
            @PathVariable Long id,
            @RequestPart("product") ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ) throws IOException {
        
        Product existing = productService.getById(id);
        
        // Upload new image and delete old one
        if (image != null && !image.isEmpty()) {
            // Delete old image
            if (existing.getImageUrl() != null) {
                cloudinaryService.deleteImage(existing.getImageUrl());
            }
            
            // Upload new image
            String imageUrl = cloudinaryService.uploadImage(image, null);
            request.setImageUrl(imageUrl);
        }
        
        Product updated = productService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        Product product = productService.getById(id);
        
        // Delete image from Cloudinary
        if (product.getImageUrl() != null) {
            cloudinaryService.deleteImage(product.getImageUrl());
        }
        
        productService.delete(id);
        return ResponseEntity.ok("Đã xóa sản phẩm");
    }
}
```

### Upload nhiều ảnh

```java
@PostMapping("/upload-multiple")
public ResponseEntity<String[]> uploadMultiple(
        @RequestParam("images") MultipartFile[] images
) throws IOException {
    String[] urls = cloudinaryService.uploadImages(images, null);
    return ResponseEntity.ok(urls);
}
```

## 📁 Folder trong Cloudinary

**Tất cả ảnh sẽ được upload vào:** `Home/techshop/`

```
Home/
└── techshop/
    ├── product-image-1.jpg
    ├── category-image-2.jpg
    ├── user-avatar-3.jpg
    └── ...
```

**Không có subfolder** - Tất cả ảnh nằm chung trong `techshop/`

## 🔧 API Methods

### `uploadImage(MultipartFile file, String folder)`
- Upload 1 ảnh
- **Params:**
  - `file`: File ảnh từ request
  - `folder`: Tên folder (products, categories, users, reviews)
- **Returns:** URL của ảnh
- **Throws:** IOException nếu upload fail

### `deleteImage(String imageUrl)`
- Xóa ảnh từ Cloudinary
- **Params:**
  - `imageUrl`: Full URL của ảnh
- **Returns:** void
- **Note:** Không throw exception, chỉ log error

### `uploadImages(MultipartFile[] files, String folder)`
- Upload nhiều ảnh cùng lúc
- **Returns:** Array of URLs

## ⚙️ Validation

CloudinaryService tự động validate:
- ✅ File không được null/empty
- ✅ File phải là ảnh (jpg, png, gif, etc.)
- ✅ Kích thước tối đa 5MB
- ✅ Auto optimize quality
- ✅ Auto convert format

## 🌍 Environment Variables (Production)

Thay vì hardcode trong `application.yml`, dùng environment variables:

```yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
```

Rồi set trong Docker/Kubernetes:
```bash
export CLOUDINARY_CLOUD_NAME=your-cloud-name
export CLOUDINARY_API_KEY=your-api-key
export CLOUDINARY_API_SECRET=your-api-secret
```

## 📝 Services cần dùng Cloudinary

1. ✅ **Product Service** - Upload ảnh sản phẩm
2. ✅ **Category Service** - Upload ảnh danh mục (trong Product Service)
3. ✅ **User Service** - Upload avatar
4. ✅ **Review Service** - Upload ảnh review (optional)

## 🔐 Security Notes

- ⚠️ **KHÔNG commit** Cloudinary credentials vào Git
- ✅ Thêm vào `.gitignore`: `application-local.yml`
- ✅ Dùng environment variables cho production
- ✅ Rotate API keys định kỳ
