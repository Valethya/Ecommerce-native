import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import helmet from "helmet";
import { createAdminRouter } from "./admin/router.js";
import type { AdminAuthConfig } from "./admin/config.js";
import { errorHandler } from "./http/error-handler.js";
import { notFound } from "./http/not-found.js";
import { requestId } from "./http/request-id.js";
import { createHealthRouter } from "./routes/health.js";

export interface AppOptions {
  enableSmokeUi?: boolean;
  adminAuth?: AdminAuthConfig;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(helmet());
  app.use(express.json({ limit: "256kb" }));

  app.use("/health", createHealthRouter());

  if (options.adminAuth) {
    app.use("/admin", createAdminRouter(options.adminAuth));
  }

  if (options.enableSmokeUi) {
    const smokeUiDirectory = fileURLToPath(
      new URL("../../../examples/smoke-ui/", import.meta.url)
    );

    app.use("/__smoke", express.static(smokeUiDirectory, { index: "index.html" }));
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
