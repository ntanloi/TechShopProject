import { useEffect, useState } from "react";
import { UserCheck, UserX, Search } from "lucide-react";
import userApi from "../../api/userApi";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    userApi.getAll().then((r) => setUsers(r.data || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try { await userApi.toggleUser(id); toast.success("Đã cập nhật"); load(); }
    catch { toast.error("Cập nhật thất bại"); }
  };

  const filtered = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const ROLE_COLOR = { CUSTOMER: "bg-blue-100 text-blue-700", ADMIN: "bg-red-100 text-red-700", STAFF: "bg-purple-100 text-purple-700" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Tìm người dùng..." />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Người dùng", "Email", "Điện thoại", "Vai trò", "Trạng thái", "Ngày tạo", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">Không tìm thấy người dùng</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-600 text-sm shrink-0">
                        {u.fullName?.[0] || u.email?.[0] || "U"}
                      </div>
                      <span className="font-medium text-gray-800">{u.fullName || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.email}</td>
                  <td className="px-5 py-4 text-gray-500">{u.phone || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLOR[u.role] || "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.enabled ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(u.id)}
                      className={`p-2 rounded-lg transition ${u.enabled ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}`}>
                      {u.enabled ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
