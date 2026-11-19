import mongoose from "mongoose";
import { Router } from "express";
import { asyncRoute, sendError } from "../admin/http-helpers.js";
import { CatalogCollectionModel, CatalogProductModel, CatalogVariantModel } from "./models.js";

const productProjection = {
  name: 1, description: 1, slug: 1, images: 1, primaryImageAssetId: 1,
  options: 1, collectionIds: 1, collectionPositions: 1
};
const variantProjection = {
  productId: 1, optionValues: 1, priceMinor: 1, purchaseLimit: 1, imageAssetId: 1
};
function escapedRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function createPublicCatalogRouter(): Router {
  const router = Router();
  router.get("/collections", asyncRoute(async (_req, res) => {
    const collections = await CatalogCollectionModel.find({ status: "active" },
      { name: 1, slug: 1, position: 1 }).sort({ position: 1, _id: 1 }).lean();
    res.json({ collections });
  }));
  router.get("/products", asyncRoute(async (req, res) => {
    const page = Number(req.query.page ?? 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return sendError(res, 400, "invalid_page");
    const search = req.query.search;
    const collection = req.query.collection;
    const option = req.query.option;
    const value = req.query.value;
    if ((search !== undefined && (typeof search !== "string" || search.length > 100)) ||
      (collection !== undefined && (typeof collection !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection))) ||
      ((option === undefined) !== (value === undefined)) ||
      (option !== undefined && (typeof option !== "string" || !option.trim() || option.length > 100 ||
        typeof value !== "string" || !value.trim() || value.length > 100))) {
      return sendError(res, 400, "invalid_catalog_filter");
    }
    // Availability depends on authoritative inventory introduced in F1-E.
    if (req.query.available !== undefined) return sendError(res, 400, "availability_not_supported");
    const filter: Record<string, unknown> = { status: "active" };
    if (typeof search === "string" && search.trim()) {
      filter.name = { $regex: escapedRegex(search.trim()), $options: "i" };
    }
    let collectionId: mongoose.Types.ObjectId | undefined;
    if (typeof collection === "string") {
      const found = await CatalogCollectionModel.findOne({ slug: collection, status: "active" }, { _id: 1 }).lean();
      if (!found) return res.json({ products: [], page });
      collectionId = found._id;
      filter.collectionIds = collectionId;
    }
    let matchingProductIds: mongoose.Types.ObjectId[] | undefined;
    if (typeof option === "string" && typeof value === "string") {
      const matching = await CatalogVariantModel.find({
        active: true,
        ["optionValues." + option]: { $regex: "^" + escapedRegex(value.trim()) + "$", $options: "i" }
      }, { productId: 1 }).lean();
      matchingProductIds = matching.map((v: { productId: mongoose.Types.ObjectId }) => v.productId);
      filter._id = { $in: matchingProductIds };
    }
    const sort: Record<string, 1> = collectionId ? { ["collectionPositions." + String(collectionId)]: 1, _id: 1 } : { _id: 1 };
    const products = await CatalogProductModel.find(filter, productProjection)
      .sort(sort).skip((page - 1) * 20).limit(20).lean();
    const ids = products.map((p: { _id: unknown }) => p._id);
    const variants = await CatalogVariantModel.find({ productId: { $in: ids }, active: true }, variantProjection).lean();
    // Only expose active collection identifiers; archived collections must not leak into public results.
    const allCollectionIds = products.flatMap((p: { collectionIds?: mongoose.Types.ObjectId[] }) => p.collectionIds ?? []);
    const activeCollections = await CatalogCollectionModel.find({
      _id: { $in: allCollectionIds }, status: "active"
    }, { _id: 1 }).lean();
    const activeIds = new Set(activeCollections.map((c: { _id: unknown }) => String(c._id)));
    res.json({ products: products.map((product: any) => ({
      ...product,
      collectionIds: (product.collectionIds ?? []).filter((id: unknown) => activeIds.has(String(id))),
      collectionPositions: Object.fromEntries(
        Object.entries(product.collectionPositions ?? {}).filter(([id]) => activeIds.has(id))
      ),
      variants: variants.filter((variant: { productId: unknown }) => String(variant.productId) === String(product._id))
    })), page });
  }));
  return router;
}
