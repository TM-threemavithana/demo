import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  bookRoom,
  getRoom,
  listRooms,
  searchRooms,
} from "./services/room-service.js";

const asToolResult = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }]
});

export function createSpiceMcpServer(): McpServer {
  const server = new McpServer({
    name: "hotel-booking-service",
    version: "0.1.0"
  });

  server.registerTool(
    "list_hotel_rooms",
    {
      title: "List hotel rooms",
      description: "List available hotel rooms in a compact form including IDs, room numbers, names, categories, and prices.",
      inputSchema: {
        category: z.enum(["single", "double", "suite", "penthouse"]).optional(),
        availableOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(50).default(20)
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async (options) => asToolResult({ rooms: listRooms(options) })
  );

  server.registerTool(
    "search_hotel_rooms",
    {
      title: "Search hotel rooms",
      description: "Search hotel rooms by words, category, price, and number of guests.",
      inputSchema: {
        query: z.string().optional().describe("Words from a room name, description, or amenities"),
        category: z.enum(["single", "double", "suite", "penthouse"]).optional(),
        maxPriceLkr: z.number().nonnegative().optional(),
        minGuests: z.number().int().min(1).optional(),
        availableOnly: z.boolean().default(false),
        limit: z.number().int().min(1).max(20).default(5)
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async (filters) => asToolResult({ rooms: searchRooms(filters) })
  );

  server.registerTool(
    "get_room_details",
    {
      title: "Get room details",
      description: "Get authoritative room details and current price using a room ID or room number.",
      inputSchema: {
        identifier: z.string().min(1).describe("Room ID such as RM-101 or Room Number such as 101")
      },
      annotations: { readOnlyHint: true, openWorldHint: false }
    },
    async ({ identifier }) => {
      const room = getRoom(identifier);
      return asToolResult(room ? { found: true, room } : { found: false, identifier });
    }
  );

  server.registerTool(
    "book_hotel_room",
    {
      title: "Book hotel room",
      description: "Book a hotel room for a guest for a certain number of nights.",
      inputSchema: {
        roomId: z.string().min(1).describe("Room ID such as RM-101"),
        guestName: z.string().min(1).describe("Name of the guest booking the room"),
        mobileNumber: z.string().min(1).describe("Mobile phone number of the guest"),
        nights: z.number().int().min(1).describe("Number of nights to stay")
      },
      annotations: { readOnlyHint: false, openWorldHint: false }
    },
    async (request) => asToolResult(bookRoom(request))
  );

  return server;
}
