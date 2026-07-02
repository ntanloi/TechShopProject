import { useState } from "react";
import { Link } from "react-router-dom";
import { tradeInTables } from "../data/tradeInPriceData";

export default function TradeInPricing() {
  const [activeTab, setActiveTab] = useState("vga");

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-6 px-4">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <span>/</span>
          <span>Thu cũ đổi mới</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 border border-gray-100 text-gray-800">
          
          <h1 className="text-xl md:text-3xl font-black text-gray-900 text-center uppercase tracking-tight mb-6 flex items-center justify-center gap-2">
            <span className="w-2.5 h-7 bg-[#E30019] rounded-full inline-block" />
            Chính Sách & Bảng Giá Thu Cũ Đổi Mới Linh Kiện Máy Tính
          </h1>

          <p className="my-3 text-sm md:text-base leading-relaxed">
            TechShop chính thức cung cấp dịch vụ <span className="font-bold text-[#E30019]">&quot;Thu cũ đổi mới&quot;</span> nhằm hỗ trợ khách hàng lên đời, nâng cấp linh kiện máy tính với mức chi phí tối ưu và thủ tục nhanh gọn nhất.
          </p>

          <p className="my-3 text-sm md:text-base leading-relaxed">
            Các nhóm linh kiện áp dụng chương trình bao gồm: <span className="font-bold text-gray-900">Card màn hình (VGA), Bộ vi xử lý (CPU) và Bo mạch chủ (Mainboard)</span> cũ của các thương hiệu phổ biến.
          </p>

          {/* Alert Notice block */}
          <div className="my-6 border-l-4 border-[#E30019] bg-red-50/50 p-4 rounded-r-lg">
            <p className="italic text-sm text-[#E30019] font-medium">
              * Lưu ý quan trọng: TechShop chỉ hỗ trợ thu lại linh kiện cũ khi quý khách mua sản phẩm mới tương ứng tại cửa hàng. Chúng tôi hiện chưa cung cấp dịch vụ thu mua lẻ linh kiện cũ không đổi mới.
            </p>
          </div>

          <h2 className="text-[#E30019] font-bold text-lg md:text-xl mb-4 uppercase">
            Bảng Giá Thu Mua Tham Khảo
          </h2>

          {/* Navigation tabs */}
          <div className="flex border-b mb-6 gap-2">
            {Object.keys(tradeInTables).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-2.5 font-bold text-sm uppercase rounded-t-lg transition ${
                  activeTab === key
                    ? "bg-[#E30019] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {key === "vga" ? "Card đồ họa (VGA)" : key === "cpu" ? "Bộ vi xử lý (CPU)" : "Bo mạch chủ"}
              </button>
            ))}
          </div>

          {/* Table container */}
          <div className="border rounded-lg overflow-hidden max-w-full">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#E30019] text-white sticky top-0 z-10">
                  <tr>
                    {tradeInTables[activeTab].columns.map((col, index) => (
                      <th
                        key={index}
                        className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {tradeInTables[activeTab].rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50 hover:bg-red-50/20 transition"}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-5 py-3 text-[13px] text-gray-700 font-medium"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="my-6 italic bg-gray-50 border-l-4 border-gray-300 p-4 text-xs md:text-sm text-gray-600 space-y-1 rounded-r-lg">
            <p>• Mức giá thu mua thực tế sẽ dao động tùy thuộc vào biến động thị trường linh kiện.</p>
            <p>• Mức giá chính xác sẽ được xác định sau khi nhân viên kỹ thuật kiểm tra thực tế tình trạng ngoại hình, hiệu năng hoạt động của thiết bị tại showroom.</p>
          </div>

          {/* Policy content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t pt-8">
            <div>
              <h3 className="text-gray-900 font-bold text-base md:text-lg mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#E30019] inline-block" />
                Quy Trình 3 Bước Lên Đời
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm leading-relaxed text-gray-600 font-medium">
                <li>Mang linh kiện cũ qua trực tiếp các Showroom TechShop.</li>
                <li>Bộ phận Kỹ thuật kiểm tra chức năng (Test hiệu năng, nhiệt độ) trong 15-30 phút.</li>
                <li>Nhân viên tư vấn định giá, bù trừ trực tiếp tiền vào hóa đơn mua linh kiện mới của bạn.</li>
              </ol>
            </div>

            <div>
              <h3 className="text-gray-900 font-bold text-base md:text-lg mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#E30019] inline-block" />
                Điều Kiện Thu Mua Linh Kiện Cũ
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed text-gray-600 font-medium">
                <li>Thiết bị còn hoạt động bình thường, không gãy vỡ hay nứt mạch.</li>
                <li>Chưa qua sửa chữa tự ý ngoài các tiêu chuẩn của hãng sản xuất.</li>
                <li>Linh kiện không bị rỉ sét nặng hoặc biến dạng do cháy nổ nguồn điện.</li>
              </ul>
            </div>
          </div>

          {/* Hotline section */}
          <div className="mt-8 text-center bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-gray-800">CẦN TƯ VẤN THÊM VỀ CHÍNH SÁCH THU CŨ ĐỔI MỚI?</p>
            <p className="text-lg md:text-xl font-extrabold text-[#E30019]">Gọi ngay Hotline miễn phí: 1800.6975</p>
          </div>

        </div>
      </div>
    </div>
  );
}
