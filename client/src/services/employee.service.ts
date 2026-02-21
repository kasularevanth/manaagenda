import { apiRequest } from "./api";

export const employeeService = {
  getProjects: () => apiRequest("/api/employee/projects"),
  updateProjectStatus: (projectId: string, status: string) =>
    apiRequest(`/api/employee/projects/${projectId}/status`, {
      method: "PATCH",
      body: { status },
    }),
};
