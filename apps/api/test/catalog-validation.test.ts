import { describe, expect, it } from "vitest";
import { CatalogValidationError, normalizeSku, normalizeSlug, optionCombinationKey, validatePublication } from "../src/catalog/validation.js";
import type { PublicationInput } from "../src/catalog/validation.js";

function valid(): PublicationInput {
  return {
    name: "Camiseta",
    slug: "camiseta",
    images: [{ assetId: "image-1" }],
    primaryImageAssetId: "image-1",
    options: [{ name: "Talla", values: ["S", "M"] }],
    variants: [{ optionValues: { Talla: "S" }, priceMinor: 12990, active: true }]
  };
}

describe("F1-D catalog invariants", () => {
  it("accepts a publishable product and the default simple variant", () => {
    expect(() => validatePublication(valid())).not.toThrow();
    const simple = valid();
    simple.options = [];
    simple.variants = [{ optionValues: {}, priceMinor: 100, active: true }];
    expect(() => validatePublication(simple)).not.toThrow();
  });

  it("rejects products without variants or active variants", () => {
    const input = valid();
    input.variants = [];
    expect(() => validatePublication(input)).toThrow("missing_variant");
    input.variants = [{ optionValues: { Talla: "S" }, priceMinor: 100, active: false }];
    expect(() => validatePublication(input)).toThrow("invalid_active_variant_count");
  });

  it("rejects duplicate option combinations case-insensitively", () => {
    const input = valid();
    input.variants.push({ optionValues: { Talla: "s" }, priceMinor: 100, active: true });
    expect(() => validatePublication(input)).toThrow("duplicate_variant_combination");
  });

  it("rejects invalid images, prices, limits and option references", () => {
    const input = valid();
    input.primaryImageAssetId = "unknown";
    expect(() => validatePublication(input)).toThrow("invalid_primary_image");
    input.primaryImageAssetId = "image-1";
    input.variants[0]!.priceMinor = 0;
    expect(() => validatePublication(input)).toThrow("active_variant_requires_positive_price");
    input.variants[0]!.priceMinor = 100;
    input.variants[0]!.purchaseLimit = 0;
    expect(() => validatePublication(input)).toThrow("invalid_purchase_limit");
    input.variants[0]!.purchaseLimit = 50;
    input.variants[0]!.optionValues = { Talla: "XL" };
    expect(() => validatePublication(input)).toThrow("unknown_option_value");
  });

  it("enforces catalog cardinality", () => {
    const input = valid();
    input.options = Array.from({ length: 4 }, (_, i) => ({ name: `Option${i}`, values: ["A"] }));
    expect(() => validatePublication(input)).toThrow("too_many_option_types");
    input.options = [];
    input.variants = Array.from({ length: 101 }, () => ({ optionValues: {}, priceMinor: 100, active: true }));
    expect(() => validatePublication(input)).toThrow();
    input.variants = [{ optionValues: {}, priceMinor: 100, active: true }];
    input.images = Array.from({ length: 13 }, (_, i) => ({ assetId: `img-${i}` }));
    expect(() => validatePublication(input)).toThrow("invalid_gallery_size");
  });

  it("normalizes identifiers without changing immutable entity IDs", () => {
    expect(normalizeSku(" ab-01 ")).toBe("AB-01");
    expect(normalizeSku("  ")).toBeNull();
    expect(normalizeSlug(" Product-1 ")).toBe("product-1");
    expect(() => normalizeSlug("not valid!")).toThrow(CatalogValidationError);
    expect(optionCombinationKey([], {})).toBe("[]");
  });
});
