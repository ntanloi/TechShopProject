import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, ChevronRight, Search } from "lucide-react";
import { southWarrantyCenters, northWarrantyCenters } from "../data/warrantyCenters";

const hcmStores = [
  {
    name: "TÂN BÌNH - HOÀNG HOA THÁM",
    address: "78-80-82 Hoàng Hoa Thám, P. 12, Q. Tân Bình, TP.HCM",
    hours: "8:00 - 21:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=78+Hoang+Hoa+Tham+Tan+Binh+HCM",
  },
  {
    name: "TP THỦ ĐỨC - KHA VẠN CÂN",
    address: "905 Kha Vạn Cân, P. Linh Tây, TP. Thủ Đức, TP.HCM",
    hours: "8:00 - 21:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=905+Kha+Van+Can+Thu+Duc+HCM",
  },
  {
    name: "QUẬN 5 - TRẦN HƯNG ĐẠO",
    address: "1081-1083 Trần Hưng Đạo, P. 5, Quận 5, TP.HCM",
    hours: "8:00 - 21:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=1081+Tran+Hung+Dao+Quan+5+HCM",
  },
];

const hanoiStores = [
  {
    name: "ĐỐNG ĐA - THÁI HÀ",
    address: "162-164 Thái Hà, P. Trung Liệt, Q. Đống Đa, Hà Nội",
    hours: "8:00 - 21:00",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=162+Thai+Ha+Dong+Da+Ha+Noi",
  },
];

function StoreCard({ store }) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-[#E30019] transition duration-300">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E30019]" />
        <h3 className="text-sm font-bold uppercase leading-5 text-blue-600">
          {store.name}
        </h3>
      </div>

      <div className="mt-3 text-xs leading-relaxed text-gray-600 space-y-1">
        <p>
          <span className="font-semibold text-gray-800">Địa chỉ:</span> {store.address}
        </p>
        <p>
          <span className="font-semibold text-gray-800">Giờ làm việc:</span> {store.hours}
        </p>
      </div>

      <div className="mt-4">
        <a
          href={store.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-bold text-white transition"
        >
          <MapPin className="h-3.5 w-3.5" />
          Xem bản đồ chỉ đường
        </a>
      </div>
    </div>
  );
}

function WarrantyCenterTable({ centers, region }) {
  const [search, setSearch] = useState("");
  const filtered = centers.filter(
    (c) =>
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.centerName.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="bg-gray-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-4 rounded-t-lg">
        {region}
      </h2>
      <div className="mt-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm kiếm trung tâm bảo hành ${region.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[360px]">
          <table className="min-w-full">
            <thead className="bg-[#E30019] text-white sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Thương hiệu</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Trung tâm BH</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Liên hệ</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">Địa chỉ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">
                    Không tìm thấy trung tâm bảo hành phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-2.5 text-xs font-bold text-[#E30019]">{c.brand}</td>
                    <td className="px-4 py-2.5 text-xs font-semibold text-gray-800">{c.centerName}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">
                      <a href={`tel:${c.contact.replace(/\s/g, "")}`} className="text-blue-600 hover:underline">
                        {c.contact}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600">{c.address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Showroom() {
  return (
    <div className="bg-[#F2F2F2] min-h-screen py-6 px-4 text-gray-800">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Hệ thống cửa hàng Showroom</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-10 border border-gray-100">
          <h1 className="text-xl md:text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-7 bg-[#E30019] rounded-full inline-block" />
            Hệ Thống Showroom & Cửa Hàng TechShop Toàn Quốc
          </h1>

          <div className="bg-gray-50 px-4 py-4 rounded-lg border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-700">
              <span className="text-lg text-[#E30019]">➔</span>
              <span>Thời gian làm việc: <strong>08:00 - 21:00</strong> tất cả các ngày trong tuần.</span>
            </div>
            <a
              href="tel:18006975"
              className="inline-flex items-center gap-2 rounded bg-green-600 hover:bg-green-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition shrink-0"
            >
              <Phone className="h-4 w-4" />
              HOTLINE MIỄN PHÍ: 1800.6975
            </a>
          </div>

          {/* HCMC Showrooms */}
          <div className="mb-8">
            <h2 className="bg-gray-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-4 rounded-t-lg">
              Khu Vực TP. HỒ CHÍ MINH
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {hcmStores.map((store, i) => (
                <StoreCard key={i} store={store} />
              ))}
            </div>
          </div>

          {/* Hanoi Showrooms */}
          <div className="mb-8">
            <h2 className="bg-gray-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3 px-4 rounded-t-lg">
              Khu Vực HÀ NỘI
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {hanoiStores.map((store, i) => (
                <StoreCard key={i} store={store} />
              ))}
            </div>
          </div>

          {/* Warranty Centers section */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#E30019] rounded-full inline-block" />
              Trung Tâm Bảo Hành Chính Hãng Liên Kết
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Danh sách các trung tâm bảo hành chính hãng mà TechShop hợp tác. 
              Khi cần bảo hành sản phẩm ngoài thời gian bảo hành tại TechShop, quý khách có thể liên hệ trực tiếp các trung tâm dưới đây.
            </p>
            <div className="space-y-8">
              <WarrantyCenterTable centers={southWarrantyCenters} region="Khu Vực TP. Hồ Chí Minh" />
              <WarrantyCenterTable centers={northWarrantyCenters} region="Khu Vực Hà Nội" />
            </div>
          </div>

          {/* Footer details */}
          <div className="mt-8 rounded-lg bg-gray-50 p-6 text-center border border-gray-200 text-xs sm:text-sm">
            <p className="font-bold text-gray-800">Liên hệ phòng chăm sóc khách hàng (CSKH):</p>
            <p className="mt-1 font-bold text-[#E30019] text-base">Tổng đài: 1800.6975 (Nhánh 1)</p>
            <p className="mt-2 text-gray-500 leading-relaxed">
              Email hỗ trợ: <span className="text-blue-600">cskh@techshop.com</span> | Website: <span className="text-blue-600">www.techshop.com</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
