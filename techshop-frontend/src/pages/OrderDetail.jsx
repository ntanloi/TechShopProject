import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Package, MapPin, Phone, Clock, CreditCard } from "lucide-react";
import orderApi from "../api/orderApi";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";

const STATUS_MAP = {
  PENDING: { label: "Chờ xác nhận", color: "text-yellow-600 bg-yellow-50", step: 0 },
  CONFIRMED: { label: "Đã xác nhận", color: "text-blue-600 bg-blue-50", step: 1 },
  PROCESSING: { label: "Đang xử lý", color: "text-purple-600 bg-purple-50", step: 2 },
  SHIPPED: { label: "Đang giao hàng", color: "text-indigo-600 bg-indigo-50", step: 3 },
  DELIVERED: { label: "Đã giao hàng", color: "text-green-600 bg-green-50", step: 4 },
  CANCELLED: { label: "Đã hủy", color: "text-red-600 bg-red-50", step: -1 },
};

const STEPS = ["Đặt hàng", "Xác nhận", "Xử lý", "Đang giao", "Đã giao"];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) { nav("/login"); return; }
    orderApi.getById(id).then((r) => setOrder(r.data)).catch(() => nav("/orders")).finally(() => setLoading(false));
  }, [id, user]);

  const handleCancel = async () => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    try {
      await orderApi.cancel(id);
      toast.success("Đã hủy đơn hàng");
      setOrder({ ...order, status: "CANCELLED" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể hủy đơn hàng");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 rounded-2xl animate-pulse" /></div>;
  if (!order) return null;

  const status = STATUS_MAP[order.status] || { label: order.status, color: "text-gray-600 bg-gray-50", step: 0 };
  const currentStep = status.step;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => nav("/orders")} className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Quay lại đơn hàng
      </button>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Đơn hàng #{order.orderCode}</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${status.color}`}>{status.label}</span>
              {order.status === "PENDING" && (
                <button onClick={handleCancel} disabled={cancelling}
                  className="px-4 py-2 border border-red-300 text-red-500 text-sm font-medium rounded-xl hover:bg-red-50 transition">
                  {cancelling ? "Đang hủy..." : "Hủy đơn"}
                </button>
              )}
            </div>
          </div>

          {/* Progress */}
          {currentStep >= 0 && (
            <div className="mt-6">
              <div className="flex items-center">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i <= currentStep ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>{i + 1}</div>
                    <div className="flex-1 mx-1">
                      <p className={`text-xs text-center ${i <= currentStep ? "text-orange-500 font-medium" : "text-gray-400"}`}>{step}</p>
                      {i < STEPS.length - 1 && (
                        <div className={`h-1 rounded-full mt-1 ${i < currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Shipping info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" /> Thông tin giao hàng
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2"><Package className="h-4 w-4 text-gray-400" /> {order.receiverName}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {order.receiverPhone}</p>
              <p className="flex items-start gap-2"><MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" /> {order.shippingAddress}</p>
              {order.note && <p className="text-gray-500 italic">Ghi chú: {order.note}</p>}
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" /> Thanh toán
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Phương thức</span>
                <span className="font-medium">{order.paymentMethod === "COD" ? "Tiền mặt (COD)" : order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Trạng thái</span>
                <span className={`font-medium ${order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}>
                  {order.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                <span>Tổng cộng</span>
                <span className="text-orange-500">{Number(order.totalAmount).toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">Sản phẩm đã đặt</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                  ) : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.productName}</p>
                  {item.productBrand && <p className="text-xs text-orange-500">{item.productBrand}</p>}
                  <p className="text-xs text-gray-500 mt-1">x{item.quantity} × {Number(item.unitPrice).toLocaleString("vi-VN")}₫</p>
                </div>
                <p className="font-bold text-gray-800 shrink-0">{Number(item.subtotal).toLocaleString("vi-VN")}₫</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
