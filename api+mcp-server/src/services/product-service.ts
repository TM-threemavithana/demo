import { products } from "../data/products.js";
import type { ProductListOptions, ProductRecommendationInput, ProductSearch, SpiceProduct } from "../types.js";

const clampLimit = (limit: number | undefined, defaultLimit: number, maxLimit: number) =>
  Math.min(Math.max(limit ?? defaultLimit, 1), maxLimit);

const compactProduct = (product: SpiceProduct) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  category: product.category,
  priceLkr: product.priceLkr,
  packageGrams: product.packageGrams,
  stockQuantity: product.stockQuantity,
  inStock: product.stockQuantity > 0
});

export function searchProducts(filters: ProductSearch): SpiceProduct[] {
  const query = filters.query?.trim().toLowerCase();
  const limit = clampLimit(filters.limit, 5, 20);

  return products
    .filter((product) => product.active)
    .filter((product) => {
      if (!query) return true;
      return [product.name, product.description, product.origin, product.sku]
        .some((value) => value.toLowerCase().includes(query));
    })
    .filter((product) => !filters.category || product.category === filters.category)
    .filter((product) => filters.maxPriceLkr === undefined || product.priceLkr <= filters.maxPriceLkr)
    .filter((product) => !filters.inStockOnly || product.stockQuantity > 0)
    .slice(0, limit);
}

export function getProduct(identifier: string): SpiceProduct | undefined {
  const normalized = identifier.trim().toLowerCase();
  return products.find(
    (product) => product.active &&
      (product.id.toLowerCase() === normalized || product.sku.toLowerCase() === normalized)
  );
}

export function listProducts(options: ProductListOptions = {}) {
  const limit = clampLimit(options.limit, 20, 50);

  return products
    .filter((product) => options.includeInactive || product.active)
    .filter((product) => !options.category || product.category === options.category)
    .filter((product) => !options.inStockOnly || product.stockQuantity > 0)
    .slice(0, limit)
    .map(compactProduct);
}

export function getProductCategories() {
  const activeProducts = products.filter((product) => product.active);
  const categories = Array.from(new Set(activeProducts.map((product) => product.category)));

  return categories.map((category) => {
    const categoryProducts = activeProducts.filter((product) => product.category === category);
    const prices = categoryProducts.map((product) => product.priceLkr);

    return {
      category,
      productCount: categoryProducts.length,
      inStockCount: categoryProducts.filter((product) => product.stockQuantity > 0).length,
      minPriceLkr: Math.min(...prices),
      maxPriceLkr: Math.max(...prices),
      products: categoryProducts.map(compactProduct)
    };
  });
}

export function getInventorySnapshot() {
  const activeProducts = products.filter((product) => product.active);

  return {
    totalActiveProducts: activeProducts.length,
    inStockProducts: activeProducts.filter((product) => product.stockQuantity > 0).length,
    outOfStockProducts: activeProducts.filter((product) => product.stockQuantity <= 0).map(compactProduct),
    lowStockProducts: activeProducts
      .filter((product) => product.stockQuantity > 0 && product.stockQuantity <= 30)
      .map(compactProduct),
    checkedAt: new Date().toISOString()
  };
}

export function compareProducts(identifiers: string[]) {
  const uniqueIdentifiers = Array.from(new Set(identifiers.map((identifier) => identifier.trim()).filter(Boolean)));
  const found = uniqueIdentifiers
    .map((identifier) => getProduct(identifier))
    .filter((product): product is SpiceProduct => Boolean(product));
  const foundKeys = new Set(found.flatMap((product) => [product.id.toLowerCase(), product.sku.toLowerCase()]));
  const notFound = uniqueIdentifiers.filter((identifier) => !foundKeys.has(identifier.toLowerCase()));

  return {
    found: found.map((product) => ({
      ...compactProduct(product),
      description: product.description,
      origin: product.origin,
      pricePer100gLkr: Math.round((product.priceLkr / product.packageGrams) * 100)
    })),
    notFound
  };
}

export function recommendProducts(input: ProductRecommendationInput) {
  const need = input.need.trim().toLowerCase();
  const limit = clampLimit(input.limit, 3, 10);
  const words = need.split(/\W+/).filter((word) => word.length >= 3);

  const scored = products
    .filter((product) => product.active)
    .filter((product) => !input.inStockOnly || product.stockQuantity > 0)
    .filter((product) => input.budgetLkr === undefined || product.priceLkr <= input.budgetLkr)
    .map((product) => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.origin,
        product.sku
      ].join(" ").toLowerCase();
      const score = words.reduce((total, word) => total + (searchableText.includes(word) ? 1 : 0), 0);

      return {
        product,
        score
      };
    })
    .sort((left, right) => right.score - left.score || left.product.priceLkr - right.product.priceLkr)
    .slice(0, limit);

  return scored.map(({ product, score }) => ({
    ...compactProduct(product),
    description: product.description,
    origin: product.origin,
    matchScore: score,
    recommendationReason: score > 0
      ? "Matched words from the customer's need against product details."
      : "Included as a catalogue fallback because no stronger keyword match was found."
  }));
}
