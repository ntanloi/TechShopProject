import { useEffect, useState } from "react";
import { Package, ShoppingBag, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import orderApi from "../../api/orderApi";
import productApi from "../../api/productApi";
import userApi from "../../api/userApi";

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orderApi.getAll({ size: 5 }).catch(() => ({ data: { content: [], totalElements: 0 } })),
      productApi.getAll({ size: 1 }).catch(() => ({ data: { totalElements: 0 } })),
      userApi.getAll().catch(() => ({ data: [] })),
    ])
      .then(([ordersRes, productsRes, usersRes]) => {
        const orders = ordersRes.data?.content || [];
        const totalRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
        setStats({
          orders: ordersRes.data?.totalElements || orders.length,
          products: productsRes.data?.totalElements || 0,
          users: usersRes.data?.length || 0,
          revenue: totalRevenue,
        });
        setRecentOrders(orders.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const STATUS_COLOR = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
  };

  const STAT_CARDS = [
    { label: "Tổng đơn hàng", value: stats.orders, icon: ShoppingBag, color: "from-blue-500 to-blue-600", change: "+12%" },
    { label: "Sản phẩm", value: stats.products, icon: Package, color: "from-purple-500 to-purple-600", change: "+5%" },
    { label: "Người dùng", value: stats.users, icon: Users, color: "from-green-500 to-green-600", change: "+8%" },
    { label: "Doanh thu", value: `${(stats.revenue / 1e6).toFixed(1)}M₫`, icon: TrendingUp, color: "from-orange-500 to-red-500", change: "+15%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Tổng quan hệ thống TechShop</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${color} rounded-xl`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <ArrowUpRight className="h-3 w-3" />{change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? "..." : value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Đơn hàng gần đây</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Mã đơn", "Khách hàng", "Tổng tiền", "Trạng thái", "Ngày đặt"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Chưa có đơn hàng</td></tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">#{o.orderCode}</td>
                    <td className="px-6 py-4 text-gray-600">{o.userEmail || o.receiverName}</td>
                    <td className="px-6 py-4 font-semibold text-orange-500">{Number(o.totalAmount).toLocaleString("vi-VN")}₫</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[o.status] || "bg-gray-100 text-gray-700"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
