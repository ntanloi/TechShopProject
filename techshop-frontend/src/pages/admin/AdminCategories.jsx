import { useEffect, useState } from "react";
import categoryApi from "../../api/categoryApi";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    categoryApi
      .getAll()
      .then((r) => setCategories(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Quản lý danh mục
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-200 rounded-2xl animate-pulse"
                />
              ))
          : categories.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border p-5 shadow-sm"
              >
                <p className="font-semibold text-gray-800">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-gray-500">
                    {c.description}
                  </p>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}