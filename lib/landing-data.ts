// Bilingual static content for the marketing landing-page sections.
// No business stats / mock vendors / fake activity — just the structural
// data (categories, how-it-works steps, FAQ, footer links, tour copy).

import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Film,
  Music,
  Guitar,
  Utensils,
  ChefHat,
  Mic,
  Wand2,
  Flower2,
  Scissors,
  Sparkles,
  Brush,
  Hand,
  Eye,
  Droplet,
  Search,
  CalendarCheck,
  CheckCheck,
} from "lucide-react";

// ─── Category grid ─────────────────────────────────────────────────────────
export type CategoryCard = {
  kind: string; // matches ProviderKind for ?kind= deep-link
  icon: LucideIcon;
  title: { az: string; ru: string };
  blurb: { az: string; ru: string };
  grad: string; // tailwind gradient classes
};

export const CATEGORY_CARDS: CategoryCard[] = [
  {
    kind: "photographer",
    icon: Camera,
    title: { az: "Fotoqraflar", ru: "Фотографы" },
    blurb: { az: "Toy, ailə, portfolio", ru: "Свадьба, семья, портфолио" },
    grad: "from-magenta-500 via-magenta-600 to-violet-700",
  },
  {
    kind: "videographer",
    icon: Film,
    title: { az: "Videooperatorlar", ru: "Видеооператоры" },
    blurb: { az: "Toy filmi, reels, after-movie", ru: "Свадебное видео, reels, after-movie" },
    grad: "from-violet-600 via-magenta-500 to-gold-500",
  },
  {
    kind: "dj",
    icon: Music,
    title: { az: "DJ-lər", ru: "DJ-и" },
    blurb: { az: "Tədbirlər, korporativlər", ru: "Мероприятия, корпоративы" },
    grad: "from-violet-500 via-violet-600 to-cyan-500",
  },
  {
    kind: "band",
    icon: Guitar,
    title: { az: "Canlı musiqi", ru: "Живая музыка" },
    blurb: { az: "Toy qrupları, caz, akustika", ru: "Свадебные группы, джаз, акустика" },
    grad: "from-magenta-600 via-violet-700 to-cyan-500",
  },
  {
    kind: "makeup",
    icon: Sparkles,
    title: { az: "Vizajistlər", ru: "Визажисты" },
    blurb: { az: "Toy, photo-shoot, gala", ru: "Свадьба, съёмка, гала" },
    grad: "from-magenta-500 via-magenta-400 to-gold-500",
  },
  {
    kind: "host",
    icon: Mic,
    title: { az: "Aparıcılar", ru: "Ведущие" },
    blurb: { az: "Toy, ad günü, gala", ru: "Свадьба, юбилеи, гала" },
    grad: "from-violet-700 via-violet-500 to-magenta-500",
  },
  {
    kind: "decorator",
    icon: Wand2,
    title: { az: "Dekoratorlar", ru: "Декораторы" },
    blurb: { az: "Tədbir dekoru, photo-zone, arka", ru: "Декор зала, фотозона, арка" },
    grad: "from-cyan-500 via-magenta-500 to-violet-700",
  },
  {
    kind: "florist",
    icon: Flower2,
    title: { az: "Floristlər", ru: "Флористы" },
    blurb: { az: "Buket, gəlin dəstəsi, kompozisiya", ru: "Букет, букет невесты, композиции" },
    grad: "from-gold-500 via-magenta-500 to-magenta-700",
  },
  {
    kind: "restaurant",
    icon: Utensils,
    title: { az: "Restoranlar", ru: "Рестораны" },
    blurb: { az: "Banket zalları, terraslar", ru: "Банкетные залы, террасы" },
    grad: "from-gold-500 via-magenta-500 to-violet-700",
  },
  {
    kind: "catering",
    icon: ChefHat,
    title: { az: "Keytering", ru: "Кейтеринг" },
    blurb: { az: "Açıq tədbir, ofis, evdə", ru: "Опен-эйр, офис, дом" },
    grad: "from-gold-500 via-gold-400 to-magenta-500",
  },
  {
    kind: "barber",
    icon: Scissors,
    title: { az: "Barberlər", ru: "Барберы" },
    blurb: { az: "Saç, saqqal, üz qulluğu", ru: "Стрижка, борода, уход" },
    grad: "from-cyan-500 via-violet-500 to-violet-700",
  },
  {
    kind: "salon",
    icon: Brush,
    title: { az: "Salonlar", ru: "Салоны" },
    blurb: { az: "Saç, qulluq, styling", ru: "Волосы, уход, укладка" },
    grad: "from-violet-700 via-magenta-600 to-magenta-500",
  },
  {
    kind: "nails",
    icon: Hand,
    title: { az: "Manikür ustaları", ru: "Маникюрные мастера" },
    blurb: { az: "Manikür, pedikür, naxış", ru: "Маникюр, педикюр, дизайн" },
    grad: "from-magenta-400 via-magenta-500 to-violet-600",
  },
  {
    kind: "brows",
    icon: Eye,
    title: { az: "Qaş və kirpik", ru: "Брови и ресницы" },
    blurb: { az: "Forma, laminasiya, uzatma", ru: "Форма, ламинация, наращивание" },
    grad: "from-violet-500 via-magenta-500 to-gold-500",
  },
  {
    kind: "cosmetologist",
    icon: Droplet,
    title: { az: "Kosmetoloqlar", ru: "Косметологи" },
    blurb: { az: "Üz qulluğu, peeling, anti-age", ru: "Уход за лицом, пилинг, anti-age" },
    grad: "from-cyan-500 via-violet-500 to-magenta-500",
  },
];

// ─── How it works ──────────────────────────────────────────────────────────
export type HowStep = {
  icon: LucideIcon;
  title: { az: string; ru: string };
  body: { az: string; ru: string };
  accent: "violet" | "magenta" | "cyan";
};

export const HOW_STEPS: HowStep[] = [
  {
    icon: Search,
    title: { az: "Axtar və müqayisə et", ru: "Найди и сравни" },
    body: {
      az: "Kateqoriyaya, qiymətə və rəyə görə filtrlə. Pulsuz vaxtları görəcəksən.",
      ru: "Фильтруй по категории, цене, рейтингу. Свободные слоты видны сразу.",
    },
    accent: "violet",
  },
  {
    icon: CalendarCheck,
    title: { az: "Anlıq rezerv et", ru: "Бронируй мгновенно" },
    body: {
      az: "Vaxt seç, xidmət əlavə et, təsdiqlə. Bir kliklə.",
      ru: "Выбери время, добавь услугу, подтверди. В один клик.",
    },
    accent: "magenta",
  },
  {
    icon: CheckCheck,
    title: { az: "Görüş və rəy yaz", ru: "Встретился — оставь отзыв" },
    body: {
      az: "Sonra reytinq qoy — komandanın gələcək seçimini formalaşdırırsan.",
      ru: "Поставь рейтинг — ты формируешь выбор будущих клиентов.",
    },
    accent: "cyan",
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────
export type FaqItem = {
  q: { az: string; ru: string };
  a: { az: string; ru: string };
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: { az: "Vaxt platforması necə işləyir?",
         ru: "Как работает платформа Vaxt?" },
    a: { az: "Müştəri kateqoriyaya görə icraçı tapır, vaxt seçir və rezerv edir. Sonra WhatsApp-da müsbət iş gedir. Komissiya almırıq.",
         ru: "Клиент находит исполнителя, выбирает время, бронирует. Дальше — WhatsApp. Комиссию мы не берём." },
  },
  {
    q: { az: "İcraçı olmaq üçün nə tələb olunur?",
         ru: "Что нужно, чтобы стать исполнителем?" },
    a: { az: "Qeydiyyat 2 dəqiqə çəkir: telefon, OTP, kateqoriya. Sonra profili tamamla — şəkillər, qiymətlər, iş saatları.",
         ru: "Регистрация за 2 минуты: телефон, OTP, категория. Затем заполни профиль — фото, цены, рабочее время." },
  },
  {
    q: { az: "Pulu necə alıram?",
         ru: "Как я получаю деньги?" },
    a: { az: "Birbaşa müştəridən. Platforma sövdələşməyə qarışmır — bu, sənin müştərinlədir.",
         ru: "Напрямую от клиента. Платформа не участвует в оплате — это твоя сделка." },
  },
  {
    q: { az: "Tender nədir?",
         ru: "Что такое тендер?" },
    a: { az: "Müştəri 'sifariş' açır (toy, korporativ və s.) — bütün uyğun icraçılar təklif verir. Müştəri ən yaxşısını seçir.",
         ru: "Клиент открывает запрос (свадьба, корпоратив и т.д.) — все подходящие исполнители подают ставки. Клиент выбирает лучшую." },
  },
  {
    q: { az: "Müştərini Vaxt qoruyur?",
         ru: "Защищает ли Vaxt клиента?" },
    a: { az: "Hər icraçı verifikasiyadan keçir — telefon və sənəd yoxlaması. Müştəri rəylərini yalnız real rezervdən sonra qoya bilər.",
         ru: "Каждый исполнитель проверяется — телефон + документ. Отзывы оставляют только после реальной брони." },
  },
  {
    q: { az: "Bakıdan kənar şəhərlər varmı?",
         ru: "Есть ли другие города кроме Баку?" },
    a: { az: "Bəli — Gəncə, Sumqayıt, Şəki, Mingəçevir, Qəbələ. Kataloqda şəhər filterindən istifadə et.",
         ru: "Да — Гянджа, Сумгаит, Шеки, Мингячевир, Габала. Фильтр городов в каталоге." },
  },
];

// ─── Footer ────────────────────────────────────────────────────────────────
export const FOOTER_LINKS = {
  categories: [
    { kind: "photographer",   label: { az: "Fotoqraflar",       ru: "Фотографы" } },
    { kind: "videographer",   label: { az: "Videooperatorlar",  ru: "Видеооператоры" } },
    { kind: "dj",             label: { az: "DJ-lər",            ru: "DJ-и" } },
    { kind: "band",           label: { az: "Canlı musiqi",      ru: "Живая музыка" } },
    { kind: "makeup",         label: { az: "Vizajistlər",       ru: "Визажисты" } },
    { kind: "host",           label: { az: "Aparıcılar",        ru: "Ведущие" } },
    { kind: "decorator",      label: { az: "Dekoratorlar",      ru: "Декораторы" } },
    { kind: "florist",        label: { az: "Floristlər",        ru: "Флористы" } },
    { kind: "restaurant",     label: { az: "Restoranlar",       ru: "Рестораны" } },
    { kind: "catering",       label: { az: "Keytering",         ru: "Кейтеринг" } },
    { kind: "barber",         label: { az: "Barberlər",         ru: "Барберы" } },
    { kind: "salon",          label: { az: "Salonlar",          ru: "Салоны" } },
    { kind: "nails",          label: { az: "Manikür ustaları",  ru: "Маникюр" } },
    { kind: "brows",          label: { az: "Qaş və kirpik",     ru: "Брови и ресницы" } },
    { kind: "cosmetologist",  label: { az: "Kosmetoloqlar",     ru: "Косметологи" } },
  ],
  cities: [
    { id: "baki",      label: { az: "Bakı",       ru: "Баку" } },
    { id: "gence",     label: { az: "Gəncə",      ru: "Гянджа" } },
    { id: "sumqayit",  label: { az: "Sumqayıt",   ru: "Сумгаит" } },
    { id: "seki",      label: { az: "Şəki",       ru: "Шеки" } },
    { id: "mingecevir",label: { az: "Mingəçevir", ru: "Мингячевир" } },
    { id: "qebele",    label: { az: "Qəbələ",     ru: "Габала" } },
  ],
  product: [
    { href: "/tenders",   label: { az: "Tenderlər",  ru: "Тендеры" } },
    { href: "/favorites", label: { az: "Sevimlilər", ru: "Избранное" } },
    { href: "/register",  label: { az: "İcraçı ol",  ru: "Стать исполнителем" } },
    { href: "/login",     label: { az: "Giriş",       ru: "Вход" } },
  ],
};

// ─── Onboarding tour steps (post-register, runs on /dashboard) ────────────
export type TourStepData = {
  selector: string;
  title: { az: string; ru: string };
  body: { az: string; ru: string };
  action?: "click" | "hover" | "type";
  cursorOffset?: { x: number; y: number };
};

export const POST_REGISTER_TOUR: TourStepData[] = [
  {
    selector: "[data-tour='profile-card']",
    title: { az: "Profilini hazırla", ru: "Заполни профиль" },
    body: {
      az: "Müştərilər ilk burada görürlər — şəkil, ad və qısa bio əlavə et.",
      ru: "Это первое, что видят клиенты — добавь фото, имя и краткое био.",
    },
    action: "click",
  },
  {
    selector: "[data-tour='availability']",
    title: { az: "İş vaxtlarını qur", ru: "Настрой рабочее время" },
    body: {
      az: "Hansı günlərdə işləyirsən? Saat neçəyə qədər? Sistem boş slotları avtomatik göstərir.",
      ru: "В какие дни ты работаешь? До скольки? Система автоматически покажет свободные слоты.",
    },
    action: "click",
  },
  {
    selector: "[data-tour='gallery']",
    title: { az: "Qalereya əlavə et", ru: "Добавь галерею" },
    body: {
      az: "8 ən yaxşı işini yüklə — bu sənin portfoliyondur. Müştəri burada qərar verir.",
      ru: "Загрузи 8 лучших работ — это твоё портфолио. Клиент решает именно здесь.",
    },
    action: "click",
  },
  {
    selector: "[data-tour='stats']",
    title: { az: "Statistikanı izlə", ru: "Следи за статистикой" },
    body: {
      az: "Bu həftə neçə rezerv? Ay ərzində qazanc? Hər şey real vaxtda yenilənir.",
      ru: "Сколько бронирований на этой неделе? Сколько заработано? Всё в реальном времени.",
    },
  },
];
