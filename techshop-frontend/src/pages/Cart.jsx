import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";

export default function Cart() {
  const { user } = useAuth();
  const { items, totalAmount, fetchCart, loading } = useCartStore();

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Vui lòng đăng nhập</h2>
      <Link to="/login" className="px-6 py-3 bg-orange-500 text-white rounded-xl">
        Đăng nhập
      </Link>
    </div>
  );

  if (loading) return <div className="p-10">Loading...</div>;

  if (items.length === 0) return (
    <div className="text-center py-20">
      <p>Giỏ hàng trống</p>
      <Link to="/products">Mua ngay</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Giỏ hàng ({items.length})
      </h1>

      {items.map((item) => (
        <div key={item.id} className="border p-4 mb-4 rounded-xl">
          <p>{item.productName}</p>
          <p>{item.quantity}</p>
        </div>
      ))}

      <div className="mt-6 font-bold">
        Tổng: {Number(totalAmount).toLocaleString("vi-VN")}₫
      </div>
    </div>
  );
}