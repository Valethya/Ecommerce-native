import { createServer, request as httpRequest } from "node:http";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { shutdownRuntime } from "../src/runtime/shutdown.js";

describe("shutdownRuntime", () => {
  it("closes the server and disconnects cleanly before the deadline", async () => {
    const server = createServer((_req, res) => {
      res.end("ok");
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    let disconnected = false;
    let deadlineCalls = 0;

    await shutdownRuntime({
      server,
      timeoutMs: 1000,
      disconnect: async () => {
        disconnected = true;
      },
      onDeadline: () => {
        deadlineCalls += 1;
      }
    });

    expect(server.listening).toBe(false);
    expect(disconnected).toBe(true);
    expect(deadlineCalls).toBe(0);
  });

  it("forces active HTTP connections closed when the deadline expires", async () => {
    let requestStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      requestStarted = resolve;
    });

    const server = createServer((_req, _res) => {
      requestStarted();
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Expected a TCP server address");
    }

    const clientRequest = httpRequest({
      host: "127.0.0.1",
      port: address.port,
      path: "/",
      method: "GET"
    });
    clientRequest.on("error", () => undefined);
    clientRequest.end();
    await started;

    let deadlineCalls = 0;
    let disconnected = false;

    await shutdownRuntime({
      server,
      timeoutMs: 50,
      disconnect: async () => {
        disconnected = true;
      },
      onDeadline: () => {
        deadlineCalls += 1;
      }
    });

    clientRequest.destroy();

    expect(deadlineCalls).toBe(1);
    expect(disconnected).toBe(true);
    expect(server.listening).toBe(false);
  });
});
