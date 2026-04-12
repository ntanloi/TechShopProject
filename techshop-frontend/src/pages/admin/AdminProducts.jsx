import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import productApi from "../../api/productApi";
import categoryApi from "../../api/categoryApi";
import { toast } from "react-toastify";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  imageUrl: "",
  brand: "",
  sku: "",
  categoryId: "",
  specifications: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = () => {
    setLoading(true);
    const req = search
      ? productApi.search(search, { page, size: 10 })
      : productApi.getAll({ page, size: 10 });
    req
      .then((r) => {
        setProducts(r.data?.content || []);
        setTotalPages(r.data?.totalPages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, search]);
  useEffect(() => {
    categoryApi
      .getAll()
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...p,
      price: p.price || "",
      salePrice: p.salePrice || "",
      categoryId: p.category?.id || "",
    });
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
      };
      if (editing) await productApi.update(editing.id, data);
      else await productApi.create(data);
      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
      setModal(false);
      load();
    } catch {
      toast.error("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    try {
      await productApi.delete(id);
      toast.success("Đã xóa");
      load();
    } catch {
      toast.error("Không thể xóa");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow"
        >
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="Tìm sản phẩm..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Sản phẩm",
                  "Danh mục",
                  "Giá",
                  "Giá KM",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    Không có sản phẩm
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              📦
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">
                            {p.name}
                          </p>
                          {p.brand && (
                            <p className="text-xs text-gray-500">{p.brand}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {p.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {Number(p.price).toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-6 py-4 text-orange-500">
                      {p.salePrice
                        ? `${Number(p.salePrice).toLocaleString("vi-VN")}₫`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {p.active ? "Đang bán" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition ${i === page ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Sửa sản phẩm" : "Thêm sản phẩm"}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Tên sản phẩm *", required: true },
                  { name: "brand", label: "Thương hiệu" },
                  {
                    name: "price",
                    label: "Giá *",
                    type: "number",
                    required: true,
                  },
                  {
                    name: "salePrice",
                    label: "Giá khuyến mãi",
                    type: "number",
                  },
                  { name: "sku", label: "Mã SKU" },
                  { name: "imageUrl", label: "URL hình ảnh" },
                ].map(({ name, label, type = "text", required }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      required={required}
                      value={form[name] || ""}
                      onChange={(e) =>
                        setForm({ ...form, [name]: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Danh mục
                </label>
                <select
                  value={form.categoryId || ""}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
