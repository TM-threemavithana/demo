export type RoomCategory = "single" | "double" | "suite" | "penthouse";

export type HotelRoom = {
  id: string;
  roomNumber: string;
  name: string;
  description: string;
  category: RoomCategory;
  pricePerNightLkr: number;
  maxGuests: number;
  amenities: string[];
  isAvailable: boolean; // Simple availability for now
  active: boolean;
};

export type RoomSearchFilters = {
  query?: string;
  category?: RoomCategory;
  maxPriceLkr?: number;
  minGuests?: number;
  availableOnly?: boolean;
  limit?: number;
};

export type RoomBookingRequest = {
  roomId: string;
  guestName: string;
  mobileNumber: string;
  nights: number;
};

export type RoomBookingResult = {
  success: boolean;
  message: string;
  bookingId?: string;
  totalPriceLkr?: number;
};

export type BookingRecord = {
  bookingId: string;
  roomId: string;
  guestName: string;
  mobileNumber: string;
  nights: number;
  totalPriceLkr: number;
  createdAt: string;
};
