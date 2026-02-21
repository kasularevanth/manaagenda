export type Role = "ADMIN" | "EMPLOYEE" | "CLIENT";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  bio?: string;
  phone?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};
