import type { Server } from "node:http";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { loadOptionalEnvFile } from "./config/env-file.js";
import { connectDatabase, disconnectDatabase } from "./db/mongoose.js";

loadOptionalEnvFile();
const env = loadEnv();

await connectDatabase(env.MONGODB_URI);

const app = createApp({
  enableSmokeUi: env.NODE_ENV !== "production" && env.ENABLE_SMOKE_UI
});

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`ecommerce-native API listening on http://${env.HOST}:${env.PORT}`);
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}; shutting down`);

  await closeServer(server);
  await disconnectDatabase();
}

function closeServer(httpServer: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal)
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error: unknown) => {
        console.error("Graceful shutdown failed", error);
        process.exitCode = 1;
      });
  });
}
