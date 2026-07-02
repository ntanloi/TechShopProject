import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import ProductCard from "../components/ProductCard";

// === Filter Config ===
const PRICE_RANGES = [
  { label: "Dưới 5 triệu", value: "0-5000000" },
  { label: "5 - 10 triệu", value: "5000000-10000000" },
  { label: "10 - 15 triệu", value: "10000000-15000000" },
  { label: "15 - 20 triệu", value: "15000000-20000000" },
  { label: "20 - 30 triệu", value: "20000000-30000000" },
  { label: "30 - 50 triệu", value: "30000000-50000000" },
  { label: "Trên 50 triệu", value: "50000000-999999999" },
];

const POPULAR_BRANDS = [
  "ASUS", "Acer", "MSI", "Lenovo", "Dell", "HP", "LG", "Apple",
  "Gigabyte", "Samsung", "Logitech", "Razer", "HyperX", "Corsair",
  "Steelseries", "Sony", "JBL", "AKKO", "Keychron", "ViewSonic",
  "AOC", "BenQ", "Xiaomi",
];

const SORT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Giá thấp → cao", value: "price_asc" },
  { label: "Giá cao → thấp", value: "price_desc" },
  { label: "Mới nhất", value: "newest" },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-3 mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full font-bold text-sm text-gray-800 mb-2"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const priceRange = searchParams.get("price") || "";
  const sortBy = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "0");

  useEffect(() => {
    categoryApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    // Parse price range
    let minPrice, maxPrice;
    if (priceRange) {
      const parts = priceRange.split("-").map(Number);
      minPrice = parts[0];
      maxPrice = parts[1];
    }

    // Build unified filter params - backend handles all filters via GET /products
    const params = {
      page,
      size: 20,
      ...(category && { category }),
      ...(minPrice !== undefined && minPrice >= 0 && { minPrice }),
      ...(maxPrice !== undefined && maxPrice > 0 && { maxPrice }),
      ...(brand && { brand }),
      ...(sortBy && { sort: sortBy }),
      ...(search && { keyword: search }),
    };

    productApi.getFiltered(params)
      .then((r) => {
        const data = r.data;
        setProducts(data?.content || data || []);
        setTotalPages(data?.totalPages || 0);
        setTotalItems(data?.totalElements || (data?.content?.length || data?.length || 0));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, category, brand, priceRange, sortBy, page]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    setSearchParams(p);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = search || category || brand || priceRange;

  const activeCategory = categories.find(
    (c) => c.id == category || c.slug === category || c.name?.toLowerCase() === category?.toLowerCase()
  );

  const Filters = () => (
    <div className="space-y-1">
      {/* Categories */}
      <FilterSection title="Danh mục">
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => setParam("category", "")}
            className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition ${!category ? "bg-[#E30019] text-white" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setParam("category", c.slug || c.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition ${
                (category == c.id || category === c.slug) ? "bg-[#E30019] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Thương hiệu">
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {POPULAR_BRANDS.map((b) => (
            <button
              key={b}
              onClick={() => setParam("brand", brand === b ? "" : b)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                brand === b
                  ? "bg-[#E30019] text-white border-[#E30019]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#E30019] hover:text-[#E30019]"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Khoảng giá">
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setParam("price", priceRange === range.value ? "" : range.value)}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-medium transition flex items-center gap-2 ${
                priceRange === range.value ? "bg-[#E30019] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {priceRange === range.value && <span className="h-2 w-2 bg-white rounded-full" />}
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full mt-2 py-2 text-xs font-bold text-[#E30019] border border-[#E30019] rounded hover:bg-red-50 transition flex items-center justify-center gap-1"
        >
          <X className="h-3.5 w-3.5" /> Xóa tất cả bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#F2F2F2] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <span>/</span>
          <span>{activeCategory?.name || (search ? `Tìm kiếm "${search}"` : "Tất cả sản phẩm")}</span>
        </div>

        <div className="flex gap-4">
          {/* === Desktop Sidebar Filter === */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center gap-2 border-b pb-2">
                <SlidersHorizontal className="h-4 w-4 text-[#E30019]" /> Bộ lọc sản phẩm
              </h3>
              <Filters />
            </div>
          </aside>

          {/* === Main Content === */}
          <div className="flex-1 min-w-0">
            {/* Top header bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h1 className="font-extrabold text-base text-gray-900">
                    {search ? `Kết quả tìm kiếm: "${search}"` : activeCategory?.name || "Tất cả sản phẩm"}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">{totalItems} sản phẩm</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Mobile Filter toggle */}
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Bộ lọc
                  </button>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setParam("sort", e.target.value)}
                    className="text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#E30019] text-gray-700"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filters pills */}
              {(brand || priceRange) && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                  {brand && (
                    <span className="flex items-center gap-1 bg-red-50 text-[#E30019] border border-red-200 text-xs font-bold px-2 py-1 rounded-full">
                      {brand}
                      <button onClick={() => setParam("brand", "")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {priceRange && (
                    <span className="flex items-center gap-1 bg-red-50 text-[#E30019] border border-red-200 text-xs font-bold px-2 py-1 rounded-full">
                      {PRICE_RANGES.find(r => r.value === priceRange)?.label}
                      <button onClick={() => setParam("price", "")}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#E30019]" />
                <p className="text-sm font-semibold text-gray-500">Đang tải sản phẩm...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-bold text-gray-600">Không tìm thấy sản phẩm</p>
                <p className="text-sm text-gray-400 mt-1">Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc</p>
                {hasFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 px-6 py-2 bg-[#E30019] text-white font-bold text-sm rounded-lg hover:bg-red-700 transition"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-6">
                <button
                  onClick={() => setParam("page", Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:border-[#E30019] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Trước
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page <= 3) {
                    pageNum = i;
                  } else if (page >= totalPages - 4) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setParam("page", pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition ${
                        pageNum === page
                          ? "bg-[#E30019] text-white shadow"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-[#E30019]"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setParam("page", Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white hover:border-[#E30019] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === Mobile Filter Drawer === */}
      {mobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileFilterOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-72 bg-white z-50 shadow-2xl overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">Bộ lọc sản phẩm</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <Filters />
          </div>
        </>
      )}
    </div>
  );
}
