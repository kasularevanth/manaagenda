import { apiRequest } from "./api";

export const profileService = {
  update: (payload: { fullName?: string; bio?: string; phone?: string }) =>
    apiRequest("/api/profile", {
      method: "PATCH",
      body: payload,
    }),
};
