import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import productApi from "../api/productApi";

function formatPrice(price) {
  if (price === undefined || price === null) return "0đ";
  return `${price.toLocaleString("vi-VN")}đ`;
}

export default function SearchBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wrapperRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKeyword(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce API call for search autocomplete
  useEffect(() => {
    const term = keyword.trim();
    if (!term) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await productApi.search(term, { size: 6 });
        const list = response.data?.content || response.data || [];
        setSuggestions(list);
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    setOpen(false);
    if (!q) {
      navigate("/products");
      return;
    }
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => {
            const val = e.target.value;
            setKeyword(val);
            setOpen(Boolean(val.trim()));
          }}
          onFocus={() => {
            if (keyword.trim()) setOpen(true);
          }}
          placeholder="Bạn cần tìm gì?"
          className="h-10 lg:h-11 w-full rounded-[6px] bg-white px-4 pr-12 text-[14px] text-black outline-none placeholder:text-gray-500 border border-gray-200 focus:border-red-500 transition"
        />

        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="absolute right-0 top-0 flex h-10 w-10 lg:h-11 lg:w-13 items-center justify-center rounded-r-[6px] bg-white text-black hover:bg-gray-50 border-l border-gray-200"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </button>
      </form>

      {open && keyword.trim() && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-[200] w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl">
          {loading ? (
            <div className="px-4 py-4 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
              Đang tìm kiếm...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                {suggestions.map((product) => {
                  const finalPrice = product.salePrice || product.price;
                  const hasSale =
                    typeof product.salePrice === "number" &&
                    product.salePrice < product.price;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-gray-900">
                          {product.name}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-red-600">
                            {formatPrice(finalPrice)}
                          </span>

                          {hasSale && (
                            <span className="text-[12px] text-gray-400 line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-gray-100 bg-white flex items-center justify-center p-1">
                        <img
                          src={product.imageUrl || "/placeholder.png"}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <Link
                to={`/products?search=${encodeURIComponent(keyword.trim())}`}
                onClick={() => setOpen(false)}
                className="block bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-red-600 hover:bg-gray-100 border-t border-gray-100"
              >
                Xem tất cả kết quả cho "{keyword}"
              </Link>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-gray-500">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
