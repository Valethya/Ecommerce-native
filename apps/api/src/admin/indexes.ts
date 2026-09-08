import {
  AdminAccountModel,
  AdminInvitationModel,
  AdminLoginChallengeModel,
  AdminLoginThrottleModel,
  AdminMfaResetModel,
  AdminSecurityEventModel,
  AdminSessionModel
} from "./models.js";

export async function ensureAdminIndexes(): Promise<void> {
  await Promise.all([
    AdminAccountModel.createIndexes(),
    AdminInvitationModel.createIndexes(),
    AdminMfaResetModel.createIndexes(),
    AdminLoginChallengeModel.createIndexes(),
    AdminSessionModel.createIndexes(),
    AdminSecurityEventModel.createIndexes(),
    AdminLoginThrottleModel.createIndexes()
  ]);
}
