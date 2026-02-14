import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const productApi = {
  getAll: (params) => axiosClient.get(API_ROUTES.products.list, { params }),
  getById: (id) => axiosClient.get(API_ROUTES.products.detail(id)),
  search: (keyword, params) =>
    axiosClient.get(API_ROUTES.products.search, { params: { keyword, ...params } }),
  getByCategory: (categoryId, params) =>
    axiosClient.get(API_ROUTES.products.byCategory(categoryId), { params }),
  create: (data) => axiosClient.post(API_ROUTES.products.create, data),
  update: (id, data) => axiosClient.put(API_ROUTES.products.update(id), data),
  delete: (id) => axiosClient.delete(API_ROUTES.products.delete(id)),
};

export default productApi;
