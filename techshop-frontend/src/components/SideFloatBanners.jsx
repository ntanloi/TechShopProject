import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Sticky side banners that appear on extra-wide screens (xl+).
 * Shift down slightly after scrolling past the header.
 */
export default function SideFloatBanners() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 85);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const posClass = compact ? "top-[85px]" : "top-[155px]";

  return (
    <>
      {/* Left sticky banner */}
      <div
        className={`fixed left-3 ${posClass} z-40 hidden xl:block transition-all duration-300 ease-out`}
      >
        <Link to="/products?category=pc-gvn" aria-label="PC GVN Banner">
          <div className="relative h-[380px] w-[100px] overflow-hidden rounded-md shadow-lg hover:shadow-xl transition-shadow">
            <img
              src="/gearvn-pc-gvn-sticky-t1-26.png"
              alt="PC GVN"
              className="h-full w-full object-contain object-center"
            />
          </div>
        </Link>
      </div>

      {/* Right sticky banner */}
      <div
        className={`fixed right-3 ${posClass} z-40 hidden xl:block transition-all duration-300 ease-out`}
      >
        <Link to="/products?category=laptop-gaming" aria-label="Laptop Gaming Banner">
          <div className="relative h-[380px] w-[100px] overflow-hidden rounded-md shadow-lg hover:shadow-xl transition-shadow">
            <img
              src="/gearvn-laptop-gaming-sticky-t1-26.png"
              alt="Laptop Gaming"
              className="h-full w-full object-contain object-center"
            />
          </div>
        </Link>
      </div>
    </>
  );
}
