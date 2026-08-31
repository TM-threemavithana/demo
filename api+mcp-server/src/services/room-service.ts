import { mockRooms } from "../data/rooms.js";
import { HotelRoom, RoomSearchFilters, RoomBookingRequest, RoomBookingResult, BookingRecord } from "../types.js";
import crypto from "crypto";

// For persistence during the server run
let rooms: HotelRoom[] = [...mockRooms];
let bookings: BookingRecord[] = [];

// Concurrency control to prevent double booking/room crash
const bookingLocks = new Set<string>();

export function listRooms(options: {
  category?: HotelRoom["category"];
  availableOnly?: boolean;
  limit?: number;
}): Partial<HotelRoom>[] {
  let filtered = rooms.filter(r => r.active);

  if (options.category) {
    filtered = filtered.filter((r) => r.category === options.category);
  }
  if (options.availableOnly) {
    filtered = filtered.filter((r) => r.isAvailable);
  }

  // Return compact version
  return filtered.slice(0, options.limit || 20).map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    name: r.name,
    category: r.category,
    pricePerNightLkr: r.pricePerNightLkr,
    isAvailable: r.isAvailable,
  }));
}

export function searchRooms(filters: RoomSearchFilters): HotelRoom[] {
  let filtered = rooms.filter(r => r.active);

  if (filters.query) {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.amenities.some((a) => a.toLowerCase().includes(q))
    );
  }

  if (filters.category) {
    filtered = filtered.filter((r) => r.category === filters.category);
  }

  if (filters.maxPriceLkr !== undefined) {
    filtered = filtered.filter((r) => r.pricePerNightLkr <= filters.maxPriceLkr!);
  }

  if (filters.minGuests !== undefined) {
    filtered = filtered.filter((r) => r.maxGuests >= filters.minGuests!);
  }

  if (filters.availableOnly) {
    filtered = filtered.filter((r) => r.isAvailable);
  }

  return filtered.slice(0, filters.limit || 5);
}

export function getRoom(identifier: string): HotelRoom | undefined {
  return rooms.find((r) => r.id === identifier || r.roomNumber === identifier);
}

export function bookRoom(request: RoomBookingRequest): RoomBookingResult {
  const room = getRoom(request.roomId);
  
  if (!room) {
    return { success: false, message: "Room not found." };
  }
  
  // Prevent double booking via lock mechanism
  if (bookingLocks.has(room.id)) {
    return { success: false, message: "Room is currently being booked by someone else. Please try again." };
  }

  // Acquire lock
  bookingLocks.add(room.id);

  try {
    if (!room.isAvailable) {
      return { success: false, message: "Room is not available for booking." };
    }

    // Basic mock booking logic
    room.isAvailable = false;
    
    const totalPrice = room.pricePerNightLkr * request.nights;
    const bookingId = "BK-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    // Store the booking data in a proper structure
    const newBooking: BookingRecord = {
      bookingId,
      roomId: room.id,
      guestName: request.guestName,
      mobileNumber: request.mobileNumber,
      nights: request.nights,
      totalPriceLkr: totalPrice,
      createdAt: new Date().toISOString()
    };
    bookings.push(newBooking);
    console.log("New Booking Recorded:", newBooking);

    return {
      success: true,
      message: `Successfully booked room ${room.roomNumber} for ${request.guestName} (${request.mobileNumber}).`,
      bookingId,
      totalPriceLkr: totalPrice
    };
  } finally {
    // Release lock
    bookingLocks.delete(room.id);
  }
}

export function getBookings(): BookingRecord[] {
  return bookings;
}
