import { Router } from "express";
import mongoose from "mongoose";
import type { AdminAuthConfig } from "../admin/config.js";
import { asyncRoute, isDuplicateKey, objectBody, objectIdText, sendError } from "../admin/http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "../admin/middleware.js";
import { getContext } from "../admin/session.js";
import { CatalogEventModel, CatalogProductModel, CatalogVariantModel } from "./models.js";
import { CatalogValidationError, normalizeSlug, optionCombinationKey, validateOptions } from "./validation.js";

export function createAdminCatalogRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const auth = createRequireAuth(config);
  const csrf = createRequireCsrf();

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
  return router;
}
