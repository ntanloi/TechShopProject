import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import useCartStore from "../store/cartStore";
import { useState, useEffect } from "react";
import {
  ShoppingCart, User, Menu, X, Search, Zap,
  LogOut, Package, Heart, Settings, ChevronDown
} from "lucide-react";
import { toast } from "react-toastify";

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { totalItems, fetchCart, clearLocal } = useCartStore();
  const nav = useNavigate();

  useEffect(() => {
    if (user && user.token) {
      // Đảm bảo token đã được lưu vào localStorage trước khi fetch
      if (localStorage.getItem("token")) {
        fetchCart();
      }
    } else {
      clearLocal();
    }
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearLocal();
    setDropdown(false);
    nav("/");
    toast.info("Đã đăng xuất!", { theme: "colored", autoClose: 2000 });
  };

  const linkClass = ({ isActive }) =>
    "relative px-3 py-2 text-sm font-medium transition-colors " +
    (isActive ? "text-orange-500" : "text-gray-700 hover:text-orange-500");

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-gray-900">Tech<span className="text-orange-500">Shop</span></span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 hidden md:flex max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>Trang chủ</NavLink>
          <NavLink to="/products" className={linkClass}>Sản phẩm</NavLink>
          <NavLink to="/categories" className={linkClass}>Danh mục</NavLink>
          <NavLink to="/about" className={linkClass}>Về chúng tôi</NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Cart */}
          <Link to="/cart" className="relative p-2 text-gray-700 hover:text-orange-500 transition">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {/* User */}
          {!user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500 transition">
                Đăng nhập
              </Link>
              <Link to="/register" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition shadow">
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                  {user.fullName?.split(" ").pop() || user.email?.split("@")[0]}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {dropdown && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b">
                    <p className="text-xs text-gray-500">Xin chào</p>
                    <p className="font-semibold text-gray-800 truncate">{user.fullName || user.email}</p>
                    <span className="text-xs text-orange-500 font-medium">{user.role}</span>
                  </div>
                  <div className="py-2">
                    <Link to="/profile" onClick={() => setDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                      <User className="h-4 w-4" /> Tài khoản của tôi
                    </Link>
                    <Link to="/orders" onClick={() => setDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                      <Package className="h-4 w-4" /> Đơn hàng của tôi
                    </Link>
                    {(user.role === "ADMIN" || user.role === "STAFF") && (
                      <Link to="/admin" onClick={() => setDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                        <Settings className="h-4 w-4" /> Quản trị
                      </Link>
                    )}
                  </div>
                  <div className="border-t">
                    <button onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition">
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 text-gray-700" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t bg-white px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm">Tìm</button>
          </form>
          <NavLink to="/" className={linkClass} end onClick={() => setOpen(false)}>Trang chủ</NavLink>
          <NavLink to="/products" className={linkClass} onClick={() => setOpen(false)}>Sản phẩm</NavLink>
          <NavLink to="/categories" className={linkClass} onClick={() => setOpen(false)}>Danh mục</NavLink>
          {!user ? (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center py-2 border border-orange-500 text-orange-500 rounded-xl text-sm font-medium">Đăng nhập</Link>
              <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center py-2 bg-orange-500 text-white rounded-xl text-sm font-medium">Đăng ký</Link>
            </div>
          ) : (
            <div className="pt-2 border-t space-y-2">
              <Link to="/orders" onClick={() => setOpen(false)} className="block py-2 text-sm text-gray-700">Đơn hàng của tôi</Link>
              <button onClick={handleLogout} className="w-full py-2 text-sm text-red-600 font-medium">Đăng xuất</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
