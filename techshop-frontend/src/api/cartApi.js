import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const cartApi = {
  getCart: () => axiosClient.get(API_ROUTES.cart.get),
  addToCart: (item) => axiosClient.post(API_ROUTES.cart.add, item),
  updateQuantity: (id, quantity) =>
    axiosClient.put(API_ROUTES.cart.update(id), null, { params: { quantity } }),
  removeItem: (id) => axiosClient.delete(API_ROUTES.cart.remove(id)),
  clearCart: () => axiosClient.delete(API_ROUTES.cart.clear),
};

export default cartApi;
