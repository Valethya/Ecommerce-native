import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ADMIN_PERMISSIONS } from "./permissions.js";

const recoveryCodeSchema = new Schema(
  {
    hash: { type: String, required: true },
    usedAt: { type: Date, default: null }
  },
  { _id: false }
);

const adminAccountSchema = new Schema(
  {
    email: { type: String, required: true },
    emailNormalized: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["owner", "collaborator"], required: true },
    ownerKey: { type: String, default: null },
    status: { type: String, enum: ["pending", "active", "suspended"], required: true },
    passwordHash: { type: String, required: true },
    mfaSecretCiphertext: { type: String, required: true },
    mfaEnabledAt: { type: Date, default: null },
    recoveryCodes: { type: [recoveryCodeSchema], default: [] },
    permissions: { type: [String], enum: [...ADMIN_PERMISSIONS], default: [] },
    sourceInvitationId: { type: Schema.Types.ObjectId, default: null },
    suspendedAt: { type: Date, default: null },
    suspendedBy: { type: Schema.Types.ObjectId, default: null }
  },
  { timestamps: true, versionKey: "revision" }
);
adminAccountSchema.index(
  { ownerKey: 1 },
  {
    unique: true,
    partialFilterExpression: { ownerKey: "installation-owner" },
    name: "one_owner_per_installation"
  }
);
adminAccountSchema.index({ emailNormalized: 1 }, { unique: true, name: "unique_admin_email" });
adminAccountSchema.index(
  { sourceInvitationId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceInvitationId: { $type: "objectId" } },
    name: "one_account_per_invitation"
  }
);

const adminInvitationSchema = new Schema(
  {
    email: { type: String, required: true },
    emailNormalized: { type: String, required: true },
    name: { type: String, required: true },
    permissions: { type: [String], enum: [...ADMIN_PERMISSIONS], default: [] },
    tokenHash: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    claimedAt: { type: Date, default: null },
    activationTokenHash: { type: String, default: null },
    passwordHash: { type: String, default: null },
    mfaSecretCiphertext: { type: String, default: null },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
adminInvitationSchema.index({ tokenHash: 1 }, { unique: true, name: "unique_invitation_token" });
adminInvitationSchema.index(
  { activationTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { activationTokenHash: { $type: "string" } },
    name: "unique_invitation_activation_token"
  }
);
adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 * 7, name: "expire_old_invitations" });

const adminMfaResetSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    tokenHash: { type: String, required: true },
    activationTokenHash: { type: String, default: null },
    mfaSecretCiphertext: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    claimedAt: { type: Date, default: null },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
adminMfaResetSchema.index({ tokenHash: 1 }, { unique: true, name: "unique_mfa_reset_token" });
adminMfaResetSchema.index(
  { activationTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { activationTokenHash: { $type: "string" } },
    name: "unique_mfa_reset_activation_token"
  }
);
adminMfaResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_mfa_resets" });

const adminLoginChallengeSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);
adminLoginChallengeSchema.index({ tokenHash: 1 }, { unique: true, name: "unique_login_challenge" });
adminLoginChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_login_challenges" });

const adminSessionSchema = new Schema(
  {
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true },
    csrfHash: { type: String, required: true },
    lastSeenAt: { type: Date, required: true },
    reauthenticatedAt: { type: Date, required: true },
    absoluteExpiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null }
  },
  { timestamps: true, versionKey: false }
);
adminSessionSchema.index({ tokenHash: 1 }, { unique: true, name: "unique_admin_session_token" });
adminSessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_admin_sessions" });

const adminSecurityEventSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, default: null },
    actorName: { type: String, default: null },
    actorEmail: { type: String, default: null },
    sessionId: { type: Schema.Types.ObjectId, default: null },
    action: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    result: { type: String, enum: ["completed", "rejected", "failed", "uncertain"], required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);
adminSecurityEventSchema.index({ createdAt: -1, action: 1 }, { name: "security_event_lookup" });

const adminLoginThrottleSchema = new Schema(
  {
    keyHash: { type: String, required: true },
    failures: { type: Number, required: true, default: 0 },
    blockedUntil: { type: Date, default: null },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true, versionKey: false }
);
adminLoginThrottleSchema.index({ keyHash: 1 }, { unique: true, name: "unique_login_throttle_key" });
adminLoginThrottleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expire_login_throttles" });

export type AdminAccount = InferSchemaType<typeof adminAccountSchema>;
export type AdminInvitation = InferSchemaType<typeof adminInvitationSchema>;
export type AdminSession = InferSchemaType<typeof adminSessionSchema>;

function cachedModel(name: string, schema: Schema): any {
  return models[name] ?? model(name, schema);
}

export const AdminAccountModel = cachedModel("AdminAccount", adminAccountSchema);
export const AdminInvitationModel = cachedModel("AdminInvitation", adminInvitationSchema);
export const AdminMfaResetModel = cachedModel("AdminMfaReset", adminMfaResetSchema);
export const AdminLoginChallengeModel = cachedModel("AdminLoginChallenge", adminLoginChallengeSchema);
export const AdminSessionModel = cachedModel("AdminSession", adminSessionSchema);
export const AdminSecurityEventModel = cachedModel("AdminSecurityEvent", adminSecurityEventSchema);
export const AdminLoginThrottleModel = cachedModel("AdminLoginThrottle", adminLoginThrottleSchema);
