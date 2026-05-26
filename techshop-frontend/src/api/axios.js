import axios from "axios";
import rateLimiter from "../utils/rateLimiter";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor - Add auth token and rate limiting
axiosClient.interceptors.request.use(
  (config) => {
    // Add JWT token
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Client-side rate limiting
    const endpoint = config.url;
    if (!rateLimiter.isAllowed(endpoint)) {
      const resetTime = rateLimiter.getResetTime(endpoint);
      const error = new Error("Rate limit exceeded");
      error.isRateLimitError = true;
      error.resetTime = resetTime;
      error.config = config;
      return Promise.reject(error);
    }

    // Log rate limit info
    const remaining = rateLimiter.getRemaining(endpoint);
    console.debug(`[Rate Limiter] ${endpoint} - Remaining: ${remaining}`);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
axiosClient.interceptors.response.use(
  (res) => {
    // Log server rate limit headers if present
    if (res.headers["x-ratelimit-limit"]) {
      console.debug(
        `[Server Rate Limit] Limit: ${res.headers["x-ratelimit-limit"]}, Remaining: ${res.headers["x-ratelimit-remaining"]}`
      );
    }
    return res;
  },
  (error) => {
    // Handle rate limit errors
    if (error.isRateLimitError) {
      console.warn(
        `[Rate Limiter] Request blocked. Retry after ${Math.ceil(error.resetTime / 1000)}s`
      );
      return Promise.reject({
        message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(error.resetTime / 1000)} giây.`,
        isRateLimitError: true,
      });
    }

    // Handle server rate limit (429 Too Many Requests)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"] || 60;
      console.warn(`[Server Rate Limit] 429 - Retry after ${retryAfter}s`);
      return Promise.reject({
        message: `Server đang bận. Vui lòng thử lại sau ${retryAfter} giây.`,
        isRateLimitError: true,
      });
    }

    // Không auto-redirect, để từng trang tự xử lý lỗi 401
    return Promise.reject(error);
  }
);

export default axiosClient;
