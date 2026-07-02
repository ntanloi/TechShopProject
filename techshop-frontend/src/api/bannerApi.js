import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const bannerApi = {
  getActive: (position) => axiosClient.get(API_ROUTES.banners.active, { params: { position } }),
  getAll: () => axiosClient.get(API_ROUTES.banners.list),
  getById: (id) => axiosClient.get(API_ROUTES.banners.detail(id)),
  create: (data) => axiosClient.post(API_ROUTES.banners.create, data),
  update: (id, data) => axiosClient.put(API_ROUTES.banners.update(id), data),
  delete: (id) => axiosClient.delete(API_ROUTES.banners.delete(id)),
};

export default bannerApi;
