import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import bannerApi from "../api/bannerApi";

const LOCAL_RIGHT_BANNERS = [
  {
    src: "/gearvn-build-pc-sub-banner-t1-26.png",
    alt: "Build PC",
    href: "/products?category=pc-gvn",
  },
  {
    src: "/gearvn-ban-phim-sub-banner-t1-26.png",
    alt: "Bàn phím",
    href: "/products?category=ban-phim",
  },
];

const LOCAL_SLIDES = [
  {
    src: "/gearvn-thu-cu-doi-moi-t10-slider.jpeg",
    alt: "Hero 1",
    href: "/trade-in-pricing",
  },
  {
    src: "/gearvn-pc-gvn-t11-slider.jpg",
    alt: "Hero 2",
    href: "/products?category=pc-gvn",
  },
  {
    src: "/gearvn-man-hinh-t10-slider.jpg",
    alt: "Hero 3",
    href: "/products?category=man-hinh",
  },
  {
    src: "/gearvn-laptop-acer-predator-triton-14a-slider-t12.jpg",
    alt: "Hero 4",
    href: "/products?category=laptop-gaming",
  },
  {
    src: "/gearvn-laptop-nvidia-rtx-50-series-slider.jpg",
    alt: "Hero 5",
    href: "/products?category=laptop-gaming",
  },
  {
    src: "/gearvn-laptop-gigabyte-slider-t12.jpg",
    alt: "Hero 6",
    href: "/products?category=laptop-gaming",
  },
  {
    src: "/gearvn-pc-gvn-nvidia-sliders.jpg",
    alt: "Hero 7",
    href: "/products?category=pc-gvn",
  },
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState(LOCAL_SLIDES);
  const [rightBanners, setRightBanners] = useState(LOCAL_RIGHT_BANNERS);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      bannerApi.getActive("HERO_SLIDE"),
      bannerApi.getActive("HERO_RIGHT")
    ])
      .then(([slideRes, rightRes]) => {
        if (slideRes.data && slideRes.data.length > 0) {
          setSlides(slideRes.data);
        }
        if (rightRes.data && rightRes.data.length > 0) {
          setRightBanners(rightRes.data);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tải banners từ API:", err);
      });
  }, []);

  const current = slides[idx];

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!current) return null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 w-full">
      <div className="lg:col-span-2">
        <div className="relative h-44 sm:h-[340px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
          <Link
            to={current.linkUrl || current.href || "#"}
            aria-label={current.title || current.alt}
            className="absolute inset-0 block"
          >
            <img
              src={current.imageUrl || current.src}
              alt={current.title || current.alt}
              className="w-full h-full object-cover"
            />
          </Link>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i === idx ? "bg-[#E30019]" : "bg-black/25 hover:bg-black/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-1 lg:gap-3 hidden">
        {rightBanners.map((banner, i) => (
          <div 
            key={i}
            className="relative h-[164px] w-full rounded-lg overflow-hidden border border-gray-100">
            <Link
              to={banner.linkUrl || banner.href || "#"}
              aria-label={banner.title || banner.alt}
              className="block w-full h-full"
            >
              <img
                src={banner.imageUrl || banner.src}
                alt={banner.title || banner.alt}
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
