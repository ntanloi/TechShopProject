import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Upload,
  AlertCircle,
} from "lucide-react";
import productApi from "../../api/productApi";
import categoryApi from "../../api/categoryApi";
import { toast } from "react-toastify";
import { useAuth } from "../../store/AuthContext";

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

const EMPTY_ERRORS = {
  name: "",
  price: "",
  salePrice: "",
  sku: "",
  categoryId: "",
};

export default function AdminProducts() {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: "",
    data: null,
  });

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
      .then((r) => {
        console.log("Categories loaded:", r.data);
        setCategories(r.data || []);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        toast.error("Không thể tải danh mục sản phẩm");
      });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors(EMPTY_ERRORS);
    setImageFile(null);
    setImagePreview("");
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
    setErrors(EMPTY_ERRORS);
    setImageFile(null);
    setImagePreview(p.imageUrl || "");
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

    // Validate name
    if (!form.name || form.name.trim() === "") {
      newErrors.name = "Tên sản phẩm không được để trống";
      isValid = false;
    }

    // Validate price
    if (!form.price || form.price === "") {
      newErrors.price = "Giá không được để trống";
      isValid = false;
    } else if (Number(form.price) <= 0) {
      newErrors.price = "Giá phải lớn hơn 0";
      isValid = false;
    }

    // Validate salePrice
    if (form.salePrice && form.salePrice !== "") {
      if (Number(form.salePrice) <= 0) {
        newErrors.salePrice = "Giá khuyến mãi phải lớn hơn 0";
        isValid = false;
      } else if (Number(form.salePrice) > Number(form.price)) {
        newErrors.salePrice = "Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin!");
      return;
    }

    // Show confirm modal
    setConfirmModal({
      show: true,
      type: editing ? "edit" : "create",
      data: form,
    });
  };

  const confirmSave = async () => {
    setSaving(true);
    setConfirmModal({ show: false, type: "", data: null });

    // Debug logging
    console.log("User info:", {
      token: user?.token ? "exists" : "missing",
      role: user?.role,
      isAdmin,
    });

    try {
      let imageUrl = form.imageUrl || "";

      // Upload image if new file selected (optional - skip if Cloudinary not configured)
      if (imageFile) {
        try {
          setUploading(true);
          const formData = new FormData();
          formData.append("file", imageFile);
          const uploadRes = await productApi.uploadImage(formData);
          imageUrl = uploadRes.data;
          toast.success("Đã upload ảnh thành công!");
          setUploading(false);
        } catch (uploadErr) {
          setUploading(false);
          console.error("Upload failed:", uploadErr);

          // Check if it's a Cloudinary configuration error
          const errorMsg = uploadErr.response?.data || uploadErr.message || "";
          if (
            errorMsg.includes("disabled") ||
            errorMsg.includes("Cloudinary")
          ) {
            toast.warning(
              "Cloudinary chưa được cấu hình. Lưu sản phẩm không có ảnh.",
            );
          } else {
            toast.warning("Không thể upload ảnh. Lưu sản phẩm không có ảnh.");
          }
          imageUrl = ""; // Save without image if upload fails
        }
      }

      const data = {
        ...form,
        imageUrl,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
      };

      if (editing) await productApi.update(editing.id, data);
      else await productApi.create(data);

      toast.success(editing ? "Đã cập nhật sản phẩm" : "Đã thêm sản phẩm");
      setModal(false);
      setImageFile(null);
      setImagePreview("");
      setErrors(EMPTY_ERRORS);
      load();
    } catch (err) {
      console.error("Save failed:", err);
      console.error("Error response:", err.response);
      const errorMsg =
        err.response?.data?.message || err.response?.data || "Lưu thất bại!";

      // Handle 401 Unauthorized
      if (err.response?.status === 401) {
        toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
        return;
      }

      // Handle 403 Forbidden
      if (err.response?.status === 403) {
        toast.error(
          "Bạn không có quyền thực hiện thao tác này! Chỉ ADMIN mới được phép.",
        );
        return;
      }

      // Parse backend validation errors
      if (errorMsg.includes("Mã SKU đã tồn tại")) {
        setErrors((prev) => ({ ...prev, sku: "Mã SKU đã tồn tại" }));
      } else if (errorMsg.includes("Giá phải lớn hơn 0")) {
        setErrors((prev) => ({ ...prev, price: "Giá phải lớn hơn 0" }));
      } else if (errorMsg.includes("Giá khuyến mãi phải lớn hơn 0")) {
        setErrors((prev) => ({
          ...prev,
          salePrice: "Giá khuyến mãi phải lớn hơn 0",
        }));
      } else if (errorMsg.includes("Giá khuyến mãi phải nhỏ hơn")) {
        setErrors((prev) => ({
          ...prev,
          salePrice: "Giá khuyến mãi phải nhỏ hơn hoặc bằng giá gốc",
        }));
      } else if (errorMsg.includes("Không tìm thấy danh mục")) {
        setErrors((prev) => ({
          ...prev,
          categoryId: "Danh mục không tồn tại",
        }));
      }

      toast.error(errorMsg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      show: true,
      type: "delete",
      data: id,
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.data;
    setConfirmModal({ show: false, type: "", data: null });

    // Debug logging
    console.log("Deleting product:", id);
    console.log("User info:", {
      token: user?.token ? "exists" : "missing",
      role: user?.role,
      isAdmin,
    });

    try {
      await productApi.delete(id);
      toast.success("Đã xóa sản phẩm");
      load();
    } catch (err) {
      console.error("Delete failed:", err);
      console.error("Error response:", err.response);

      // Handle 401 Unauthorized
      if (err.response?.status === 401) {
        toast.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
        return;
      }

      // Handle 403 Forbidden
      if (err.response?.status === 403) {
        toast.error(
          "Bạn không có quyền xóa sản phẩm! Chỉ ADMIN mới được phép.",
        );
        return;
      }

      const errorMsg =
        err.response?.data?.message ||
        err.response?.data ||
        "Không thể xóa sản phẩm";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning if not admin */}
      {!isAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              Không có quyền truy cập
            </p>
            <p className="text-sm text-red-600">
              Bạn cần đăng nhập với tài khoản ADMIN để quản lý sản phẩm. Role
              hiện tại: <strong>{user?.role || "Chưa đăng nhập"}</strong>
            </p>
          </div>
        </div>
      )}

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
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
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
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hình ảnh sản phẩm
                </label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 border-2 border-dashed border-gray-300">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        📷
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow">
                      <Upload className="h-4 w-4" />
                      Chọn ảnh từ máy tính
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Định dạng: JPG, PNG, GIF. Tối đa 5MB.
                    </p>
                    {imageFile && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ Đã chọn: {imageFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { name: "name", label: "Tên sản phẩm *", required: true },
                  { name: "brand", label: "Thương hiệu", required: false },
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
                    required: false,
                  },
                  { name: "sku", label: "Mã SKU", required: false },
                ].map(({ name, label, type = "text", required }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Danh mục
                </label>
                <select
                  value={form.categoryId || ""}
                  onChange={(e) => {
                    setForm({ ...form, categoryId: e.target.value });
                    // Clear error when user selects
                    if (errors.categoryId) {
                      setErrors({ ...errors, categoryId: "" });
                    }
                  }}
                  className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    errors.categoryId
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-orange-400"
                  }`}
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.length === 0 ? (
                    <option disabled>Không có danh mục nào</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.categoryId}
                  </p>
                )}
                {categories.length === 0 && !errors.categoryId && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Chưa có danh mục. Vui lòng tạo danh mục trước.
                  </p>
                )}
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

      {/* Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100">
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {confirmModal.type === "delete" && "Xác nhận xóa sản phẩm"}
                {confirmModal.type === "create" && "Xác nhận thêm sản phẩm"}
                {confirmModal.type === "edit" && "Xác nhận cập nhật sản phẩm"}
              </h3>

              <p className="text-gray-600 text-center mb-6">
                {confirmModal.type === "delete" &&
                  "Sản phẩm sẽ bị ẩn khỏi danh sách. Bạn có chắc chắn muốn tiếp tục?"}
                {confirmModal.type === "create" &&
                  "Sản phẩm mới sẽ được thêm vào hệ thống. Bạn có chắc chắn?"}
                {confirmModal.type === "edit" &&
                  "Thông tin sản phẩm sẽ được cập nhật. Bạn có chắc chắn?"}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ show: false, type: "", data: null })
                  }
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={
                    confirmModal.type === "delete" ? confirmDelete : confirmSave
                  }
                  className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${
                    confirmModal.type === "delete"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {confirmModal.type === "delete" ? "Xóa" : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
