import { Router } from "express";
import mongoose from "mongoose";
import type { AdminAuthConfig } from "../admin/config.js";
import { asyncRoute, isDuplicateKey, objectBody, objectIdText, sendError } from "../admin/http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "../admin/middleware.js";
import { getContext } from "../admin/session.js";
import { CatalogCollectionModel, CatalogEventModel } from "./models.js";
import { CatalogValidationError, normalizeSlug } from "./validation.js";

export function createCatalogCollectionRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const auth = createRequireAuth(config);
  const csrf = createRequireCsrf();
  router.get("/collections", auth("catalog:read"), asyncRoute(async (_req, res) => {
    const collections = await CatalogCollectionModel.find({}).sort({ position: 1, _id: 1 }).limit(500).lean();
    res.json({ collections });
  }));
  router.post("/collections", auth("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    if (Object.keys(body).some(k => !["name", "slug", "position"].includes(k)) ||
      typeof body.name !== "string" || !body.name.trim() || body.name.length > 200 ||
      typeof body.slug !== "string" ||
      (body.position !== undefined && !Number.isSafeInteger(body.position))) {
      return sendError(res, 400, "invalid_collection");
    }
    try {
      const slug = normalizeSlug(body.slug);
      const actorId = getContext(res).account._id;
      const result = await mongoose.connection.transaction(async session => {
        const [collection] = await CatalogCollectionModel.create([{
          name: (body.name as string).trim(), slug, position: body.position ?? 0, status: "active"
        }], { session });
        if (!collection) throw new Error("collection_creation_failed");
        await CatalogEventModel.create([{
          actorId, action: "collection.created", entityType: "collection", entityId: collection._id,
          before: null, after: { name: collection.name, slug, position: collection.position, status: "active" }
        }], { session });
        return String(collection._id);
      });
      res.status(201).json({ id: result });
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 400, error.message);
      if (isDuplicateKey(error)) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));
  router.patch("/collections/:collectionId", auth("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const id = objectIdText(req.params.collectionId);
    const body = objectBody(req.body);
    if (!id || !Object.keys(body).length ||
      Object.keys(body).some(k => !["name", "slug", "position", "status"].includes(k))) {
      return sendError(res, 400, "invalid_collection_patch");
    }
    const changes: Record<string, string | number> = {};
    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 200) return sendError(res, 400, "invalid_name");
      changes.name = body.name.trim();
    }
    if ("position" in body) {
      if (!Number.isSafeInteger(body.position)) return sendError(res, 400, "invalid_position");
      changes.position = body.position as number;
    }
    if ("status" in body) {
      if (body.status !== "active" && body.status !== "archived") return sendError(res, 400, "invalid_status");
      changes.status = body.status;
    }
    try {
      if ("slug" in body) {
        if (typeof body.slug !== "string") return sendError(res, 400, "invalid_slug");
        changes.slug = normalizeSlug(body.slug);
      }
      const actorId = getContext(res).account._id;
      const result = await mongoose.connection.transaction(async session => {
        const collection = await CatalogCollectionModel.findById(id).session(session).lean();
        if (!collection) return null;
        const before: Record<string, unknown> = {};
        for (const key of Object.keys(changes)) before[key] = collection[key];
        const updated = await CatalogCollectionModel.updateOne(
          { _id: id, __v: collection.__v },
          { $set: changes, $inc: { __v: 1 } }, { session }
        );
        if (updated.modifiedCount !== 1) throw new Error("collection_conflict");
        await CatalogEventModel.create([{
          actorId, action: "collection.updated", entityType: "collection", entityId: collection._id,
          before, after: changes
        }], { session });
        return { id };
      });
      if (!result) return sendError(res, 404, "collection_not_found");
      res.json(result);
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 400, error.message);
      if (isDuplicateKey(error) || (error instanceof Error && /conflict/i.test(error.message))) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));
  return router;
}
