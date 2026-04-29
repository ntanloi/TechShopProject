import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";

export default function Cart() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { items, totalAmount, fetchCart, updateQuantity, removeItem, clearCart, loading } = useCartStore();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Vui lòng đăng nhập</h2>
      <p className="text-gray-500 mb-6">Đăng nhập để xem giỏ hàng của bạn</p>
      <Link to="/login" className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition">
        Đăng nhập
      </Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
      {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-500 mb-6">Hãy thêm sản phẩm vào giỏ hàng</p>
      <Link to="/products" className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition">
        Tiếp tục mua sắm
      </Link>
    </div>
  );

  const handleUpdate = async (id, qty) => {
    try { await updateQuantity(id, qty); }
    catch { toast.error("Không thể cập nhật"); }
  };

  const handleRemove = async (id) => {
    try { await removeItem(id); toast.success("Đã xóa sản phẩm"); }
    catch { toast.error("Không thể xóa"); }
  };

  const handleClear = async () => {
    if (!confirm("Xóa toàn bộ giỏ hàng?")) return;
    try { await clearCart(); toast.success("Đã xóa giỏ hàng"); }
    catch { toast.error("Không thể xóa"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng ({items.length} sản phẩm)</h1>
        <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-600 transition">Xóa tất cả</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.productName}</h3>
                {item.productBrand && <p className="text-xs text-orange-500 mt-0.5">{item.productBrand}</p>}
                <p className="text-orange-500 font-bold mt-1">{Number(item.unitPrice).toLocaleString("vi-VN")}₫</p>
              </div>

              <div className="flex flex-col items-end justify-between shrink-0">
                <button onClick={() => handleRemove(item.id)} className="text-gray-400 hover:text-red-500 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => handleUpdate(item.id, item.quantity - 1)} disabled={item.quantity <= 1}
                    className="px-2 py-1.5 hover:bg-gray-100 transition disabled:opacity-40">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                  <button onClick={() => handleUpdate(item.id, item.quantity + 1)}
                    className="px-2 py-1.5 hover:bg-gray-100 transition">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính ({items.length} sản phẩm)</span>
                <span>{Number(totalAmount).toLocaleString("vi-VN")}₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Tổng cộng</span>
                <span className="text-orange-500 text-lg">{Number(totalAmount).toLocaleString("vi-VN")}₫</span>
              </div>
            </div>
            <button onClick={() => nav("/checkout")}
              className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-2">
              Tiến hành đặt hàng <ArrowRight className="h-4 w-4" />
            </button>
            <Link to="/products" className="mt-3 block text-center text-sm text-gray-500 hover:text-orange-500 transition">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
