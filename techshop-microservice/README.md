# TechShop Microservice

Technology Devices E-Commerce Website built with Spring Boot Microservices.

## Architecture

```
techshop-microservice/
├── discovery-service     # Eureka Server          :8761
├── gateway-service       # API Gateway            :8080
├── user-service          # Auth + User            :8081
├── product-service       # Products + Categories  :8082
├── order-service         # Order Management       :8083
├── cart-service          # Shopping Cart          :8084
├── payment-service       # Payment (VNPay, COD)   :8085
├── notification-service  # Email Notifications    :8086
├── review-service        # Product Reviews        :8087
└── inventory-service     # Stock Management       :8088
```

## Tech Stack

- Java 21 + Spring Boot 3.3.5
- Spring Cloud 2023.0.3 (Eureka, Gateway, OpenFeign)
- MySQL 8.0 (separate DB per service)
- JWT Authentication
- Docker + Docker Compose

## API Routes (via Gateway :8080)

| Service      | Path prefix         |
|--------------|---------------------|
| Auth         | /api/auth/**        |
| Users        | /api/users/**       |
| Products     | /api/products/**    |
| Categories   | /api/categories/**  |
| Orders       | /api/orders/**      |
| Cart         | /api/cart/**        |
| Payments     | /api/payments/**    |
| Notifications| /api/notifications/**|
| Reviews      | /api/reviews/**     |
| Inventory    | /api/inventory/**   |

## Quick Start

### 1. Setup environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run with Docker Compose

```bash
docker-compose up -d
```

### 3. Run locally (dev)

Start each service individually in your IDE, or:

```bash
# Start discovery first
cd discovery-service && mvn spring-boot:run

# Then start other services
cd user-service && mvn spring-boot:run
# ...
```

## Environment Variables

See `.env.example` for all required variables.

Key variables:
- `JWT_SECRET` - JWT signing secret
- `MAIL_USERNAME` / `MAIL_PASSWORD` - Gmail SMTP credentials
- `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` - VNPay payment gateway
