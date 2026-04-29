# 📚 COMMON-LIB DOCUMENTATION INDEX

## 🎯 BẮT ĐẦU TỪ ĐÂY

### **Cho Developer/AI mới:**
1. **CLOUDINARY_SETUP.md** ← Đọc đầu tiên (Quick start 3 bước)
2. **README.md** ← Đọc tiếp (Chi tiết đầy đủ)
3. **AI_INSTRUCTIONS.md** ← Checklist & code template

### **Cho Team Lead:**
- **USAGE_GUIDE.txt** ← Tổng quan ngắn gọn

---

## 📁 CẤU TRÚC FILES

```
common-lib/
├── INDEX.md                        ← BẠN ĐANG Ở ĐÂY
├── CLOUDINARY_SETUP.md            ← ⭐ Quick start (3 bước)
├── README.md                       ← Chi tiết đầy đủ
├── AI_INSTRUCTIONS.md             ← Checklist cho AI
├── USAGE_GUIDE.txt                ← Tổng quan
├── application-template.yml       ← Template config
├── pom.xml                        ← Maven config
└── src/main/java/com/techshop/common/
    ├── config/
    │   └── CloudinaryConfig.java  ← Cloudinary Bean config
    └── service/
        └── CloudinaryService.java ← Upload/Delete service
```

---

## 🚀 QUICK LINKS

### **Tôi muốn...**

**...bắt đầu nhanh:**
→ Đọc `CLOUDINARY_SETUP.md`

**...hiểu chi tiết:**
→ Đọc `README.md`

**...xem code mẫu:**
→ Đọc `AI_INSTRUCTIONS.md` (phần CODE TEMPLATE)

**...biết services nào cần Cloudinary:**
→ Đọc `USAGE_GUIDE.txt`

**...lấy config template:**
→ Copy `application-template.yml`

---

## 📖 NỘI DUNG TỪNG FILE

### 1. **CLOUDINARY_SETUP.md** (⭐ Đọc đầu tiên)
- Quick start 3 bước
- Lấy Cloudinary credentials
- Services cần dùng
- Lưu ý quan trọng

### 2. **README.md** (Chi tiết)
- Cài đặt đầy đủ
- API methods
- Validation rules
- Folder structure
- Environment variables
- Security notes

### 3. **AI_INSTRUCTIONS.md** (Cho AI)
- Checklist từng bước
- Code template đầy đủ
- Folder names
- Error handling
- Debugging tips

### 4. **USAGE_GUIDE.txt** (Tổng quan)
- Hướng dẫn ngắn gọn
- Quick commands
- Services cần Cloudinary
- Lưu ý quan trọng

### 5. **application-template.yml** (Config)
- Template config Cloudinary
- Copy thành `application-local.yml`
- Điền credentials

---

## 🎯 USE CASES

### **Case 1: Tôi là developer mới, cần implement Cloudinary cho Product Service**
```
1. Đọc CLOUDINARY_SETUP.md (3 phút)
2. Follow 3 bước trong đó
3. Done!
```

### **Case 2: Tôi là AI, được yêu cầu thêm Cloudinary vào User Service**
```
1. Đọc AI_INSTRUCTIONS.md
2. Follow checklist
3. Copy code template
4. Customize cho User Service
```

### **Case 3: Tôi muốn hiểu sâu về CloudinaryService**
```
1. Đọc README.md (phần API Methods)
2. Xem code CloudinaryService.java
3. Xem code mẫu trong AI_INSTRUCTIONS.md
```

### **Case 4: Tôi gặp lỗi khi upload ảnh**
```
1. Đọc AI_INSTRUCTIONS.md (phần DEBUGGING)
2. Check config trong application-local.yml
3. Check @ComponentScan
```

---

## ⚡ QUICK COMMANDS

### Build common-lib
```bash
cd techshop-microservice/common-lib
mvn clean install
```

### Thêm vào service
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.techshop</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Config Cloudinary
```yaml
# application-local.yml
cloudinary:
  cloud-name: your-cloud-name
  api-key: your-api-key
  api-secret: your-api-secret
```

---

## 🔑 CLOUDINARY CREDENTIALS

**Lấy tại:** https://cloudinary.com/console

**Cần 3 thông tin:**
- Cloud name
- API Key
- API Secret

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. ❌ **KHÔNG commit** file `application-local.yml`
2. ✅ Dùng `application-template.yml` làm mẫu
3. ✅ Mỗi developer tự tạo config riêng
4. ✅ Build common-lib trước khi dùng

---

## 📞 HỖ TRỢ

**Gặp vấn đề?**
1. Đọc phần DEBUGGING trong `AI_INSTRUCTIONS.md`
2. Check `.gitignore` đã có `application-local.yml` chưa
3. Check common-lib đã build chưa (`mvn clean install`)

---

## 🎉 DONE!

Bây giờ bạn đã biết:
- ✅ File nào đọc trước
- ✅ Cách bắt đầu nhanh
- ✅ Cách tìm thông tin chi tiết
- ✅ Cách debug khi gặp lỗi

**Happy coding! 🚀**
