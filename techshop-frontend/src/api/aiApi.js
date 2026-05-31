import axiosClient from "./axios";

const aiApi = {
  chat(message, sessionId, userId) {
    return axiosClient.post("/api/ai/chat", {
      message,
      sessionId,
      userId: userId ? String(userId) : null,
    });
  },
  getRecommendations(productId, limit = 4, userId = null) {
    return axiosClient.post("/api/ai/recommendations", {
      productId: Number(productId),
      limit,
      userId: userId ? Number(userId) : null,
    });
  },
};

export default aiApi;
