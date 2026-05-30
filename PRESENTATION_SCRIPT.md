# KỊCH BẢN THUYẾT TRÌNH TECHSHOP E-COMMERCE PLATFORM
## Thời gian: 10-15 phút

---

## **SLIDE 1: TITLE (30 giây)**

**Kịch bản:**
> "Xin chào thầy/cô và các bạn. Hôm nay nhóm em xin phép được trình bày về đồ án **TechShop E-Commerce Platform** - một nền tảng thương mại điện tử được xây dựng theo kiến trúc Microservices với Spring Boot và React.
>
> Đây là sản phẩm của nhóm [TÊN NHÓM], được thực hiện trong [THỜI GIAN]. Em xin phép bắt đầu bài thuyết trình."

**Lưu ý:** Nói tự tin, rõ ràng, tạo ấn tượng ban đầu tốt.

---

## **SLIDE 2: SYSTEM OVERVIEW (1 phút)**

**Kịch bản:**
> "Đầu tiên, em xin giới thiệu tổng quan về hệ thống.
>
> TechShop là một nền tảng thương mại điện tử chuyên về thiết bị điện tử. Hệ thống được thiết kế với **10 microservices độc lập**, giúp tách biệt các chức năng nghiệp vụ và dễ dàng mở rộng.
>
> Về công nghệ, em sử dụng **React 18** cho frontend để tạo giao diện người dùng hiện đại, và **Spring Boot 3.3** cho backend để xử lý logic nghiệp vụ.
>
> Toàn bộ hệ thống được **containerized bằng Docker**, giúp triển khai nhất quán trên mọi môi trường.
>
> Đây là sơ đồ kiến trúc tổng quan của hệ thống [CHỈ VÀO DIAGRAM]."

**Điểm nhấn:** Nhấn mạnh con số 10 microservices và Docker containerization.

---

## **SLIDE 3: ARCHITECTURE STYLE (1.5 phút)**

**Kịch bản:**
> "Vậy tại sao nhóm em lại chọn kiến trúc Microservices?
>
> **Thứ nhất**, Microservices cho phép **mở rộng độc lập** từng service. Ví dụ, khi có nhiều người truy cập sản phẩm, em chỉ cần scale Product Service mà không ảnh hưởng đến các service khác.
>
> **Thứ hai**, nó đảm bảo **fault tolerance** - khi một service gặp lỗi, các service khác vẫn hoạt động bình thường.
>
> **Thứ ba**, các team có thể phát triển và deploy **độc lập**, tăng tốc độ phát triển.
>
> Hệ thống của em bao gồm **10 services chính**: User, Product, Order, Cart, Payment, Notification, Review, Inventory, AI Service, và Rate Limiter Service.
>
> Để quản lý các service này, em sử dụng:
> - **API Gateway** trên port 8080 - điểm vào duy nhất của hệ thống
> - **Eureka Service Discovery** trên port 8761 - tự động phát hiện và đăng ký service
> - **Database per Service pattern** với 7 MySQL databases riêng biệt, đảm bảo tính độc lập về dữ liệu."

**Điểm nhấn:** Giải thích rõ lợi ích của Microservices, không chỉ liệt kê.

---

## **SLIDE 4-5: C4 DIAGRAMS (1 phút - NHANH)**

**Kịch bản:**
> "Để hiểu rõ hơn về kiến trúc, em xin trình bày qua C4 Model.
>
> **[SLIDE 4]** Ở mức Context, hệ thống có 2 actor chính: **Customer** và **Administrator**. Hệ thống tích hợp với các external systems như **VNPay** cho thanh toán, **Cloudinary** cho lưu trữ ảnh, và **Email SMTP** cho thông báo.
>
> **[SLIDE 5]** Ở mức Container, các bạn có thể thấy chi tiết hơn: Frontend React giao tiếp với Gateway, Gateway routing đến các microservices thông qua **lb://service-name**, và mỗi service có database riêng. Đặc biệt, em có thêm **Redis cache** để tối ưu hiệu năng."

**Lưu ý:** Nói nhanh qua 2 slide này, không dừng lâu vì đây là phần lý thuyết.

---

## **SLIDE 6: DEPLOYMENT ARCHITECTURE (45 giây)**

**Kịch bản:**
> "Về deployment, toàn bộ hệ thống chạy trên **Docker** với hơn **20 containers** trong cùng một network.
>
> Em có port mapping rõ ràng: Gateway ở 8080, Eureka ở 8761, các services từ 8081-8089, databases từ 3307-3313, và Redis ở 6379.
>
> Tất cả được orchestrate bằng **Docker Compose**, giúp khởi động toàn bộ hệ thống chỉ với một lệnh."

---

## **SLIDE 7-9: KEY FEATURES (3 phút - PHẦN QUAN TRỌNG NHẤT)**

### **SLIDE 7: Performance Optimization**

**Kịch bản:**
> "Bây giờ em xin trình bày về các tính năng nổi bật của hệ thống.
>
> **Đầu tiên là Performance Optimization với Redis Caching.**
>
> Khi không có cache, mỗi request phải query database, mất khoảng **150ms**. Với Redis cache, thời gian giảm xuống còn **15ms** - giảm **90%** thời gian phản hồi.
>
> Em implement cache cho Product Service với TTL 10 phút, sử dụng các annotation của Spring: `@Cacheable` để lưu cache, `@CacheEvict` để xóa cache khi update, và `@CachePut` để cập nhật cache.
>
> **[NẾU CÓ DEMO]** Em xin phép demo nhanh: Lần đầu truy cập sản phẩm sẽ là Cache MISS, lần thứ hai sẽ là Cache HIT và nhanh hơn rõ rệt."

### **SLIDE 8: Fault Tolerance**

**Kịch bản:**
> "**Thứ hai là Fault Tolerance - khả năng chịu lỗi.**
>
> Em implement **3 cơ chế bảo vệ**:
>
> **1. Rate Limiter ở Server-side**: Giới hạn **100 requests/phút** mỗi IP, sử dụng Redis để tracking. Điều này ngăn chặn DDoS attacks.
>
> **2. Rate Limiter ở Client-side**: Giới hạn **20 requests/phút** cho mỗi endpoint, tránh spam từ người dùng.
>
> **3. Retry Mechanism**: Khi một service gặp lỗi, hệ thống tự động retry **3 lần** với exponential backoff - 3 giây, 6 giây, rồi 10 giây. Điều này giúp xử lý các lỗi tạm thời như network timeout.
>
> **[NẾU CÓ DEMO]** Em có thể demo: Khi tắt một service, request sẽ tự động retry và thành công khi service bật lại."

### **SLIDE 9: Scalability**

**Kịch bản:**
> "**Thứ ba là Horizontal Scalability - khả năng mở rộng ngang.**
>
> Đây là điểm mạnh của Microservices. Khi Product Service quá tải, em có thể scale từ **1 lên 3 instances** chỉ với một lệnh Docker Compose.
>
> Eureka sẽ **tự động phát hiện** các instances mới, và Gateway sẽ **load balance** requests theo thuật toán round-robin.
>
> Em cũng set resource limits: mỗi instance tối đa **1 CPU core** và **1GB RAM**, đảm bảo không chiếm hết tài nguyên server.
>
> **[NẾU CÓ DEMO]** Em có thể demo lệnh: `docker-compose --scale product-service=3` và các bạn sẽ thấy 3 instances xuất hiện trong Eureka Dashboard."

**Điểm nhấn:** Đây là 3 slide QUAN TRỌNG NHẤT - nói chậm, rõ ràng, có số liệu cụ thể.

---

## **SLIDE 10: CI/CD (1 phút)**

**Kịch bản:**
> "Về DevOps, em implement **GitLab CI/CD Pipeline** với 4 stages:
>
> **Build** - compile code và dependencies
> **Test** - chạy JUnit tests cho backend và Vitest cho frontend
> **Docker-Build** - build Docker images và push lên registry
> **Deploy** - tự động deploy lên môi trường dev, và manual deploy lên production để kiểm soát.
>
> Pipeline này đảm bảo code quality và tự động hóa deployment process."

---

## **SLIDE 11: TECHNOLOGY STACK (30 giây - NHANH)**

**Kịch bản:**
> "Về technology stack, em sử dụng:
> - Backend: **Spring Boot 3.3** với **Java 21**
> - Frontend: **React 18** với **Vite** và **TailwindCSS**
> - Database: **MySQL 8.0** - 7 instances
> - Cache: **Redis 7**
> - Service mesh: **Spring Cloud Gateway** và **Netflix Eureka**
> - Containerization: **Docker** và **Docker Compose**
> - CI/CD: **GitLab CI/CD**
>
> Tất cả đều là các công nghệ hiện đại và được sử dụng rộng rãi trong industry."

---

## **SLIDE 12: DESIGN PATTERNS (1 phút)**

**Kịch bản:**
> "Em áp dụng nhiều design patterns trong hệ thống:
>
> - **Database per Service Pattern**: Mỗi service có database riêng, đảm bảo loose coupling
> - **API Gateway Pattern**: Single entry point, xử lý authentication, routing
> - **Service Registry Pattern**: Eureka tự động phát hiện services
> - **Circuit Breaker Pattern**: Sử dụng Resilience4j để ngăn chặn cascading failures
> - **Retry Pattern**: Exponential backoff như em đã trình bày
> - **Cache-Aside Pattern**: Redis cache với lazy loading
>
> Những patterns này giúp hệ thống robust, maintainable và scalable."

---

## **SLIDE 13: SECURITY (45 giây)**

**Kịch bản:**
> "Về security, em implement:
> - **JWT Authentication** cho user authentication
> - **Rate Limiting** ở cả server và client side
> - **CORS configuration** cho React SPA
> - **Input validation** để chống injection attacks
> - **BCrypt password hashing** để bảo mật mật khẩu
>
> Đây là các best practices trong web security."

---

## **SLIDE 14: DEMO SCENARIOS (1 phút - NẾU CÓ THỜI GIAN)**

**Kịch bản:**
> "Em đã chuẩn bị 5 demo scenarios để minh họa các tính năng:
>
> 1. **Redis Cache**: Xem sự khác biệt giữa Cache MISS và Cache HIT
> 2. **Rate Limiter**: Spam 110 requests và nhận 429 Too Many Requests
> 3. **Retry Mechanism**: Tắt service và xem auto retry
> 4. **Scalability**: Scale product-service lên 3 instances
> 5. **CI/CD**: Xem GitLab pipeline execution
>
> **[NẾU THỜI GIAN CHO PHÉP]** Em xin phép demo một trong những scenarios này."

**Lưu ý:** Chỉ demo nếu còn thời gian và tự tin. Nếu không, bỏ qua phần này.

---

## **SLIDE 15: ARCHITECTURE CHARACTERISTICS (45 giây)**

**Kịch bản:**
> "Tổng kết lại, hệ thống của em đạt được các quality attributes sau:
>
> - **Scalability**: Horizontal scaling, load balancing
> - **Availability**: Retry, circuit breaker, health checks
> - **Performance**: Redis cache giảm 90% response time
> - **Fault Tolerance**: Rate limiting, retry mechanism
> - **Maintainability**: Microservices, database per service
> - **Security**: JWT, rate limiting, CORS
>
> Đây là những đặc tính quan trọng của một hệ thống production-ready."

---

## **SLIDE 16: FUTURE IMPROVEMENTS (30 giây)**

**Kịch bản:**
> "Về hướng phát triển, em có một số ý tưởng:
>
> - Migrate sang **Kubernetes** để orchestration tốt hơn
> - Thêm **Message Queue** như Kafka cho async processing
> - Implement **Distributed Tracing** với Zipkin để debug
> - Centralized logging với **ELK stack**
> - Database replication cho high availability
> - **GraphQL API** để giảm over-fetching
> - Nâng cấp AI features với recommendation engine
>
> Đây là những cải tiến để đưa hệ thống lên enterprise level."

---

## **SLIDE 17: Q&A (KẾT THÚC)**

**Kịch bản:**
> "Em xin kết thúc bài thuyết trình tại đây.
>
> Cảm ơn thầy/cô và các bạn đã lắng nghe. Em rất mong nhận được feedback và sẵn sàng trả lời các câu hỏi ạ!"

**Lưu ý:** Nói với thái độ tự tin, mỉm cười, sẵn sàng trả lời câu hỏi.

---

## **TIPS THUYẾT TRÌNH HIỆU QUẢ**

### **1. Quản lý thời gian:**
- **Phần quan trọng nhất**: Slide 7-9 (Key Features) - dành 3 phút
- **Phần có thể nói nhanh**: Slide 4-5 (C4 Diagrams), Slide 11 (Tech Stack)
- **Phần có thể bỏ qua nếu hết giờ**: Slide 14 (Demo), Slide 16 (Future)

### **2. Ngôn ngữ cơ thể:**
- Đứng thẳng, tự tin
- Giao tiếp bằng mắt với giảng viên
- Sử dụng tay để chỉ vào slide khi cần
- Không đọc slide, hãy giải thích

### **3. Giọng nói:**
- Nói rõ ràng, không quá nhanh
- Nhấn mạnh các con số: 90%, 150ms → 15ms, 10 microservices
- Tạm dừng giữa các ý để người nghe tiếp thu

### **4. Xử lý câu hỏi:**
- Lắng nghe kỹ câu hỏi
- Nếu không biết, thành thật nói "Em chưa tìm hiểu sâu về phần này"
- Liên hệ câu trả lời với những gì đã trình bày

### **5. Các câu hỏi có thể gặp:**

**Q: "Tại sao không dùng Monolithic architecture?"**
> "Dạ, với Monolithic, khi cần scale một chức năng, em phải scale toàn bộ ứng dụng, tốn tài nguyên. Còn Microservices cho phép scale từng service độc lập. Ngoài ra, khi một module lỗi trong Monolithic, toàn bộ app có thể down, còn Microservices thì các service khác vẫn hoạt động ạ."

**Q: "Database per service có nhược điểm gì không?"**
> "Dạ có ạ. Nhược điểm chính là khó thực hiện transactions across services và data consistency. Em xử lý bằng cách sử dụng eventual consistency và có thể implement Saga pattern trong tương lai ạ."

**Q: "Redis cache có vấn đề gì khi scale không?"**
> "Dạ, khi scale nhiều instances, cache có thể inconsistent. Em có thể giải quyết bằng Redis Cluster hoặc sử dụng cache invalidation strategy như pub/sub để đồng bộ cache giữa các instances ạ."

**Q: "Tại sao chọn MySQL thay vì NoSQL?"**
> "Dạ, vì dữ liệu e-commerce có quan hệ chặt chẽ (user-order-product) và cần ACID transactions. MySQL phù hợp hơn. Tuy nhiên, em có thể dùng MongoDB cho AI Service hoặc Notification Service trong tương lai ạ."

**Q: "CI/CD pipeline có test coverage bao nhiêu?"**
> "Dạ, hiện tại em có unit tests cho các service chính với coverage khoảng [NÊU CON SỐ NẾU BIẾT]. Em cũng có integration tests cho các API endpoints quan trọng ạ."

---

## **CHECKLIST TRƯỚC KHI THUYẾT TRÌNH**

- [ ] Đọc kịch bản 3-5 lần để thuộc flow
- [ ] Tập thuyết trình với đồng hồ bấm giờ (đảm bảo 10-15 phút)
- [ ] Chuẩn bị demo (nếu có) và test trước
- [ ] Kiểm tra slide không có lỗi chính tả
- [ ] Chuẩn bị backup plan nếu demo fail
- [ ] Mặc trang phục lịch sự
- [ ] Đến sớm 10 phút để setup
- [ ] Mang theo nước uống

---

## **CẤU TRÚC THỜI GIAN TỔNG THỂ (15 PHÚT)**

| Slide | Thời gian | Tích lũy |
|-------|-----------|----------|
| 1. Title | 30s | 0:30 |
| 2. System Overview | 1m | 1:30 |
| 3. Architecture Style | 1m 30s | 3:00 |
| 4-5. C4 Diagrams | 1m | 4:00 |
| 6. Deployment | 45s | 4:45 |
| 7. Performance | 1m | 5:45 |
| 8. Fault Tolerance | 1m | 6:45 |
| 9. Scalability | 1m | 7:45 |
| 10. CI/CD | 1m | 8:45 |
| 11. Tech Stack | 30s | 9:15 |
| 12. Design Patterns | 1m | 10:15 |
| 13. Security | 45s | 11:00 |
| 14. Demo (optional) | 1m | 12:00 |
| 15. Characteristics | 45s | 12:45 |
| 16. Future | 30s | 13:15 |
| 17. Q&A | - | - |
| **Buffer time** | 1m 45s | 15:00 |

---

## **KẾT LUẬN**

Kịch bản này được thiết kế để:
- ✅ Trình bày đầy đủ trong 10-15 phút
- ✅ Nhấn mạnh các điểm mạnh của hệ thống
- ✅ Có số liệu cụ thể, thuyết phục
- ✅ Linh hoạt điều chỉnh theo thời gian
- ✅ Chuẩn bị sẵn câu trả lời cho các câu hỏi thường gặp

**Chúc bạn thuyết trình thành công! 🎉**
