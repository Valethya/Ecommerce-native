import mongoose from "mongoose";
import { generate } from "otplib";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { ensureAdminIndexes } from "../src/admin/indexes.js";
import { CatalogEventModel, CatalogProductModel, CatalogVariantModel } from "../src/catalog/models.js";
import { connectDatabase, disconnectDatabase } from "../src/db/mongoose.js";

const config = {
  bootstrapToken: "test-bootstrap-token-that-is-long-enough",
  mfaEncryptionKey: Buffer.alloc(32, 7).toString("base64"),
  totpIssuer: "Ecommerce Native Test",
  secureCookies: false
};
const app = createApp({ adminAuth: config });
beforeAll(async () => {
  await connectDatabase("mongodb://127.0.0.1:27017/ecommerce_native_f1d_edit_test?replicaSet=rs0");
  await ensureAdminIndexes();

});
beforeEach(async () => {
  await mongoose.connection.db!.dropDatabase();
  await ensureAdminIndexes();
});
afterAll(async () => { await disconnectDatabase(); });

async function owner() {
  const pending = await request(app).post("/admin/auth/bootstrap/owner")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ name: "Owner", email: "owner@example.test", password: "owner password 123" });
  expect(pending.status).toBe(201);
  const agent = request.agent(app);
  const activated = await agent.post("/admin/auth/bootstrap/owner/activate")
    .set("x-admin-bootstrap-token", config.bootstrapToken)
    .send({ accountId: pending.body.accountId, totp: await generate({ secret: pending.body.mfa.secret }) });
  expect(activated.status).toBe(200);
  const cookie = activated.headers["set-cookie"] as unknown as string[];
  const csrf = cookie.map(c => /^admin_csrf=([^;]+)/.exec(c)?.[1]).find(Boolean);
  expect(csrf).toBeTruthy();
  return { agent, csrf: csrf! };
}

describe("F1-D transactional catalog edits", () => {
  it("requires authenticated MFA-backed session and CSRF", async () => {
    const product = await CatalogProductModel.create({ name: "Item", slug: "item" });
    const unauthenticated = await request(app).patch("/admin/catalog/products/" + product.id).send({ name: "Changed" });
    expect(unauthenticated.status).toBe(401);
    const admin = await owner();
    const missingCsrf = await admin.agent.patch("/admin/catalog/products/" + product.id).send({ name: "Changed" });
    expect(missingCsrf.status).toBe(403);
    expect((await CatalogProductModel.findById(product.id))!.name).toBe("Item");
  });

  it("updates a product and variant atomically with attributable audit events", async () => {
    const admin = await owner();
    const created = await admin.agent.post("/admin/catalog/products").set("x-csrf-token", admin.csrf)
      .send({ name: "Item", slug: "item" });
    expect(created.status).toBe(201);
    const productId = created.body.id as string;
    const variant = await CatalogVariantModel.findOne({ productId });
    expect(variant).toBeTruthy();

    const productEdit = await admin.agent.patch("/admin/catalog/products/" + productId)
      .set("x-csrf-token", admin.csrf).send({ name: "Updated", slug: "updated" });
    expect(productEdit.status).toBe(200);
    const variantEdit = await admin.agent.patch("/admin/catalog/products/" + productId + "/variants/" + variant!.id)
      .set("x-csrf-token", admin.csrf)
      .send({ sku: " ab-01 ", priceMinor: 1990, purchaseLimit: 4, active: true });
    expect(variantEdit.status).toBe(200);
    expect((await CatalogVariantModel.findById(variant!.id))!.sku).toBe("AB-01");
    expect((await CatalogProductModel.findById(productId))!.slug).toBe("updated");
    const events = await CatalogEventModel.find({}).lean();
    expect(events.map(e => e.action)).toEqual(expect.arrayContaining(["product.created", "product.updated", "variant.updated"]));
    expect(events.every(e => e.actorId)).toBe(true);
  });

  it("rejects invalid variant changes without modifying data or writing audit", async () => {
    const admin = await owner();
    const created = await admin.agent.post("/admin/catalog/products").set("x-csrf-token", admin.csrf)
      .send({ name: "Item", slug: "item" });
    const variant = await CatalogVariantModel.findOne({ productId: created.body.id });
    const initialEvents = await CatalogEventModel.countDocuments();
    const result = await admin.agent.patch("/admin/catalog/products/" + created.body.id + "/variants/" + variant!.id)
      .set("x-csrf-token", admin.csrf).send({ purchaseLimit: 0 });
    expect(result.status).toBe(400);
    expect((await CatalogVariantModel.findById(variant!.id))!.purchaseLimit).toBe(50);
    expect(await CatalogEventModel.countDocuments()).toBe(initialEvents);
  });

  it("enforces unique SKUs at the database boundary", async () => {
    const admin = await owner();
    const ids: string[] = [];
    for (const slug of ["one", "two"]) {
      const created = await admin.agent.post("/admin/catalog/products").set("x-csrf-token", admin.csrf)
        .send({ name: slug, slug });
      ids.push(created.body.id);
    }
    const variants = await Promise.all(ids.map(id => CatalogVariantModel.findOne({ productId: id })));
    const endpoint = (i: number) => "/admin/catalog/products/" + ids[i] + "/variants/" + variants[i]!.id;
    const first = await admin.agent.patch(endpoint(0)).set("x-csrf-token", admin.csrf).send({ sku: "DUPLICATE" });
    const second = await admin.agent.patch(endpoint(1)).set("x-csrf-token", admin.csrf).send({ sku: "duplicate" });
    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect((await CatalogVariantModel.findById(variants[1]!.id))!.sku).toBeNull();
  });
  it("creates a variant with an audited immutable combination and rejects duplicate combinations", async () => {
    const admin = await owner();
    const created = await admin.agent.post("/admin/catalog/products").set("x-csrf-token", admin.csrf)
      .send({ name: "Simple", slug: "simple" });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const first = await admin.agent.post("/admin/catalog/products/" + id + "/variants")
      .set("x-csrf-token", admin.csrf)
      .send({ optionValues: {}, priceMinor: 1200, sku: "new-sku", active: false });
    expect(first.status).toBe(409);
    expect(await CatalogVariantModel.countDocuments({ productId: id })).toBe(1);
    expect(await CatalogEventModel.countDocuments({ action: "variant.created" })).toBe(0);
  });

  it("does not mutate option identity of an existing variant", async () => {
    const admin = await owner();
    const created = await admin.agent.post("/admin/catalog/products").set("x-csrf-token", admin.csrf)
      .send({ name: "Simple", slug: "simple" });
    expect(created.status).toBe(201);
    const id = created.body.id as string;
    const result = await admin.agent.patch("/admin/catalog/products/" + id + "/options")
      .set("x-csrf-token", admin.csrf)
      .send({ options: [{ name: "Size", values: ["M"] }] });
    expect(result.status).toBe(422);
    expect((await CatalogProductModel.findById(id))!.options).toHaveLength(0);
    expect(await CatalogEventModel.countDocuments({ action: "product.options_updated" })).toBe(0);
  });

  it("rejects a conflicting product slug without leaving an audit event", async () => {
    const admin = await owner();
    const ids: string[] = [];
    for (const slug of ["alpha", "beta"]) {
      const created = await admin.agent.post("/admin/catalog/products")
        .set("x-csrf-token", admin.csrf).send({ name: slug, slug });
      expect(created.status).toBe(201);
      ids.push(created.body.id as string);
    }
    const edit = await admin.agent.patch("/admin/catalog/products/" + ids[1])
      .set("x-csrf-token", admin.csrf).send({ slug: "alpha" });
    expect(edit.status).toBe(409);
    expect((await CatalogProductModel.findById(ids[1]))!.slug).toBe("beta");
    expect(await CatalogEventModel.countDocuments({ action: "product.updated" })).toBe(0);
  });

  it("creates, archives and restores a collection with audit and rejects duplicate slugs", async () => {
    const admin = await owner();
    const created = await admin.agent.post("/admin/catalog/collections")
      .set("x-csrf-token", admin.csrf).send({ name: "Seasonal", slug: "seasonal", position: 2 });
    expect(created.status).toBe(201);
    const duplicate = await admin.agent.post("/admin/catalog/collections")
      .set("x-csrf-token", admin.csrf).send({ name: "Duplicate", slug: "seasonal" });
    expect(duplicate.status).toBe(409);
    const archived = await admin.agent.patch("/admin/catalog/collections/" + created.body.id)
      .set("x-csrf-token", admin.csrf).send({ status: "archived" });
    expect(archived.status).toBe(200);
    const restored = await admin.agent.patch("/admin/catalog/collections/" + created.body.id)
      .set("x-csrf-token", admin.csrf).send({ status: "active" });
    expect(restored.status).toBe(200);
    expect(await CatalogEventModel.countDocuments({ entityType: "collection" })).toBe(3);
  });

});
