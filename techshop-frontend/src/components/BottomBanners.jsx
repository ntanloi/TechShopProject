import { Link } from "react-router-dom";

const topRow = [
  { src: "/banner-laptop-gaming.png", alt: "Laptop Gaming", href: "/products?category=laptop-gaming" },
  { src: "/banner-laptop-office.png", alt: "Laptop Office", href: "/products?category=laptop" },
  { src: "/banner-pc-i5-5060.png", alt: "PC i5 5060", href: "/products?category=pc-gvn" },
];

const bottomRow = [
  { src: "/banner-deal-hong-dieu.png", alt: "Deal hồng điều", href: "/products" },
  { src: "/banner-monitor.png", alt: "Monitor", href: "/products?category=man-hinh" },
  { src: "/banner-gaming-mouse.png", alt: "Gaming Mouse", href: "/products?category=chuot-lot-chuot" },
  { src: "/banner-pc-rx6500xt.png", alt: "PC RX 6500XT", href: "/products?category=pc-gvn" },
];

function BannerCard({ item, heightClass = "h-[165px]" }) {
  return (
    <Link
      to={item.href || "#"}
      aria-label={item.alt}
      className="block overflow-hidden rounded-lg bg-white w-full border border-gray-100 shadow-sm"
    >
      <div className={`relative w-full overflow-hidden rounded-lg ${heightClass}`}>
        <img
          src={item.src}
          alt={item.alt}
          className="w-full h-full object-cover hover:scale-[1.02] transition duration-300"
        />
      </div>
    </Link>
  );
}

export function TopPromoRow() {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3 mt-3 w-full">
      {topRow.map((item) => (
        <BannerCard
          key={item.src}
          item={item}
        />
      ))}
    </div>
  );
}

export function BottomWideRow() {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-3 w-full">
      {bottomRow.map((item) => (
        <BannerCard
          key={item.src}
          item={item}
          heightClass="h-[120px] md:h-[150px]"
        />
      ))}
    </div>
  );
}
