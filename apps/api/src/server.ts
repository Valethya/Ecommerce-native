import { createApp } from "./app.js";
import { isSmokeUiEnabled, loadEnv } from "./config/env.js";
import { loadOptionalEnvFile } from "./config/env-file.js";
import { connectDatabase, disconnectDatabase } from "./db/mongoose.js";
import { shutdownRuntime } from "./runtime/shutdown.js";

loadOptionalEnvFile();
const env = loadEnv();

await connectDatabase(env.MONGODB_URI);

const app = createApp({
  enableSmokeUi: isSmokeUiEnabled(env),
  adminAuth: {
    bootstrapToken: env.ADMIN_BOOTSTRAP_TOKEN,
    mfaEncryptionKey: env.ADMIN_MFA_ENCRYPTION_KEY,
    totpIssuer: env.ADMIN_TOTP_ISSUER,
    secureCookies: env.NODE_ENV === "production"
  }
});

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`ecommerce-native API listening on http://${env.HOST}:${env.PORT}`);
});

let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}; shutting down`);

  await shutdownRuntime({
    server,
    disconnect: disconnectDatabase,
    timeoutMs: env.SHUTDOWN_TIMEOUT_MS,
    onDeadline: () => {
      console.error(
        JSON.stringify({
          event: "shutdown_deadline_exceeded",
          signal,
          timeoutMs: env.SHUTDOWN_TIMEOUT_MS
        })
      );
      process.exit(1);
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal)
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error: unknown) => {
        console.error(
          JSON.stringify({
            event: "graceful_shutdown_failed",
            signal,
            errorName: error instanceof Error ? error.name : "UnknownError"
          })
        );
        process.exitCode = 1;
      });
  });
}
