export type ServiceCategory = "haircut" | "beard" | "coloring" | "styling";
export type PriceRange = "low" | "medium" | "high";
export type Role = "client" | "worker";

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  haircut: "Saç kəsimi",
  beard: "Saqqal",
  coloring: "Boyama",
  styling: "Stayl",
};

export const PRICE_LABELS: Record<PriceRange, string> = {
  low: "Sərfəli",
  medium: "Orta",
  high: "Premium",
};

export type Service = {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMin: number;
  price: number;
};

export type Stylist = {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  rating: number;
  reviewsCount: number;
  specialties: ServiceCategory[];
  priceRange: PriceRange;
  serviceIds: string[];
  workingHours: { start: string; end: string };
  breaks: { start: string; end: string }[];
  city: string;
};

export type Appointment = {
  id: string;
  stylistId: string;
  clientName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "upcoming" | "completed" | "cancelled";
};
