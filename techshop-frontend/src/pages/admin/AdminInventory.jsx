import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Plus, RefreshCw, Search,
  Package, ArrowUpCircle, ArrowDownCircle, CheckCircle,
  X, Warehouse, TrendingDown, Edit3,
} from "lucide-react";
import inventoryApi from "../../api/inventoryApi";
import productApi from "../../api/productApi";
import orderApi from "../../api/orderApi";
import { toast } from "react-toastify";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "Tất cả kho" },
  { key: "in", label: "Còn hàng" },
  { key: "low", label: "Sắp hết hàng" },
  { key: "out", label: "Hết hàng" },
];

function StockBadge({ available, threshold }) {
  if (available === 0)
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Hết hàng</span>;
  if (available <= threshold)
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Sắp hết</span>;
  return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Còn hàng</span>;
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 ${onClick ? "cursor-pointer hover:shadow-md transition" : ""}`}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Adjust Modal ────────────────────────────────────────────────────────────

function AdjustModal({ item, product, onClose, onDone }) {
  const [delta, setDelta] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(delta);
    if (!num || num === 0) return toast.error("Vui lòng nhập số lượng hợp lệ");
    setSaving(true);
    try {
      await inventoryApi.adjust(item.productId, num);
      toast.success(`Đã ${num > 0 ? "nhập" : "xuất"} ${Math.abs(num)} sản phẩm`);
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title="Điều chỉnh tồn kho" onClose={onClose}>
      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
            {product?.imageUrl
              ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{product?.name ?? `Sản phẩm #${item.productId}`}</p>
            {product?.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500">Tổng: <strong className="text-gray-800">{item.quantity}</strong></span>
          <span className="text-gray-500">Đang giữ: <strong className="text-orange-600">{item.reservedQuantity}</strong></span>
          <span className="text-gray-500">Khả dụng: <strong className="text-green-600">{item.availableQuantity}</strong></span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Số lượng điều chỉnh
            <span className="text-gray-400 font-normal ml-1">(dương = nhập, âm = xuất)</span>
          </label>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="Ví dụ: 50 hoặc -10"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          {[10, 20, 50, 100].map((n) => (
            <button key={n} type="button" onClick={() => setDelta(String(n))}
              className="flex-1 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
              +{n}
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
            Hủy
          </button>
          <button type="submit" disabled={saving}
            className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving ? "bg-gray-400" : "bg-orange-500 hover:bg-orange-600"}`}>
            {saving ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Stock Operation Modal ───────────────────────────────────────────────────

const OP_CONFIG = {
  reserve: {
    title: "Giữ hàng (Reserve)",
    desc: "Giữ hàng cho đơn đặt hàng. Số lượng khả dụng sẽ giảm.",
    btnClass: "bg-blue-500 hover:bg-blue-600",
    bgLight: "bg-blue-50",
    border: "border border-blue-200",
    textColor: "text-blue-500",
    icon: ArrowDownCircle,
  },
  release: {
    title: "Trả hàng (Release)",
    desc: "Giải phóng hàng đã giữ khi hủy đơn. Số lượng khả dụng sẽ tăng lại.",
    btnClass: "bg-yellow-500 hover:bg-yellow-600",
    bgLight: "bg-yellow-50",
    border: "border border-yellow-200",
    textColor: "text-yellow-500",
    icon: ArrowUpCircle,
  },
  commit: {
    title: "Xác nhận xuất kho (Commit)",
    desc: "Trừ hàng thực tế sau khi đơn hoàn thành. Không thể hoàn tác.",
    btnClass: "bg-red-500 hover:bg-red-600",
    bgLight: "bg-red-50",
    border: "border border-red-200",
    textColor: "text-red-500",
    icon: CheckCircle,
  },
};

function StockOpModal({ item, product, operation, onClose, onDone }) {
  const [quantity, setQuantity] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const cfg = OP_CONFIG[operation];
  const Icon = cfg.icon;

  // Fetch đơn hàng liên quan — lọc theo trạng thái phù hợp với từng operation
  useEffect(() => {
    setLoadingOrders(true);
    orderApi.getAll({ size: 200 })
      .then((r) => {
        const all = r.data?.content || r.data || [];
        // reserve: đơn PENDING/CONFIRMED; release: đơn CANCELLED; commit: đơn DELIVERED/PROCESSING
        const statusFilter = {
          reserve: ["PENDING", "CONFIRMED"],
          release: ["CANCELLED", "PENDING", "CONFIRMED"],
          commit:  ["PROCESSING", "SHIPPED", "DELIVERED"],
        };
        const allowed = statusFilter[operation] || [];
        setOrders(all.filter((o) => allowed.includes(o.status)));
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));
  }, [operation]);

  const filteredOrders = orders.filter((o) =>
    o.orderCode?.toLowerCase().includes(orderSearch.toLowerCase()) ||
    o.receiverName?.toLowerCase().includes(orderSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseInt(quantity);
    if (!num || num <= 0) return toast.error("Số lượng phải lớn hơn 0");
    setSaving(true);
    try {
      const res = await inventoryApi[operation](item.productId, {
        quantity: num,
        orderId: selectedOrder ? String(selectedOrder.id) : undefined,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        onDone();
      } else {
        toast.error(res.data?.message || "Thao tác thất bại");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const STATUS_LABEL = {
    PENDING: "Chờ xác nhận", CONFIRMED: "Đã xác nhận", PROCESSING: "Đang xử lý",
    SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy",
  };
  const STATUS_COLOR = {
    PENDING: "bg-yellow-100 text-yellow-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    PROCESSING: "bg-purple-100 text-purple-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <ModalWrapper title={cfg.title} onClose={onClose}>
      {/* Mô tả thao tác */}
      <div className={`mb-4 p-3 rounded-xl flex items-start gap-3 ${cfg.bgLight} ${cfg.border}`}>
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.textColor}`} />
        <p className="text-sm text-gray-700">{cfg.desc}</p>
      </div>

      {/* Thông tin tồn kho hiện tại */}
      <div className="mb-4 p-4 bg-gray-50 rounded-xl text-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
            {product?.imageUrl
              ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
              : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{product?.name ?? `Sản phẩm #${item.productId}`}</p>
            {product?.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
          </div>
        </div>
        <div className="flex gap-4">
          <span className="text-gray-500">Tổng: <strong className="text-gray-800">{item.quantity}</strong></span>
          <span className="text-gray-500">Đang giữ: <strong className="text-orange-600">{item.reservedQuantity}</strong></span>
          <span className="text-gray-500">Khả dụng: <strong className="text-green-600">{item.availableQuantity}</strong></span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Số lượng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng *</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)}
            placeholder="Nhập số lượng..."
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            autoFocus />
        </div>

        {/* Chọn đơn hàng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Đơn hàng liên quan
            <span className="text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
          </label>

          {selectedOrder ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">#{selectedOrder.orderCode}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500">{selectedOrder.receiverName}</p>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[selectedOrder.status]}`}>
                    {STATUS_LABEL[selectedOrder.status]}
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold text-orange-500 shrink-0">
                {Number(selectedOrder.totalAmount).toLocaleString("vi-VN")}₫
              </p>
              <button type="button" onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition shrink-0">
                <X className="h-4 w-4 text-blue-500" />
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative border-b border-gray-100">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Tìm mã đơn hoặc tên khách..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm focus:outline-none bg-gray-50" />
              </div>
              <div className="max-h-44 overflow-y-auto">
                {loadingOrders ? (
                  <div className="py-5 text-center text-sm text-gray-400">Đang tải...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-5 text-center text-sm text-gray-400">
                    {orders.length === 0 ? "Không có đơn hàng phù hợp" : "Không tìm thấy đơn hàng"}
                  </div>
                ) : (
                  filteredOrders.map((o) => (
                    <button key={o.id} type="button"
                      onClick={() => { setSelectedOrder(o); setOrderSearch(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">#{o.orderCode}</p>
                        <p className="text-xs text-gray-400 truncate">{o.receiverName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                        <span className="text-xs font-semibold text-orange-500">
                          {Number(o.totalAmount).toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
            Hủy
          </button>
          <button type="submit" disabled={saving}
            className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving ? "bg-gray-400" : cfg.btnClass}`}>
            {saving ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Create Inventory Modal ──────────────────────────────────────────────────

function CreateModal({ onClose, onDone, existingProductIds }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("5");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    productApi.getAll({ size: 200 })
      .then((r) => {
        const all = r.data?.content || r.data || [];
        // Lọc ra những sản phẩm chưa có bản ghi tồn kho
        setProducts(all.filter((p) => !existingProductIds.has(p.id)));
      })
      .catch(() => toast.error("Không tải được danh sách sản phẩm"))
      .finally(() => setLoadingProducts(false));
  }, [existingProductIds]);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error("Vui lòng chọn sản phẩm");
    const qty = parseInt(quantity);
    if (!qty || qty < 0) return toast.error("Số lượng không hợp lệ");
    setSaving(true);
    try {
      await inventoryApi.create({
        productId: selected.id,
        quantity: qty,
        lowStockThreshold: parseInt(threshold) || 5,
      });
      toast.success(`Đã tạo tồn kho cho "${selected.name}"`);
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Tạo thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title="Thêm tồn kho mới" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Chọn sản phẩm *
          </label>
          {selected ? (
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="w-10 h-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
                {selected.imageUrl
                  ? <img src={selected.imageUrl} alt={selected.name} className="w-full h-full object-contain" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{selected.name}</p>
                <p className="text-xs text-gray-500">ID: {selected.id}{selected.brand ? ` · ${selected.brand}` : ""}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-orange-100 rounded-lg transition shrink-0">
                <X className="h-4 w-4 text-orange-500" />
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative border-b border-gray-100">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc ID..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm focus:outline-none bg-gray-50"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {loadingProducts ? (
                  <div className="py-6 text-center text-sm text-gray-400">Đang tải...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">
                    {products.length === 0 ? "Tất cả sản phẩm đã có tồn kho" : "Không tìm thấy sản phẩm"}
                  </div>
                ) : (
                  filtered.map((p) => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelected(p); setSearch(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">ID: {p.id}{p.brand ? ` · ${p.brand}` : ""}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quantity + threshold — chỉ hiện sau khi chọn sản phẩm */}
        {selected && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Số lượng ban đầu *
              </label>
              <input type="number" min="0" required value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Nhập số lượng nhập kho..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngưỡng cảnh báo hết hàng
                <span className="text-gray-400 font-normal ml-1">(mặc định: 5)</span>
              </label>
              <input type="number" min="0" value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition">
            Hủy
          </button>
          <button type="submit" disabled={saving || !selected}
            className={`flex-1 py-2.5 font-semibold text-white rounded-xl transition ${saving || !selected ? "bg-gray-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}>
            {saving ? "Đang lưu..." : "Tạo mới"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}

// ─── Shared Modal Wrapper ────────────────────────────────────────────────────

function ModalWrapper({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminInventory() {
  const [allItems, setAllItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [productMap, setProductMap] = useState({}); // productId → product object
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, lowRes, prodRes] = await Promise.allSettled([
        inventoryApi.getAll(),
        inventoryApi.getLowStock(),
        productApi.getAll({ size: 500 }),
      ]);
      if (allRes.status === "fulfilled") setAllItems(allRes.value.data || []);
      if (lowRes.status === "fulfilled") setLowStock(lowRes.value.data || []);
      if (prodRes.status === "fulfilled") {
        const products = prodRes.value.data?.content || prodRes.value.data || [];
        setProductMap(Object.fromEntries(products.map((p) => [p.id, p])));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setModal(null);
  const doneModal = () => { closeModal(); load(); };

  const outOfStockItems = allItems.filter((i) => i.availableQuantity === 0);
  const displayItems =
    tab === "in"  ? allItems.filter((i) => i.availableQuantity > (i.lowStockThreshold ?? 5)) :
    tab === "low" ? lowStock.filter((i) => i.availableQuantity > 0) :
    tab === "out" ? outOfStockItems :
    allItems;
  const filtered = displayItems.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const product = productMap[item.productId];
    return (
      product?.name?.toLowerCase().includes(q) ||
      product?.brand?.toLowerCase().includes(q) ||
      String(item.productId).includes(q)
    );
  });

  const outOfStock = outOfStockItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Theo dõi và điều phối tồn kho sản phẩm</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            title="Làm mới">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition shadow">
            <Plus className="h-4 w-4" /> Thêm tồn kho
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Warehouse} label="Tổng sản phẩm" value={allItems.length} color="bg-blue-500" />
        <StatCard icon={Package} label="Còn hàng" value={allItems.filter(i => i.availableQuantity > (i.lowStockThreshold ?? 5)).length} color="bg-green-500" onClick={() => setTab("in")} />
        <StatCard icon={TrendingDown} label="Sắp hết hàng" value={lowStock.filter(i => i.availableQuantity > 0).length} color="bg-yellow-500" onClick={() => setTab("low")} />
        <StatCard icon={AlertTriangle} label="Hết hàng" value={outOfStock} color="bg-red-500" onClick={() => setTab("out")} />
      </div>

      {/* Low stock alert banner */}
      {(lowStock.filter(i => i.availableQuantity > 0).length > 0 || outOfStock > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            {lowStock.filter(i => i.availableQuantity > 0).length > 0 && (
              <>
                <strong>{lowStock.filter(i => i.availableQuantity > 0).length} sản phẩm</strong> sắp hết hàng.
                <button onClick={() => setTab("low")} className="ml-1 underline font-medium hover:text-yellow-900">Xem ngay</button>
              </>
            )}
            {lowStock.filter(i => i.availableQuantity > 0).length > 0 && outOfStock > 0 && <span className="mx-2">·</span>}
            {outOfStock > 0 && (
              <>
                <strong>{outOfStock} sản phẩm</strong> đã hết hàng.
                <button onClick={() => setTab("out")} className="ml-1 underline font-medium hover:text-yellow-900">Xem ngay</button>
              </>
            )}
          </p>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t.label}
              {t.key === "low" && lowStock.filter(i => i.availableQuantity > 0).length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                  {lowStock.filter(i => i.availableQuantity > 0).length}
                </span>
              )}
              {t.key === "out" && outOfStock > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{outOfStock}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Sản phẩm", "Tổng kho", "Đang giữ", "Khả dụng", "Ngưỡng", "Trạng thái", "Thao tác"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{tab === "in" ? "Không có sản phẩm nào còn hàng" : tab === "low" ? "Không có sản phẩm nào sắp hết hàng" : tab === "out" ? "Không có sản phẩm nào hết hàng" : "Không có dữ liệu tồn kho"}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      {(() => {
                        const p = productMap[item.productId];
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              {p?.imageUrl
                                ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate max-w-[180px]">
                                {p?.name ?? `Sản phẩm #${item.productId}`}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p?.brand ? `${p.brand} · ` : ""}ID: {item.productId}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{item.quantity}</td>
                    <td className="px-5 py-4">
                      <span className={`font-medium ${item.reservedQuantity > 0 ? "text-orange-600" : "text-gray-400"}`}>
                        {item.reservedQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold text-base ${item.availableQuantity === 0 ? "text-red-600" : item.availableQuantity <= item.lowStockThreshold ? "text-yellow-600" : "text-green-600"}`}>
                        {item.availableQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{item.lowStockThreshold}</td>
                    <td className="px-5 py-4">
                      <StockBadge available={item.availableQuantity} threshold={item.lowStockThreshold} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <ActionBtn
                          icon={Edit3} label="Điều chỉnh"
                          className="text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                          onClick={() => setModal({ type: "adjust", item })} />
                        <ActionBtn
                          icon={ArrowDownCircle} label="Reserve"
                          className="text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                          onClick={() => setModal({ type: "reserve", item })} />
                        <ActionBtn
                          icon={ArrowUpCircle} label="Release"
                          className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                          onClick={() => setModal({ type: "release", item })} />
                        <ActionBtn
                          icon={CheckCircle} label="Commit"
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setModal({ type: "commit", item })} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateModal
          onClose={closeModal}
          onDone={doneModal}
          existingProductIds={new Set(allItems.map((i) => i.productId))}
        />
      )}
      {modal?.type === "adjust" && <AdjustModal item={modal.item} product={productMap[modal.item.productId]} onClose={closeModal} onDone={doneModal} />}
      {["reserve", "release", "commit"].includes(modal?.type) && (
        <StockOpModal item={modal.item} product={productMap[modal.item.productId]} operation={modal.type} onClose={closeModal} onDone={doneModal} />
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, className, onClick }) {
  return (
    <button onClick={onClick} title={label}
      className={`p-2 rounded-lg transition ${className}`}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
