import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Phone, User, CreditCard, Truck } from "lucide-react";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import orderApi from "../api/orderApi";
import { toast } from "react-toastify";

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalAmount, clearCart, clearLocal } = useCartStore();
  const nav = useNavigate();
  const [form, setForm] = useState({
    receiverName: user?.fullName || "",
    receiverPhone: user?.phone || "",
    shippingAddress: user?.address || "",
    note: "",
    paymentMethod: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (!orderPlaced && (!user || items.length === 0)) {
      nav("/cart");
    }
  }, [user, items.length, orderPlaced, nav]);

  if (!user || (items.length === 0 && !orderPlaced)) {
    return null;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shippingAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    setLoading(true);
    setOrderPlaced(true);

    try {
      const orderData = {
        ...form,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productImage: i.productImage,
          productBrand: i.productBrand,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      const res = await orderApi.create(orderData);

      // ✅ DEBUG: Kiểm tra response structure
      console.log("=== ORDER RESPONSE DEBUG ===");
      console.log("1. Full response:", res);
      console.log("2. Response status:", res.status);
      console.log("3. Response data type:", typeof res.data);
      
      // Parse response - có thể là string hoặc object
      let order = res.data;
      if (typeof res.data === 'string') {
        try {
          order = JSON.parse(res.data);
          console.log("4. Parsed from string:", order);
        } catch (e) {
          console.error("Failed to parse response:", e);
        }
      }
      
      const orderId = order?.id;
      const paymentUrl = order?.paymentUrl; // URL thanh toán VNPay
      console.log("5. Extracted Order ID:", orderId);
      console.log("6. Payment URL:", paymentUrl);
      console.log("============================");

      toast.success("Đặt hàng thành công!");

      // Xóa giỏ hàng local trước
      clearLocal();

      // Xóa giỏ hàng trên server (không chặn nếu lỗi)
      clearCart().catch((err) => {
        console.warn("Cart clear on server failed (ignored):", err);
      });

      // ✅ Kiểm tra phương thức thanh toán
      if (form.paymentMethod === "VNPAY" && paymentUrl) {
        // Chuyển đến trang VNPay để thanh toán
        console.log("✅ Redirecting to VNPay:", paymentUrl);
        window.location.href = paymentUrl;
      } else if (orderId) {
        // COD hoặc thanh toán khác → chuyển đến order detail
        console.log("✅ Navigating to order detail:", `/orders/${orderId}`);
        nav(`/orders/${orderId}`, { replace: true });
      } else {
        console.error("❌ No order ID found!");
        console.log("Order object:", order);
        nav("/orders", { replace: true });
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      toast.error(err.response?.data?.message || "Đặt hàng thất bại!");
      setOrderPlaced(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" /> Thông tin giao hàng
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: "receiverName", label: "Tên người nhận", icon: User, placeholder: "Nguyễn Văn A" },
                  { name: "receiverPhone", label: "Số điện thoại", icon: Phone, placeholder: "0901234567" },
                ].map(({ name, label, icon: Icon, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name={name}
                        required
                        value={form[name]}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder={placeholder}
                      />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      name="shippingAddress"
                      required
                      value={form.shippingAddress}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                      rows={2}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    rows={2}
                    placeholder="Ghi chú cho người giao hàng..."
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" /> Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {[
                  { value: "COD", label: "Thanh toán khi nhận hàng (COD)", icon: "💵", desc: "Trả tiền mặt khi nhận hàng" },
                  { value: "VNPAY", label: "Thanh toán qua VNPay", icon: "💳", desc: "Thẻ ATM, Visa, MasterCard" },
                  { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng", icon: "🏦", desc: "Chuyển khoản trực tiếp" },
                ].map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${
                      form.paymentMethod === m.value ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={form.paymentMethod === m.value}
                      onChange={handleChange}
                      className="accent-orange-500"
                    />
                    <span className="text-2xl">{m.icon}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Đơn hàng của bạn</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 line-clamp-2">{item.productName}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-800 shrink-0">
                      {Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{Number(totalAmount).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vận chuyển</span>
                  <span className="text-green-600">Miễn phí</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-orange-500">{Number(totalAmount).toLocaleString("vi-VN")}₫</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`mt-6 w-full py-3 font-semibold text-white rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {loading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Truck className="h-5 w-5" /> Đặt hàng ngay
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}