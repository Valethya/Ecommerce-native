import mongoose from "mongoose";

export type DatabaseState =
  | "disconnected"
  | "connected"
  | "connecting"
  | "disconnecting"
  | "unknown";

const stateNames: Record<number, DatabaseState> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting"
};

export function getDatabaseState(): DatabaseState {
  return stateNames[mongoose.connection.readyState] ?? "unknown";
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 10_000
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
