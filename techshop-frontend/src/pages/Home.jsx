import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import productApi from "../api/productApi";
import CategorySidebar from "../components/CategorySidebar";
import HeroCarousel from "../components/HeroCarousel";
import { TopPromoRow, BottomWideRow } from "../components/BottomBanners";
import ProductType from "../components/ProductType";
import CategoryMenuBottom from "../components/CategoryMenuBottom";
import SideFloatBanners from "../components/SideFloatBanners";
import { ProductGrid } from "../components/ProductList";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch featured products for the recommendation section at bottom
    productApi.getAll({ size: 20, page: 0 })
      .then((r) => {
        setProducts(r.data?.content || r.data || []);
      })
      .catch((err) => {
        console.error("Error fetching homepage products:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F2] pb-8">
      {/* Sticky side float banners (xl screens only) */}
      <SideFloatBanners />
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-4">
        <section className="rounded-xl bg-white p-5 border border-gray-100 shadow-sm">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            TechShop - Hệ Thống Thiết Bị Công Nghệ Cao Cấp Chính Hãng
          </h1>
          <p className="mt-2 text-xs md:text-sm leading-relaxed text-gray-600">
            Chào mừng bạn đến với TechShop! Khám phá kho laptop văn phòng, laptop gaming hiệu năng cao, 
            PC lắp ráp GearVN đồng bộ, màn hình hiển thị chính hãng, linh kiện nâng cấp (VGA, CPU, RAM) và 
            phụ kiện gaming gear đẳng cấp. Chúng tôi cam kết hàng chính hãng 100%, bảo hành uy tín 12-24 tháng 
            và dịch vụ hỗ trợ kỹ thuật tận nơi tiện lợi.
          </p>
        </section>

        {/* Categories Menu Sidebar & Hero Carousel Slider */}
        <div className="mt-4 flex flex-row gap-4 items-start w-full">
          <CategorySidebar />
          <div className="flex-1 min-w-0">
            <HeroCarousel />
            <TopPromoRow />
          </div>
        </div>

        {/* Auxiliary Promo Banners */}
        <div className="mt-4">
          <BottomWideRow />
        </div>

        {/* Video Catalog Showcases - fetch per category */}
        <div className="mt-4">
          <ProductType />
        </div>

        {/* All Products catalog list */}
        <section className="mt-6 rounded-xl bg-white p-5 border border-gray-100 shadow-sm">
          <div className="border-b border-gray-100 pb-3 mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
                Gợi Ý Sản Phẩm Dành Cho Bạn
              </h2>
              <p className="text-xs text-gray-500 mt-1">Tổng cộng có {products.length} sản phẩm mới nhất được đề xuất</p>
            </div>
            <Link to="/products" className="text-[#E30019] hover:underline text-xs font-semibold">
              Xem tất cả sản phẩm →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-base font-semibold">Chưa có sản phẩm nào được nhập</p>
              <p className="text-xs mt-1 text-gray-400">Hệ thống đang đồng bộ dữ liệu tự động...</p>
            </div>
          ) : (
            <ProductGrid products={products.slice(0, 15)} />
          )}
        </section>

        {/* Circle Icons Grid Category menu bottom */}
        <CategoryMenuBottom />
      </div>
    </div>
  );
}
