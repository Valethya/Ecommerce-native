import { AdminSecurityEventModel } from "./models.js";

export async function evidence(input: {
  actor?: any;
  sessionId?: unknown;
  action: string;
  targetType?: string;
  targetId?: string;
  result?: "completed" | "rejected" | "failed" | "uncertain";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await AdminSecurityEventModel.create({
    actorId: input.actor?._id ?? null,
    actorName: input.actor?.name ?? null,
    actorEmail: input.actor?.email ?? null,
    sessionId: input.sessionId ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    result: input.result ?? "completed",
    metadata: input.metadata ?? {}
  });
}
