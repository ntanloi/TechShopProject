import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import userApi from "../api/userApi";
import { Mail, Lock, LogIn, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Nếu đã login rồi thì redirect
  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN" || user.role === "STAFF") {
      nav("/admin/dashboard", { replace: true });
    } else {
      nav(from === "/login" ? "/" : from, { replace: true });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await userApi.login({ email, password });
      const { token, role, fullName, id, message } = res.data;

      // Lưu vào context ngay với đầy đủ thông tin từ response
      login(token, { id, email, role, fullName });

      toast.success("Đăng nhập thành công!", { theme: "colored" });

      // Redirect ngay lập tức dựa vào role từ response (không chờ useEffect)
      if (role === "ADMIN" || role === "STAFF") {
        nav("/admin/dashboard", { replace: true });
      } else {
        nav(from === "/login" ? "/" : from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Email hoặc mật khẩu không đúng!", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* Left */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-10 text-white flex flex-col justify-between hidden lg:flex">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-white/20 rounded-2xl"><Zap className="h-7 w-7" /></div>
              <span className="text-2xl font-bold">TechShop</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              Mua sắm <br /><span className="text-yellow-300">thông minh hơn</span>
            </h1>
            <p className="text-orange-100 text-lg mb-8">Hàng ngàn sản phẩm chính hãng • Giao hàng nhanh • Giá tốt nhất</p>
            <div className="space-y-3">
              {["Hàng chính hãng 100%", "Bảo hành chính thức", "Đổi trả trong 30 ngày"].map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">✓</div>
                  <span className="font-medium">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-orange-200">© 2025 TechShop. Thiết bị điện tử chính hãng.</p>
        </div>

        {/* Right */}
        <div className="p-8 lg:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
                <div className="p-2 bg-orange-500 rounded-xl"><Zap className="h-5 w-5 text-white" /></div>
                <span className="font-bold text-xl">Tech<span className="text-orange-500">Shop</span></span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Chào mừng trở lại</h2>
              <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục mua sắm</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                    placeholder="you@example.com" disabled={loading} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                    placeholder="••••••••" disabled={loading} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition shadow-lg ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-xl"
                }`}>
                {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><LogIn className="h-5 w-5" /> Đăng nhập</>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-600">Đăng ký miễn phí</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
