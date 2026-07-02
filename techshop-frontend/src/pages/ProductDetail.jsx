import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart, Star, Truck, Shield, ArrowLeft,
  Plus, Minus, ChevronLeft, ChevronRight, CheckCircle,
  Zap, Package
} from "lucide-react";
import productApi from "../api/productApi";
import reviewApi from "../api/reviewApi";
import aiApi from "../api/aiApi";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";

function parseImages(product) {
  if (!product) return [];
  const list = [];
  // Primary imageUrl always first
  if (product.imageUrl) list.push(product.imageUrl);
  // Parse `images` field which is JSON array string from migration
  if (product.images && typeof product.images === "string") {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        parsed.forEach((url) => {
          if (url && !list.includes(url)) list.push(url);
        });
      }
    } catch (_) {}
  } else if (Array.isArray(product.images)) {
    product.images.forEach((url) => {
      if (url && !list.includes(url)) list.push(url);
    });
  }
  return list;
}

function formatSpecValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  // Array of strings → join
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  // Nested object → flatten key: value pairs
  if (typeof val === "object") {
    return Object.entries(val)
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
  }
  return String(val);
}

// Known non-spec fields that should NOT appear in the specs table
const EXCLUDED_SPEC_FIELDS = new Set([
  "id", "name", "description", "price", "salePrice", "imageUrl",
  "images", "brand", "sku", "slug", "category", "active",
  "createdAt", "updatedAt", "subcategory", "accessoryType",
  // GearVN raw fields — already merged into `specifications`
  "specs", "cardSpecs", "detailSpecs",
]);

function parseSpecs(product) {
  if (!product) return [];
  const rows = [];

  if (product.brand) rows.push({ label: "Thương hiệu", value: product.brand });
  if (product.category?.name) rows.push({ label: "Danh mục", value: product.category.name });
  if (product.subcategory) rows.push({ label: "Phân loại", value: product.subcategory });
  if (product.sku) rows.push({ label: "Mã SKU", value: product.sku });

  // Parse the `specifications` JSON field (primary source)
  const specsField = product.specifications;
  if (specsField) {
    try {
      const parsed = typeof specsField === "string" ? JSON.parse(specsField) : specsField;
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.entries(parsed).forEach(([key, val]) => {
          const formatted = formatSpecValue(val);
          if (formatted) rows.push({ label: key, value: formatted });
        });
      }
    } catch (_) {
      if (typeof specsField === "string" && specsField.trim()) {
        rows.push({ label: "Thông số", value: specsField });
      }
    }
  }

  return rows;
}

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
  const [recommendations, setRecommendations] = useState([]);
  const [recAlgo, setRecAlgo] = useState("");
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);

    // Fetch product first (critical), then other data independently (non-critical)
    productApi.getById(id)
      .then((pRes) => {
        setProduct(pRes.data);

        // Load reviews, rating, AI recs in parallel — failures don't block the page
        reviewApi.getByProduct(id)
          .then((r) => setReviews(r.data || []))
          .catch(() => setReviews([]));

        reviewApi.getRating(id)
          .then((r) => setRating(r.data || {}))
          .catch(() => setRating({ averageRating: 0, totalReviews: 0 }));

        aiApi.getRecommendations(id, 4, user?.id)
          .then((r) => {
            setRecommendations(r?.data?.recommendations || []);
            setRecAlgo(r?.data?.algorithm || "");
          })
          .catch(() => {
            setRecommendations([]);
            setRecAlgo("");
          });
      })
      .catch((err) => {
        console.error("ProductDetail fetch error:", err);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  const handleAddToCart = async () => {
    if (!user) { toast.info("Vui lòng đăng nhập"); nav("/login"); return; }
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
    if (!user) { toast.info("Vui lòng đăng nhập để đánh giá"); return; }
    setSubmittingReview(true);
    try {
      await reviewApi.create({ productId: id, ...newReview });
      toast.success("Đã gửi đánh giá!");
      setNewReview({ rating: 5, comment: "" });
      const [rRes, ratRes] = await Promise.all([reviewApi.getByProduct(id), reviewApi.getRating(id)]);
      setReviews(rRes.data || []);
      setRating(ratRes.data || {});
    } catch {
      toast.error("Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-4 py-8 animate-pulse">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="text-xl font-bold text-gray-700 mb-2">Không tìm thấy sản phẩm</h2>
      <p className="text-gray-500 text-sm mb-6">Sản phẩm này có thể đã bị xóa hoặc không tồn tại.</p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E30019] text-white font-bold rounded-lg hover:bg-red-700 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách sản phẩm
      </Link>
    </div>
  );

  const price = product.salePrice || product.price;
  const originalPrice = product.salePrice ? product.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const images = parseImages(product);
  const specs = parseSpecs(product);

  return (
    <div className="bg-[#F2F2F2] min-h-screen pb-8">
      <div className="max-w-[1200px] mx-auto px-4 py-4">

        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="text-blue-600 hover:underline">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-[420px_1fr] gap-0">

            {/* === Left: Image Gallery === */}
            <div className="p-5 border-r border-gray-100">
              {/* Main Image */}
              <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100 group">
                {discount > 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-[#E30019] text-white text-xs font-extrabold px-2 py-1 rounded">
                    -{discount}%
                  </span>
                )}
                <img
                  src={images[activeImg] || "/placeholder.png"}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain p-4 transition-all duration-300"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }}
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveImg((prev) => (prev + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 transition ${
                        i === activeImg ? "border-[#E30019]" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="max-h-full max-w-full object-contain p-1"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.png"; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* === Right: Product Info === */}
            <div className="p-6 flex flex-col gap-4">
              {product.brand && (
                <span className="text-xs font-extrabold text-[#E30019] uppercase tracking-widest">{product.brand}</span>
              )}
              <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>

              {/* Rating row */}
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(rating.averageRating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {rating.averageRating?.toFixed(1) || "5.0"} ({rating.totalReviews || 0} đánh giá)
                </span>
                {product.sku && (
                  <span className="text-xs text-gray-400 border-l pl-3">SKU: {product.sku}</span>
                )}
              </div>

              {/* Price block */}
              <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                <div className="flex items-end gap-3">
                  <span className="text-2xl md:text-3xl font-black text-[#E30019]">
                    {Number(price).toLocaleString("vi-VN")}₫
                  </span>
                  {originalPrice && (
                    <span className="text-base text-gray-400 line-through">
                      {Number(originalPrice).toLocaleString("vi-VN")}₫
                    </span>
                  )}
                </div>
                {originalPrice && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    Tiết kiệm {Number(originalPrice - price).toLocaleString("vi-VN")}₫ ({discount}%)
                  </p>
                )}
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                {[
                  { icon: Shield, text: "Hàng chính hãng 100%" },
                  { icon: Truck, text: "Miễn phí giao hàng" },
                  { icon: CheckCircle, text: "Bảo hành chính hãng" },
                  { icon: Package, text: "Đổi trả trong 30 ngày" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 p-2 bg-gray-50 rounded border border-gray-100">
                    <Icon className="h-3.5 w-3.5 text-[#E30019] shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-700">Số lượng:</span>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2.5 hover:bg-gray-100 transition border-r border-gray-200">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-5 py-2.5 font-bold min-w-14 text-center text-sm">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="px-3 py-2.5 hover:bg-gray-100 transition border-l border-gray-200">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingCart}
                  className="flex-1 py-3 border-2 border-[#E30019] text-[#E30019] font-extrabold rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {addingCart ? "Đang thêm..." : "Thêm vào giỏ"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 bg-[#E30019] hover:bg-red-700 text-white font-extrabold rounded-lg transition shadow-lg text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === Specs Table === */}
        {specs.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <h2 className="text-base font-extrabold text-gray-900 p-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
              Thông số kỹ thuật
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
                    <td className="px-4 py-2.5 font-semibold text-gray-700 w-1/3 border-b border-gray-50">{spec.label}</td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-gray-50">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* === Description === */}
        {product.description && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-extrabold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
              Mô tả sản phẩm
            </h2>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* === AI Recommendations === */}
        {recommendations && recommendations.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🤖</span> Gợi ý sản phẩm phù hợp
              <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                AI - {recAlgo}
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recommendations.map((rec) => (
                <div
                  key={rec.productId}
                  onClick={() => nav(`/products/${rec.productId}`)}
                  className="group cursor-pointer border border-gray-100 rounded-lg p-3 bg-gray-50 hover:bg-white hover:shadow-md hover:border-red-200 transition-all duration-300"
                >
                  <div className="aspect-square bg-white rounded overflow-hidden flex items-center justify-center mb-2 p-2 group-hover:scale-105 transition-transform duration-300">
                    {rec.imageUrl ? (
                      <img src={rec.imageUrl} alt={rec.productName} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-gray-300 text-3xl">📦</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xs line-clamp-2 group-hover:text-[#E30019] transition-colors">
                    {rec.productName}
                  </h3>
                  <p className="font-bold text-[#E30019] text-xs mt-1">
                    {rec.price ? `${Number(rec.price).toLocaleString("vi-VN")}₫` : "Liên hệ"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === Reviews === */}
        <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
            Đánh giá sản phẩm ({rating.totalReviews || 0})
          </h2>

          {user && (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
              <p className="font-semibold text-gray-800 text-sm">Viết đánh giá của bạn</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600">Chất lượng:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setNewReview({ ...newReview, rating: s })}>
                    <Star className={`h-5 w-5 transition ${s <= newReview.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2 bg-[#E30019] hover:bg-red-700 text-white font-bold text-sm rounded-lg transition"
              >
                {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-[#E30019] font-extrabold text-sm">
                        {(r.userName || r.userEmail || "U")[0].toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{r.userName || r.userEmail}</span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
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
    </div>
  );
}
