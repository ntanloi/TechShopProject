import axiosClient from "./axios";

const aiApi = {
  chat(message, sessionId, userId) {
    return axiosClient.post("/api/ai/chat", {
      message,
      sessionId,
      userId: userId ? String(userId) : null,
    });
  },
};

export default aiApi;
