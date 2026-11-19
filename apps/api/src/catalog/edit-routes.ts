import { Router } from "express";
import mongoose from "mongoose";
import type { AdminAuthConfig } from "../admin/config.js";
import { asyncRoute, isDuplicateKey, objectBody, objectIdText, sendError } from "../admin/http-helpers.js";
import { createRequireAuth, createRequireCsrf } from "../admin/middleware.js";
import { getContext } from "../admin/session.js";
import { CatalogEventModel, CatalogProductModel, CatalogVariantModel } from "./models.js";
import { CatalogValidationError, normalizeSku, normalizeSlug, validatePublication } from "./validation.js";

type Change = Record<string, string | number | boolean | null>;
class CatalogConflict extends Error {}
function plainOptions(value: unknown): Record<string, string> {
  if (value instanceof Map) return Object.fromEntries(value);
  return (value ?? {}) as Record<string, string>;
}
async function assertPublishable(product: any, session: mongoose.ClientSession): Promise<void> {
  if (product.status !== "active") return;
  const variants = await CatalogVariantModel.find({ productId: product._id }).session(session).lean();
  validatePublication({
    name: product.name, slug: product.slug, images: product.images,
    primaryImageAssetId: product.primaryImageAssetId, options: product.options,
    variants: variants.map((v: any) => ({
      optionValues: plainOptions(v.optionValues), sku: v.sku, priceMinor: v.priceMinor,
      purchaseLimit: v.purchaseLimit, active: v.active, imageAssetId: v.imageAssetId
    }))
  });
}

export function createCatalogEditRouter(config: AdminAuthConfig): Router {
  const router = Router();
  const protect = createRequireAuth(config);
  const csrf = createRequireCsrf();

  router.patch("/products/:productId", protect("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const id = objectIdText(req.params.productId);
    const body = objectBody(req.body);
    if (!id || !Object.keys(body).length || Object.keys(body).some(k => !["name", "description", "slug"].includes(k))) {
      return sendError(res, 400, "invalid_product_patch");
    }
    const changes: Change = {};
    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 200) return sendError(res, 400, "invalid_name");
      changes.name = body.name.trim();
    }
    if ("description" in body) {
      if (typeof body.description !== "string" || body.description.length > 20000) return sendError(res, 400, "invalid_description");
      changes.description = body.description.trim();
    }
    try {
      if ("slug" in body) {
        if (typeof body.slug !== "string") return sendError(res, 400, "invalid_slug");
        changes.slug = normalizeSlug(body.slug);
      }
      const actorId = getContext(res).account._id;
      const result = await mongoose.connection.transaction(async session => {
        const product = await CatalogProductModel.findById(id).session(session).lean();
        if (!product) return null;
        const before: Change = {};
        for (const key of Object.keys(changes)) before[key] = product[key];
        const next = { ...product, ...changes };
        await assertPublishable(next, session);
        const updated = await CatalogProductModel.updateOne(
          { _id: id, __v: product.__v },
          { $set: changes, $inc: { __v: 1 } }, { session }
        );
        if (updated.modifiedCount !== 1) throw new CatalogConflict();
        await CatalogEventModel.create([{
          actorId, action: "product.updated", entityType: "product",
          entityId: product._id, before, after: changes
        }], { session });
        return { id, version: product.__v + 1 };
      });
      if (!result) return sendError(res, 404, "product_not_found");
      res.json(result);
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 422, error.message);
      if (error instanceof CatalogConflict || isDuplicateKey(error) || (error instanceof Error && error.name === "MongoServerError" && /WriteConflict/.test(error.message))) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));

  router.patch("/products/:productId/variants/:variantId", protect("catalog:manage"), csrf, asyncRoute(async (req, res) => {
    const productId = objectIdText(req.params.productId);
    const variantId = objectIdText(req.params.variantId);
    const body = objectBody(req.body);
    if (!productId || !variantId || !Object.keys(body).length ||
      Object.keys(body).some(k => !["sku", "priceMinor", "purchaseLimit", "active", "imageAssetId"].includes(k))) {
      return sendError(res, 400, "invalid_variant_patch");
    }
    const changes: Change = {};
    try {
      if ("sku" in body) {
        if (body.sku !== null && typeof body.sku !== "string") return sendError(res, 400, "invalid_sku");
        changes.sku = normalizeSku(body.sku as string | null);
      }
      if ("priceMinor" in body) {
        if (!Number.isSafeInteger(body.priceMinor) || (body.priceMinor as number) < 0) return sendError(res, 400, "invalid_price");
        changes.priceMinor = body.priceMinor as number;
      }
      if ("purchaseLimit" in body) {
        if (!Number.isSafeInteger(body.purchaseLimit) || (body.purchaseLimit as number) < 1) return sendError(res, 400, "invalid_purchase_limit");
        changes.purchaseLimit = body.purchaseLimit as number;
      }
      if ("active" in body) {
        if (typeof body.active !== "boolean") return sendError(res, 400, "invalid_active");
        changes.active = body.active;
      }
      if ("imageAssetId" in body) {
        if (body.imageAssetId !== null && (typeof body.imageAssetId !== "string" || !body.imageAssetId.trim() || body.imageAssetId.length > 200)) return sendError(res, 400, "invalid_image");
        changes.imageAssetId = body.imageAssetId as string | null;
      }
      const actorId = getContext(res).account._id;
      const result = await mongoose.connection.transaction(async session => {
        const product = await CatalogProductModel.findById(productId).session(session).lean();
        if (!product) return null;
        const variant = await CatalogVariantModel.findOne({ _id: variantId, productId }).session(session).lean();
        if (!variant) return null;
        const before: Change = {};
        for (const key of Object.keys(changes)) before[key] = variant[key];
        if (changes.imageAssetId && !product.images.some((image: { assetId: string }) => image.assetId === changes.imageAssetId)) {
          throw new CatalogValidationError("invalid_variant_image");
        }
        const next = { ...variant, ...changes };
        if (product.status === "active" && next.active && next.priceMinor <= 0) {
          throw new CatalogValidationError("active_variant_requires_positive_price");
        }
        const bumped = await CatalogProductModel.updateOne(
          { _id: productId, __v: product.__v }, { $inc: { __v: 1 } }, { session }
        );
        if (bumped.modifiedCount !== 1) throw new CatalogConflict();
        const updated = await CatalogVariantModel.updateOne(
          { _id: variantId, productId, __v: variant.__v },
          { $set: changes, $inc: { __v: 1 } }, { session }
        );
        if (updated.modifiedCount !== 1) throw new CatalogConflict();
        await assertPublishable(product, session);
        await CatalogEventModel.create([{
          actorId, action: "variant.updated", entityType: "variant", entityId: variant._id,
          before, after: changes
        }], { session });
        return { id: variantId, version: variant.__v + 1 };
      });
      if (!result) return sendError(res, 404, "variant_not_found");
      res.json(result);
    } catch (error) {
      if (error instanceof CatalogValidationError) return sendError(res, 422, error.message);
      if (error instanceof CatalogConflict || isDuplicateKey(error) || (error instanceof Error && /WriteConflict/.test(error.message))) return sendError(res, 409, "catalog_conflict");
      throw error;
    }
  }));
  return router;
}
