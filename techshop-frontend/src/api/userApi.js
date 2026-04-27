import axiosClient from "./axios";
import { API_ROUTES } from "./routes";

const userApi = {
  register: (data) => axiosClient.post(API_ROUTES.auth.register, data),
  login: (data) => axiosClient.post(API_ROUTES.auth.login, data),
  getMe: () => axiosClient.get(API_ROUTES.users.me),
  getAll: () => axiosClient.get(API_ROUTES.users.all),
  toggleUser: (id) => axiosClient.put(API_ROUTES.users.toggle(id)),
};

export default userApi;
