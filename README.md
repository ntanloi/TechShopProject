# 🛒 TechShop — E-Commerce Microservices Platform

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=java" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?style=for-the-badge&logo=springboot" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis" />
  <img src="https://img.shields.io/badge/VNPay-Payment-blue?style=for-the-badge" />
</p>

TechShop là một nền tảng thương mại điện tử được xây dựng theo kiến trúc **Microservices**, gồm backend Java Spring Boot, frontend React và đầy đủ hạ tầng DevOps (Docker, CI/CD, load testing).

---

## 📋 Mục lục

- [Tổng quan kiến trúc](#-tổng-quan-kiến-trúc)
- [Các microservice](#-các-microservice)
- [Tech Stack](#-tech-stack)
- [Tính năng nổi bật](#-tính-năng-nổi-bật)
- [Cấu trúc project](#-cấu-trúc-project)
- [Hướng dẫn chạy](#-hướng-dẫn-chạy)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Load Testing](#-load-testing)
- [Biến môi trường](#-biến-môi-trường)

---

## 🏗 Tổng quan kiến trúc

```
                        ┌─────────────────┐
                        │   React Frontend │
                        │  (Vite + Tailwind)│
                        └────────┬────────┘
                                 │ HTTP
                        ┌────────▼────────┐
                        │  Nginx (Reverse  │
                        │     Proxy)       │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  API Gateway     │  ← JWT Auth + Rate Limiter + Retry
                        │  (Spring Cloud)  │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                   │
   ┌──────────▼──┐   ┌──────────▼──┐   ┌──────────▼──┐
   │ User Service│   │Product Svc  │   │ Order Service│
   └─────────────┘   └─────────────┘   └─────────────┘
              │                  │                   │
   ┌──────────▼──┐   ┌──────────▼──┐   ┌──────────▼──┐
   │ Cart Service│   │Inventory Svc│   │Payment (VNPay│
   └─────────────┘   └─────────────┘   └─────────────┘
              │                  │                   │
   ┌──────────▼──┐   ┌──────────▼──┐   ┌──────────▼──┐
   │Review Service│  │  AI Service  │   │Notification  │
   └─────────────┘   └─────────────┘   └─────────────┘
                                 │
                        ┌────────▼────────┐
                        │ Discovery Service│
                        │  (Eureka Server) │
                        └─────────────────┘
```

---

## 🧩 Các Microservice

| Service | Mô tả | Port |
|---|---|---|
| **gateway-service** | API Gateway — JWT auth, rate limiting, retry, routing | `8080` |
| **discovery-service** | Eureka Server — service registry & discovery | `8761` |
| **user-service** | Đăng ký, đăng nhập, quản lý người dùng (CUSTOMER / ADMIN / STAFF) | `8081` |
| **product-service** | Quản lý sản phẩm, danh mục, Redis caching | `8082` |
| **inventory-service** | Quản lý tồn kho, cập nhật số lượng | `8083` |
| **cart-service** | Giỏ hàng (JWT-secured, liên kết product & inventory) | `8084` |
| **order-service** | Tạo đơn hàng, liên kết payment & notification | `8085` |
| **payment-service** | Tích hợp **VNPay**, xử lý callback thanh toán | `8086` |
| **review-service** | Đánh giá sản phẩm | `8087` |
| **notification-service** | Gửi email xác nhận, WebSocket real-time notification | `8088` |
| **ai-service** | AI Chatbot tư vấn sản phẩm + gợi ý sản phẩm theo đơn hàng | `8089` |

---

## 🛠 Tech Stack

### Backend
- **Java 17** + **Spring Boot 3.x**
- **Spring Cloud Gateway** — routing, filter, rate limiter
- **Spring Cloud Netflix Eureka** — service discovery
- **Spring Security** + **JWT** — authentication & authorization
- **Spring Data JPA** + **PostgreSQL** — persistence
- **Redis** — caching (product service) + rate limiting (gateway)
- **OpenFeign** — inter-service communication với circuit breaker fallback
- **WebSocket** — real-time notifications
- **Cloudinary** — upload & lưu trữ ảnh sản phẩm

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS**
- **Axios** — API client với interceptor
- **Zustand** — state management (cart, notifications)
- **React Router v6**
- Deployed on **Vercel**

### Infrastructure & DevOps
- **Docker** + **Docker Compose** (multi-service orchestration)
- **Nginx** — reverse proxy, static file serving
- **GitHub Actions** — CI/CD pipeline (build, test, deploy)
- **Jenkins** — Jenkinsfile cho pipeline tùy chọn
- **k6** — load testing & performance benchmarking

---

## ✨ Tính năng nổi bật

### 🔐 Bảo mật
- JWT-based authentication trên toàn hệ thống
- Role-based access control: `CUSTOMER`, `ADMIN`, `STAFF`
- Rate limiting tại Gateway (server-side) + client-side throttling

### 🤖 AI
- **Chatbot tư vấn** sản phẩm tích hợp trong giao diện mua sắm
- **Gợi ý sản phẩm** (Recommendation) dựa trên lịch sử đơn hàng
- Fallback circuit breaker khi AI service không khả dụng

### 💳 Thanh toán
- Tích hợp **VNPay** — cổng thanh toán phổ biến tại Việt Nam
- Xử lý callback, cập nhật trạng thái đơn hàng tự động
- Trang kết quả thanh toán real-time

### 📦 Quản lý kho
- Kiểm tra và trừ tồn kho khi đặt hàng
- Admin quản lý inventory trực tiếp trên dashboard

### 🔔 Thông báo
- Email xác nhận đơn hàng tự động
- Real-time notification qua **WebSocket**
- Notification bell component trên frontend

### 📊 Admin Dashboard
- Quản lý người dùng, sản phẩm, danh mục, đơn hàng, kho hàng
- Thống kê tổng quan

---

## 📁 Cấu trúc project

```
TechShopProject/
├── techshop-microservice/          # Toàn bộ backend
│   ├── gateway-service/            # API Gateway
│   ├── discovery-service/          # Eureka Server
│   ├── user-service/               # Auth & User management
│   ├── product-service/            # Products & Categories
│   ├── inventory-service/          # Stock management
│   ├── cart-service/               # Shopping cart
│   ├── order-service/              # Order management
│   ├── payment-service/            # VNPay integration
│   ├── review-service/             # Product reviews
│   ├── notification-service/       # Email & WebSocket
│   ├── ai-service/                 # Chatbot & Recommendations
│   ├── common-lib/                 # Shared utilities (Cloudinary, etc.)
│   └── Dockerfile.*                # Dockerfile riêng cho từng service
│
├── techshop-frontend/              # React frontend
│   ├── src/
│   │   ├── api/                    # Axios API clients
│   │   ├── components/             # NavBar, Footer, ChatBot, ...
│   │   ├── pages/                  # Home, Products, Cart, Checkout, ...
│   │   │   └── admin/              # Dashboard, AdminProducts, ...
│   │   ├── store/                  # Auth context, Cart store, Notifications
│   │   └── utils/                  # Rate limiter
│   └── vercel.json
│
├── nginx/                          # Nginx config
├── redis/                          # Redis config & monitoring scripts
├── k6-tests/                       # Load & performance tests
├── .github/workflows/              # GitHub Actions CI/CD
├── Jenkinsfile                     # Jenkins pipeline
├── docker-compose.yml              # Main compose file
├── docker-compose.ai.yml           # AI service compose
└── docker-compose.scale.yml        # Scale testing compose
```

---

## 🚀 Hướng dẫn chạy

### Yêu cầu
- Docker & Docker Compose
- Java 17+ (nếu chạy local)
- Node.js 18+ (nếu chạy frontend local)

### 1. Clone repository

```bash
git clone https://github.com/<your-username>/TechShopProject.git
cd TechShopProject
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env với các giá trị thực tế
```

### 3. Chạy toàn bộ hệ thống với Docker Compose

```bash
docker-compose up -d
```

### 4. Chạy kèm AI Service

```bash
docker-compose -f docker-compose.yml -f docker-compose.ai.yml up -d
```

### 5. Chạy frontend local (development)

```bash
cd techshop-frontend
npm install
npm run dev
```

### Truy cập

| Dịch vụ | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Eureka Dashboard | http://localhost:8761 |

---

## ⚙️ CI/CD Pipeline

### GitHub Actions

- **`backend-ci.yml`** — Build & test tất cả microservices khi push/PR
- **`backend-cd.yml`** — Build Docker images và deploy

### Jenkins

Jenkinsfile có sẵn cho CI/CD pipeline tùy chỉnh.

---

## 📈 Load Testing

Project tích hợp **k6** để kiểm tra hiệu năng:

```bash
# Test rate limiter phía server
k6 run k6-tests/test-server-rate-limiter.js

# Test rate limiter phía client
k6 run k6-tests/test-client-rate-limiter.js

# Test scalability
k6 run k6-tests/test-scalability.js

# Test Eureka health check
k6 run k6-tests/test-eureka-healthcheck.js

# Test retry mechanism
k6 run k6-tests/retry-test.js
```

Xem thêm: [`k6-tests/README.md`](./k6-tests/README.md)

---

## 🔑 Biến môi trường

Tạo file `.env` từ `.env.example` và điền các giá trị sau:

| Biến | Mô tả |
|---|---|
| `JWT_SECRET` | Secret key cho JWT |
| `VNPAY_TMN_CODE` | Mã merchant VNPay |
| `VNPAY_HASH_SECRET` | Hash secret VNPay |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MAIL_USERNAME` | Email gửi thông báo |
| `MAIL_PASSWORD` | App password email |
| `REDIS_HOST` | Redis host (default: `localhost`) |
| `REDIS_PORT` | Redis port (default: `6379`) |
| `OPENAI_API_KEY` | API key cho AI service |

---

## 📄 License

MIT License — xem file [LICENSE](./LICENSE) để biết thêm chi tiết.
