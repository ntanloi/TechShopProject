import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import productApi from "../api/productApi";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = [
  {
    title: "Laptop Học tập & Văn phòng",
    categorySlug: "laptop",
    href: "/products?category=laptop",
    video: ["/product/laptop_dell.mp4"],
  },
  {
    title: "Laptop Gaming Hiệu Năng Cao",
    categorySlug: "laptop-gaming",
    href: "/products?category=laptop-gaming",
    video: [
      "/product/laptopgaming_acer.mp4",
      "/product/laptopgaming_asus.mp4",
      "/product/laptopgaming_dell.mp4",
    ],
  },
  {
    title: "PC GVN Lắp Ráp & Đồng Bộ",
    categorySlug: "pc-gvn",
    href: "/products?category=pc-gvn",
    video: [
      "/product/PC.mp4",
      "/product/PC_1.mp4",
      "/product/PC_2.mp4",
      "/product/PC_4.mp4",
    ],
  },
  {
    title: "Bàn Phím Cơ & Văn Phòng",
    categorySlug: "ban-phim",
    href: "/products?category=ban-phim",
    video: [
      "/product/keyboard.mp4",
      "/product/keyboard_1.mp4",
      "/product/keyboard_2.mp4",
      "/product/keyboard_3.mp4",
      "/product/keyboard_4.mp4",
    ],
  },
  {
    title: "Màn Hình Hiển Thị Chính Hãng",
    categorySlug: "man-hinh",
    href: "/products?category=man-hinh",
    video: [
      "/product/monitor.mp4",
      "/product/monitor_1.mp4",
    ],
  },
];

function CategoryRow({ item }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    productApi
      .getAll({ category: item.categorySlug, size: 12, page: 0 })
      .then((r) => {
        const data = r.data;
        setProducts(data?.content || data || []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [item.categorySlug]);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: "smooth" });
    }
  };
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: "smooth" });
    }
  };

  const currentVideo = item.video[videoIndex];

  if (!loading && products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Video Banner */}
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="relative h-48 md:h-[280px] overflow-hidden flex items-center justify-center bg-black"
      >
        {currentVideo && (
          <video
            key={currentVideo}
            className="w-full h-full object-cover opacity-90"
            autoPlay
            muted
            playsInline
            onEnded={() =>
              setVideoIndex((prev) => (prev + 1) % item.video.length)
            }
          >
            <source src={currentVideo} type="video/mp4" />
          </video>
        )}
        {hovering && (
          <Link
            to={item.href}
            className="absolute bg-white/20 hover:bg-[#E30019] text-white font-extrabold text-sm md:text-base px-6 py-2 rounded-full border-2 border-white/80 hover:border-transparent transition-all backdrop-blur-sm shadow-lg tracking-wider"
          >
            XEM CHI TIẾT
          </Link>
        )}
      </div>

      {/* Product Carousel */}
      <div className="p-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-2">
          <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
            {item.title}
          </h2>
          <Link to={item.href} className="text-[#E30019] hover:underline text-xs font-semibold">
            Xem tất cả →
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="min-w-[200px] animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={scrollLeft}
              className="hidden lg:flex absolute -left-3 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md w-8 h-8 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollRight}
              className="hidden lg:flex absolute -right-3 top-1/2 z-10 -translate-y-1/2 bg-white shadow-md w-8 h-8 rounded-full border border-gray-200 items-center justify-center hover:bg-gray-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scroll-smooth snap-x scrollbar-hide py-2 px-1"
            >
              {products.map((p) => (
                <div key={p.id} className="min-w-[190px] max-w-[190px] snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductType() {
  return (
    <div className="flex flex-col gap-5">
      {CATEGORIES.map((item) => (
        <CategoryRow key={item.categorySlug} item={item} />
      ))}
    </div>
  );
}
