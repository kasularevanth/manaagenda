import { apiRequest } from "./api";

export type MessageableRecipient = {
  id: string;
  fullName: string;
  role: string;
};

export const messagesService = {
  getConversations: () => apiRequest("/api/messages/conversations"),
  getRecipients: (role?: "ADMIN" | "EMPLOYEE" | "CLIENT") =>
    apiRequest<MessageableRecipient[]>(
      `/api/messages/recipients${role ? `?role=${role}` : ""}`,
    ),
  getThread: (userId: string) => apiRequest(`/api/messages/${userId}`),
  send: (payload: { receiverId: string; content: string; projectId?: string }) =>
    apiRequest("/api/messages/send", {
      method: "POST",
      body: payload,
    }),
};
