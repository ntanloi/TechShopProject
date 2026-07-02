import { Link } from "react-router-dom";

const PRODUCTS_PATH = "/products";

const normalize = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/đ/g, "d")             
    .replace(/[^\w\s]/g, "")        
    .replace(/\s+/g, " ")           
    .trim();

const slugify = (value) =>
  normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const buildHref = (pathname, query) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    const valStr = value !== undefined && value !== null ? String(value) : "";
    if (valStr && valStr.trim() !== "") {
      params.set(key, valStr);
    }
  });
  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
};

export const getItemLabel = (item) =>
  typeof item === "string" ? item : item.label;

const getDirectHref = (item) => {
  if (typeof item === "string") return undefined;
  const href = item.href?.trim();
  if (!href || href === "#" || href === "/#" || href.startsWith("#")) {
    return undefined;
  }
  return href;
};

const SPECIAL_LINK_MAP = {
  "dich vu::dich vu ky thuat tai nha": "/on-site-technical-support",
  "dich vu::dich vu sua chua tai nha": "/on-site-technical-support",
  "dich vu::dich vu sua chua": "/on-site-technical-support",
  "chinh sach::chinh sach & bang gia thu vga qua su dung": "/trade-in-pricing",
  "chinh sach::chinh sach va bang gia thu vga qua su dung": "/trade-in-pricing",
  "chinh sach::chinh sach bao hanh": "/warranty-policy",
  "chinh sach::chinh sach giao hang": "/shipping-policy",
  "chinh sach::chinh sach doi tra": "/trade-in-pricing",
};

const categoryAliasMap = {
  "phu-kien": "accessory",
  "accessories": "accessory",
  "tai-nghe": "headphone",
  "headphones": "headphone",
  "loa": "speaker",
  "audio-webcam": "speaker",
  "micro": "microphone",
};

const accessoryTypeMap = {
  "cap sac": "cap-sac",
  "day cap": "cap-sac",
  "hub chuyen doi": "hub",
  "cu sac": "cu-sac",
};

const categoryPricePrefixMap = {
  accessory: "phu kien",
  headphone: "tai nghe",
  "mouse-mousepad": "chuot-lot-chuot",
  "ghe-ban": "ban ghe",
  "handheld-console": "handheld",
};

export const resolveHref = (category, columnTitle, item) => {
  const label = getItemLabel(item);
  const title = normalize(columnTitle);
  const value = normalize(label);
  const queryCategory = categoryAliasMap[category || ""] || category;

  const specialKey = `${title}::${value}`;
  if (specialKey in SPECIAL_LINK_MAP) {
    return SPECIAL_LINK_MAP[specialKey] || undefined;
  }

  const directHref = getDirectHref(item);
  if (directHref) return directHref;

  const SPECIFIC_PRODUCT_MAP = {
    "homework athlon": "homework-athlon-3000g",
    "homework r3": "homework-ryzen-3-4300g",
    "homework r5": "homework-ryzen-5-5600g",
    "homework i5": "homework-intel-core-i5",
    "window ban quyen": "microsoft-windows-11-home",
    "office 365 ban quyen": "microsoft-office-365-personal",
  };
  const rawValue = normalize(label).split("-")[0].trim();

  if (SPECIFIC_PRODUCT_MAP[rawValue]) {
    return `/product/${SPECIFIC_PRODUCT_MAP[rawValue]}`;
  }

  const brandMap = {
    asus: "asus",
    acer: "acer",
    msi: "msi",
    lenovo: "lenovo",
    dell: "dell",
    hp: "hp",
    lg: "lg",
    apple: "apple",
    gigabyte: "gigabyte",
    viewsonic: "viewsonic",
    aoc: "aoc",
    hkc : "hkc",
    samsung: "samsung",
    philips : "philips",
    "e-dra" : "e-dra",
    vsp : "vsp",
    razer: "razer",
    logitech: "logitech",
    corsair: "corsair",
    hyperx: "hyperx",
    steelseries: "steelseries",
    sony: "sony",
    jbl: "jbl",
    edifier: "edifier",
    ugreen: "ugreen",
    belkin: "belkin",
    akko : "akko",
    aula : "aula",
    "dare-u" : "dare-u",
    durgod : "durgod",
    leobog : "leobog",
    keychron : "keychron",
    "fl-esports" : "fl-esports",
    cidoo : "cidoo",
    machenike : "machenike",
    rapoo: "rapoo",
    vgn : "vgn",
    madlions : "madlions",
    skyloong : "skyloong"
  };

  const priceMap = {
    "duoi 15 trieu": "under-15",
    "15-20 trieu": "15-20",
    "tren 20 trieu": "over-20",
    "duoi 20 trieu": "under-20",
    "tu 20 den 25 trieu": "20-25",
    "tu 25 den 30 trieu": "25-30",
    "tren 30 trieu": "over-30",
    "pc duoi 30 trieu": "under-30",
    "pc tu 30 50 trieu": "30-50",
    "pc tu 50 70 trieu": "50-70",
    "pc tu 70 100 trieu": "70-100",
    "pc tu 100 200 trieu": "100-200",
    "pc tren 200 trieu": "over-200",
    "duoi 5 trieu" : "under-5",
    "tu 5 trieu den 10 trieu" : "5-10",
    "tu 10 trieu den 20 trieu" : "10-20",
    "tu 20 trieu den 30 trieu" : "20-30",
    "duoi 500 nghin": "under-500k-mouse",
    "tu 500 nghin 1 trieu": "500k-1m-mouse",
    "tu 1 trieu 2 trieu": "1-2m-mouse",
    "tren 2 trieu 3 trieu": "2-3m-mouse",
    "tren 3 trieu": "over-3m-mouse",
    "tai nghe duoi 1 trieu": "under-1m-headphone",
    "tai nghe 1 trieu den 2 trieu": "1-2m-headphone",
    "tai nghe 2 den 3 trieu": "2-3m-headphone",
    "tai nghe 3 den 4 trieu": "3-4m-headphone",
    "tai nghe tren 4 trieu": "over-4m-headphone",
    "ban ghe duoi 5 trieu": "under-5m-chair-table",
    "ban ghe tu 5 den 10 trieu": "5-10m-chair-table",
    "ban ghe tren 10 trieu": "over-10m-chair-table",
    "handheld duoi 1 trieu": "under-1m-handheld",
    "handheld tren 2 trieu": "over-2m-handheld",
    "phu kien duoi 200 nghin": "under-200k",
    "phu kien tu 200 den 500 nghin": "200k-500k",
    "phu kien tu 500 nghin den 1 trieu": "500k-1m",
    "phu kien tren 1 trieu": "over-1m",
    "duoi 1 trieu" : "under-1",
    "1 trieu 2 trieu" : "1-2",
    "2 trieu 3 trieu" : "2-3",
    "3 trieu 4 trieu" : "3-4",
    "tren 4 trieu" : "over-4"
  };

  const cpuMap = {
    "core i3": "core-i3",
    "core i5": "core-i5",
    "core i7": "core-i7",
    "core i9": "core-i9",
    "amd ryzen": "amd-ryzen",
    "ryzen 5": "ryzen-5",
    "ryzen 7": "ryzen-7",
    "cpu core ultra" : "cpu-core-ultra",
    "cpu adm" : "cpu-adm",
    "pc amd r3" : "pc-amd-r3",
    "pc amd r5" : "pc-amd-r5",
    "pc amd r7" : "pc-amd-r7",
    "pc amd r9" : "pc-amd-r9",
    "pc core i3": "pc-core-i3",
    "pc core i5": "pc-core-i5",
    "pc core i7": "pc-core-i7",
    "pc core i9": "pc-core-i9",
    "pc ultra 5": "pc-ultra-5",
    "pc ultra 7": "pc-ultra-7",
    "pc ultra 9": "pc-ultra-9",
    "cpu intel core ultra series 2": "core-ultra",
    "cpu intel 9": "core-i9",
    "cpu intel 7": "core-i7",
    "cpu intel 5": "core-i5",
    "cpu intel 3": "core-i3",
    "cpu amd athlon": "cpu-amd-athlon",
    "cpu amd r3": "cpu-amd-r3",
    "cpu amd r5": "cpu-amd-r5",
    "cpu amd r7": "cpu-amd-r7",
    "cpu amd r9": "cpu-amd-r9",
  };

  const gpuMap = {
    "rtx 50 series" : "rtx-50-series",
    "pc rtx 5090" : "pc-rtx-5090",
    "pc rtx 5080": "pc-rtx-5080",
    "pc rtx 5070ti": "pc-rtx-5070ti",
    "pc rtx 5070": "pc-rtx-5070",
    "pc rtx 5060ti": "pc-rtx-5060ti",
    "pc rtx 5060": "pc-rtx-5060",
    "pc rtx 5050": "pc-rtx-5050",
    "pc rtx 3060": "pc-rtx-3060",
    "pc rtx 3050": "pc-rtx-3050",
    "rtx 5090" : "rtx-5090",
    "rtx 5080": "rtx-5080",
    "rtx 5070ti": "rtx-5070ti",
    "rtx 5070": "rtx-5070",
    "rtx 5060ti": "rtx-5060ti",
    "rtx 5060": "rtx-5060",
    "rtx 4070 super (12gb)": "rtx-4070-super-12gb",
    "rtx 4070ti super (16gb)": "rtx-4070ti-super-16gb",
    "rtx 4080 super (16gb)": "rtx-4080-super-16gb",
    "rtx 4090 super (24gb)": "rtx-4090-super-24gb",
    "rtx 4060ti (8 - 16gb)": "rtx-4060ti-8-16gb",
    "rtx 4060 (8gb)": "rtx-4060-8gb",
    "rtx 3060 (12gb)": "rtx-3060-12gb",
    "rtx 3050 (6 - 8gb)": "rtx-3050-6-8gb",
    "gtx 1650 (4gb)": "gtx-1650-4gb",
    "gt 710 / gt 1030 (2-4gb)": "gt-710-gt-1030-2-4gb",
    "nvidia quadro": "nvidia-quadro",
    "amd radeon": "amd-radeon",
  };

  const usageMap = {
    "do hoa-studio": "do-hoa-studio",
    "hoc sinh-sinh vien": "hoc-sinh-sinh-vien",
    "mong nhe-cao cap": "mong-nhe-cao-cap",
    gaming: "gaming",
    "van phong": "van-phong",
  };

  if (title === "thuong hieu" && brandMap[value]) {
    return buildHref(PRODUCTS_PATH, {
      category: queryCategory,
      brand: brandMap[value],
    });
  }

  if (
    queryCategory === "accessory" &&
    (title.includes("hub") || title.includes("sac") || title.includes("cap") || title.includes("nhom san pham"))
  ) {
    const type = accessoryTypeMap[value] || slugify(label);
    return buildHref(PRODUCTS_PATH, {
      category: queryCategory,
      accessoryType: type,
    });
  }

  if (title === "gia ban" || (queryCategory === "ghe-ban" && title === "gia tien")) {
    const prefix = categoryPricePrefixMap[queryCategory || ""];
    const fullPriceKey = prefix ? `${prefix} ${value}` : value;
    const resolvedPrice = priceMap[fullPriceKey] || priceMap[value];

    return buildHref(PRODUCTS_PATH, {
      category: queryCategory,
      price: resolvedPrice || slugify(label),
    });
  }

  if (title === "cpu intel-amd" && cpuMap[value]) {
    return buildHref(PRODUCTS_PATH, {
      category,
      cpu: cpuMap[value],
    });
  }

  if (title === "nhu cau su dung" && usageMap[value]) {
    return buildHref(PRODUCTS_PATH, {
      category,
      usage: usageMap[value],
    });
  }

  return buildHref(PRODUCTS_PATH, {
    category: queryCategory,
    q: label
  });
};

export default function MegaMenu({ activeSidebarItem }) {
  const content = activeSidebarItem?.content;
  const category = activeSidebarItem?.id;

  if (!content || !content.columns || content.columns.length === 0) {
    return null;
  }

  return (
    <div
      className="h-[520px] w-[940px] max-w-[calc(100vw-320px)] ml-4 rounded-r-md border border-l-0 border-gray-200 bg-white p-6 text-black shadow-xl"
    >
      <div className="grid h-full grid-cols-5 gap-x-6 gap-y-8 overflow-y-auto">
        {content.columns.map((col, idx) => (
          <div key={`${col.title}-${idx}`} className="flex flex-col gap-2">
            <h4 className="text-[14px] font-bold uppercase tracking-tight text-[#E30019]">
              {col.title}
            </h4>
            {col.items?.length > 0 && (
              <ul className="flex flex-col gap-1">
                {col.items.map((item, itemIndex) => {
                  const label = getItemLabel(item);
                  const href = resolveHref(category, col.title, item);
                  return (
                    <li key={`${label}-${itemIndex}`}>
                      {href ? (
                        <Link
                          to={href}
                          className="text-[13px] text-gray-700 transition-colors duration-150 hover:text-[#E30019]"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="text-[13px] text-gray-700 cursor-default">
                          {label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
