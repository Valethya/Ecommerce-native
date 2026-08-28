import { Router } from "express";
import { getDatabaseState, isDatabaseReady } from "../db/mongoose.js";

export function createHealthRouter(): Router {
  const router = Router();

  router.get("/live", (_req, res) => {
    res.status(200).json({
      status: "ok"
    });
  });

  router.get("/ready", (_req, res) => {
    const database = getDatabaseState();
    const ready = isDatabaseReady();

    res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      database
    });
  });

  return router;
}
