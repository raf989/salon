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
  slug: string;
  /**
   * Firebase UID of the owner. Set when a provider self-registers; NULL on
   * legacy/seed rows (admin-managed). The dashboard resolves "me" by
   * matching this against the signed-in user.
   */
  authUserId?: string;
  name: string;
  bio: Localized;
  rating: number;
  reviewsCount: number;
  specialties: ServiceCategory[];
  priceRange: PriceRange;
  serviceIds: string[];
  workingHours: { start: string; end: string };
  breaks: { start: string; end: string }[];
  /**
   * Weekday indices (0=Sunday..6=Saturday) the provider is active on.
   * `undefined` means "all days active" — backwards-compatible with rows that
   * pre-date the column.
   */
  activeDays?: number[];
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
  /** Contact channels — surfaced on the dashboard only when present. */
  phones?: string[]; // up to 3
  whatsapp?: string;
  telegram?: string;
  tiktok?: string;
  instagram?: string;
  /**
   * Manual availability override. `"closed"` forces status to red, `"break"`
   * forces orange, regardless of working hours; `undefined` means status
   * follows the time-based logic.
   */
  manualStatus?: "open" | "closed" | "break";
};

export type Provider = Stylist;

export type Appointment = {
  id: string;
  stylistId: string;
  clientName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: "upcoming" | "completed" | "cancelled" | "no_show";
};

export type TenderBidBadge =
  | "verified"
  | "topEvent"
  | "fastResponse"
  | "rating";

export type TenderBidStatus = "pending" | "accepted" | "rejected";

export type TenderBid = {
  id: string;
  providerId: string;
  /** Auth user (localStorage) who submitted this bid. Separate from
   *  providerId, which is the FK to the `providers` table. */
  authorUserId?: string;
  providerName: string;
  /** Optional avatar URL captured at submit time so the bid card can show
   *  a real photo instead of the gradient placeholder. */
  providerAvatar?: string;
  price: number;
  note: Localized;
  badges: TenderBidBadge[];
  rating?: number;
  /** Lifecycle: missing / undefined collapses to "pending" at the display
   *  surface. DB-backed bids always have a value (column has a `default`).
   *  Mock-data seeded bids omit the field. */
  status?: TenderBidStatus;
};

export type UserRole = "client" | "provider";

// User profile. `id` is the Firebase UID (from the JWT `sub` claim) — same
// value returned by `auth.uid()` in Supabase RLS, so callers can use it as
// the foreign key on `providers.auth_user_id`, `tenders.auth_user_id`, etc.
//
// Phone Auth manages the credential (phone + OTP) and verified-status; we
// don't store either here. Profile fields (name, role, email, kind) are
// collected during registration and persisted to localStorage keyed by uid.
export type AuthUser = {
  id: string; // Firebase UID
  phone: string; // E.164: "+994501234567"
  name: string;
  role: UserRole;
  email?: string; // providers only
  kind?: ProviderKind; // providers only
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
  deadline: string; // YYYY-MM-DD — last day bids can be submitted
  openedAt: string; // YYYY-MM-DD
  /** When the service should actually be performed. */
  eventDate?: string; // YYYY-MM-DD
  eventTime?: string; // HH:MM (optional within the day)
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
  name?: string;
  bio?: Localized;
  city?: Localized;
  district?: Localized;
  experienceYears?: number;
  gallery?: string[];
  avatar?: string;
  workingHours?: { start: string; end: string };
  breaks?: { start: string; end: string }[];
  // `null` means "explicitly clear" (treat as all days active), `undefined`
  // means "don't touch".
  activeDays?: number[] | null;
  // Socials: `null` means "explicitly clear", `undefined` means "don't touch".
  phones?: string[];
  whatsapp?: string | null;
  telegram?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  manualStatus?: "open" | "closed" | "break" | null;
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
  /** Firebase UID of the logged-in client; optional for guest bookings.
   *  Required to claim/cancel the booking later when RLS tightens (011). */
  authUserId?: string;
};

export type CreateTenderInput = Omit<
  Tender,
  "id" | "openedAt" | "bidsCount" | "bids"
> & {
  /** Firebase UID of the author. Required under migration 011; nullable
   *  for legacy seed data only. */
  authUserId: string;
};

// Status is already optional on TenderBid (the DB column has
// `default 'pending'`), so `Omit<… , "id">` is fine.
export type CreateBidInput = Omit<TenderBid, "id">;

export type CreateReviewInput = {
  authorName: string;
  rating: number;
  text: Localized;
  /** Firebase UID of the reviewer — required under migration 011. */
  authUserId: string;
};
