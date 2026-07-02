import { Link } from "react-router-dom";
import { ChevronRight, Wrench, Shield, CheckCircle } from "lucide-react";

export default function TechnicalSupport() {
  const combos = [
    {
      title: "Combo Lắp Đặt Máy Tính",
      price: "449.000đ",
      desc: "Dành cho khách hàng đã có sẵn các linh kiện rời và cần kỹ thuật viên đến tận nhà lắp ráp hoàn chỉnh, đi dây gọn gàng và cài đặt phần mềm.",
      services: [
        "Kiểm tra tình trạng vật lý của các linh kiện.",
        "Lắp ráp hoàn chỉnh CPU, Mainboard, VGA, RAM, Nguồn, Ổ cứng vào vỏ case.",
        "Đi dây gọn gàng, tối ưu luồng gió tản nhiệt.",
        "Cài đặt hệ điều hành Windows và các Driver cơ bản."
      ],
      warranty: "Bảo hành dịch vụ 7 ngày"
    },
    {
      title: "Combo Bảo Trì Máy Tính",
      price: "549.000đ",
      desc: "Dành cho máy tính cũ cần tối ưu hóa hiệu năng, giảm nhiệt độ hoạt động và loại bỏ triệt để bụi bẩn bám lâu ngày.",
      services: [
        "Kiểm tra tổng quát và chẩn đoán lỗi hệ thống.",
        "Vệ sinh sạch sẽ bụi bẩn linh kiện trong vỏ case PC.",
        "Thay keo tản nhiệt CPU chất lượng cao (MX-4/MX-6).",
        "Tối ưu hóa phần mềm, dọn dẹp file rác hệ điều hành."
      ],
      saving: "Tiết kiệm 25% so với mua lẻ",
      warranty: "Bảo hành dịch vụ 7 ngày"
    },
    {
      title: "Combo Nâng Cấp Thiết Bị",
      price: "649.000đ",
      desc: "Dành cho khách hàng mua thêm linh kiện mới (RAM, SSD, Card màn hình, Fan) cần hỗ trợ thay thế đồng thời vệ sinh bảo trì máy cũ.",
      services: [
        "Vệ sinh làm sạch linh kiện PC cũ.",
        "Lắp đặt linh kiện nâng cấp mới vào hệ thống.",
        "Cài đặt cập nhật driver thiết bị mới tương thích.",
        "Thay keo tản nhiệt CPU cao cấp."
      ],
      saving: "Tiết kiệm 35% so với mua lẻ",
      warranty: "Bảo hành dịch vụ 7 ngày"
    }
  ];

  const singleServices = [
    { name: "Dịch vụ bảo trì phần mềm / cài Windows tại nhà", price: "349.000đ" },
    { name: "Dịch vụ cân màu màn hình chuyên nghiệp (Spyder X)", price: "349.000đ" },
    { name: "Dịch vụ thay thế, nâng cấp linh kiện lẻ", price: "349.000đ" },
    { name: "Dịch vụ vệ sinh PC / Laptop tản nhiệt khí", price: "349.000đ" },
    { name: "Dịch vụ vệ sinh PC sử dụng tản nhiệt nước AIO", price: "399.000đ" },
    { name: "Dịch vụ vệ sinh ghế gaming chất liệu da", price: "349.000đ" },
    { name: "Dịch vụ vệ sinh ghế chất liệu nỉ hoặc lưới công thái học", price: "399.000đ" },
    { name: "Dịch vụ vệ sinh dàn máy nước Custom cao cấp", price: "Từ 2.000.000đ" }
  ];

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-6 px-4 text-gray-800">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Dịch vụ kỹ thuật tại nhà</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 border border-gray-100">
          
          <header className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-xl md:text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 flex items-center justify-center gap-2">
              <Wrench className="h-7 w-7 text-[#E30019]" />
              Dịch Vụ Kỹ Thuật Máy Tính & Vệ Sinh Thiết Bị Tại Nhà
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              TechShop hợp tác cùng các đối tác kỹ thuật chuyên nghiệp mang đến dịch vụ bảo trì PC, cài đặt phần mềm và vệ sinh thiết bị tận nhà chất lượng cao, nhanh chóng và an toàn.
            </p>
          </header>

          {/* Banner */}
          <div className="relative h-44 sm:h-[280px] w-full rounded-xl overflow-hidden mb-10 shadow-sm border border-gray-100">
            <img
              src="/services/dich_vu_hop_tac_gearvn_ald_service.png"
              alt="Dịch vụ kỹ thuật TechShop"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Combos list */}
          <h2 className="text-[#E30019] font-bold text-lg md:text-xl mb-6 uppercase flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
            Các Gói Combo Dịch Vụ Tiết Kiệm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {combos.map((combo, idx) => (
              <div key={idx} className="border rounded-xl p-5 bg-white flex flex-col justify-between hover:shadow-lg hover:border-red-500 transition duration-300">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-extrabold text-base text-gray-900">{combo.title}</h3>
                    {combo.saving && (
                      <span className="text-[9px] bg-red-100 text-[#E30019] px-2 py-0.5 rounded font-black uppercase shrink-0">
                        {combo.saving}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-[#E30019] mb-4">{combo.price}</p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">{combo.desc}</p>
                  
                  <ul className="space-y-2 border-t pt-4">
                    {combo.services.map((srv, sIdx) => (
                      <li key={sIdx} className="flex gap-2 text-xs leading-relaxed text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{srv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-6 border-t pt-3 flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span>{combo.warranty}</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> Đã gồm VAT
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Single services list */}
          <h2 className="text-[#E30019] font-bold text-lg md:text-xl mb-6 uppercase flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
            Bảng Giá Dịch Vụ Lẻ Tham Khảo
          </h2>

          <div className="border rounded-lg overflow-hidden bg-gray-50/50 p-4 border-gray-200 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              {singleServices.map((srv, idx) => (
                <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-100 text-xs sm:text-sm font-semibold">
                  <span className="text-gray-700">{srv.name}</span>
                  <span className="text-[#E30019] whitespace-nowrap">{srv.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8 text-xs sm:text-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-3 uppercase">Thông tin liên hệ kỹ thuật</h3>
              <p className="mb-2"><strong>Số Hotline hỗ trợ:</strong> 0947.266.276 (Nhận yêu cầu từ 8h30 - 18h00)</p>
              <p className="mb-2"><strong>Địa chỉ trụ sở đối tác:</strong> 34/9 Phùng Văn Cung, Phường Cầu Kiệu, Q. Phú Nhuận, TP. Hồ Chí Minh</p>
              <p className="mb-2"><strong>Thời gian xử lý:</strong> Kỹ thuật viên sẽ liên hệ phản hồi đặt lịch hẹn trong vòng tối đa 12 giờ làm việc.</p>
            </div>
            
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-3 uppercase">Quy định và phụ thu</h3>
              <p className="mb-2">• Miễn phí phí di chuyển trong bán kính 20km tính từ trụ sở kỹ thuật.</p>
              <p className="mb-2">• Phụ thu di chuyển từ 21-25km: +50.000đ; từ 26-30km: +100.000đ.</p>
              <p className="mb-2">• Phụ thu hỗ trợ dịch vụ ngoài giờ hành chính (trước 8h30 hoặc sau 18h): +150.000đ.</p>
            </div>
          </div>

          {/* Hotline Box */}
          <div className="mt-8 text-center bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-gray-800">CẦN ĐẶT LỊCH KỸ THUẬT VIÊN ĐẾN TẬN NHÀ?</p>
            <p className="text-lg md:text-xl font-extrabold text-[#E30019]">Liên hệ ngay Hotline hỗ trợ đặt lịch: 0947.266.276</p>
          </div>

        </div>
      </div>
    </div>
  );
}
