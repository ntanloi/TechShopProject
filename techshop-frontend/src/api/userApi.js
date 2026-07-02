import axiosClient from "./axios";
import {
    API_ROUTES
} from "./routes";

const userApi = {
    // Legacy
    register: (data) => axiosClient.post(API_ROUTES.auth.register, data),
    login: (data) => axiosClient.post(API_ROUTES.auth.login, data),

    // OTP flow
    otpSend: (data) => axiosClient.post(API_ROUTES.auth.otpSend, data),
    otpVerify: (data) => axiosClient.post(API_ROUTES.auth.otpVerify, data),
    forgotPassword: (data) => axiosClient.post(API_ROUTES.auth.forgotPassword, data),
    resetPassword: (data) => axiosClient.post(API_ROUTES.auth.resetPassword, data),

    getMe: () => axiosClient.get(API_ROUTES.users.me),
    getAll: () => axiosClient.get(API_ROUTES.users.all),
    toggleUser: (id) => axiosClient.put(API_ROUTES.users.toggle(id)),
};

export default userApi;