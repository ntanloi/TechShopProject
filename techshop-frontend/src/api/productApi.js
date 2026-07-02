import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const productApi = {
  /**
   * Get all products with optional filters:
   * { page, size, category (slug), brand, minPrice, maxPrice, keyword, sort }
   */
  getAll: (params) => axiosClient.get(API_ROUTES.products.list, { params }),

  getById: (id) => axiosClient.get(API_ROUTES.products.detail(id)),

  search: (keyword, params) =>
    axiosClient.get(API_ROUTES.products.search, {
      params: { keyword, ...params },
    }),

  /**
   * Get by category - supports both numeric ID and slug string.
   * Also supports additional filter params: brand, minPrice, maxPrice, sort
   */
  getByCategory: (categoryIdOrSlug, params) =>
    axiosClient.get(API_ROUTES.products.byCategory(categoryIdOrSlug), { params }),

  /**
   * Get filtered products: category slug, brand, price range, sort, keyword
   * All params optional - falls back to getAll when no filters
   */
  getFiltered: (params) => axiosClient.get(API_ROUTES.products.list, { params }),

  create: (data) => axiosClient.post(API_ROUTES.products.create, data),
  update: (id, data) => axiosClient.put(API_ROUTES.products.update(id), data),
  delete: (id) => axiosClient.delete(API_ROUTES.products.delete(id)),
  uploadImage: (formData) =>
    axiosClient.post(API_ROUTES.products.uploadImage, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default productApi;
