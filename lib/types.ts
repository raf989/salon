export type ServiceCategory =
  | "haircut"
  | "beard"
  | "coloring"
  | "styling"
  | "shoot"
  | "djset"
  | "banquet"
  | "host";
export type PriceRange = "low" | "medium" | "high";
export type Role = "client" | "worker";
export type Lang = "az" | "ru";
export type Localized = { az: string; ru: string };

export type ProviderKind =
  | "photographer"
  | "dj"
  | "restaurant"
  | "host"
  | "barber"
  | "salon"
  | "makeup";

export type ProviderTier = "event" | "beauty";

export const PROVIDER_TIER_OF: Record<ProviderKind, ProviderTier> = {
  photographer: "event",
  dj: "event",
  restaurant: "event",
  host: "event",
  barber: "beauty",
  salon: "beauty",
  makeup: "beauty",
};

export const KIND_LABELS: Record<ProviderKind, Localized> = {
  photographer: { az: "Fotoqraf", ru: "Фотограф" },
  dj: { az: "DJ", ru: "DJ" },
  restaurant: { az: "Restoran", ru: "Ресторан" },
  host: { az: "Aparıcı", ru: "Ведущий" },
  barber: { az: "Barber", ru: "Барбер" },
  salon: { az: "Salon", ru: "Салон" },
  makeup: { az: "Vizajist", ru: "Визажист" },
};

export const KIND_PLURAL: Record<ProviderKind, Localized> = {
  photographer: { az: "Fotoqraflar", ru: "Фотографы" },
  dj: { az: "DJ-lər və aparıcılar", ru: "DJ и ведущие" },
  restaurant: { az: "Restoranlar", ru: "Рестораны" },
  host: { az: "Aparıcılar", ru: "Ведущие" },
  barber: { az: "Barberlər və salonlar", ru: "Барберы и салоны" },
  salon: { az: "Salonlar", ru: "Салоны" },
  makeup: { az: "Vizajistlər", ru: "Визажисты" },
};

export const CATEGORY_LABELS: Record<ServiceCategory, Localized> = {
  haircut: { az: "Saç kəsimi", ru: "Стрижка" },
  beard: { az: "Saqqal", ru: "Борода" },
  coloring: { az: "Boyama", ru: "Окрашивание" },
  styling: { az: "Stayl", ru: "Укладка" },
  shoot: { az: "Çəkiliş", ru: "Съёмка" },
  djset: { az: "DJ-set", ru: "DJ-сет" },
  banquet: { az: "Banket", ru: "Банкет" },
  host: { az: "Aparıcı xidməti", ru: "Ведущий" },
};

export const PRICE_LABELS: Record<PriceRange, Localized> = {
  low: { az: "Sərfəli", ru: "Доступно" },
  medium: { az: "Orta", ru: "Средне" },
  high: { az: "Premium", ru: "Премиум" },
};

export type Service = {
  id: string;
  name: Localized;
  category: ServiceCategory;
  durationMin: number;
  price: number;
};

export type Stylist = {
  id: string;
  name: string;
  bio: Localized;
  rating: number;
  reviewsCount: number;
  specialties: ServiceCategory[];
  priceRange: PriceRange;
  serviceIds: string[];
  workingHours: { start: string; end: string };
  breaks: { start: string; end: string }[];
  city: Localized;
  kind: ProviderKind;
  tier: ProviderTier;
  priceUnit?: Localized;
  responseMins?: number;
  experienceYears?: number;
  district?: Localized;
  gallery?: string[];
  /** Optional photo URL or data URL replacing the gradient avatar. */
  avatar?: string;
  verified?: boolean;
};

export type Provider = Stylist;

export type Appointment = {
  id: string;
  stylistId: string;
  clientName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "upcoming" | "completed" | "cancelled";
};

export type TenderBidBadge =
  | "verified"
  | "topEvent"
  | "fastResponse"
  | "rating";

export type TenderBid = {
  id: string;
  providerId: string;
  providerName: string;
  price: number;
  note: Localized;
  badges: TenderBidBadge[];
  rating?: number;
};

export type UserRole = "client" | "provider";

export type AuthUser = {
  id: string;
  phone: string; // normalized E.164: "+994501234567"
  name: string;
  password: string; // PROTOTYPE: plain text. NEVER do this in prod.
  role: UserRole;
  email?: string; // providers only
  kind?: ProviderKind; // providers only
  verified: boolean;
  createdAt: string; // ISO
};

export type Tender = {
  id: string;
  tier: ProviderTier;
  kind: ProviderKind;
  title: Localized;
  description: Localized;
  budgetMin: number;
  budgetMax: number;
  deadline: string; // YYYY-MM-DD
  openedAt: string; // YYYY-MM-DD
  tags: Localized[];
  bidsCount: number;
  bids: TenderBid[];
  authorName: string;
  district: Localized;
};

export type Review = {
  id: string;
  providerId: string;
  authorName: string;
  rating: number; // 1..5
  text: Localized;
  createdAt: string; // ISO
};

export type ProviderEditPatch = {
  bio?: Localized;
  district?: Localized;
  experienceYears?: number;
  gallery?: string[];
  avatar?: string;
};

export type ProviderFilters = {
  cityId?: string;
  kind?: ProviderKind;
  tier?: ProviderTier;
  category?: ServiceCategory;
  priceRange?: PriceRange;
  minRating?: number;
};

export type CreateAppointmentInput = Omit<Appointment, "id" | "status"> & {
  status?: Appointment["status"];
};

export type CreateTenderInput = Omit<Tender, "id" | "openedAt" | "bidsCount" | "bids">;

export type CreateBidInput = Omit<TenderBid, "id">;

export type CreateReviewInput = {
  authorName: string;
  rating: number;
  text: Localized;
};
