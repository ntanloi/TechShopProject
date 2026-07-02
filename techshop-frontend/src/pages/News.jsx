import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { newsArticles, newsBanner, hotTopics, tipsArticles, gameTopics } from "../data/news";

export default function News() {
  const featured = useMemo(() => newsArticles.filter((item) => item.featured), []);
  const normalArticles = useMemo(() => newsArticles.filter((item) => !item.featured), []);

  const [visibleCount, setVisibleCount] = useState(7);
  const displayedArticles = useMemo(() => normalArticles.slice(0, visibleCount), [normalArticles, visibleCount]);

  const loadMore = () => {
    setVisibleCount((prev) => prev + 4);
  };

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-4 px-4 text-gray-800">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Breadcrumbs */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link to="/" className="text-blue-600 hover:underline">Trang chủ</Link>
          <span>/</span>
          <span>Tin tức công nghệ</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 md:p-8 border border-gray-100">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#E30019] rounded-full inline-block" />
              TIN TỨC CÔNG NGHỆ NỔI BẬT
            </h1>
            <p className="mt-2 text-xs md:text-sm text-gray-500">
              Cập nhật liên tục tin tức công nghệ mới nhất, xu hướng thiết bị phần cứng PC/Laptop, thủ thuật và cẩm nang lựa chọn đồ công nghệ phù hợp.
            </p>
          </header>

          {/* Featured Hero Banner */}
          <div className="relative h-44 sm:h-[300px] w-full rounded-xl overflow-hidden mb-8 border shadow-sm group">
            <img
              src={newsBanner.image}
              alt={newsBanner.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-[10px] md:text-xs bg-[#E30019] text-white px-2 py-0.5 rounded font-extrabold w-fit mb-2">
                {newsBanner.subtitle}
              </span>
              <h2 className="text-base md:text-2xl font-black">{newsBanner.title}</h2>
              <p className="text-[11px] md:text-sm text-gray-200 mt-1 line-clamp-2">{newsBanner.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8">
            
            {/* Left Content column */}
            <div className="space-y-8">
              
              {/* Featured Articles Grid */}
              <section>
                <h3 className="text-base md:text-lg font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#E30019] inline-block" />
                  Tiêu Điểm Nổi Bật
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featured.map((article) => (
                    <div key={article.id} className="group flex flex-col border rounded-lg overflow-hidden bg-white hover:border-red-500 hover:shadow-md transition">
                      <div className="relative aspect-video w-full overflow-hidden">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-red-100 text-[#E30019] px-2 py-0.5 rounded font-bold uppercase">
                            {article.category}
                          </span>
                          <h4 className="text-[13px] font-bold text-gray-900 mt-2 line-clamp-2 group-hover:text-[#E30019] transition">
                            {article.title}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="text-[9px] text-gray-400 mt-3 flex items-center justify-between">
                          <span>{article.author}</span>
                          <span>{article.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Normal Articles List */}
              <section>
                <h3 className="text-base md:text-lg font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#E30019] inline-block" />
                  Mới Cập Nhật
                </h3>

                <div className="space-y-4">
                  {displayedArticles.map((article) => (
                    <div key={article.id} className="flex gap-4 p-3 border rounded-lg hover:border-red-400 transition bg-white group">
                      <div className="w-24 sm:w-36 aspect-video bg-gray-100 rounded overflow-hidden shrink-0">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">
                            {article.category}
                          </span>
                          <h4 className="text-[13px] sm:text-base font-bold text-gray-900 mt-1 line-clamp-2 group-hover:text-[#E30019] transition">
                            {article.title}
                          </h4>
                          <p className="hidden sm:block text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="text-[9px] sm:text-xs text-gray-400 mt-2 flex items-center gap-4">
                          <span>Bởi: {article.author}</span>
                          <span>•</span>
                          <span>{article.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {visibleCount < normalArticles.length && (
                  <button
                    onClick={loadMore}
                    className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-lg hover:bg-[#E30019] hover:text-white transition-colors"
                  >
                    Xem thêm bài viết
                  </button>
                )}
              </section>

            </div>

            {/* Right Sidebar column */}
            <aside className="space-y-6 shrink-0">
              
              {/* Hot topics */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-[#E30019] inline-block" />
                  Chủ Đề Hot
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {hotTopics.map((topic, i) => (
                    <div key={i} className="relative aspect-video rounded overflow-hidden shadow-sm group">
                      <img
                        src={topic.image}
                        alt={topic.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 text-center text-white text-[11px] font-bold">
                        {topic.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips list */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-[#E30019] inline-block" />
                  Mẹo Hay & Thủ Thuật
                </h4>
                <div className="space-y-3">
                  {tipsArticles.map((tip) => (
                    <div key={tip.id} className="flex gap-2 group cursor-pointer">
                      <div className="w-16 h-12 bg-white border rounded overflow-hidden shrink-0">
                        <img
                          src={tip.image}
                          alt={tip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#E30019] transition">
                          {tip.title}
                        </h5>
                        <span className="text-[9px] text-gray-400 mt-1 block">{tip.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gaming corner */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1 h-3 bg-[#E30019] inline-block" />
                  Góc Game Thủ
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {gameTopics.map((topic, i) => (
                    <div key={i} className="relative aspect-video rounded overflow-hidden shadow-sm group">
                      <img
                        src={topic.image}
                        alt={topic.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-2 text-center text-white text-[11px] font-bold">
                        {topic.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}
