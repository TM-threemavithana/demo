import assert from "node:assert/strict";
import test from "node:test";
import {
  compareProducts,
  getInventorySnapshot,
  getProduct,
  getProductCategories,
  listProducts,
  recommendProducts,
  searchProducts
} from "../src/services/product-service.js";

test("searches the active catalogue", () => {
  const result = searchProducts({ query: "cinnamon", inStockOnly: true });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "SP-001");
});

test("filters unavailable products", () => {
  const result = searchProducts({ query: "cardamom", inStockOnly: true });
  assert.equal(result.length, 0);
});

test("gets a product by SKU without case sensitivity", () => {
  assert.equal(getProduct("cin-cey-100")?.name, "Ceylon Cinnamon Quills");
});

test("lists compact products for catalogue discovery", () => {
  const result = listProducts({ limit: 3 });
  assert.equal(result.length, 3);
  assert.equal(result[0].id, "SP-001");
  assert.equal("description" in result[0], false);
});

test("summarizes categories", () => {
  const categories = getProductCategories();
  assert.ok(categories.some((category) => category.category === "whole" && category.productCount >= 1));
});

test("returns inventory snapshot", () => {
  const snapshot = getInventorySnapshot();
  assert.equal(snapshot.outOfStockProducts[0].id, "SP-004");
});

test("compares products by mixed IDs and SKUs", () => {
  const result = compareProducts(["SP-001", "PEP-BLK-200"]);
  assert.equal(result.found.length, 2);
  assert.equal(result.notFound.length, 0);
});

test("recommends products from natural language needs", () => {
  const result = recommendProducts({ need: "I need chilli for a spicy curry", inStockOnly: true });
  assert.equal(result[0].id, "SP-005");
});
