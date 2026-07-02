import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MapPin, Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  const [openSections, setOpenSections] = useState({
    about: false,
    policy: false,
    info: false,
    support: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="bg-white border-t border-gray-200 text-gray-800 text-xs sm:text-sm mt-8 py-8 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8 pb-6 border-b border-gray-200">
          
          {/* Về TechShop */}
          <div className="border-b border-gray-100 md:border-none pb-4 md:pb-0">
            <div 
              onClick={() => toggleSection("about")}
              className="flex justify-between items-center cursor-pointer md:cursor-default"
            >
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                Về TechShop
              </h4>
              <ChevronDown className={`h-4 w-4 md:hidden transition-transform duration-300 ${openSections.about ? "rotate-180" : ""}`} />
            </div>
            <ul className={`mt-2 space-y-2.5 font-medium text-gray-600 ${openSections.about ? "block" : "hidden md:block"}`}>
              <li>
                <Link to="/about" className="hover:text-[#E30019] transition">Giới thiệu TechShop</Link>
              </li>
              <li>
                <Link to="/showroom" className="hover:text-[#E30019] transition">Hệ thống showroom</Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-[#E30019] transition">Tin tức công nghệ</Link>
              </li>
            </ul>
          </div>

          {/* Chính sách */}
          <div className="border-b border-gray-100 md:border-none pb-4 md:pb-0">
            <div 
              onClick={() => toggleSection("policy")}
              className="flex justify-between items-center cursor-pointer md:cursor-default"
            >
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                Chính Sách
              </h4>
              <ChevronDown className={`h-4 w-4 md:hidden transition-transform duration-300 ${openSections.policy ? "rotate-180" : ""}`} />
            </div>
            <ul className={`mt-2 space-y-2.5 font-medium text-gray-600 ${openSections.policy ? "block" : "hidden md:block"}`}>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#E30019] transition">Chính sách bảo mật</Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-[#E30019] transition">Điều khoản dịch vụ</Link>
              </li>
              <li>
                <Link to="/trade-in-pricing" className="hover:text-[#E30019] transition">Chính sách thu cũ đổi mới</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E30019] transition">Chính sách giao hàng</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E30019] transition">Chính sách bảo hành</Link>
              </li>
            </ul>
          </div>

          {/* Thông tin */}
          <div className="border-b border-gray-100 md:border-none pb-4 md:pb-0">
            <div 
              onClick={() => toggleSection("info")}
              className="flex justify-between items-center cursor-pointer md:cursor-default"
            >
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                Thông Tin Hỗ Trợ
              </h4>
              <ChevronDown className={`h-4 w-4 md:hidden transition-transform duration-300 ${openSections.info ? "rotate-180" : ""}`} />
            </div>
            <ul className={`mt-2 space-y-2.5 font-medium text-gray-600 ${openSections.info ? "block" : "hidden md:block"}`}>
              <li>
                <Link to="/" className="hover:text-[#E30019] transition">Hướng dẫn mua hàng</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#E30019] transition">Theo dõi đơn hàng</Link>
              </li>
              <li>
                <Link to="/on-site-technical-support" className="hover:text-[#E30019] transition">Hỗ trợ kỹ thuật tại nhà</Link>
              </li>
              <li>
                <Link to="/warranty-lookup" className="hover:text-[#E30019] transition">Tra cứu bảo hành chính hãng</Link>
              </li>
            </ul>
          </div>

          {/* Tổng đài hỗ trợ */}
          <div className="border-b border-gray-100 md:border-none pb-4 md:pb-0">
            <div 
              onClick={() => toggleSection("support")}
              className="flex justify-between items-center cursor-pointer md:cursor-default"
            >
              <h4 className="font-extrabold text-gray-900 uppercase tracking-wider mb-2">
                Tổng Đài Hỗ Trợ (Free)
              </h4>
              <ChevronDown className={`h-4 w-4 md:hidden transition-transform duration-300 ${openSections.support ? "rotate-180" : ""}`} />
            </div>
            <div className={`mt-2 space-y-3 font-semibold text-gray-700 ${openSections.support ? "block" : "hidden md:block"}`}>
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium text-xs">Tư vấn mua hàng:</span>
                <a href="tel:18006975" className="text-[#E30019] hover:underline font-bold text-sm">1800.6975 (Phím 1)</a>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium text-xs">Chăm sóc & Khiếu nại:</span>
                <a href="tel:18006975" className="text-[#E30019] hover:underline font-bold text-sm">1800.6975 (Phím 2)</a>
              </div>
            </div>
          </div>

          {/* Vận chuyển & Thanh toán */}
          <div className="pb-4 md:pb-0">
            <h4 className="font-extrabold text-gray-900 uppercase tracking-wider mb-2">
              Đối Tác & Thanh Toán
            </h4>
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1.5 tracking-wider">Đơn vị vận chuyển</p>
                <div className="flex gap-2">
                  <img src="/footer_ship_1.png" alt="Ship Giao Hàng Nhanh" className="h-6 w-auto object-contain bg-gray-50 p-1 border rounded" />
                  <img src="/footer_ship_2.png" alt="Ship Ninja Van" className="h-6 w-auto object-contain bg-gray-50 p-1 border rounded" />
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1.5 tracking-wider">Phương thức thanh toán</p>
                <div className="flex gap-2 flex-wrap">
                  <img src="/footer_momo_icon_payment.png" alt="Thanh toán MoMo" className="h-7 w-auto object-contain bg-gray-50 p-1 border rounded" />
                  <img src="/footer_cash_icon_payment.png" alt="Thanh toán tiền mặt" className="h-7 w-auto object-contain bg-gray-50 p-1 border rounded" />
                  <img src="/footer_visa_icon_payment.png" alt="Thanh toán Visa" className="h-7 w-auto object-contain bg-gray-50 p-1 border rounded" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Copy right row */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-gray-500">
          <p>© 2026 TechShop System. Thiết kế và phát triển bởi Antigravity.</p>
          <div className="flex gap-5 text-gray-400">
            <span>Giấy phép ĐKKD số: 0312345678</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              <Globe className="h-4.5 w-4.5 text-gray-400" /> Vietnam
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
