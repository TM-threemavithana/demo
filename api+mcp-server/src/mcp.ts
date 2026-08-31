import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  compareProducts,
  getInventorySnapshot,
  getProduct,
  getProductCategories,
  listProducts,
  recommendProducts,
  searchProducts
} from "./services/product-service.js";

const asToolResult = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }]
});

export function createSpiceMcpServer(): McpServer {
  const server = new McpServer({
    name: "ceylon-spice-business",
    version: "0.1.0"
  });

  server.registerTool(
    "list_spice_products",
    {
      title: "List spice products",
      description: "List available spice products in a compact form including product IDs, SKUs, names, categories, prices and stock. Use this first when you do not know exact product IDs.",
      inputSchema: {
        category: z.enum(["whole", "ground", "blend"]).optional(),
        inStockOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(50).default(20)
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async (options) => asToolResult({ products: listProducts(options) })
  );

  server.registerTool(
    "list_spice_categories",
    {
      title: "List spice categories",
      description: "Summarize catalogue categories with counts, price ranges and compact product lists. Use this to understand what kinds of products the business sells.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async () => asToolResult({ categories: getProductCategories() })
  );

  server.registerTool(
    "search_spice_products",
    {
      title: "Search spice products",
      description: "Search the live Ceylon Spice Company catalogue by words, category, price and stock. Use this instead of inventing product or price information.",
      inputSchema: {
        query: z.string().optional().describe("Words from a product name, description, SKU or origin"),
        category: z.enum(["whole", "ground", "blend"]).optional(),
        maxPriceLkr: z.number().nonnegative().optional(),
        inStockOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(20).default(5)
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async (filters) => asToolResult({ products: searchProducts(filters) })
  );

  server.registerTool(
    "get_spice_product",
    {
      title: "Get spice product",
      description: "Get authoritative product details and current price using a product ID or SKU.",
      inputSchema: {
        identifier: z.string().min(1).describe("Product ID such as SP-001 or SKU such as CIN-CEY-100")
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ identifier }) => {
      const product = getProduct(identifier);
      return asToolResult(product ? { found: true, product } : { found: false, identifier });
    }
  );

  server.registerTool(
    "compare_spice_products",
    {
      title: "Compare spice products",
      description: "Compare multiple spice products after discovering their IDs or SKUs. Returns price, package size, stock, origin and price per 100g.",
      inputSchema: {
        identifiers: z.array(z.string().min(1)).min(2).max(6).describe("Product IDs or SKUs to compare")
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ identifiers }) => asToolResult(compareProducts(identifiers))
  );

  server.registerTool(
    "recommend_spice_products",
    {
      title: "Recommend spice products",
      description: "Recommend catalogue products from a natural-language customer need, such as cooking use, flavour preference or budget. Use this when the customer has not named an exact product.",
      inputSchema: {
        need: z.string().min(1).describe("Customer need, recipe, preference or buying intent"),
        budgetLkr: z.number().nonnegative().optional(),
        inStockOnly: z.boolean().default(true),
        limit: z.number().int().min(1).max(10).default(3)
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async (input) => asToolResult({ recommendations: recommendProducts(input) })
  );

  server.registerTool(
    "get_spice_inventory_snapshot",
    {
      title: "Get spice inventory snapshot",
      description: "Get current stock overview, including out-of-stock and low-stock products. Use this before making availability-sensitive suggestions.",
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async () => asToolResult(getInventorySnapshot())
  );

  server.registerTool(
    "check_spice_stock",
    {
      title: "Check spice stock",
      description: "Check current sellable stock for one spice product using its product ID or SKU.",
      inputSchema: {
        identifier: z.string().min(1).describe("Product ID or SKU")
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ identifier }) => {
      const product = getProduct(identifier);
      if (!product) return asToolResult({ found: false, identifier });
      return asToolResult({
        found: true,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        inStock: product.stockQuantity > 0,
        stockQuantity: product.stockQuantity,
        checkedAt: new Date().toISOString()
      });
    }
  );

  return server;
}
