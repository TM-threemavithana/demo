import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createSpiceMcpServer } from "./mcp.js";
import {
  compareProducts,
  getInventorySnapshot,
  getProduct,
  getProductCategories,
  recommendProducts,
  searchProducts
} from "./services/product-service.js";
import type { SpiceProduct } from "./types.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "Ceylon Spice Company API and MCP Server",
    version: "0.1.0",
    endpoints: { health: "/health", products: "/api/products", mcp: "/mcp" }
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/products", (req, res) => {
  const category = req.query.category;
  const validCategory = category === "whole" || category === "ground" || category === "blend"
    ? category as SpiceProduct["category"]
    : undefined;
  const maxPrice = req.query.maxPriceLkr ? Number(req.query.maxPriceLkr) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const result = searchProducts({
    query: typeof req.query.q === "string" ? req.query.q : undefined,
    category: validCategory,
    maxPriceLkr: Number.isFinite(maxPrice) ? maxPrice : undefined,
    inStockOnly: req.query.inStockOnly === "true",
    limit: Number.isFinite(limit) ? limit : 20
  });
  res.json({ products: result, count: result.length });
});

app.get("/api/categories", (_req, res) => {
  res.json({ categories: getProductCategories() });
});

app.get("/api/inventory", (_req, res) => {
  res.json(getInventorySnapshot());
});

app.get("/api/products/compare", (req, res) => {
  const identifiers = typeof req.query.identifiers === "string"
    ? req.query.identifiers.split(",")
    : [];

  if (identifiers.length < 2) {
    return res.status(400).json({ detail: "Provide at least two comma-separated product IDs or SKUs" });
  }

  return res.json(compareProducts(identifiers));
});

app.get("/api/products/recommend", (req, res) => {
  const budget = req.query.budgetLkr ? Number(req.query.budgetLkr) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  if (typeof req.query.need !== "string" || !req.query.need.trim()) {
    return res.status(400).json({ detail: "Query parameter 'need' is required" });
  }

  return res.json({
    recommendations: recommendProducts({
      need: req.query.need,
      budgetLkr: Number.isFinite(budget) ? budget : undefined,
      inStockOnly: req.query.inStockOnly !== "false",
      limit: Number.isFinite(limit) ? limit : undefined
    })
  });
});

app.get("/api/products/:identifier", (req, res) => {
  const product = getProduct(req.params.identifier);
  if (!product) return res.status(404).json({ detail: "Product not found" });
  return res.json(product);
});

app.post("/mcp", async (req: Request, res: Response) => {
  const server = createSpiceMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) res.status(500).json({ detail: "MCP request failed" });
  }
});

app.get("/mcp", (_req, res) => res.status(405).json({ detail: "Use POST for MCP requests" }));
app.delete("/mcp", (_req, res) => res.status(405).json({ detail: "Stateless MCP sessions cannot be deleted" }));

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "127.0.0.1";

app.listen(port, host, () => {
  console.log(`Ceylon Spice API: http://${host}:${port}/api/products`);
  console.log(`Ceylon Spice MCP: http://${host}:${port}/mcp`);
});
