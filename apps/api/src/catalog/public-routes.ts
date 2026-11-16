import { Router } from "express";
import { asyncRoute, sendError } from "../admin/http-helpers.js";
import { CatalogProductModel, CatalogVariantModel } from "./models.js";

// Explicit projections: administrative metadata and inactive variants are never returned.
const productProjection = {
  name: 1, description: 1, slug: 1, images: 1, primaryImageAssetId: 1,
  options: 1, collectionIds: 1, collectionPositions: 1
};
const variantProjection = {
  productId: 1, optionValues: 1, priceMinor: 1, purchaseLimit: 1, imageAssetId: 1
};

export function createPublicCatalogRouter(): Router {
  const router = Router();
  router.get("/products", asyncRoute(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) {
      return sendError(res, 400, "invalid_page");
    }
    const search = req.query.search;
    if (search !== undefined && (typeof search !== "string" || search.length > 100)) {
      return sendError(res, 400, "invalid_search");
    }
    const filter: Record<string, unknown> = { status: "active" };
    if (typeof search === "string" && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }
    const products = await CatalogProductModel.find(filter, productProjection)
      .sort({ _id: 1 }).skip((page - 1) * 20).limit(20).lean();
    const ids = products.map((product: { _id: unknown }) => product._id);
    const variants = await CatalogVariantModel.find(
      { productId: { $in: ids }, active: true }, variantProjection
    ).lean();
    res.json({ products: products.map((product: { _id: unknown }) => ({
      ...product, variants: variants.filter((variant: { productId: unknown }) =>
        String(variant.productId) === String(product._id))
    })), page });
  }));
  return router;
}
