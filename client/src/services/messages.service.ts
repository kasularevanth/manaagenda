import { apiRequest } from "./api";

export const messagesService = {
  getConversations: () => apiRequest("/api/messages/conversations"),
  getThread: (userId: string) => apiRequest(`/api/messages/${userId}`),
  send: (payload: { receiverId: string; content: string; projectId?: string }) =>
    apiRequest("/api/messages/send", {
      method: "POST",
      body: payload,
    }),
};
