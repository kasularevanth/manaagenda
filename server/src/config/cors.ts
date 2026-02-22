import type { CorsOptions } from "cors";

// Add production frontend URLs here when needed.
const allowedOrigins = [
  "http://localhost:5173",
  "https://manaagendaai.onrender.com",
];

export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Allow tools like Postman and same-origin calls with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
};

export const corsAllowedOrigins = allowedOrigins;
