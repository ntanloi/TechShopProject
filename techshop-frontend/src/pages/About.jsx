import { Zap, Shield, Truck, Headphones, Users, Award } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-orange-500 rounded-2xl"><Zap className="h-8 w-8" /></div>
            <span className="text-4xl font-extrabold">TechShop</span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold mb-4">Thiết bị điện tử <span className="text-orange-400">chính hãng</span></h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            TechShop là nền tảng mua sắm thiết bị điện tử hàng đầu Việt Nam, cam kết mang đến sản phẩm chính hãng với giá tốt nhất.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { value: "10K+", label: "Sản phẩm" },
            { value: "500K+", label: "Khách hàng" },
            { value: "50+", label: "Thương hiệu" },
            { value: "99%", label: "Hài lòng" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-orange-500">{value}</p>
              <p className="text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Cam kết của chúng tôi</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Hàng chính hãng 100%", desc: "Tất cả sản phẩm đều có tem chính hãng, hóa đơn VAT đầy đủ, bảo hành theo nhà sản xuất." },
              { icon: Truck, title: "Giao hàng nhanh chóng", desc: "Giao hàng trong ngày tại TP.HCM, 2-3 ngày toàn quốc. Miễn phí vận chuyển cho đơn từ 500K." },
              { icon: Headphones, title: "Hỗ trợ 24/7", desc: "Đội ngũ tư vấn chuyên nghiệp sẵn sàng hỗ trợ bạn mọi lúc qua hotline, chat và email." },
              { icon: Award, title: "Giá tốt nhất", desc: "Cam kết hoàn tiền chênh lệch nếu bạn tìm thấy giá rẻ hơn trong vòng 7 ngày sau khi mua." },
              { icon: Users, title: "Cộng đồng tin cậy", desc: "Hơn 500.000 khách hàng tin tưởng lựa chọn TechShop là địa chỉ mua sắm công nghệ." },
              { icon: Zap, title: "Trải nghiệm mượt mà", desc: "Giao diện thân thiện, thanh toán an toàn, theo dõi đơn hàng realtime." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="p-3 bg-orange-50 rounded-xl w-fit mb-4"><Icon className="h-6 w-6 text-orange-500" /></div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
