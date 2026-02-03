# TechShop Frontend

Giao diện web cho hệ thống TechShop E-Commerce, xây dựng bằng React + Vite + TailwindCSS.

## Tech Stack

- React 18 + Vite
- TailwindCSS 3
- React Router DOM v6
- Axios
- Zustand (state management)
- React Toastify
- Lucide React (icons)

## Cài đặt và chạy

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Mở trình duyệt: http://localhost:5173

## Yêu cầu

Backend TechShop phải đang chạy tại http://localhost:8080

## Cấu trúc

```
src/
├── api/          # Axios client + API calls
├── components/   # NavBar, Footer, ProductCard...
├── layouts/      # AdminLayout
├── pages/        # Tất cả các trang
│   ├── admin/    # Dashboard, Products, Orders, Users...
│   └── ...       # Home, Products, Cart, Checkout...
└── store/        # AuthContext, cartStore
```

## Tài khoản test

Đăng ký tài khoản mới tại /register
Admin: tạo user với role ADMIN trong database
