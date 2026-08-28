import { loadEnvFile } from "node:process";

export function loadOptionalEnvFile(path = ".env"): void {
  try {
    loadEnvFile(path);
  } catch (error: unknown) {
    if (isMissingFile(error)) return;
    throw error;
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
