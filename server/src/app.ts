import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { corsOptions } from "./config/cors";
import { authRouter } from "./modules/auth/auth.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { employeeRouter } from "./modules/employee/employee.routes";
import { clientRouter } from "./modules/client/client.routes";
import { messagesRouter } from "./modules/messages/messages.routes";
import { profileRouter } from "./modules/profile/profile.routes";
import { errorHandler } from "./middleware/error-handler";

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/client", clientRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/profile", profileRouter);

app.use(errorHandler);
