import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Star,
  Truck,
  Shield,
  ArrowLeft,
  Plus,
  Minus,
} from "lucide-react";
import productApi from "../api/productApi";
import reviewApi from "../api/reviewApi";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCartStore();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 });
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productApi.getById(id),
      reviewApi.getByProduct(id),
      reviewApi.getRating(id),
    ])
      .then(([pRes, rRes, ratRes]) => {
        setProduct(pRes.data);
        setReviews(rRes.data || []);
        setRating(ratRes.data || {});
      })
      .catch(() => nav("/products"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập");
      nav("/login");
      return;
    }
    setAddingCart(true);
    try {
      await addToCart({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        productBrand: product.brand,
        unitPrice: product.salePrice || product.price,
        quantity: qty,
      });
      toast.success(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    nav("/cart");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Vui lòng đăng nhập để đánh giá");
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewApi.create({ productId: id, ...newReview });
      toast.success("Đã gửi đánh giá!");
      setNewReview({ rating: 5, comment: "" });
      const [rRes, ratRes] = await Promise.all([
        reviewApi.getByProduct(id),
        reviewApi.getRating(id),
      ]);
      setReviews(rRes.data || []);
      setRating(ratRes.data || {});
    } catch {
      toast.error("Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-10 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );

  if (!product) return null;

  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="grid lg:grid-cols-2 gap-10 bg-white rounded-2xl p-6 lg:p-10 shadow-sm border border-gray-100">
        {/* Image */}
        <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="text-gray-300 text-6xl">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          {product.brand && (
            <span className="text-sm text-orange-500 font-semibold uppercase">
              {product.brand}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${s <= Math.round(rating.averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {rating.averageRating?.toFixed(1)} ({rating.totalReviews} đánh
              giá)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-orange-500">
              {Number(price).toLocaleString("vi-VN")}₫
            </span>
            {originalPrice && (
              <span className="text-lg text-gray-400 line-through">
                {Number(originalPrice).toLocaleString("vi-VN")}₫
              </span>
            )}
            {originalPrice && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
                -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Số lượng:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 hover:bg-gray-100 transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 font-semibold min-w-12 text-center">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="px-3 py-2 hover:bg-gray-100 transition"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={addingCart}
              className="flex-1 py-3 border-2 border-orange-500 text-orange-500 font-semibold rounded-xl hover:bg-orange-50 transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              {addingCart ? "Đang thêm..." : "Thêm vào giỏ"}
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-lg"
            >
              Mua ngay
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { icon: Shield, text: "Hàng chính hãng 100%" },
              { icon: Truck, text: "Giao hàng toàn quốc" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl"
              >
                <Icon className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-xs text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-2 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-10 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Đánh giá sản phẩm ({rating.totalReviews})
        </h2>

        {/* Write review */}
        {user && (
          <form
            onSubmit={handleSubmitReview}
            className="mb-8 p-5 bg-orange-50 rounded-2xl space-y-4"
          >
            <h3 className="font-semibold text-gray-800">
              Viết đánh giá của bạn
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Đánh giá:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: s })}
                >
                  <Star
                    className={`h-6 w-6 transition ${s <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              required
            />
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition"
            >
              {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                      {r.userName?.[0] || r.userEmail?.[0] || "U"}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">
                      {r.userName || r.userEmail}
                    </span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
