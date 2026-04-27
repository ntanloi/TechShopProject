import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const reviewApi = {
  getByProduct: (productId) => axiosClient.get(API_ROUTES.reviews.byProduct(productId)),
  getRating: (productId) => axiosClient.get(API_ROUTES.reviews.rating(productId)),
  create: (data) => axiosClient.post(API_ROUTES.reviews.create, data),
  delete: (id) => axiosClient.delete(API_ROUTES.reviews.delete(id)),
  getMyReviews: () => axiosClient.get(API_ROUTES.reviews.my),
};

export default reviewApi;
