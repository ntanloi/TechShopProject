import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import userApi from "../api/userApi";
import { Mail, Lock, User, Phone, Zap, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      const res = await userApi.register(form);
      const { token, ...userData } = res.data;
      login(token, userData);
      toast.success("Đăng ký thành công! Chào mừng bạn đến TechShop 🎉");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại!", { theme: "colored" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-orange-500 rounded-xl"><Zap className="h-5 w-5 text-white" /></div>
            <span className="font-bold text-xl">Tech<span className="text-orange-500">Shop</span></span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h2>
          <p className="text-gray-500 text-sm mt-1">Đăng ký để bắt đầu mua sắm</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: "fullName", label: "Họ và tên", icon: User, type: "text", placeholder: "Nguyễn Văn A" },
            { name: "email", label: "Email", icon: Mail, type: "email", placeholder: "you@example.com" },
            { name: "phone", label: "Số điện thoại", icon: Phone, type: "tel", placeholder: "0901234567" },
          ].map(({ name, label, icon: Icon, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type={type} name={name} required value={form[name]} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                  placeholder={placeholder} disabled={loading} />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type={showPw ? "text" : "password"} name="password" required value={form.password} onChange={handleChange}
                className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                placeholder="Tối thiểu 6 ký tự" disabled={loading} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition shadow-lg mt-2 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            }`}>
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : "Đăng ký ngay"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
