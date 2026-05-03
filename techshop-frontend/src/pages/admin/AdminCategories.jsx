import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, AlertCircle, Upload } from "lucide-react";
import categoryApi from "../../api/categoryApi";
import { toast } from "react-toastify";

const EMPTY = { name: "", description: "", imageUrl: "", slug: "" };
const EMPTY_ERRORS = { name: "" };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, id: null });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);

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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors(EMPTY_ERRORS);
    setImageFile(null);
    setImagePreview("");
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ ...c });
    setErrors(EMPTY_ERRORS);
    setImageFile(null);
    setImagePreview(c.imageUrl || "");
    setModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh!");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB!");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validateForm = () => {
    const newErrors = { ...EMPTY_ERRORS };
    let isValid = true;

    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Tên danh mục không được để trống";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl || "";

      // Upload image if new file selected
      if (imageFile) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append("file", imageFile);

          // Import productApi to use upload endpoint
          const productApi = (await import("../../api/productApi")).default;
          const uploadRes = await productApi.uploadImage(formData);
          imageUrl = uploadRes.data;
          toast.success("Đã upload ảnh thành công!");
          setUploading(false);
        } catch (uploadErr) {
          setUploading(false);
          console.error("Upload failed:", uploadErr);

          const errorMsg = uploadErr.response?.data || uploadErr.message || "";
          if (
            errorMsg.includes("disabled") ||
            errorMsg.includes("Cloudinary")
          ) {
            toast.warning(
              "Cloudinary chưa được cấu hình. Lưu danh mục không có ảnh.",
            );
          } else {
            toast.warning("Không thể upload ảnh. Lưu danh mục không có ảnh.");
          }
          imageUrl = "";
        }
      }

      const data = { ...form, imageUrl };

      if (editing) await categoryApi.update(editing.id, data);
      else await categoryApi.create(data);

      toast.success(editing ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
      setModal(false);
      setErrors(EMPTY_ERRORS);
      setImageFile(null);
      setImagePreview("");
      load();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data || "Lưu thất bại!";

      // Parse backend validation errors
      if (errorMsg.includes("Tên danh mục đã tồn tại")) {
        setErrors((prev) => ({ ...prev, name: "Tên danh mục đã tồn tại" }));
      }

      toast.error(errorMsg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ show: false, id: null });

    console.log("Deleting category:", id);

    try {
      await categoryApi.delete(id);
      toast.success("Đã xóa danh mục");
      load();
    } catch (err) {
      console.error("Delete category failed:", err);
      console.error("Error response:", err.response);

      const errorMsg =
        err.response?.data?.message || err.response?.data || "Không thể xóa";

      // Parse error message to show product count
      if (errorMsg.includes("đang có") || errorMsg.includes("sản phẩm")) {
        // Extract number from message like "Không thể xóa danh mục đang có 5 sản phẩm"
        const match = errorMsg.match(/(\d+)\s*sản phẩm/);
        if (match) {
          const count = match[1];
          toast.error(`Không thể xóa danh mục đang có ${count} sản phẩm!`, {
            autoClose: 5000,
          });
        } else {
          toast.error(errorMsg, { autoClose: 5000 });
        }
      } else {
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow"
        >
          <Plus className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

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
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">
                    {c.imageUrl ? (
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
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
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Sửa danh mục" : "Thêm danh mục"}
              </h2>
              <button
                onClick={() => setModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh danh mục
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden shrink-0 border-2 border-dashed border-gray-300">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow">
                      <Upload className="h-4 w-4" />
                      Chọn ảnh
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG, GIF. Tối đa 5MB.
                    </p>
                    {imageFile && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ Đã chọn: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {[
                { name: "name", label: "Tên danh mục *", required: true },
                { name: "description", label: "Mô tả" },
                { name: "slug", label: "Slug (URL)" },
              ].map(({ name, label, required }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    required={required}
                    value={form[name] || ""}
                    onChange={(e) => {
                      setForm({ ...form, [name]: e.target.value });
                      // Clear error when user types
                      if (errors[name]) {
                        setErrors({ ...errors, [name]: "" });
                      }
                    }}
                    className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                      errors[name]
                        ? "border-red-300 focus:ring-red-400"
                        : "border-gray-200 focus:ring-orange-400"
                    }`}
                  />
                  {errors[name] && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors[name]}
                    </p>
                  )}
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  disabled={saving || uploading}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving || uploading ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"}`}
                >
                  {uploading
                    ? "Đang tải ảnh..."
                    : saving
                      ? "Đang lưu..."
                      : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Xác nhận xóa danh mục
              </h3>

              <p className="text-gray-600 text-center mb-6">
                Danh mục sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ show: false, id: null })}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 font-semibold text-white rounded-xl transition bg-red-500 hover:bg-red-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
