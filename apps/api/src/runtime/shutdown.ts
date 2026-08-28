import type { Server } from "node:http";

export interface ShutdownOptions {
  server: Server;
  disconnect: () => Promise<void>;
  timeoutMs: number;
  onDeadline: () => void;
}

export async function shutdownRuntime(options: ShutdownOptions): Promise<void> {
  const { server, disconnect, timeoutMs, onDeadline } = options;
  let completed = false;

  const deadline = setTimeout(() => {
    if (completed) return;

    server.closeAllConnections();
    onDeadline();
  }, timeoutMs);
  deadline.unref();

  try {
    await closeServer(server);
    await disconnect();
    completed = true;
  } finally {
    clearTimeout(deadline);
  }
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}
