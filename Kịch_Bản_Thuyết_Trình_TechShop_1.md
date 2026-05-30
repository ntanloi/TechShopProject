# 🎤 Kịch Bản Thuyết Trình — Nền Tảng TechShop
**Thời lượng:** 12–15 phút | **Nhóm:** Beta5 | **Ngày:** 20/05/2026

---

## ⏱️ Phân Bổ Thời Gian Tổng Quan

| Phần | Nội dung | Thời gian |
|------|----------|-----------|
| 1 | Mở đầu & Tổng quan hệ thống | 1–2 phút |
| 2 | Kiến trúc Microservices | 2–3 phút |
| 3 | Các tính năng kỹ thuật nổi bật | 3–4 phút |
| 4 | Demo trực tiếp | 2–3 phút |
| 5 | Bảo mật & Chất lượng | 1 phút |
| 6 | Kết luận & Định hướng tương lai | 1 phút |
| 7 | Q&A | 2–3 phút |

---

## 📌 PHẦN 1 — MỞ ĐẦU & TỔNG QUAN *(~2 phút | Slide 1, 3)*

> **[Slide 1 — Trang tiêu đề]**

"Xin chào thầy/cô và các bạn! Nhóm Beta5 chúng em xin trình bày đồ án **Nền Tảng Thương Mại Điện Tử TechShop** — một hệ thống bán thiết bị điện tử xây dựng hoàn toàn trên kiến trúc **Microservices** với Spring Boot và React."

> **[Chuyển sang Slide 3 — Tổng quan hệ thống]**

"Để mở đầu, nhóm em muốn các bạn hình dung quy mô của hệ thống này:

- **10 Microservices** hoạt động độc lập, liên kết lỏng lẻo với nhau
- **Frontend React 18** kết hợp **Backend Java 21** với Spring Boot
- Toàn bộ được đóng gói trong **hơn 20 Docker Container**, điều phối bằng Docker Compose
- Tích hợp 3 dịch vụ bên ngoài: **VNPay** cho thanh toán, **Cloudinary** lưu trữ hình ảnh, và **Email SMTP** cho thông báo

Đây không chỉ là một website bán hàng đơn giản — đây là một **hệ thống phân tán thực thụ** mà các doanh nghiệp lớn đang sử dụng trong thực tế."

---

## 📌 PHẦN 2 — KIẾN TRÚC MICROSERVICES *(~2–3 phút | Slide 4, 5, 6, 7)*

> **[Slide 4 — Kiến trúc Microservices]**

"Tại sao chúng em chọn Microservices thay vì Monolithic truyền thống? Có 3 lý do cốt lõi:

Thứ nhất là **khả năng mở rộng** — chúng em có thể scale riêng từng service. Ví dụ vào mùa sale, chỉ cần tăng Product Service lên 3 instances mà không cần đụng đến các service khác.

Thứ hai là **chịu lỗi** — nếu AI Service bị lỗi, hệ thống vẫn tiếp tục hoạt động bình thường. Người dùng chỉ mất tính năng gợi ý sản phẩm, không mất khả năng mua hàng.

Thứ ba là **độc lập triển khai** — mỗi service có database riêng, pipeline CI/CD riêng."

"Nhìn vào bảng này, chúng em có **9 backend services** chạy trên các cổng từ 8081 đến 8089:
- User Service xử lý xác thực JWT và BCrypt
- Product Service tích hợp Redis cache và Cloudinary
- Payment Service tích hợp VNPay
- AI Service cung cấp chatbot và gợi ý sản phẩm bằng Gemini API"

> **[Slide 6 — Sơ đồ C4 Container]**

"Luồng hoạt động của hệ thống rất rõ ràng: **React Frontend → API Gateway → các Microservices → Database riêng**. Điểm quan trọng là **API Gateway** là điểm vào duy nhất — mọi request đều phải đi qua đây, giúp kiểm soát tập trung về xác thực, rate limiting và routing."

> **[Slide 7 — Triển khai Docker]**

"Toàn bộ hệ thống chạy trên một Docker Host với hơn 20 container. 7 MySQL databases độc lập — mỗi service một DB, đúng với pattern **Database per Service**. Tất cả kết nối qua một Bridge Network nội bộ."

---

## 📌 PHẦN 3 — CÁC TÍNH NĂNG KỸ THUẬT NỔI BẬT *(~3–4 phút | Slide 8, 9, 10, 11)*

> **[Slide 8 — Redis Caching]**

"Một trong những điểm em tự hào nhất là chiến lược **Redis Caching**. Khi lần đầu user load trang chi tiết sản phẩm, hệ thống query MySQL mất khoảng **150ms**. Từ lần thứ 2 trở đi, dữ liệu được lấy từ Redis cache chỉ trong **15ms** — **nhanh gấp 10 lần**.

Chúng em dùng 3 annotation của Spring Cache:
- `@Cacheable` — lưu kết quả vào cache lần đầu gọi
- `@CacheEvict` — xóa cache khi dữ liệu thay đổi
- `@CachePut` — cập nhật cache và luôn thực thi hàm

TTL là 10 phút, đủ để giảm tải mà không bị stale data."

> **[Slide 9 — Fault Tolerance & Rate Limiting]**

"Về khả năng **chịu lỗi**, chúng em triển khai 2 cơ chế:

**Rate Limiting** hoạt động ở 2 cấp:
- Server: 100 requests/phút mỗi IP — dùng Redis sliding window
- Client: 20 requests/phút mỗi endpoint — ngăn chặn lạm dụng API
Khi vượt ngưỡng, hệ thống trả về HTTP 429.

**Retry Pattern** với Resilience4j: tối đa 3 lần thử lại, backoff theo cấp số nhân — 3 giây, rồi 6 giây, rồi 10 giây. Điều này giúp hệ thống tự phục hồi khi gặp lỗi tạm thời."

> **[Slide 10 — Scale ngang]**

"Scale ngang cực kỳ đơn giản với lệnh:
```
docker-compose --scale product-service=3
```
Ba instances tự động đăng ký với **Eureka Discovery**, và API Gateway phân phối load theo kiểu Round-robin mà không cần cấu hình thêm gì."

> **[Slide 11 — CI/CD Pipeline]**

"Về DevOps, chúng em xây dựng pipeline đầy đủ trên **GitLab CI/CD**, bao gồm 4 stage: Build → Test → Docker Build → Deploy. Ngoài ra còn có cả Jenkinsfile cho những ai dùng Jenkins.

Mỗi khi push code lên nhánh main hoặc develop, pipeline tự động chạy — giảm thiểu hoàn toàn công đoạn deploy thủ công."

---

## 📌 PHẦN 4 — DEMO TRỰC TIẾP *(~2–3 phút | Slide 15)*

> **[Slide 15 — Demo Scenarios]**

"Bây giờ nhóm em sẽ demo **3 trong 5 kịch bản** để tiết kiệm thời gian:"

**Demo 1 — Redis Cache** *(~45 giây)*
"Em sẽ mở DevTools Network, vào trang chi tiết sản phẩm. Lần đầu các bạn thấy response time khoảng 150ms — đây là **Cache MISS**, hệ thống phải query MySQL. Bây giờ em F5 lại... thấy không, chỉ còn **15ms** — đây là **Cache HIT** từ Redis."

**Demo 2 — Rate Limiting** *(~45 giây)*
"Em chạy script gửi 110 requests liên tiếp. 100 requests đầu trả về 200 OK bình thường. Từ request thứ 101, các bạn thấy lỗi **HTTP 429 Too Many Requests** — hệ thống đã kích hoạt Rate Limiter."

**Demo 3 — Horizontal Scaling** *(~45 giây)*
"Em chạy lệnh scale product-service lên 3 instances. Mở Eureka Dashboard — các bạn thấy 3 instances đã đăng ký. Eureka Dashboard ở cổng 8761 hiển thị real-time."

---

## 📌 PHẦN 5 — BẢO MẬT & CHẤT LƯỢNG *(~1 phút | Slide 14, 16)*

> **[Slide 14 — Bảo mật]**

"Về bảo mật, hệ thống có 5 lớp bảo vệ:
- **JWT** stateless — User Service phát hành, API Gateway xác thực
- **Rate Limiting** ngăn brute-force và DDoS
- **CORS** chính xác cho React SPA
- **Bean Validation** + DTO pattern ở mọi request
- **BCrypt** strength 12 — mỗi user một salt riêng, tuyệt đối không lưu plaintext"

---

## 📌 PHẦN 6 — KẾT LUẬN & ĐỊNH HƯỚNG *(~1 phút | Slide 17, 18)*

> **[Slide 17 — Lộ trình tương lai]**

"Hệ thống hiện tại đã hoàn chỉnh nhưng vẫn còn nhiều hướng phát triển:

Gần nhất là thay Docker Compose bằng **Kubernetes** để có auto-scaling thực sự. Tiếp theo là **Kafka** cho Event-driven architecture — hiện tại các service gọi nhau synchronous, Kafka sẽ giúp async hóa. Và **ELK Stack** cho centralized logging — rất cần thiết khi hệ thống phân tán."

> **[Slide 18 — Q&A]**

"Tóm lại, TechShop là một hệ thống phân tán đầy đủ với **10 services, 20+ containers, 7 MySQL databases**, tích hợp Redis cache, Rate Limiting, CI/CD Pipeline và AI Chatbot. Nhóm em xin kết thúc phần trình bày. Cảm ơn thầy/cô và các bạn đã lắng nghe — chúng em xin mời có câu hỏi!"

---

## 💡 GỢI Ý CÂU HỎI THƯỜNG GẶP & TRẢ LỜI

**Q: Tại sao dùng Microservices cho một dự án học thuật? Có phức tạp quá không?**
> "Mục tiêu của nhóm là thực hành kiến trúc thực tế mà doanh nghiệp đang dùng. Độ phức tạp có tăng nhưng bù lại chúng em học được rất nhiều về Docker, CI/CD, và distributed systems — những kỹ năng có giá trị thực tế cao."

**Q: Nếu service A cần dữ liệu từ service B, xử lý thế nào?**
> "Chúng em dùng **Feign Client** — là HTTP client khai báo của Spring Cloud. Ví dụ Cart Service gọi sang Product Service để lấy thông tin sản phẩm qua Feign Client, có fallback xử lý khi Product Service không phản hồi."

**Q: Database per Service thì làm sao JOIN dữ liệu?**
> "Đây là trade-off của Microservices. Chúng em không JOIN trực tiếp qua DB mà thực hiện **API composition** — gọi nhiều service rồi aggregate dữ liệu ở application layer, hoặc cache dữ liệu cần thiết."

**Q: AI Service hoạt động thế nào?**
> "AI Service tích hợp **Gemini API** của Google. Service này có hai chức năng: Chatbot tư vấn sản phẩm và gợi ý sản phẩm dựa trên lịch sử đơn hàng và danh mục. Nó gọi sang Product Service và Order Service qua Feign Client để lấy context trước khi query Gemini."

**Q: Sao không dùng Kubernetes ngay từ đầu?**
> "Docker Compose phù hợp hơn cho môi trường development và học tập — dễ setup, dễ debug. Kubernetes là bước tiếp theo khi deploy production. Chúng em đã thiết kế sẵn với hướng migrate lên K8s trong lộ trình."

---

## 📝 LƯU Ý KHI THUYẾT TRÌNH

- **Giữ nhịp** — Mỗi slide không quá 90 giây, tránh đọc text trên slide
- **Demo** — Chuẩn bị sẵn terminal + browser, test trước 30 phút
- **Số liệu** — Nhớ kỹ: 10 services, 20+ containers, 7 DB, 15ms cache, 90% giảm tải DB, 100 req/min limit
- **Chuyển tiếp** — Dùng câu dẫn giữa các phần để tạo flow tự nhiên
- **Tự tin** — Bạn đã xây dựng hệ thống này, bạn là người hiểu rõ nhất!
