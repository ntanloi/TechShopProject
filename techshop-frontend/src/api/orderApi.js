import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const orderApi = {
  getMyOrders: (params) => axiosClient.get(API_ROUTES.orders.my, { params }),
  getById: (id) => axiosClient.get(API_ROUTES.orders.detail(id)),
  create: (data) => axiosClient.post(API_ROUTES.orders.create, data),
  cancel: (id) => axiosClient.put(API_ROUTES.orders.cancel(id)),
  getAll: (params) => axiosClient.get(API_ROUTES.orders.all, { params }),
  updateStatus: (id, status) =>
    axiosClient.put(API_ROUTES.orders.updateStatus(id), null, { params: { status } }),
};

export default orderApi;
