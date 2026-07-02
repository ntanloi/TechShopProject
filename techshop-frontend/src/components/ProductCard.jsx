import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import { toast } from "react-toastify";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/login");
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
      className="group bg-white rounded-lg border border-gray-200 hover:border-red-500 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Discount Badge */}
      {discount > 0 && (
        <span className="absolute top-2 left-2 bg-[#E30019] text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded z-10">
          -{discount}%
        </span>
      )}

      {/* Image Block */}
      <div className="relative w-full aspect-square bg-white flex items-center justify-center p-3 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/placeholder.png";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
            <ShoppingCart className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1 border-t border-gray-50">
        {product.brand && (
          <span className="text-[10px] text-[#E30019] font-extrabold uppercase tracking-widest">
            {product.brand}
          </span>
        )}
        
        <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors h-10">
          {product.name}
        </h3>

        {/* Spec tags (Show subcategory if exists) */}
        {product.subcategory && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
              {product.subcategory}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${s <= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
            />
          ))}
          <span className="text-[11px] text-gray-400 ml-1">(5)</span>
        </div>

        {/* Prices */}
        <div className="mt-auto pt-2 flex flex-col gap-0.5">
          {originalPrice && (
            <span className="text-[11px] text-gray-400 line-through leading-none">
              {Number(originalPrice).toLocaleString("vi-VN")}₫
            </span>
          )}
          <span className="text-[15px] font-extrabold text-[#E30019] leading-none">
            {Number(price).toLocaleString("vi-VN")}₫
          </span>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full py-2 bg-gray-100 group-hover:bg-[#E30019] text-gray-700 group-hover:text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          THÊM VÀO GIỎ
        </button>
      </div>
    </Link>
  );
}
