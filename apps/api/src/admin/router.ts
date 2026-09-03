import { Router } from "express";
import type { AdminAuthConfig } from "./config.js";
import { createAccountRouter } from "./account-routes.js";
import { createBootstrapRouter } from "./bootstrap-routes.js";
import { createIdentityAccountRouter } from "./identity-account-routes.js";
import { createIdentityInvitationRouter } from "./identity-invitation-routes.js";
import { createInvitationActivationRouter } from "./invitation-routes.js";
import { createLoginRouter } from "./login-routes.js";
import { createSessionRouter } from "./session-routes.js";

export function createAdminRouter(config: AdminAuthConfig): Router {
  const router = Router();

  router.use("/auth/bootstrap", createBootstrapRouter(config));
  router.use("/auth/invitations", createInvitationActivationRouter(config));
  router.use("/auth/login", createLoginRouter(config));
  router.use("/session", createSessionRouter(config));
  router.use("/account", createAccountRouter(config));
  router.use("/identity/invitations", createIdentityInvitationRouter(config));
  router.use("/identity/accounts", createIdentityAccountRouter(config));

  return router;
}
