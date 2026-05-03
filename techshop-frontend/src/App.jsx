import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "@/components/NavBar.jsx";
import Footer from "@/components/Footer.jsx";
import ScrollToTop from "@/components/ScrollToTop.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";

import AdminLayout from "@/layouts/AdminLayout.jsx";

// Public pages
import Home from "@/pages/Home.jsx";
import Products from "@/pages/Products.jsx";
import ProductDetail from "@/pages/ProductDetail.jsx";
import About from "@/pages/About.jsx";
import NotFound from "@/pages/NotFound.jsx";

// Auth pages
import Login from "@/pages/Login.jsx";
import Register from "@/pages/Register.jsx";

// User pages
import Cart from "@/pages/Cart.jsx";
import Checkout from "@/pages/Checkout.jsx";
import Orders from "@/pages/Orders.jsx";
import OrderDetail from "@/pages/OrderDetail.jsx";
import Profile from "@/pages/Profile.jsx";
import PaymentResult from "@/pages/PaymentResult.jsx";

// Admin pages
import Dashboard from "@/pages/admin/Dashboard.jsx";
import AdminProducts from "@/pages/admin/AdminProducts.jsx";
import AdminCategories from "@/pages/admin/AdminCategories.jsx";
import AdminOrders from "@/pages/admin/AdminOrders.jsx";
import AdminUsers from "@/pages/admin/AdminUsers.jsx";
import AdminInventory from "@/pages/admin/AdminInventory.jsx";

export default function App() {
  const location = useLocation();

  const hideLayout =
    ["/login", "/register"].includes(location.pathname) ||
    location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      {!hideLayout && <NavBar />}
      <ScrollToTop />

      <main className="flex-1">
        <Routes>
          {/* ===== PUBLIC ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/categories" element={<Products />} />
          <Route path="/about" element={<About />} />

          {/* ===== AUTH ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ===== USER ===== */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/payment-result" element={<PaymentResult />} />

          {/* ===== ADMIN ===== */}
          <Route path="/admin" element={<RequireAuth roles={["ADMIN", "STAFF"]}><AdminLayout /></RequireAuth>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inventory" element={<AdminInventory />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}
