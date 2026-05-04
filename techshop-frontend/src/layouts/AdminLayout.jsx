import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, BarChart3, LogOut, Zap, Menu, X, Warehouse
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import NotificationBell from "../components/NotificationBell";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Sản phẩm", icon: Package },
  { to: "/admin/categories", label: "Danh mục", icon: Tag },
  { to: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/inventory", label: "Kho hàng", icon: Warehouse },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    nav("/");
    toast.info("Đã đăng xuất!");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
      isActive ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900">TechShop</span>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={() => setSidebarOpen(false)}>
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold text-sm">{user?.fullName?.[0] || "A"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.fullName || user?.email}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition">
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar cho Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        <Sidebar />
      </aside>

      {/* Sidebar cho Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Thanh tiêu đề (Header) */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-bold text-lg text-gray-800 hidden md:block">Quản trị TechShop</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2">
               <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
               <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">{user?.role}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
