import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import categoryApi from "../../api/categoryApi";
import { toast } from "react-toastify";

const EMPTY = { name: "", description: "", imageUrl: "", slug: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    categoryApi.getAll().then((r) => setCategories(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await categoryApi.update(editing.id, form);
      else await categoryApi.create(form);
      toast.success(editing ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
      setModal(false);
      load();
    } catch { toast.error("Lưu thất bại!"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa danh mục này?")) return;
    try { await categoryApi.delete(id); toast.success("Đã xóa"); load(); }
    catch { toast.error("Không thể xóa (có thể đang có sản phẩm)"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow">
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        )) : categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">
                {c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="w-8 h-8 object-contain" /> : "📦"}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{c.name}</p>
                {c.description && <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Sửa danh mục" : "Thêm danh mục"}</h2>
              <button onClick={() => setModal(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { name: "name", label: "Tên danh mục *", required: true },
                { name: "description", label: "Mô tả" },
                { name: "imageUrl", label: "URL hình ảnh" },
                { name: "slug", label: "Slug (URL)" },
              ].map(({ name, label, required }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type="text" required={required} value={form[name] || ""} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={saving}
                  className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"}`}>
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
