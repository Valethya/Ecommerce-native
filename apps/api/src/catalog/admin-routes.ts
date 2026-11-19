import { Router } from "express";
import { createCatalogEditRouter } from "./edit-routes.js";
import mongoose from "mongoose";
import type { AdminAuthConfig } from "../admin/config.js";
import { asyncRoute, isDuplicateKey, objectBody, objectIdText, sendError } from "../admin/http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "../admin/middleware.js";
import { getContext } from "../admin/session.js";
import { CatalogEventModel, CatalogProductModel, CatalogVariantModel } from "./models.js";
import { CatalogValidationError, normalizeSlug, optionCombinationKey, validateOptions, validatePublication } from "./validation.js";

export function createAdminCatalogRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const auth = createRequireAuth(config);
  const csrf = createRequireCsrf();
  router.use(createCatalogEditRouter(config));

  router.get("/products", auth("catalog:read"), asyncRoute(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return sendError(res, 400, "invalid_page");
    const products = await CatalogProductModel.find({}).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25).lean();
    res.json({ products, page });
  }));

  router.get("/products/:productId", auth("catalog:read"), asyncRoute(async (req, res) => {
    const id = objectIdText(req.params.productId);
    if (!id) return sendError(res, 400, "invalid_product_id");
    const product = await CatalogProductModel.findById(id).lean();
    if (!product) return sendError(res, 404, "product_not_found");
    const variants = await CatalogVariantModel.find({ productId: id }).sort({ _id: 1 }).lean();
    res.json({ product, variants });
  }));

  // Draft creation is transactional: the product is never persisted without its default variant.
  // Publication, image ingestion, variant mutation and archival require their own audited contracts.
  router.post("/products", auth("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const body = objectBody(req.body);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const rawSlug = body.slug;
    if (!name || name.length > 200 || description.length > 20000 || typeof rawSlug !== "string") {
      return sendError(res, 400, "invalid_product");
    }
    let slug: string;
    try {
      slug = normalizeSlug(rawSlug);
      validateOptions([]);
      optionCombinationKey([], {});
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 400, error.message);
      throw error;
    }
    const actor = getContext(res).account;
    try {
      const createdId = await mongoose.connection.transaction(async (session) => {
        const [product] = await CatalogProductModel.create([{
          name, description, slug, status: "draft", options: [], images: []
        }], { session });
        if (!product) throw new Error("product_creation_failed");
        await CatalogVariantModel.create([{
          productId: product._id,
          optionKey: "[]",
          optionValues: {},
          sku: null,
          priceMinor: 0,
          active: false
        }], { session });
        await CatalogEventModel.create([{
          actorId: actor._id,
          action: "product.created",
          entityType: "product",
          entityId: product._id,
          before: null,
          after: { name, description, slug, status: "draft" }
        }], { session });
        return String(product._id);
      });
      res.status(201).json({ id: createdId, status: "draft" });
    } catch (error) {
      if (isDuplicateKey(error)) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));

  router.post("/products/:productId/status", auth("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const id = objectIdText(req.params.productId);
    const body = objectBody(req.body);
    const action = body.action;
    const reason = typeof body.reason === "string" && body.reason.trim().length <= 500
      ? body.reason.trim() : null;
    if (!id || !["publish", "unpublish", "archive", "restore"].includes(String(action))) {
      return sendError(res, 400, "invalid_status_request");
    }
    const transitions: Record<string, { from: string[]; to: string }> = {
      publish: { from: ["draft"], to: "active" },
      unpublish: { from: ["active"], to: "draft" },
      archive: { from: ["draft", "active"], to: "archived" },
      restore: { from: ["archived"], to: "draft" }
    };
    const transition = transitions[String(action)]!;
    const actor = getContext(res).account;
    try {
      const result = await mongoose.connection.transaction(async (session) => {
        const product = await CatalogProductModel.findById(id).session(session).lean();
        if (!product) return { status: 404, error: "product_not_found" };
        if (!transition.from.includes(product.status)) return { status: 409, error: "invalid_status_transition" };
        if (action === "publish") {
          const variants = await CatalogVariantModel.find({ productId: id }).session(session).lean();
          validatePublication({
            name: product.name, slug: product.slug,
            images: product.images, primaryImageAssetId: product.primaryImageAssetId,
            options: product.options,
            variants: variants.map((variant: any) => ({
              optionValues: variant.optionValues instanceof Map
                ? Object.fromEntries(variant.optionValues)
                : variant.optionValues,
              sku: variant.sku, priceMinor: variant.priceMinor,
              purchaseLimit: variant.purchaseLimit, active: variant.active,
              imageAssetId: variant.imageAssetId
            }))
          });
        }
        const updated = await CatalogProductModel.updateOne(
          { _id: id, status: product.status, __v: product.__v },
          { $set: { status: transition.to }, $inc: { __v: 1 } },
          { session }
        );
        if (updated.modifiedCount !== 1) return { status: 409, error: "concurrent_catalog_change" };
        await CatalogEventModel.create([{
          actorId: actor._id, action: "product." + String(action),
          entityType: "product", entityId: product._id,
          before: { status: product.status }, after: { status: transition.to }, reason
        }], { session });
        return { status: 200, state: transition.to };
      });
      if (result.status !== 200) return sendError(res, result.status, result.error!);
      res.json({ id, status: result.state });
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 422, error.message);
      if (isDuplicateKey(error)) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));
  return router;
}
