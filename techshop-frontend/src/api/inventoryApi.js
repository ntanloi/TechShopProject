import axiosClient from "./axios";

const inventoryApi = {
  getAll: () => axiosClient.get("/api/inventory/all"),
  getByProduct: (productId) => axiosClient.get(`/api/inventory/product/${productId}`),
  checkStock: (productId, quantity) =>
    axiosClient.get(`/api/inventory/product/${productId}/check`, { params: { quantity } }),
  getLowStock: () => axiosClient.get("/api/inventory/low-stock"),
  create: (data) => axiosClient.post("/api/inventory", data),
  adjust: (productId, delta) =>
    axiosClient.put(`/api/inventory/product/${productId}/adjust`, null, { params: { delta } }),
  reserve: (productId, data) =>
    axiosClient.post(`/api/inventory/product/${productId}/reserve`, data),
  release: (productId, data) =>
    axiosClient.post(`/api/inventory/product/${productId}/release`, data),
  commit: (productId, data) =>
    axiosClient.post(`/api/inventory/product/${productId}/commit`, data),
};

export default inventoryApi;
