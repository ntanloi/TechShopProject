export const MENU_DATA = [
  { 
    label: "Laptop", 
    icon: "Laptop", 
    href: "/category/laptop",
    id: "laptop",
    content: {
      columns: [
        {title: 'Thương hiệu', items: ['ASUS','ACER','MSI','LENOVO','DELL','HP','LG']},
        {title: 'Giá bán', items: ['Dưới 15 triệu','15-20 triệu','Trên 20 triệu']},
        {title: 'CPU Intel-AMD', items: ['Core i3','Core i5','Core i7','AMD Ryzen']},
        {title: 'Nhu cầu sử dụng', items: ['Đồ họa-studio','Học sinh-sinh viên','Mỏng nhẹ-cao cấp']},
        {title: "Linh phụ kiện Laptop", items: ["Ram laptop", "SSD laptop", "Ổ cứng di động"]},
        {title: "Laptop ASUS", items: ["ASUS OLED Series", "Vivobook Series", "Zenbook Series"]},
        {title: "Laptop ACER", items: ["Aspire Series", "Swift Series"]},
        {title: "Laptop MSI", items: ["Modern Series", "Prestige Series"]},
        {title: "Laptop Lenovo", items: ["Thinkbook Series", "Ideapad Series", "Thinkpad Series", "Yoga Series"]},
        {title: "Laptop Dell", items: ["Inspiron Series", "Vostro Series", "Latitude Series", "XPS Series"]},
      ]
    }
  },
  { 
    label: "Laptop Gaming", 
    icon: "Laptop", 
    href: "/category/laptop-gaming",
    id: "laptop-gaming",
    content: {
      columns: [
        {title: "Thương hiệu", items: ["ACER / PREDATOR", "ASUS / ROG", "MSI", "LENOVO", "DELL", "GIGABYTE / AORUS", "HP"]},
        {title: "Giá bán", items: ["Dưới 20 triệu", "Từ 20 đến 25 triệu", "Từ 25 đến 30 triệu", "Trên 30 triệu", "Gaming RTX 50 Series"]},
        {title: "ACER | PREDATOR", items: ["Nitro ProPanel Series", "Nitro Series", "Aspire Series", "Predator Series", "ACER RTX 50 Series"]},
        {title: "ASUS | ROG Gaming", items: ["ROG Series", "TUF Series", "Zephyrus Series", "ASUS RTX 50 Series"]},
        {title: "MSI Gaming", items: ["Titan GT Series", "Stealth GS Series", "Raider GE Series", "Vector GP Series", "Crosshair / Pulse GL Series", "Sword / Katana GF66 Series", "Cyborg / Thin GF Series", "MSI RTX 50 Series"]},
        {title: "LENOVO Gaming", items: ["Legion Gaming", "LOQ series", "RTX 50 Series"]},
        {title: "GIGABYTE Gaming", items: ["Gaming Gigabyte", "GIGABYTE RTX 50 Series"]},
        {title: "HP Gaming", items: ["HP Victus", "Hp Omen", "HP RTX 50 Series"]},
        {title: "Cấu hình", items: ["RTX 50 Series", "CPU Core Ultra", "CPU AMD"]},
        {title: "Linh - Phụ kiện Laptop", items: ["Ram laptop", "SSD laptop", "Ổ cứng di động"]},
      ]
    }
  },
  { 
    label: "PC GVN", 
    icon: "PcCase", 
    href: "/category/pc-gvn",
    id: "pc-gvn",
    content: {
      columns: [
        {title: "PC THEO GIÁ", items: ["PC DƯỚI 30 TRIỆU", "PC TỪ 30 - 50 TRIỆU", "PC TỪ 50 - 70 TRIỆU", "PC TỪ 70 - 100 TRIỆU", "PC TỪ 100 - 200 TRIỆU", "PC TRÊN 200 TRIỆU"]},
        {title: "PC RTX 50 Series", items: ["PC RTX 5090", "PC RTX 5080", "PC RTX 5070Ti", "PC RTX 5070", "PC RTX 5060Ti"]},
        {title: "PC theo cấu hình VGA", items: ["PC RTX 5060", "PC RTX 5050", "PC RTX 3060", "PC RTX 3050"]},
        {title: "PC theo cấu hình VGA", items: ["PC RTX 5060Ti", "PC RTX 5070", "PC RTX 5070Ti", "PC RTX 5080", "PC RTX 5090"]},
        {title: "PC khuyến mãi KHỦNG", items: ["PC I7 TẶNG MÀN 240HZ", "GVN x MSI - Tặng màn OLED", "GVN x ASUS - MAX SETTING"]},
        {title: "PC theo CPU AMD", items: ["PC AMD R3", "PC AMD R5 (HOT)", "PC AMD R7", "PC AMD R9"]},
        {title: "PC theo CPU Intel", items: ["PC Core i3", "PC Core i5", "PC Core i7", "PC Core i9"]},
        {title: "PC theo CPU Intel", items: ["PC Ultra 5", "PC Ultra 7", "PC Ultra 9"]},
        {title: "PC Văn phòng", items: ["Homework Athlon - Giá chỉ 3.990k", "Homework R3 - Giá chỉ 5.690k", "Homework R5 - Giá chỉ 5.690k", "Homework I5 - Giá chỉ 5.690k"]},
        {title: "Phần mềm bản quyền", items: ["Window bản quyền - Chỉ từ 2.990K", "Office 365 bản quyền - Chỉ từ 990K"]},
      ]
    }
  },
  { 
    label: "Main, CPU, VGA", 
    icon: "Cpu", 
    href: "/category/main-cpu-vga",
    id: "main-cpu-vga",
    content: {
      columns: [
        {title: "VGA RTX 50 SERIES", items: ["RTX 5090", "RTX 5080", "RTX 5070Ti", "RTX 5070", "RTX 5060Ti", "RTX 5060"]},
        {title: "VGA (Trên 12 GB VRAM)", items: ["RTX 4070 SUPER (12GB)", "RTX 4070Ti SUPER (16GB)", "RTX 4080 SUPER (16GB)", "RTX 4090 SUPER (24GB)"]},
        {title: "VGA (Dưới 12 GB VRAM)", items: ["RTX 4060Ti (8 - 16GB)", "RTX 4060 (8GB)", "RTX 3060 (12GB)", "RTX 3050 (6 - 8GB)", "GTX 1650 (4GB)", "GT 710 / GT 1030 (2-4GB)"]},
        {title: "VGA - Card màn hình", items: ["NVIDIA Quadro", "AMD Radeon"]},
        {title: "Bo mạch chủ Intel", items: ["Z890", "Z790", "B760", "H610", "X299X", "Xem tất cả"]},
        {title: "Bo mạch chủ AMD", items: ["AMD X870", "AMD X670", "AMD X570", "AMD B650", "AMD B550", "AMD A320", "AMD TRX40"]},
        {title: "CPU - Bộ vi xử lý Intel", items: ["CPU Intel Core Ultra Series 2", "CPU Intel 9", "CPU Intel 7", "CPU Intel 5", "CPU Intel 3"]},
        {title: "CPU - Bộ vi xử lý AMD", items: ["CPU AMD Athlon", "CPU AMD R3", "CPU AMD R5", "CPU AMD R7", "CPU AMD R9"]},
      ]
    }
  },
  { 
    label: "Case, Nguồn, Tản", 
    icon: "PcCase", 
    href: "/category/case-nguon-tan",
    id: "case-nguon-tan",
    content: {
      columns: [
        {title: "Case - Theo hãng", items: ["Case ASUS", "Case Corsair", "Case Lianli", "Case Cooler Master", "Case Jonsbo", "Xem tất cả"]},
        {title: "Theo giá", items: ["Dưới 1 triệu", "Từ 1 triệu đến 2 triệu", "Trên 2 triệu", "Xem tất cả"]},
        {title: "Nguồn - Theo Hãng", items: ["Nguồn ASUS", "Nguồn DeepCool", "Nguồn Corsair", "Nguồn Cooler Master", "Nguồn MSI", "Xem tất cả"]},
        {title: "Nguồn - Theo công suất", items: ["Từ 500w - 600w", "Từ 700w - 800w", "Trên 1000w", "Xem tất cả"]},
        {title: "Tản nhiệt - Theo hãng", items: ["Tản nhiệt ASUS", "Tản nhiệt Jonsbo", "Tản nhiệt DeepCool", "Tản nhiệt Cooler Master", "Tản nhiệt MSI"]},
        {title: "Loại tản nhiệt", items: ["Tản nhiệt AIO 240mm", "Tản nhiệt AIO 360mm", "Tản nhiệt khí", "Xem tất cả"]},
      ]
    }
  },
  { 
    label: "Ổ cứng, RAM, Thẻ nhớ", 
    icon: "HardDrive", 
    href: "/category/o-cung-ram-the-nho",
    id: "storage-ram",
    content: {
      columns: [
        {title: "Dung lượng RAM", items: ["8 GB", "16 GB", "32 GB", "64 GB", "Xem tất cả"]},
        {title: "Loại RAM", items: ["DDR4", "DDR5", "Xem tất cả"]},
        {title: "Hãng RAM", items: ["Corsair", "Kingston", "G.Skill", "PNY", "Xem tất cả"]},
        {title: "Dung lượng HDD", items: ["HDD 1 TB", "HDD 2 TB", "HDD 4 TB - 6 TB", "HDD trên 8 TB", "Xem tất cả"]},
        {title: "Hãng HDD", items: ["WesterDigital", "Seagate", "Toshiba", "Xem tất cả"]},
        {title: "Dung lượng SSD", items: ["120GB - 128GB", "250GB - 256GB", "480GB - 512GB", "960GB - 1TB", "2TB", "Trên 2TB", "Xem tất cả"]},
        {title: "Hãng SSD", items: ["Samsung", "Wester Digital", "Kingston", "Corsair", "PNY", "Xem tất cả"]},
        {title: "Thẻ nhớ / USB", items: ["Sandisk"]},
        {title: "Ổ cứng di động", items: []},
      ]
    }
  },
  {
    label: "Loa, Micro, Webcam",
    icon: "Mic",
    href: "/category/loa-micro-webcam",
    id: "audio-webcam",
    content: {
      columns: [
        {title: "Thương hiệu loa", items: ["Edifier", "Razer", "Logitech", "SoundMax"]},
        {title: "Kiểu Loa", items: ["Loa vi tính", "Loa Bluetooth", "Loa Soundbar", "Loa mini", "Sub phụ (Loa trầm)"]},
        {title: "Webcam", items: ["Độ phân giải 4k", "Độ phân giải Full HD (1080p)", "Độ phân giải 720p"]},
        {title: "Microphone", items: ["Micro HyperX"]},
      ]
    }
  },
  { 
    label: "Màn hình", 
    icon: "Monitor", 
    href: "/category/man-hinh",
    id: "monitor",
    content: {
      columns: [
        {title: "Hãng sản xuất", items: ["LG", "Asus", "ViewSonic", "Dell", "Gigabyte", "AOC", "Acer", "HKC"]},
        {title: "Hãng sản xuất", items: ["MSI", "Samsung", "Philips", "E-Dra", "VSP"]},
        {title: "Giá tiền", items: ["Dưới 5 triệu", "Từ 5 triệu đến 10 triệu", "Từ 10 triệu đến 20 triệu", "Từ 20 triệu đến 30 triệu", "Trên 30 triệu"]},
        {title: "Độ Phân giải", items: ["Màn hình Full HD", "Màn hình 2K 1440p", "Màn hình 4K UHD", "Màn hình 6K"]},
        {title: "Tần số quét", items: ["60Hz", "75Hz", "100Hz", "144Hz", "240Hz"]},
        {title: "Màn hình cong", items: ["24\" Curved", "27\" Curved", "32\" Curved", "Trên 32\" Curved"]},
        {title: "Kích thước", items: ["Màn hình 22\"", "Màn hình 24\"", "Màn hình 27\"", "Màn hình 29\"", "Màn hình 32\"", "Màn hình Trên 32\"", "Hỗ trợ giá treo (VESA)"]},
        {title: "Màn hình đồ họa", items: ["Màn hình đồ họa 24\"", "Màn hình đồ họa 27\"", "Màn hình đồ họa 32\""]},
        {title: "Phụ kiện màn hình", items: ["Giá treo màn hình", "Phụ kiện dây HDMI,DP,LAN"]},
        {title: "Màn hình di động", items: ["Full HD 1080p", "2K 1440p", "Có cảm ứng"]},
      ]
    }
  },
  { 
    label: "Bàn phím", 
    icon: "Keyboard", 
    href: "/category/ban-phim",
    id: "keyboard",
    content: {
      columns: [
        {title: "Thương hiệu", items: ["AKKO", "AULA", "Dare-U", "Durgod", "Leobog", "Keychron", "FL-Esports", "Corsair", "E-Dra", "Cidoo", "Machenike"]},
        {title: "Thương hiệu", items: ["ASUS", "Logitech", "Razer", "Leopold", "Steelseries", "Rapoo", "VGN", "MadLions", "SKYLOONG"]},
        {title: "Giá tiền", items: ["Dưới 1 triệu", "1 triệu - 2 triệu", "2 triệu - 3 triệu", "3 triệu - 4 triệu", "Trên 4 triệu"]},
        {title: "Kết nối", items: ["Bluetooth", "Wireless"]},
        {title: "Phụ kiện bàn phím cơ", items: ["Keycaps", "Dwarf Factory", "Kê tay"]},
        {title: "Bàn phím Rapid Trigger", items: []},
      ]
    }
  },
  { 
    label: "Chuột + Lót chuột", 
    icon: "Mouse", 
    href: "/category/chuot-lot-chuot",
    id: "mouse-mousepad",
    content: {
      columns: [
        {title: "Thương hiệu chuột", items: ["Logitech", "Razer", "Corsair", "Microsoft", "Dare U","ASUS"]},
        {title: "Giá tiền", items: ["Dưới 500 nghìn", "Từ 500 nghìn - 1 triệu", "Từ 1 triệu - 2 triệu", "Trên 2 triệu - 3 triệu", "Trên 3 triệu"]},
        {title: "Loại Chuột", items: ["Chuột chơi game", "Chuột văn phòng"]},
        {title: "Logitech", items: ["Logitech Gaming", "Logitech Văn phòng"]},
        {title: "Thương hiệu lót chuột", items: ["GEARVN", "ASUS", "Corsair", "Steelseries", "Dare-U", "Razer", "SKYLOONG"]},
      ]
    }
  },
  { 
    label: "Tai nghe",
    icon: "Headphones",
    href: "/category/tai-nghe",
    id: "headphones",
    content: {
      columns: [
        {title: "Thương hiệu tai nghe", items: ["ASUS", "HyperX", "Razer", "ONIKUMA"]},
        {title: "Tai nghe theo giá", items: ["Tai nghe dưới 1 triệu", "Tai nghe 1 triệu đến 2 triệu", "Tai nghe 2 đến 3 triệu", "Tai nghe 3 đến 4 triệu", "Tai nghe trên 4 triệu"]},
        {title: "Kiểu kết nối", items: ["Tai nghe Bluetooth"]},
        {title: "Kiểu tai nghe", items: ["Tai nghe Over-ear", "Tai nghe Gaming In-ear"]},
      ]
    }
  },
  { 
    label: "Ghế - Bàn", 
    icon: "Armchair",
    href: "/category/ghe-ban",
    id: "ghe-ban",
    content: {
      columns: [
        {title: "Thương hiệu ghế Gaming", items: ["Corsair", "Warrior", "E-DRA", "DXRacer", "Cougar", "AKRaing", "Razer"]},
        {title: "Thương hiệu ghế CTH", items: ["Warrior", "Sihoo", "E-Dra"]},
        {title: "Kiểu ghế", items: ["Ghế Công thái học", "Ghế Gaming"]},
        {title: "Bàn Gaming", items: ["Bàn Gaming DXRacer", "Bàn Gaming E-Dra", "Bàn Gaming Warrior"]},
        {title: "Bàn công thái học", items: ["Bàn CTH Warrior", "Phụ kiện bàn ghế"]},
        {title: "Giá tiền", items: ["Dưới 5 triệu", "Từ 5 đến 10 triệu", "Trên 10 triệu"]},
      ]
    }
  },
  {
    label: "Handheld, Console", 
    icon: "Gamepad2", 
    href: "/category/handheld-console",
    id: "handheld-console",
    content: {
      columns: [
        {title: "Handheld PC", items: ["MSI Claw", "Legion Go"]},
        {title: "Tay cầm", items: ["Tay cầm Playstation", "Tay cầm Rapoo", "Tay cầm DareU", "Xem tất cả"]},
        {title: "Vô lăng lái xe", items: ["Vô lăng Logitech"]},
        {title: "Giá tiền", items: ["Dưới 1 triệu", "Trên 2 triệu"]},
      ]
    }
  },
  {
    label: "Phụ kiện (Hub, sạc, cáp..)", 
    icon: "Usb", 
    href: "/category/phu-kien",
    id: "accessories",
    content: {
      columns: [
        {title: "Hub, sạc, cáp", items: ["Hub chuyển đổi", "Dây cáp", "Củ sạc"]},
        {title: "Gía bán", items: ["Dưới 200 nghìn", "Từ 200 đến 500 nghìn", "Từ 500 nghìn đến 1 triệu", "Trên 1 triệu"]},
      ]
    }
  },
  { 
    label: "Dịch vụ và thông tin khác", 
    icon: "Wrench", 
    href: "/category/dich-vu-thong-tin-khac",
    id: "dich-vu-thong-tin",
    content: {
      columns: [
        {title: "Dịch vụ", items: ["Dịch vụ kỹ thuật tại nhà", "Dịch vụ sửa chữa"]},
        {title: "Chính sách", items: ["Chính sách & bảng giá thu VGA qua sử dụng", "Chính sách bảo hành", "Chính sách giao hàng", "Chính sách đổi trả"]},
      ]
    }
  },
];
