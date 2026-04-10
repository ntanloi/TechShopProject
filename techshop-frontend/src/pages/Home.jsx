import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Shield, Truck, Headphones, ChevronRight, Star, ArrowRight } from "lucide-react";
import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import ProductCard from "../components/ProductCard";

const CATEGORY_ICONS = {
  "Điện thoại": "📱",
  "Laptop": "💻",
  "Máy tính bảng": "📟",
  "Tai nghe": "🎧",
  "Phụ kiện": "🔌",
  "Màn hình": "🖥️",
  "Camera": "📷",
  "Smartwatch": "⌚",
};

const BANNERS = [
  {
    title: "iPhone 15 Pro Max",
    subtitle: "Chip A17 Pro mạnh mẽ nhất từ trước đến nay",
    badge: "Mới nhất 2024",
    bg: "from-gray-900 via-gray-800 to-gray-900",
    accent: "text-blue-400",
    cta: "Mua ngay",
    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702708",
  },
  {
    title: "MacBook Air M3",
    subtitle: "Mỏng nhẹ, hiệu năng vượt trội với chip M3",
    badge: "Giảm 10%",
    bg: "from-slate-900 via-blue-950 to-slate-900",
    accent: "text-cyan-400",
    cta: "Khám phá",
    img: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banner, setBanner] = useState(0);

  useEffect(() => {
    productApi.getAll({ size: 8 }).then((r) => setProducts(r.data?.content || [])).catch(() => {});
    categoryApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});

    const t = setInterval(() => setBanner((b) => (b + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const b = BANNERS[banner];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== HERO BANNER ===== */}
      <section className={`bg-gradient-to-r ${b.bg} text-white transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <span className={`inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium ${b.accent}`}>
              {b.badge}
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">{b.title}</h1>
            <p className="text-lg text-gray-300 max-w-lg">{b.subtitle}</p>
            <div className="flex gap-4">
              <Link to="/products" className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg transition flex items-center gap-2">
                {b.cta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/products" className="px-8 py-3 border border-white/30 hover:bg-white/10 text-white font-semibold rounded-xl transition">
                Xem tất cả
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img src={b.img} alt={b.title} className="max-h-72 lg:max-h-96 object-contain drop-shadow-2xl" />
          </div>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-2 pb-6">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBanner(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === banner ? "bg-orange-400 w-6" : "bg-white/30"}`} />
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Giao hàng nhanh", desc: "Toàn quốc 2-3 ngày" },
            { icon: Shield, title: "Hàng chính hãng", desc: "Bảo hành 12-24 tháng" },
            { icon: Zap, title: "Giá tốt nhất", desc: "Cam kết giá cạnh tranh" },
            { icon: Headphones, title: "Hỗ trợ 24/7", desc: "Tư vấn miễn phí" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-xl shrink-0">
                <Icon className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Danh mục sản phẩm</h2>
            <Link to="/categories" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {categories.slice(0, 8).map((cat) => (
              <Link key={cat.id} to={`/products?category=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-md transition group">
                <span className="text-3xl">{CATEGORY_ICONS[cat.name] || "📦"}</span>
                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-orange-500 transition line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
            <p className="text-gray-500 text-sm mt-1">Những sản phẩm được yêu thích nhất</p>
          </div>
          <Link to="/products" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Chưa có sản phẩm nào</p>
            <p className="text-sm mt-2">Admin hãy thêm sản phẩm để hiển thị tại đây</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ===== PROMO BANNER ===== */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 lg:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl lg:text-3xl font-extrabold">Đăng ký nhận ưu đãi độc quyền</h2>
            <p className="text-orange-100">Giảm ngay 100.000₫ cho đơn hàng đầu tiên khi đăng ký tài khoản</p>
          </div>
          <Link to="/register"
            className="shrink-0 px-8 py-3 bg-white text-orange-500 font-bold rounded-xl hover:bg-orange-50 transition shadow-lg">
            Đăng ký ngay →
          </Link>
        </div>
      </section>

      {/* ===== WHY TECHSHOP ===== */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-10">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Tại sao chọn <span className="text-orange-500">TechShop?</span></h2>
            <p className="text-gray-500 mt-2">Cam kết mang đến trải nghiệm mua sắm tốt nhất</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: "🏆", title: "Hàng chính hãng 100%", desc: "Tất cả sản phẩm đều có tem chính hãng, hóa đơn VAT đầy đủ." },
              { emoji: "💰", title: "Giá cạnh tranh nhất", desc: "Cam kết hoàn tiền nếu tìm thấy giá rẻ hơn trong 7 ngày." },
              { emoji: "🚀", title: "Giao hàng siêu tốc", desc: "Giao hàng trong ngày tại TP.HCM, 2-3 ngày toàn quốc." },
            ].map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 text-left hover:shadow-md transition">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
