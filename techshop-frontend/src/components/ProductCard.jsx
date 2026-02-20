import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();
  const { user } = useAuth();
  const nav = useNavigate();

  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
      nav("/login");
      return;
    }
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        productBrand: product.brand,
        unitPrice: price,
        quantity: 1,
      });
      toast.success("Đã thêm vào giỏ hàng!", { autoClose: 1500 });
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    }
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discount}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.brand && (
          <span className="text-xs text-orange-500 font-medium uppercase tracking-wide">
            {product.brand}
          </span>
        )}
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Rating placeholder */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${s <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">(0)</span>
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-orange-500">
              {Number(price).toLocaleString("vi-VN")}₫
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {Number(originalPrice).toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className="mt-2 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          Thêm vào giỏ
        </button>
      </div>
    </Link>
  );
}
