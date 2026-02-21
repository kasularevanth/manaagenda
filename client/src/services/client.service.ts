import { apiRequest } from "./api";

export const clientService = {
  getProjects: () => apiRequest("/api/client/projects"),
  getServiceRequests: () => apiRequest("/api/client/service-requests"),
  createServiceRequest: (payload: { serviceId: string; notes?: string }) =>
    apiRequest("/api/client/service-requests", {
      method: "POST",
      body: payload,
    }),
};
