import {
  DEFAULT_PURCHASE_LIMIT,
  MAX_ACTIVE_VARIANTS,
  MAX_OPTION_TYPES,
  MAX_PRODUCT_IMAGES
} from "./models.js";

export interface CatalogOption {
  name: string;
  values: string[];
}

export interface CatalogVariantInput {
  optionValues: Record<string, string>;
  sku?: string | null;
  priceMinor: number;
  purchaseLimit?: number;
  active: boolean;
  imageAssetId?: string | null;
}

export interface PublicationInput {
  name: string;
  slug: string;
  images: { assetId: string }[];
  primaryImageAssetId: string | null;
  options: CatalogOption[];
  variants: CatalogVariantInput[];
}

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogValidationError";
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new CatalogValidationError(message);
}

export function normalizeSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized), "invalid_slug");
  return normalized;
}

export function normalizeSku(sku: string | null | undefined): string | null {
  if (sku == null || sku.trim() === "") return null;
  const normalized = sku.trim().toUpperCase();
  assert(normalized.length <= 100, "invalid_sku");
  return normalized;
}

export function validateOptions(options: CatalogOption[]): void {
  assert(options.length <= MAX_OPTION_TYPES, "too_many_option_types");
  const names = new Set<string>();
  for (const option of options) {
    const name = option.name.trim().toLocaleLowerCase("en");
    assert(name.length > 0 && !names.has(name), "duplicate_or_empty_option_name");
    names.add(name);
    assert(option.values.length > 0, "empty_option_values");
    const values = option.values.map(value => value.trim().toLocaleLowerCase("en"));
    assert(values.every(Boolean) && new Set(values).size === values.length, "duplicate_or_empty_option_value");
  }
}

export function optionCombinationKey(
  options: CatalogOption[],
  values: Record<string, string>
): string {
  validateOptions(options);
  const expected = options.map(option => option.name.trim());
  assert(Object.keys(values).length === expected.length, "option_count_mismatch");
  const pairs = expected.map(name => {
    const value = values[name]?.trim();
    assert(value, "missing_option_value");
    const option = options.find(item => item.name.trim() === name);
    assert(option?.values.some(allowed => allowed.toLocaleLowerCase("en") === value.toLocaleLowerCase("en")), "unknown_option_value");
    return [name.toLocaleLowerCase("en"), value.toLocaleLowerCase("en")];
  });
  return JSON.stringify(pairs);
}

export function validatePublication(input: PublicationInput): void {
  assert(input.name.trim().length > 0, "missing_product_name");
  normalizeSlug(input.slug);
  validateOptions(input.options);
  assert(input.images.length >= 1 && input.images.length <= MAX_PRODUCT_IMAGES, "invalid_gallery_size");
  const imageIds = input.images.map(image => image.assetId);
  assert(imageIds.every(Boolean) && new Set(imageIds).size === imageIds.length, "invalid_gallery_images");
  assert(input.primaryImageAssetId && imageIds.includes(input.primaryImageAssetId), "invalid_primary_image");
  assert(input.variants.length >= 1, "missing_variant");
  const active = input.variants.filter(variant => variant.active);
  assert(active.length >= 1 && active.length <= MAX_ACTIVE_VARIANTS, "invalid_active_variant_count");
  const combinations = new Set<string>();
  const skus = new Set<string>();
  for (const variant of input.variants) {
    const key = optionCombinationKey(input.options, variant.optionValues);
    assert(!combinations.has(key), "duplicate_variant_combination");
    combinations.add(key);
    const sku = normalizeSku(variant.sku);
    if (sku) {
      assert(!skus.has(sku), "duplicate_sku");
      skus.add(sku);
    }
    const limit = variant.purchaseLimit ?? DEFAULT_PURCHASE_LIMIT;
    assert(Number.isSafeInteger(limit) && limit > 0, "invalid_purchase_limit");
    assert(Number.isSafeInteger(variant.priceMinor) && variant.priceMinor >= 0, "invalid_price");
    if (variant.active) assert(variant.priceMinor > 0, "active_variant_requires_positive_price");
    if (variant.imageAssetId) assert(imageIds.includes(variant.imageAssetId), "invalid_variant_image");
  }
}
