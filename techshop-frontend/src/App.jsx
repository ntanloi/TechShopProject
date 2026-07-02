import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import NavBar from "@/components/NavBar.jsx";
import Footer from "@/components/Footer.jsx";
import ScrollToTop from "@/components/ScrollToTop.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";
import ChatBot from "@/components/ChatBot.jsx";

import AdminLayout from "@/layouts/AdminLayout.jsx";

// Public pages
import Home from "@/pages/Home.jsx";
import Products from "@/pages/Products.jsx";
import ProductDetail from "@/pages/ProductDetail.jsx";
import About from "@/pages/About.jsx";
import TradeInPricing from "@/pages/TradeInPricing.jsx";
import News from "@/pages/News.jsx";
import WarrantyLookup from "@/pages/WarrantyLookup.jsx";
import TechnicalSupport from "@/pages/TechnicalSupport.jsx";
import Showroom from "@/pages/Showroom.jsx";
import NotFound from "@/pages/NotFound.jsx";

// Auth pages
import Login from "@/pages/Login.jsx";
import Register from "@/pages/Register.jsx";
import TermsOfService from "@/pages/TermsOfService.jsx";
import PrivacyPolicy from "@/pages/PrivacyPolicy.jsx";
import ForgotPassword from "@/pages/ForgotPassword.jsx";

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
import HotDealsGaming from "@/pages/HotDealsGaming.jsx";


// Helper: redirect /category/:slug → /products?category=:slug
function CategoryRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/products?category=${slug}`} replace />;
}

export default function App() {
  const location = useLocation();

  const hideLayout =
    ["/login", "/register", "/forgot-password"].includes(location.pathname) ||
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
          {/* Category slug redirect: /category/laptop-gaming → /products?category=laptop-gaming */}
          <Route path="/category/:slug" element={<CategoryRedirect />} />
          <Route path="/categories" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/trade-in-pricing" element={<TradeInPricing />} />
          <Route path="/trade-in" element={<TradeInPricing />} />
          <Route path="/hot-deals" element={<HotDealsGaming />} />
          <Route path="/laptop-gaming-hot-deals" element={<HotDealsGaming />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<News />} />
          <Route path="/warranty-lookup" element={<WarrantyLookup />} />
          <Route path="/warranty-policy" element={<WarrantyLookup />} />
          <Route path="/shipping-policy" element={<About />} />
          <Route path="/on-site-technical-support" element={<TechnicalSupport />} />
          <Route path="/showroom" element={<Showroom />} />

          {/* ===== AUTH ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

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

      {!hideLayout && <ChatBot />}

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
