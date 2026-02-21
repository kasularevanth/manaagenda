import { apiRequest, clearAccessToken, setAccessToken } from "./api";
import type { AuthResponse, User } from "../types/api";

export const login = async (email: string, password: string) => {
  const response = await apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  setAccessToken(response.accessToken);
  return response.user;
};

export const registerUser = (payload: {
  fullName: string;
  email: string;
  password: string;
  role: "ADMIN" | "EMPLOYEE" | "CLIENT";
}) =>
  apiRequest<User>("/api/auth/register", {
    method: "POST",
    body: payload,
  });

export const refreshSession = async () => {
  const response = await apiRequest<AuthResponse>("/api/auth/refresh", {
    method: "POST",
  });
  setAccessToken(response.accessToken);
  return response.user;
};

export const logout = async () => {
  await apiRequest("/api/auth/logout", { method: "POST" });
  clearAccessToken();
};
