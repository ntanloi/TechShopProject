import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const categoryApi = {
  getAll: () => axiosClient.get(API_ROUTES.categories.list),
  getById: (id) => axiosClient.get(API_ROUTES.categories.detail(id)),
  create: (data) => axiosClient.post(API_ROUTES.categories.create, data),
  update: (id, data) => axiosClient.put(API_ROUTES.categories.update(id), data),
  delete: (id) => axiosClient.delete(API_ROUTES.categories.delete(id)),
  uploadImage: (formData) =>
    axiosClient.post(API_ROUTES.categories.uploadImage, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default categoryApi;
