import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export const MAX_OPTION_TYPES = 3;
export const MAX_ACTIVE_VARIANTS = 100;
export const MAX_PRODUCT_IMAGES = 12;
export const DEFAULT_PURCHASE_LIMIT = 50;

const imageSchema = new Schema({
  assetId: { type: String, required: true },
  alt: { type: String, default: "" }
}, { _id: false });

const optionSchema = new Schema({
  name: { type: String, required: true },
  values: { type: [String], required: true }
}, { _id: false });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  slug: { type: String, required: true, trim: true, lowercase: true },
  status: { type: String, enum: ["draft", "active", "archived"], default: "draft", required: true },
  images: { type: [imageSchema], default: [] },
  primaryImageAssetId: { type: String, default: null },
  options: { type: [optionSchema], default: [] },
  collectionIds: { type: [Schema.Types.ObjectId], default: [] },
  collectionPositions: { type: Map, of: Number, default: {} }
}, { timestamps: true, optimisticConcurrency: true });

productSchema.index({ slug: 1 }, { unique: true, name: "unique_product_slug" });
productSchema.index({ status: 1, name: 1, _id: 1 });

const variantSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, required: true, index: true },
  optionKey: { type: String, required: true },
  optionValues: { type: Map, of: String, default: {} },
  sku: { type: String, default: null },
  priceMinor: { type: Number, required: true, min: 0 },
  purchaseLimit: { type: Number, required: true, default: DEFAULT_PURCHASE_LIMIT, min: 1 },
  active: { type: Boolean, default: true, required: true },
  imageAssetId: { type: String, default: null },
  hasOrderHistory: { type: Boolean, default: false, required: true }
}, { timestamps: true, optimisticConcurrency: true });

variantSchema.index({ productId: 1, optionKey: 1 }, { unique: true, name: "unique_variant_combination" });
variantSchema.index({ sku: 1 }, {
  unique: true,
  partialFilterExpression: { sku: { $type: "string" } },
  name: "unique_defined_sku"
});

const collectionSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  status: { type: String, enum: ["active", "archived"], default: "active" },
  position: { type: Number, default: 0 }
}, { timestamps: true, optimisticConcurrency: true });
collectionSchema.index({ slug: 1 }, { unique: true, name: "unique_collection_slug" });

const catalogEventSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  before: { type: Schema.Types.Mixed, default: null },
  after: { type: Schema.Types.Mixed, default: null },
  reason: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
catalogEventSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export const CatalogProductModel: mongoose.Model<any> = (models.CatalogProduct as mongoose.Model<any> | undefined) ?? model("CatalogProduct", productSchema);
export const CatalogVariantModel: mongoose.Model<any> = (models.CatalogVariant as mongoose.Model<any> | undefined) ?? model("CatalogVariant", variantSchema);
export const CatalogCollectionModel: mongoose.Model<any> = (models.CatalogCollection as mongoose.Model<any> | undefined) ?? model("CatalogCollection", collectionSchema);
export const CatalogEventModel: mongoose.Model<any> = (models.CatalogEvent as mongoose.Model<any> | undefined) ?? model("CatalogEvent", catalogEventSchema);
