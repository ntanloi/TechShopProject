import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productApi from "../api/productApi";
import ProductCard from "../components/ProductCard";

const TABS = [
  { key: "laptop-gaming", label: "Laptop\nGaming", sectionId: "laptop-gaming" },
  { key: "laptop", label: "Laptop\nVăn Phòng", sectionId: "laptop-office" },
  { key: "pc-gvn", label: "PC\nGVN", sectionId: "pc-gvn" },
  { key: "man-hinh", label: "Màn\nHình", sectionId: "monitor" },
];

const PRICE_SECTIONS = [
  { id: "best-seller", title: "Best Seller", category: "laptop-gaming", sort: "best-seller" },
  { id: "under-25", title: "Dưới 25 triệu", category: "laptop-gaming", maxPrice: 25000000 },
  { id: "under-30", title: "Dưới 30 triệu", category: "laptop-gaming", maxPrice: 30000000 },
  { id: "over-30", title: "Trên 30 triệu", category: "laptop-gaming", minPrice: 30000001 },
];

function SectionTitle({ title }) {
  return (
    <div className="mx-auto mb-6 flex justify-center px-4">
      <div className="rounded-2xl border border-zinc-500 bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-800 px-8 py-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
        <div className="text-2xl font-extrabold uppercase tracking-wide text-white md:text-4xl">
          {title}
        </div>
      </div>
    </div>
  );
}

function ProductSection({ id, title, category, maxPrice, minPrice }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = {
      category,
      size: 5,
      page: 0,
      ...(maxPrice && { maxPrice }),
      ...(minPrice && { minPrice }),
    };
    setLoading(true);
    productApi
      .getFiltered(params)
      .then((r) => {
        const data = r.data;
        setProducts((data?.content || data || []).slice(0, 5));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, maxPrice, minPrice]);

  if (!loading && products.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-8">
      <SectionTitle title={title} />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 max-w-[1280px] mx-auto">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-zinc-800 rounded-lg mb-3" />
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile horizontal scroll */}
          <div className="md:hidden flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
            {products.map((p) => (
              <div key={p.id} className="w-[160px] shrink-0 snap-start">
                <ProductCard product={p} darkMode />
              </div>
            ))}
          </div>

          {/* Desktop grid */}
          <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 max-w-[1280px] mx-auto">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center mt-6">
        <Link
          to={`/products?category=${category}${maxPrice ? `&maxPrice=${maxPrice}` : ""}${minPrice ? `&minPrice=${minPrice}` : ""}`}
          className="rounded-2xl border border-cyan-900 bg-[radial-gradient(circle_at_top,rgba(70,170,220,0.35),rgba(10,18,30,0.95))] px-7 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(34,211,238,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_0_22px_rgba(34,211,238,0.28)]"
        >
          Xem Thêm
        </Link>
      </div>
    </section>
  );
}

export default function HotDealsGaming() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[260px] sm:h-[360px] md:h-[480px] bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(227,0,25,0.3),transparent_70%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">
            Hot Deals
          </h1>
          <p className="mt-3 text-sm sm:text-lg text-zinc-300 font-semibold tracking-widest uppercase">
            Laptop Gaming — PC — Màn Hình
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {TABS.map((tab) => (
              <a
                key={tab.key}
                href={`#${tab.sectionId}`}
                className="flex items-center justify-center min-h-[44px] rounded-xl border border-cyan-900 bg-[radial-gradient(circle_at_top,rgba(70,170,220,0.35),rgba(10,18,30,0.95))] px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-[0_0_12px_rgba(34,211,238,0.14)] transition hover:-translate-y-0.5"
              >
                {tab.label.split("\n").map((line, i) => (
                  <span key={i} className="block leading-tight">{line}</span>
                ))}
              </a>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* Product sections */}
      <div
        className="min-h-screen"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,.92), rgba(10,10,20,.98))",
        }}
      >
        {PRICE_SECTIONS.map((section) => (
          <ProductSection key={section.id} {...section} />
        ))}

        {/* CTA footer */}
        <div className="text-center py-12 px-4">
          <p className="text-zinc-400 text-sm mb-4">Xem toàn bộ sản phẩm TechShop</p>
          <Link
            to="/products"
            className="inline-block rounded-2xl border border-[#E30019] bg-[#E30019] px-8 py-3 text-base font-black text-white shadow-lg transition hover:bg-red-700 hover:-translate-y-0.5"
          >
            Xem Tất Cả Sản Phẩm
          </Link>
        </div>
      </div>
    </div>
  );
}
