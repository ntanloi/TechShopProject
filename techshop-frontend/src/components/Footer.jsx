import { Link } from "react-router-dom";
import { Zap, Mail, Phone, MapPin, Facebook, Youtube, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white">Tech<span className="text-orange-400">Shop</span></span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Thiết bị điện tử chính hãng, giá tốt nhất. Giao hàng nhanh toàn quốc.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-gray-800 hover:bg-orange-500 rounded-lg transition"><Facebook className="h-4 w-4" /></a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-orange-500 rounded-lg transition"><Youtube className="h-4 w-4" /></a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-orange-500 rounded-lg transition"><Instagram className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Sản phẩm</h3>
            <ul className="space-y-2 text-sm">
              {["Điện thoại", "Laptop", "Máy tính bảng", "Tai nghe", "Phụ kiện"].map((item) => (
                <li key={item}>
                  <Link to="/products" className="hover:text-orange-400 transition">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Chính sách đổi trả", to: "/" },
                { label: "Hướng dẫn mua hàng", to: "/" },
                { label: "Theo dõi đơn hàng", to: "/orders" },
                { label: "Liên hệ hỗ trợ", to: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="hover:text-orange-400 transition">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                <span>123 Nguyễn Văn Linh, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-400 shrink-0" />
                <span>1800-xxxx (Miễn phí)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-400 shrink-0" />
                <span>support@techshop.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2025 TechShop. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-orange-400 transition">Chính sách bảo mật</Link>
            <Link to="/" className="hover:text-orange-400 transition">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
