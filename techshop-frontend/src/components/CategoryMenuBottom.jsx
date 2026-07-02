import { Link } from "react-router-dom";

const Menu_Data_Images = [
  { category: "case-nguon-tan", image: "/categorybottom/case.png", title: "Vỏ máy tính", alt: "Vỏ máy tính" },
  { category: "case-nguon-tan", image: "/categorybottom/cooler.png", title: "Tản nhiệt", alt: "Tản nhiệt" },
  { category: "main-cpu-vga", image: "/categorybottom/cpu.png", title: "CPU", alt: "Bộ vi xử lý" },
  { category: "ban-phim", image: "/categorybottom/keyboard.jpg", title: "Bàn phím", alt: "Bàn phím" },
  { category: "laptop", image: "/categorybottom/laptop.png", title: "Laptop", alt: "Laptop" },
  { category: "main-cpu-vga", image: "/categorybottom/mainboard.png", title: "Mainboard", alt: "Bo mạch chủ" },
  { category: "man-hinh", image: "/categorybottom/monitor.jpg", title: "Màn hình", alt: "Màn hình" },
  { category: "chuot-lot-chuot", image: "/categorybottom/mouse.jpg", title: "Chuột", alt: "Chuột" },
  { category: "pc-gvn", image: "/categorybottom/PC.png", title: "PC GVN", alt: "PC" },
  { category: "case-nguon-tan", image: "/categorybottom/pus.png", title: "Nguồn", alt: "Nguồn" },
  { category: "o-cung-ram-the-nho", image: "/categorybottom/ram.png", title: "RAM", alt: "Ram" },
  { category: "o-cung-ram-the-nho", image: "/categorybottom/ssd.png", title: "Ổ cứng", alt: "Ổ cứng" },
  { category: "main-cpu-vga", image: "/categorybottom/vga.jpg", title: "VGA", alt: "Card màn hình" },
  { category: "phu-kien", image: "/categorybottom/accessory.png", title: "Phụ kiện", alt: "Phụ kiện" },
  { category: "handheld-console", image: "/categorybottom/handheld_console.png", title: "Console", alt: "Tay cầm" },
  { category: "tai-nghe", image: "/categorybottom/headphone.jpg", title: "Tai nghe", alt: "Tai nghe" },
  { category: "loa-micro-webcam", image: "/categorybottom/speaker.png", title: "Loa", alt: "Loa" },
  { category: "ghe-ban", image: "/categorybottom/chair.jpg", title: "Ghế - Bàn", alt: "Ghế" },
];

export default function CategoryMenuBottom() {
  return (
    <div className="mt-6 hidden w-full bg-white p-5 lg:block rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b">
        Danh Mục Linh Kiện & Phụ Kiện Nổi Bật
      </h3>
      <div className="grid grid-cols-9 gap-4">
        {Menu_Data_Images.map((m, index) => (
          <Link
            to={`/products?category=${m.category}`}
            key={index}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="h-16 w-16 p-2 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 group-hover:border-red-500 group-hover:bg-white transition-all duration-300">
              <img
                src={m.image}
                alt={m.alt}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
              />
            </div>
            <span className="text-center text-[12px] font-semibold text-gray-700 group-hover:text-red-600 transition truncate max-w-full">
              {m.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
