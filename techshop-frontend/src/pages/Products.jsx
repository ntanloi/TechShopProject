import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import productApi from "../api/productApi";
import categoryApi from "../api/categoryApi";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "0");

  useEffect(() => {
    categoryApi
      .getAll()
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, size: 12 };

    const fetch = search
      ? productApi.search(search, params)
      : categoryId
        ? productApi.getByCategory(categoryId, params)
        : productApi.getAll(params);

    fetch
      .then((r) => {
        setProducts(r.data?.content || []);
        setTotalPages(r.data?.totalPages || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, categoryId, page]);

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    setSearchParams(p);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
            </h3>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-600 mb-3">
                Danh mục
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setParam("category", "")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${!categoryId ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Tất cả
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setParam("category", c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${categoryId == c.id ? "bg-orange-50 text-orange-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {search
                  ? `Kết quả: "${search}"`
                  : categoryId
                    ? categories.find((c) => c.id == categoryId)?.name ||
                      "Sản phẩm"
                    : "Tất cả sản phẩm"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {products.length} sản phẩm
              </p>
            </div>

            {/* Search bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setParam("search", e.target.q.value);
              }}
              className="flex gap-2 w-full sm:w-auto"
            >
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  name="q"
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Tìm sản phẩm..."
                />
              </div>
              {search && (
                <button
                  type="button"
                  onClick={() => setParam("search", "")}
                  className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </form>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
              <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setParam("page", i)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition ${i === page ? "bg-orange-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
