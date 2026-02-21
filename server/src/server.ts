import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const startServer = async () => {
  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log("Database connected");

    app.listen(env.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API running on port ${env.PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Database connection failed", error);
    process.exit(1);
  }
};

void startServer();
