declare namespace Express {
  export interface UserPayload {
    id: string;
    role: "ADMIN" | "EMPLOYEE" | "CLIENT";
    email: string;
  }

  export interface Request {
    user?: UserPayload;
  }
}
