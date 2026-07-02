import { Link } from "react-router-dom";

export default function MegaMenuContent({ category }) {
  if (!category || !category.sections) return null;
  return (
    <div className="grid h-full grid-cols-4 content-start gap-x-8 gap-y-6 p-5 xl:grid-cols-5 bg-white rounded-r-md">
      {category.sections.map((section) => (
        <div key={section.title} className="min-w-0">
          <h3 className="mb-2 text-[14px] font-bold leading-5 text-[#E30019] uppercase">
            {section.title}
          </h3>

          <ul className="space-y-1.5">
            {section.items.map((item) => (
              <li key={item}>
                <Link
                  to={`/products?category=${category.id}&keyword=${encodeURIComponent(item)}`}
                  className="block text-[14px] leading-5 text-gray-800 transition-colors duration-150 hover:text-[#E30019]"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
