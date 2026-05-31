import { useState } from "react";
import { useAuth } from "../store/AuthContext";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";
import axiosClient from "../api/axios";
import { toast } from "react-toastify";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    address: user?.address || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.put("/api/users/me", form);
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      
      // Cập nhật localStorage để giữ data khi reload
      if (res.data.fullName) localStorage.setItem("fullName", res.data.fullName);
      if (res.data.phone) localStorage.setItem("phone", res.data.phone);
      if (res.data.address) localStorage.setItem("address", res.data.address);
      
      toast.success("Cập nhật thành công!");
    } catch {
      toast.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Tài khoản của tôi</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName || "Người dùng"}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
              {user?.role === "CUSTOMER" ? "Khách hàng" : user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="email" value={user?.email || ""} disabled
                className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                placeholder="Nguyễn Văn A" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" value={user?.phone || ""} disabled
                className="w-full pl-11 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                placeholder="Chưa cập nhật" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Số điện thoại không thể thay đổi sau khi đăng ký</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" name="address" value={form.address} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition"
                placeholder="Địa chỉ của bạn" />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-3 font-semibold text-white rounded-xl transition flex items-center justify-center gap-2 ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 shadow-lg"
            }`}>
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><Save className="h-5 w-5" /> Lưu thay đổi</>}
          </button>
        </form>
      </div>
    </div>
  );
}
