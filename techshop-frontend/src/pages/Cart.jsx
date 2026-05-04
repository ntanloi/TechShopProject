import { useEffect, useState, useCallback, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, Tag, Gift, ChevronRight, AlertCircle } from "lucide-react";
import useCartStore from "../store/cartStore";
import { useAuth } from "../store/AuthContext";
import { toast } from "react-toastify";

/**
 * Modal xác nhận tùy chỉnh
 */
const ConfirmModal = memo(({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-500 mb-8 leading-relaxed">{message}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Thành phần hiển thị một dòng sản phẩm trong giỏ hàng
 * Hỗ trợ Responsive: Mobile (Dạng thẻ), Desktop (Dạng bảng)
 */
const CartItemRow = memo(({ item, isSelected, onToggle, onUpdate, onRemove }) => {
  const subtotal = item.unitPrice * item.quantity;

  return (
    <div className="p-4 transition-colors hover:bg-gray-50/50 border-b border-gray-100 last:border-0">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">

        {/* Phần đầu: Checkbox, Ảnh và Thông tin cơ bản (45%) */}
        <div className="flex items-start md:items-center md:w-[45%] gap-3 md:pr-6">
          <div className="pt-1 md:pt-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(item.id)}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
            />
          </div>
          <Link to={`/products/${item.productId}`} className="w-20 h-20 md:w-24 md:h-24 border border-gray-200 rounded shrink-0 p-1 bg-white">
            <img
              src={item.productImage || "/placeholder.jpg"}
              alt={item.productName}
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = 'https://placehold.co/150x150?text=No+Image' }}
            />
          </Link>
          <div className="flex flex-col min-w-0 flex-1">
            <Link to={`/products/${item.productId}`} className="text-sm md:text-base font-medium text-gray-800 hover:text-orange-500 line-clamp-2 leading-relaxed">
              {item.productName}
            </Link>
            {item.productBrand && (
              <span className="text-xs text-gray-500 mt-1">Thương hiệu: {item.productBrand}</span>
            )}

            {/* Giá hiển thị trên Mobile (Dưới tên SP) */}
            <div className="md:hidden mt-2 flex items-baseline gap-2">
              <span className="font-bold text-orange-600">{Number(item.unitPrice).toLocaleString("vi-VN")}₫</span>
              <span className="text-[10px] text-gray-400 line-through">{Number(item.unitPrice * 1.1).toLocaleString("vi-VN")}₫</span>
            </div>

            {/* Cảnh báo tồn kho dựa trên ngưỡng từ inventory-service */}
            {item.availableStock !== undefined && (
              item.availableStock > 0 && item.availableStock <= (item.lowStockThreshold || 5) ? (
                <span className="text-[11px] text-orange-500 mt-1 font-medium italic">
                  Chỉ còn {item.availableStock} sản phẩm
                </span>
              ) : item.availableStock === 0 && (
                <span className="text-[11px] text-red-500 mt-1 font-bold italic">Hết hàng</span>
              )
            )}
          </div>
        </div>

        {/* Cột 2: Đơn giá (15%) */}
        <div className="hidden md:flex md:w-[15%] flex-col items-end pt-2 text-right md:pr-6">
          <span className="font-bold text-gray-900">{Number(item.unitPrice).toLocaleString("vi-VN")}₫</span>
          <span className="text-[10px] text-gray-400 line-through mt-0.5">{Number(item.unitPrice * 1.1).toLocaleString("vi-VN")}₫</span>
        </div>

        {/* Cột 3: Số lượng (15%) */}
        <div className="flex md:w-[15%] items-center justify-between md:justify-center mt-2 md:mt-0 md:pl-6 md:pr-2">
          <span className="text-xs text-gray-500 md:hidden">Số lượng:</span>
          <div className="flex items-center border border-gray-200 rounded h-8 overflow-hidden bg-white">
            <button
              onClick={() => onUpdate(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 h-full flex items-center justify-center text-sm font-medium border-x border-gray-200 bg-white">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(item.id, item.quantity + 1)}
              className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Cột 4: Thành tiền (15%) */}
        <div className="flex md:w-[15%] items-center justify-between md:justify-end mt-2 md:mt-0 md:pl-10">
          <span className="text-xs text-gray-500 md:hidden">Thành tiền:</span>
          <span className="font-bold text-orange-600">
            {Number(subtotal).toLocaleString("vi-VN")}₫
          </span>
        </div>

        {/* Cột 5: Nút xóa (10%) */}
        <div className="flex md:w-[10%] justify-end md:justify-center items-center mt-2 md:mt-0">
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group"
            title="Xóa khỏi giỏ hàng"
          >
            <Trash2 className="h-5 w-5 group-hover:scale-110" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default function Cart() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { items, fetchCart, updateQuantity, removeItem, clearCart, loading } = useCartStore();
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, targetId: null });

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);

  useEffect(() => {
    if (items.length > 0 && selectedItems.length === 0) {
      setSelectedItems(items.map(item => item.id));
    }
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      console.log("Cart items updated:", items.map(i => ({
        id: i.id,
        name: i.productName,
        stock: i.availableStock,
        threshold: i.lowStockThreshold
      })));
    }
  }, [items]);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  }, [selectedItems.length, items]);

  const toggleSelectItem = useCallback((id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  }, []);

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  const handleUpdate = useCallback(async (id, qty) => {
    try {
      await updateQuantity(id, qty);
    } catch (error) {
      // Trích xuất thông báo lỗi linh hoạt từ nhiều nguồn khác nhau
      const errorData = error.response?.data;
      const serverMsg = errorData?.message || errorData?.error || (typeof errorData === 'string' ? errorData : null);
      const msg = serverMsg || error.message || "Không thể cập nhật số lượng";

      console.error("Lỗi cập nhật số lượng:", error);
      toast.error(msg);
    }
  }, [updateQuantity]);

  const openRemoveModal = useCallback((id) => {
    setModalConfig({ isOpen: true, type: "REMOVE_ITEM", targetId: id });
  }, []);

  const openClearModal = useCallback(() => {
    setModalConfig({ isOpen: true, type: "CLEAR_CART", targetId: null });
  }, []);

  const handleConfirm = async () => {
    if (modalConfig.type === "REMOVE_ITEM") {
      try {
        await removeItem(modalConfig.targetId);
        setSelectedItems(prev => prev.filter(itemId => itemId !== modalConfig.targetId));
        toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
      } catch {
        toast.error("Không thể xóa sản phẩm");
      }
    } else if (modalConfig.type === "CLEAR_CART") {
      try {
        await clearCart();
        setSelectedItems([]);
        toast.success("Đã xóa toàn bộ giỏ hàng");
      } catch {
        toast.error("Không thể xóa giỏ hàng");
      }
    }
    setModalConfig({ isOpen: false, type: null, targetId: null });
  };

  if (!user) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-[#f8f9fa]">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm text-center max-w-md w-full border border-gray-100">
        <ShoppingBag className="h-16 w-16 text-orange-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Vui lòng đăng nhập</h2>
        <p className="text-gray-500 mb-8">Đăng nhập tài khoản để quản lý giỏ hàng của bạn.</p>
        <Link to="/login" className="block w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );

  if (loading && items.length === 0) return (
    <div className="max-w-[1200px] mx-auto px-4 py-12 animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="lg:col-span-1">
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-[#f8f9fa]">
      <div className="text-center">
        <ShoppingBag className="h-20 w-20 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">Chưa có sản phẩm nào trong giỏ hàng.<br />Hãy khám phá hàng ngàn sản phẩm công nghệ tại TechShop!</p>
        <Link to="/products" className="inline-flex items-center px-8 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-6 font-sans">
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, targetId: null })}
        onConfirm={handleConfirm}
        title="Xác nhận xóa"
        message={
          modalConfig.type === "REMOVE_ITEM"
            ? "Bạn chắc chắn muốn xoá sản phẩm này ra khỏi giỏ hàng?"
            : "Bạn chắc chắn muốn xoá toàn bộ sản phẩm trong giỏ hàng?"
        }
      />

      <div className="max-w-[1200px] mx-auto px-4">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link to="/" className="text-orange-500 hover:underline">Trang chủ</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>Giỏ hàng</span>
          </div>
        </div>

        {/* Hàng Tiêu đề & Xóa tất cả: Sử dụng layout 2 cột để căn lề chuẩn với danh sách bên dưới */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1 flex items-center justify-between px-4">
            <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng ({items.length})</h1>

            {/* Nút Xóa tất cả (Desktop): Thẳng cột với nút xóa 10% */}
            <div className="hidden md:flex w-[10%] justify-center">
              <button
                onClick={openClearModal}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[12px] font-bold whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" /> XÓA TẤT CẢ
              </button>
            </div>

            {/* Nút Xóa tất cả (Mobile): Hiển thị cạnh tiêu đề */}
            <button
              onClick={openClearModal}
              className="md:hidden text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Trash2 className="h-4 w-4" /> XÓA TẤT CẢ
            </button>
          </div>
          <div className="hidden lg:block w-[350px] shrink-0"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* DANH SÁCH SẢN PHẨM */}
          <div className="flex-1">
            {/* Header cho Desktop */}
            <div className="hidden md:flex bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 items-center">
              <div className="w-[45%] flex items-center gap-3 md:pr-10">
                <input
                  type="checkbox"
                  checked={selectedItems.length === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <span className="font-bold text-gray-800 text-sm uppercase">Tất cả sản phẩm</span>
              </div>
              <div className="w-[15%] text-right text-sm text-gray-700 font-bold md:pr-6">Đơn giá</div>
              <div className="w-[15%] text-center text-sm text-gray-700 font-bold md:pl-4">Số lượng</div>
              <div className="w-[15%] text-right text-sm text-gray-700 font-bold md:pl-10">Thành tiền</div>
              <div className="w-[10%]"></div>
            </div>

            {/* List items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onToggle={toggleSelectItem}
                  onUpdate={handleUpdate}
                  onRemove={openRemoveModal}
                />
              ))}
            </div>
          </div>

          {/* TÓM TẮT THANH TOÁN */}
          <div className="w-full lg:w-[350px] shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-800">Khuyến mãi</span>
                <button className="text-blue-500 hover:underline text-sm flex items-center gap-1 font-medium">
                  <Tag className="h-3 w-3" /> Chọn hoặc nhập khuyến mãi
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6 border-b border-gray-100 pb-4">Tóm tắt đơn hàng</h3>

              <div className="space-y-4 mb-6 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tạm tính ({selectedItems.length} sản phẩm)</span>
                  <span className="font-semibold text-gray-900">{Number(selectedTotal).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Miễn phí</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 pb-8">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">Tổng cộng</span>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-orange-500 leading-none mb-1">
                      {Number(selectedTotal).toLocaleString("vi-VN")}₫
                    </span>
                    <span className="text-[11px] text-gray-400">(Đã bao gồm VAT)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => nav("/checkout")}
                disabled={selectedItems.length === 0}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all uppercase text-sm tracking-wider shadow-lg shadow-orange-500/25 active:scale-[0.98]"
              >
                Tiếp tục
              </button>

              <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center">
                Bằng cách đặt hàng, bạn đồng ý với Điều khoản của TechShop.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
