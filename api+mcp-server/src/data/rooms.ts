import { HotelRoom } from "../types.js";

export const mockRooms: HotelRoom[] = [
  {
    id: "RM-101",
    roomNumber: "101",
    name: "Standard Single",
    description: "A cozy and compact room perfect for solo travelers, featuring a twin bed, work desk, and city view.",
    category: "single",
    pricePerNightLkr: 15000,
    maxGuests: 1,
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV", "Tea/Coffee Maker"],
    isAvailable: true,
    active: true
  },
  {
    id: "RM-102",
    roomNumber: "102",
    name: "Standard Double",
    description: "Comfortable double room with a queen-size bed, ideal for couples or friends.",
    category: "double",
    pricePerNightLkr: 22000,
    maxGuests: 2,
    amenities: ["Free Wi-Fi", "Air Conditioning", "Flat-screen TV", "Mini Fridge"],
    isAvailable: true,
    active: true
  },
  {
    id: "RM-201",
    roomNumber: "201",
    name: "Ocean View Suite",
    description: "Spacious suite offering stunning ocean views, a king-size bed, and a separate living area.",
    category: "suite",
    pricePerNightLkr: 45000,
    maxGuests: 3,
    amenities: ["Free Wi-Fi", "Air Conditioning", "Smart TV", "Mini Bar", "Ocean View", "Bathtub"],
    isAvailable: true,
    active: true
  },
  {
    id: "RM-301",
    roomNumber: "301",
    name: "The Royal Penthouse",
    description: "The ultimate luxury experience. The penthouse features panoramic views, multiple bedrooms, and exclusive services.",
    category: "penthouse",
    pricePerNightLkr: 120000,
    maxGuests: 4,
    amenities: ["Free Wi-Fi", "Private Pool", "Butler Service", "Full Kitchen", "Home Theater"],
    isAvailable: true,
    active: true
  },
  {
    id: "RM-105",
    roomNumber: "105",
    name: "Economy Single",
    description: "Budget-friendly option for solo travelers on a short stay.",
    category: "single",
    pricePerNightLkr: 10000,
    maxGuests: 1,
    amenities: ["Free Wi-Fi", "Fan", "Shared Bathroom"],
    isAvailable: false, // Currently booked or under maintenance
    active: true
  },
];
