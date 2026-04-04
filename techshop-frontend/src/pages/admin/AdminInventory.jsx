import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Minus } from "lucide-react";
import axiosClient from "../../api/axios";
import { toast } from "react-toastify";

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      axiosClient.get("/api/inventory/low-stock"),
      axiosClient.get("/api/inventory/low-stock"),
    ])
      .then(([lowRes]) => {
        setLowStock(lowRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdjust = async (productId, delta) => {
    try {
      await axiosClient.put(`/api/inventory/product/${productId}/adjust`, null, { params: { delta } });
      toast.success(`Đã ${delta > 0 ? "nhập" : "xuất"} ${Math.abs(delta)} sản phẩm`);
      load();
    } catch { toast.error("Cập nhật thất bại"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="font-semibold text-yellow-800">Sản phẩm sắp hết hàng ({lowStock.length})</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item) => (
              <div key={item.id} className="bg-white rounded-xl p-4 border border-yellow-200">
                <p className="font-medium text-gray-800 text-sm">{item.productName || `Sản phẩm #${item.productId}`}</p>
                <p className="text-xs text-yellow-600 mt-1">Còn lại: <strong>{item.availableQuantity}</strong> / {item.quantity}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleAdjust(item.productId, 10)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition">
                    <Plus className="h-3 w-3" /> Nhập 10
                  </button>
                  <button onClick={() => handleAdjust(item.productId, 50)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition">
                    <Plus className="h-3 w-3" /> Nhập 50
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : lowStock.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Tất cả sản phẩm đều có đủ hàng</p>
          <p className="text-sm mt-1">Không có sản phẩm nào sắp hết hàng</p>
        </div>
      ) : null}
    </div>
  );
}
