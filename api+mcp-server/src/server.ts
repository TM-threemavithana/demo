import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createSpiceMcpServer } from "./mcp.js";
import {
  bookRoom,
  getRoom,
  searchRooms,
  getBookings,
} from "./services/room-service.js";
import type { HotelRoom } from "./types.js";

const app = express();
app.use(express.json({ limit: "256kb" }));

// Manual CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.get("/", (_req, res) => {
  res.json({
    service: "Hotel Booking API and MCP Server",
    version: "0.1.0",
    endpoints: { health: "/health", rooms: "/api/rooms", mcp: "/mcp" }
  });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/rooms", (req, res) => {
  const category = req.query.category;
  const validCategory = category === "single" || category === "double" || category === "suite" || category === "penthouse"
    ? category as HotelRoom["category"]
    : undefined;
  const maxPrice = req.query.maxPriceLkr ? Number(req.query.maxPriceLkr) : undefined;
  const minGuests = req.query.minGuests ? Number(req.query.minGuests) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const result = searchRooms({
    query: typeof req.query.q === "string" ? req.query.q : undefined,
    category: validCategory,
    maxPriceLkr: Number.isFinite(maxPrice) ? maxPrice : undefined,
    minGuests: Number.isFinite(minGuests) ? minGuests : undefined,
    availableOnly: req.query.availableOnly === "true",
    limit: Number.isFinite(limit) ? limit : 20
  });
  res.json({ rooms: result, count: result.length });
});

app.post("/api/rooms/book", (req, res) => {
  const { roomId, guestName, mobileNumber, nights } = req.body;
  if (!roomId || !guestName || !mobileNumber || !nights) {
    return res.status(400).json({ detail: "Missing required booking details (roomId, guestName, mobileNumber, nights)" });
  }

  const result = bookRoom({ roomId, guestName, mobileNumber, nights });
  if (!result.success) {
    return res.status(400).json(result);
  }
  return res.json(result);
});

app.get("/api/rooms/:identifier", (req, res) => {
  const room = getRoom(req.params.identifier);
  if (!room) return res.status(404).json({ detail: "Room not found" });
  return res.json(room);
});

app.get("/api/bookings", (req, res) => {
  return res.json(getBookings());
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
  console.log(`Hotel Booking API: http://${host}:${port}/api/rooms`);
  console.log(`Hotel Booking MCP: http://${host}:${port}/mcp`);
});
