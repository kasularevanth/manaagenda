import { apiRequest } from "./api";

export const adminService = {
  getDashboard: () => apiRequest<Record<string, number>>("/api/admin/dashboard"),
  getUsers: (role?: "EMPLOYEE" | "CLIENT") =>
    apiRequest(`/api/admin/users${role ? `?role=${role}` : ""}`),
  createUser: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: "EMPLOYEE" | "CLIENT";
  }) =>
    apiRequest("/api/admin/users", {
      method: "POST",
      body: payload,
    }),
  removeEmployee: (id: string) =>
    apiRequest(`/api/admin/employees/${id}`, {
      method: "DELETE",
    }),
  getClients: () => apiRequest("/api/admin/clients"),
  createClientCompany: (payload: { companyName: string; contactUserId: string }) =>
    apiRequest("/api/admin/clients", {
      method: "POST",
      body: payload,
    }),
  getServices: () => apiRequest("/api/admin/services"),
  createService: (payload: { name: string; description: string }) =>
    apiRequest("/api/admin/services", {
      method: "POST",
      body: payload,
    }),
  getServiceRequests: () => apiRequest("/api/admin/service-requests"),
  approveRequest: (id: string) =>
    apiRequest(`/api/admin/service-requests/${id}/approve`, { method: "POST" }),
  getProjects: () => apiRequest("/api/admin/projects"),
  createProject: (payload: { name: string; description: string; clientCompanyId: string }) =>
    apiRequest("/api/admin/projects", { method: "POST", body: payload }),
  updateProject: (id: string, payload: { status?: string; name?: string; description?: string; clientCompanyId?: string }) =>
    apiRequest(`/api/admin/projects/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  deleteProject: (id: string) =>
    apiRequest(`/api/admin/projects/${id}`, { method: "DELETE" }),
  assignEmployee: (projectId: string, employeeUserId: string) =>
    apiRequest(`/api/admin/projects/${projectId}/assignments`, {
      method: "POST",
      body: { employeeUserId },
    }),
  unassignEmployee: (projectId: string, employeeUserId: string) =>
    apiRequest(`/api/admin/projects/${projectId}/assignments/${employeeUserId}`, {
      method: "DELETE",
    }),
};
