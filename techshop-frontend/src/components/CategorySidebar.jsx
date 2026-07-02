import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import * as LucideIcons from "lucide-react";

import MegaMenu from "./MegaMenu";
import MegaMenuContent from "./MegaMenuContent";
import { MENU_DATA } from "../data/megamenu";
import { CATEGORY_MENU } from "../data/categoryMenu";

export const sidebarItems = [
  { id: "laptop", label: "Laptop", icon: "Laptop" },
  { id: "laptop-gaming", label: "Laptop Gaming", icon: "Laptop" },
  { id: "pc-gvn", label: "PC GVN", icon: "PcCase" },
  { id: "main-cpu-vga", label: "Main, CPU, VGA", icon: "Cpu" },
  { id: "case-nguon-tan", label: "Case, Nguồn, Tản", icon: "PcCase" },
  { id: "storage-ram", label: "Ổ cứng, RAM, Thẻ nhớ", icon: "HardDrive" },
  { id: "audio-webcam", label: "Loa, Micro, Webcam", icon: "Mic" },
  { id: "monitor", label: "Màn hình", icon: "Monitor" },
  { id: "keyboard", label: "Bàn phím", icon: "Keyboard" },
  { id: "mouse-mousepad", label: "Chuột + Lót chuột", icon: "Mouse" },
  { id: "headphones", label: "Tai nghe", icon: "Headphones" },
  { id: "ghe-ban", label: "Ghế - Bàn", icon: "Armchair" },
  { id: "handheld-console", label: "Handheld Console", icon: "Gamepad2" },
  { id: "accessories", label: "Phụ kiện", icon: "Usb" },
  { id: "dich-vu-thong-tin", label: "Dịch vụ và thông tin", icon: "Wrench" },
];

const slugAliasMap = {
  laptopgaming: "laptop-gaming",
  laptopgamings: "laptop-gaming",
  "laptop-gamings": "laptop-gaming",
  pcgaming: "pc-gvn",
  "pc-gaming": "pc-gvn",
  monitor: "man-hinh",
  monitors: "man-hinh",
  mouse: "chuot-lot-chuot",
  mouses: "chuot-lot-chuot",
  mousepad: "chuot-lot-chuot",
  mousepads: "chuot-lot-chuot",
  "mouse-mousepad" : "chuot-lot-chuot",
  keyboard: "ban-phim",
  keyboards: "ban-phim",
  headphone: "tai-nghe",
  headphones: "tai-nghe",
  accessory: "phu-kien",
  accessories: "phu-kien",
  handheld: "handheld-console",
  handheldconsole: "handheld-console",
  "handheld-consoles": "handheld-console",
  "storage-ram" : "o-cung-ram-the-nho",
  "audio-webcam" : "loa-micro-webcam",
};

const fallbackCategory = (id, label) => ({
  id,
  label,
  sections: [
    {
      title: label,
      items: ["Danh mục đang cập nhật"],
    },
  ],
});

function normalizeCategoryId(value) {
  const raw = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  return slugAliasMap[raw] || raw;
}

function buildCategoryHref(id) {
  return `/products?category=${normalizeCategoryId(id)}`;
}

export default function CategorySidebar({ className = "", onNavigate }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams?.toString() || "";

  const [activeId, setActiveId] = useState(
    normalizeCategoryId(sidebarItems[0]?.id || "")
  );
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const closeTimerRef = useRef(null);

  const mergedItems = useMemo(() => {
    return sidebarItems.map((localItem) => {
      const normalizedId = normalizeCategoryId(localItem.id);

      const remoteItem = MENU_DATA.find((item) => {
        const remoteId = normalizeCategoryId(item.id);
        const remoteLabel = item.label?.trim().toLowerCase();
        const localLabel = localItem.label.trim().toLowerCase();

        return remoteId === normalizedId || remoteLabel === localLabel;
      });

      return {
        ...localItem,
        id: normalizedId,
        href: buildCategoryHref(normalizedId),
        content: remoteItem?.content || null,
      };
    });
  }, []);

  const activeSidebarItem = useMemo(() => {
    return mergedItems.find((item) => item.id === activeId) || mergedItems[0];
  }, [activeId, mergedItems]);

  const activeCategory = useMemo(() => {
    if (!activeSidebarItem) {
      return fallbackCategory("default", "Danh mục");
    }

    return (
      CATEGORY_MENU.find(
        (item) =>
          normalizeCategoryId(item.id) ===
          normalizeCategoryId(activeSidebarItem.id)
      ) || fallbackCategory(activeSidebarItem.id, activeSidebarItem.label)
    );
  }, [activeSidebarItem]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeAll = () => {
    clearCloseTimer();
    setIsMegaOpen(false);
    onNavigate?.();
  };

  const openMenuById = (id) => {
    clearCloseTimer();
    setActiveId(normalizeCategoryId(id));
    setIsMegaOpen(true);
  };

  const handleWrapperEnter = () => {
    clearCloseTimer();
    setIsMegaOpen(true);
  };

  const handleWrapperLeave = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsMegaOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    setIsMegaOpen(false);
  }, [pathname, searchKey]);

  if (!mergedItems.length) return null;

  return (
    <div
      className={`relative w-[180px] h-auto shrink-0 ${className} mr-4 hidden lg:block`}
      onMouseEnter={handleWrapperEnter}
      onMouseLeave={handleWrapperLeave}
    >
      <aside className="overflow-visible h-[520px] rounded-md border border-gray-200 bg-white shadow-sm">
        <ul className="divide-y divide-gray-100 flex flex-col h-full justify-between">
          {mergedItems.map((item) => {
            // Resolve Lucide Icon dynamically
            let Icon = LucideIcons[item.icon];
            if (!Icon) {
              if (item.icon === "PcCase") {
                Icon = LucideIcons.Cpu || LucideIcons.Server;
              } else {
                Icon = LucideIcons.HelpCircle;
              }
            }
            const isActive = isMegaOpen && activeId === item.id;

            return (
              <li
                key={item.id}
                className="relative flex-1 flex"
                onMouseEnter={() => openMenuById(item.id)}
              >
                <Link
                  to={item.href}
                  onClick={closeAll}
                  className={[
                    "group relative flex w-full items-center gap-2 px-3 py-1",
                    "text-left text-[13px] font-medium leading-none transition-colors",
                    isActive
                      ? "bg-[#E30019] text-white"
                      : "bg-white text-gray-800 hover:bg-[#E30019] hover:text-white",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 translate-x-full",
                      isActive ? "block" : "hidden group-hover:block",
                      "z-[60] h-0 w-0",
                      "border-b-[18px] border-b-transparent",
                      "border-l-[14px] border-l-[#E30019]",
                      "border-t-[18px] border-t-transparent",
                    ].join(" ")}
                  />

                  <Icon
                    className={[
                      "relative z-10 h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-white",
                    ].join(" ")}
                  />

                  <span className="relative z-10 flex-1 truncate">
                    {item.label}
                  </span>

                  <LucideIcons.ChevronRight
                    className={[
                      "relative z-10 h-3.5 w-3.5 shrink-0 transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white",
                    ].join(" ")}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div
        className={[
          "absolute left-[calc(100%-1px)] top-0 z-[120]",
          "transition-all duration-150 ease-out",
          isMegaOpen
            ? "visible translate-x-0 opacity-100"
            : "pointer-events-none invisible translate-x-1 opacity-0",
        ].join(" ")}
        onClickCapture={(e) => {
          const target = e.target;
          if (target?.closest("a")) {
            closeAll();
          }
        }}
      >
        {activeSidebarItem?.content ? (
          <MegaMenu activeSidebarItem={activeSidebarItem} />
        ) : (
          <div className="min-h-full w-[940px] max-w-[calc(100vw-320px)] rounded-r-md border border-l-0 border-gray-200 bg-[#f5f5f5] shadow-xl">
            <MegaMenuContent category={activeCategory} />
          </div>
        )}
      </div>
    </div>
  );
}
