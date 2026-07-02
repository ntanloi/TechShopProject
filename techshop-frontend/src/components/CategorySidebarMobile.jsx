import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { MENU_DATA } from "../data/megamenu";
import { getItemLabel, resolveHref } from "./MegaMenu";

const SUB_NAV_ITEMS = [
  { href: "/about", text: "Giới thiệu", icon: "Tag" },
  { href: "/products", text: "Hot Deal sản phẩm", icon: "Flame" },
  { href: "/news", text: "Tin tức công nghệ", icon: "Newspaper" },
  { href: "/on-site-technical-support", text: "Dịch vụ kỹ thuật", icon: "Wrench" },
  { href: "/trade-in-pricing", text: "Thu cũ đổi mới", icon: "RefreshCw" },
  { href: "/warranty-lookup", text: "Tra cứu bảo hành", icon: "Shield" },
  { href: "/showroom", text: "Hệ thống Showroom", icon: "MapPin" },
];

function MobileCategoryMenu({ onClose }) {
  const [openId, setOpenId] = useState(null);
  const [openCol, setOpenCol] = useState(null);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    onClose();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const toggleItem = (id) => {
    setOpenId(openId === id ? null : id);
    setOpenCol(null);
  };

  const toggleCol = (colId) => {
    setOpenCol(openCol === colId ? null : colId);
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-[#E30019] h-12 text-white flex justify-between px-4 items-center sticky top-0 z-10">
        <span className="text-base font-bold">Danh mục sản phẩm</span>
        <button
          onClick={onClose}
          className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Category accordion */}
      <div className="divide-y divide-gray-100">
        {MENU_DATA.map((item) => {
          const Icon = LucideIcons[item.icon] || LucideIcons.HelpCircle;
          const isOpen = openId === item.id;

          return (
            <div key={item.id}>
              {/* Parent item */}
              <button
                onClick={() => toggleItem(item.id)}
                className="flex w-full items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#E30019] shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">
                    {item.label}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Children columns */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[2000px]" : "max-h-0"
                }`}
              >
                <div className="bg-gray-50 px-4 pb-3 pt-1">
                  {item.content?.columns.map((col, colIdx) => {
                    const colId = `${item.id}-${colIdx}`;
                    const isColOpen = openCol === colId;

                    return (
                      <div key={colIdx} className="mb-2">
                        {/* Column title (collapsible) */}
                        <button
                          onClick={() => toggleCol(colId)}
                          className="flex w-full items-center justify-between py-1.5 pl-6 text-left"
                        >
                          <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">
                            {col.title}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isColOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* Column items */}
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            isColOpen ? "max-h-[500px]" : "max-h-0"
                          }`}
                        >
                          <ul className="pl-10 space-y-1 pb-1">
                            {col.items.map((child, childIdx) => {
                              const label = getItemLabel(child);
                              const href = resolveHref(item.id, col.title, child);
                              return (
                                <li key={`${label}-${childIdx}`}>
                                  {href ? (
                                    <Link
                                      to={href}
                                      className="block py-1 text-[13px] text-gray-600 hover:text-[#E30019] transition-colors"
                                    >
                                      {label}
                                    </Link>
                                  ) : (
                                    <span className="block py-1 text-[13px] text-gray-500 cursor-default">
                                      {label}
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BottomNavLinks({ onClose }) {
  return (
    <div className="border-t border-gray-200 bg-white pt-3 pb-4">
      <p className="px-4 pb-2 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
        Thông tin & Dịch vụ
      </p>
      {SUB_NAV_ITEMS.map((item) => {
        const Icon = LucideIcons[item.icon] || LucideIcons.HelpCircle;
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-[#E30019] transition-colors"
          >
            <Icon className="h-4 w-4 text-gray-400 shrink-0" />
            {item.text}
            <ChevronRight className="h-3.5 w-3.5 ml-auto text-gray-300" />
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Full-screen slide-in drawer for mobile category navigation.
 * Renders only on < lg screens (hidden on desktop).
 */
export default function CategorySidebarMobile({ open, onClose }) {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[70]
          transform transition-transform duration-300 ease-in-out shadow-2xl
          ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu danh mục"
      >
        <div className="h-full overflow-y-auto overscroll-contain">
          <MobileCategoryMenu onClose={onClose} />
          <BottomNavLinks onClose={onClose} />
        </div>
      </div>
    </>
  );
}
