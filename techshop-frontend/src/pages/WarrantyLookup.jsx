import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { southWarrantyCenters, northWarrantyCenters } from "../data/warrantyCenters";

export default function WarrantyLookup() {
  const [activeTab, setActiveTab] = useState("warranty");
  const [phone, setPhone] = useState("");
  const [warrantyCode, setWarrantyCode] = useState("");
  const [imei, setImei] = useState("");

  const handleWarrantyLookup = () => {
    alert(
      `[Tra cứu hệ thống] Hiện tại đây là dữ liệu mô phỏng bảo hành.\nSố điện thoại: ${phone}\nMã phiếu bảo hành: ${warrantyCode}`
    );
  };

  const handleImeiLookup = () => {
    alert(`[Tra cứu hệ thống] Hiện tại đây là dữ liệu mô phỏng bảo hành.\nSố IMEI thiết bị: ${imei}`);
  };

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-6 px-4 text-gray-800">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Tra cứu bảo hành</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 border border-gray-100">
          <h1 className="text-xl md:text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-7 bg-[#E30019] rounded-full inline-block" />
            Trung tâm hỗ trợ tra cứu thông tin bảo hành sản phẩm chính hãng
          </h1>

          {/* Mode Tabs */}
          <div className="flex border-b mb-6 gap-2">
            <button
              onClick={() => setActiveTab("warranty")}
              className={`px-6 py-3 font-bold text-sm uppercase rounded-t-lg transition ${
                activeTab === "warranty"
                  ? "bg-[#E30019] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tra cứu phiếu bảo hành
            </button>
            <button
              onClick={() => setActiveTab("imei")}
              className={`px-6 py-3 font-bold text-sm uppercase rounded-t-lg transition ${
                activeTab === "imei"
                  ? "bg-[#E30019] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tra cứu IMEI
            </button>
          </div>

          {/* Form input sections */}
          {activeTab === "warranty" ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Quý khách vui lòng nhập đầy đủ Số điện thoại & Mã phiếu bảo hành (bắt buộc) để truy xuất dữ liệu:
              </p>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Số điện thoại đăng ký"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded focus:border-[#E30019] outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Mã phiếu bảo hành"
                  value={warrantyCode}
                  onChange={(e) => setWarrantyCode(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded focus:border-[#E30019] outline-none bg-white"
                />
                <button
                  onClick={handleWarrantyLookup}
                  className="px-8 py-3 bg-[#E30019] hover:bg-red-700 text-white font-bold text-sm rounded transition"
                >
                  TRA CỨU NGAY
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
              <p className="text-sm font-semibold text-gray-700 mb-4">
                Quý khách vui lòng nhập số IMEI của thiết bị để tra cứu hạn bảo hành điện tử:
              </p>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Nhập số IMEI sản phẩm"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded focus:border-[#E30019] outline-none bg-white"
                />
                <button
                  onClick={handleImeiLookup}
                  className="px-8 py-3 bg-[#E30019] hover:bg-red-700 text-white font-bold text-sm rounded transition"
                >
                  TRA CỨU NGAY
                </button>
              </div>
            </div>
          )}

          <div className="prose max-w-none text-xs md:text-sm leading-relaxed text-gray-600 space-y-4">
            <p>
              TechShop xin chân thành xin lỗi vì sự cố không mong muốn đối với thiết bị của Quý khách. Để tiết kiệm thời gian đi lại và đảm bảo thiết bị được kiểm tra đúng quy chuẩn, quý khách có thể gửi bảo hành trực tiếp tại các trung tâm bảo hành chính hãng được liệt kê bên dưới.
            </p>

            {/* South table */}
            <WarrantyTableBlock
              title="TechShop - Địa chỉ bảo hành khu vực Miền Nam"
              rows={southWarrantyCenters}
            />

            {/* North table */}
            <WarrantyTableBlock
              title="TechShop - Địa chỉ bảo hành khu vực Miền Bắc"
              rows={northWarrantyCenters}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

function WarrantyTableBlock({ title, rows }) {
  return (
    <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b px-4 py-3 font-bold text-gray-800 text-sm md:text-base">
        {title}
      </div>
      <div className="overflow-x-auto max-h-[400px]">
        <table className="min-w-[900px] w-full text-left text-xs md:text-sm">
          <thead className="bg-red-50 text-[#E30019] font-bold sticky top-0 z-10">
            <tr>
              <th className="border-b px-4 py-2.5">Hãng sản xuất</th>
              <th className="border-b px-4 py-2.5">Tên Trung tâm</th>
              <th className="border-b px-4 py-2.5">Số điện thoại</th>
              <th className="border-b px-4 py-2.5">Địa chỉ bảo hành</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white font-medium text-gray-700">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 font-bold text-[#E30019]">{row.brand}</td>
                <td className="px-4 py-2.5">{row.centerName}</td>
                <td className="px-4 py-2.5">{row.contact}</td>
                <td className="px-4 py-2.5">{row.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
