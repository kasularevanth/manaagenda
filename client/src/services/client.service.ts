import { apiRequest } from "./api";

export const clientService = {
  getServices: () => apiRequest("/api/client/services"),
  getProjects: () => apiRequest("/api/client/projects"),
  getServiceRequests: () => apiRequest("/api/client/service-requests"),
  createServiceRequest: (payload: {
    projectName: string;
    projectDescription: string;
    notes?: string;
  }) =>
    apiRequest("/api/client/service-requests", {
      method: "POST",
      body: payload,
    }),
};
