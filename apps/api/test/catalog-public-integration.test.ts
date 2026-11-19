import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ensureAdminIndexes } from "../src/admin/indexes.js";
import { CatalogCollectionModel, CatalogProductModel, CatalogVariantModel } from "../src/catalog/models.js";
import { connectDatabase, disconnectDatabase } from "../src/db/mongoose.js";

const app = createApp();
beforeAll(async () => {
  await connectDatabase("mongodb://127.0.0.1:27017/ecommerce_native_f1d_public_test?replicaSet=rs0");
  await ensureAdminIndexes();
});
beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
  await ensureAdminIndexes();
});
afterAll(async () => { await disconnectDatabase(); });

describe("F1-D public catalog privacy and filters", () => {
  it("excludes drafts, archived collections and inactive variants", async () => {
    const activeCollection = await CatalogCollectionModel.create({ name: "Active", slug: "active" });
    const archivedCollection = await CatalogCollectionModel.create({ name: "Archived", slug: "archived", status: "archived" });
    const visible = await CatalogProductModel.create({
      name: "Visible", slug: "visible", status: "active",
      collectionIds: [activeCollection._id, archivedCollection._id]
    });
    const hidden = await CatalogProductModel.create({ name: "Hidden", slug: "hidden", status: "draft" });
    await CatalogVariantModel.create([
      { productId: visible._id, optionKey: "[]", optionValues: {}, priceMinor: 100, active: true },
      { productId: visible._id, optionKey: "inactive", optionValues: {}, priceMinor: 200, active: false },
      { productId: hidden._id, optionKey: "[]", optionValues: {}, priceMinor: 100, active: true }
    ]);
    const response = await request(app).get("/catalog/products");
    expect(response.status).toBe(200);
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0].variants).toHaveLength(1);
    expect(response.body.products[0].collectionIds).toEqual([String(activeCollection._id)]);
    expect(response.body.products[0].status).toBeUndefined();
    const collections = await request(app).get("/catalog/collections");
    expect(collections.status).toBe(200);
    expect(collections.body.collections).toHaveLength(1);
    const byArchived = await request(app).get("/catalog/products?collection=archived");
    expect(byArchived.body.products).toHaveLength(0);
  });

  it("filters by active collection and active variant option values", async () => {
    const collection = await CatalogCollectionModel.create({ name: "Clothes", slug: "clothes" });
    const product = await CatalogProductModel.create({
      name: "Jacket", slug: "jacket", status: "active", collectionIds: [collection._id],
      options: [{ name: "Size", values: ["M", "L"] }]
    });
    await CatalogVariantModel.create({
      productId: product._id, optionKey: '[["size","m"]]',
      optionValues: { Size: "M" }, priceMinor: 1000, active: true
    });
    const found = await request(app).get("/catalog/products?collection=clothes&option=Size&value=m");
    expect(found.status).toBe(200);
    expect(found.body.products.map((p: { slug: string }) => p.slug)).toEqual(["jacket"]);
    const missing = await request(app).get("/catalog/products?option=Size&value=L");
    expect(missing.body.products).toHaveLength(0);
    const invalid = await request(app).get("/catalog/products?option=Size");
    expect(invalid.status).toBe(400);
    const availability = await request(app).get("/catalog/products?available=true");
    expect(availability.status).toBe(400);
  });
});
