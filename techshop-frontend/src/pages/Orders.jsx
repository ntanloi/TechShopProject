import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, ChevronRight, Clock } from "lucide-react";
import orderApi from "../api/orderApi";
import { useAuth } from "../store/AuthContext";

const STATUS_MAP = {
  PENDING: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
  SHIPPED: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
  DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Hoàn tiền", color: "bg-gray-100 text-gray-700" },
};

export default function Orders() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("Orders component rendered, user:", user); // Debug log

  useEffect(() => {
    console.log("useEffect triggered, user:", user); // Debug log
    
    if (!user) { 
      console.log("No user, redirecting to login"); // Debug log
      nav("/login"); 
      return; 
    }
    
    console.log("Calling orderApi.getMyOrders..."); // Debug log
    
    // Truyền size=100 để lấy nhiều orders
    orderApi.getMyOrders({ page: 0, size: 100 })
      .then((r) => {
        console.log("Orders API response:", r.data); // Debug log
        console.log("Total orders:", r.data?.totalElements); // Debug log
        console.log("Orders content:", r.data?.content); // Debug log
        setOrders(r.data?.content || []);
      })
      .catch((err) => {
        console.error("Orders API error:", err); // Debug log
        console.error("Error details:", err.response); // Debug log
      })
      .finally(() => {
        console.log("API call finished"); // Debug log
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa có đơn hàng nào</h2>
          <p className="text-gray-500 mb-6">Hãy mua sắm và đặt hàng ngay!</p>
          <Link to="/products" className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition">
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100 text-gray-700" };
            return (
              <Link key={order.id} to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition hover:border-orange-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-800">#{order.orderCode}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <span>{order.items?.length || 0} sản phẩm</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 truncate">{order.shippingAddress}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-orange-500 text-lg">
                      {Number(order.totalAmount).toLocaleString("vi-VN")}₫
                    </p>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-auto mt-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
