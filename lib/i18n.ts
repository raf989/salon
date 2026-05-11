"use client";

import { useStore } from "./store";
import type { Localized } from "./types";

export const DICT = {
  // brand
  "brand.name": { az: "Vaxt", ru: "Vaxt" },
  "brand.homeAria": { az: "Vaxt ana səhifə", ru: "Vaxt — на главную" },

  // header
  "nav.explore": { az: "Kəşf et", ru: "Каталог" },
  "nav.dashboard": { az: "Panel", ru: "Панель" },
  "header.city": { az: "Bakı", ru: "Баку" },
  "role.client": { az: "Müştəri", ru: "Клиент" },
  "role.worker": { az: "Usta", ru: "Мастер" },

  // header / nav (Vaxt structure)
  "nav.catalog": { az: "Kataloq", ru: "Каталог" },
  "nav.tenders": { az: "Tenderlər", ru: "Тендеры" },
  "nav.urgent": { az: "Yaxınlıqda təcili", ru: "Срочно рядом" },
  "nav.becomeProvider": { az: "Icraçı ol", ru: "Стать исполнителем" },
  "nav.login": { az: "Giriş", ru: "Вход" },
  "nav.createListing": { az: "+ Elan", ru: "+ Объявление" },

  // hero
  "hero.eyebrow": {
    az: "Event və Beauty · Azərbaycan",
    ru: "Event и Beauty · Азербайджан",
  },
  "hero.title.before": {
    az: "Şəhərin ən yaxşı icraçılarını,",
    ru: "Найди исполнителя,",
  },
  "hero.title.emphasis": {
    az: "axşam başlamamış tap.",
    ru: "пока вечер ещё не начался.",
  },
  "hero.title.after": { az: "", ru: "" },
  "hero.subline": {
    az: "Fotoqraflar, DJ-lər, restoranlar, barberlər və salonlar. Bir klik — və birbaşa WhatsApp-da yazırsan.",
    ru: "Фотографы, диджеи, рестораны, барберы и салоны. Один клик — и ты пишешь напрямую в WhatsApp.",
  },
  "hero.searchPlaceholder": {
    az: "Kimi axtarırıq? Fotoqraf, DJ, restoran…",
    ru: "Кого ищем? Фотограф, DJ, ресторан…",
  },
  "hero.chip.todayFree": { az: "Bu gün boş", ru: "Свободны сегодня" },
  "hero.chip.haircut": { az: "Saç kəsimi", ru: "Стрижка" },
  "hero.chip.coloring": { az: "Boyama", ru: "Окрашивание" },
  "hero.chip.beard": { az: "Saqqal", ru: "Борода" },
  "hero.chip.rating": { az: "4.0+ reytinq", ru: "Рейтинг 4.0+" },
  "hero.chip.urgentToday": { az: "Bu gün təcili", ru: "Срочно сегодня" },
  "hero.chip.weddingTurnkey": { az: "Toy açar təslimi", ru: "Свадьба под ключ" },
  "hero.chip.barberHome": { az: "Evdə barber", ru: "Барбер на дом" },
  "hero.chip.corporate": { az: "Korporativ", ru: "Корпоратив" },
  "hero.chip.kidsParty": { az: "Uşaq bayramı", ru: "Детский праздник" },
  "hero.stats.usta": { az: "usta", ru: "мастер(ов)" },
  "hero.stats.xidmət": { az: "xidmət", ru: "услуг" },
  "hero.stats.rating": { az: "orta reytinq", ru: "средний рейтинг" },

  // filters
  "filters.searchPlaceholder": {
    az: "Stilist və ya xidmət axtar…",
    ru: "Поиск стилиста или услуги…",
  },
  "filters.search.aria": { az: "Axtarış", ru: "Поиск" },
  "filters.search.button": { az: "Axtar", ru: "Найти" },
  "filters.label.category": { az: "Kateqoriya", ru: "Категория" },
  "filters.label.price": { az: "Qiymət", ru: "Цена" },
  "filters.label.time": { az: "Vaxt", ru: "Время" },
  "filters.label.rating": { az: "Reytinq", ru: "Рейтинг" },
  "filters.option.all": { az: "Hamısı", ru: "Все" },
  "filters.option.anyPrice": { az: "İstənilən qiymət", ru: "Любая цена" },
  "filters.option.anyTime": { az: "İstənilən vaxt", ru: "Любое время" },
  "filters.option.today": { az: "Bu gün", ru: "Сегодня" },
  "filters.option.week": { az: "Bu həftə", ru: "На неделе" },
  "filters.option.rating4": { az: "4.0+ reytinq", ru: "Рейтинг 4.0+" },
  "filters.reset": { az: "Filtrləri sıfırla", ru: "Сбросить фильтры" },

  // results meta
  "results.foundIn": { az: "Bakı şəhərində", ru: "В Баку" },
  "results.foundCount": { az: "usta tapıldı", ru: "мастеров найдено" },
  "results.sort.recommended": { az: "Tövsiyə", ru: "Рекомендуем" },
  "results.sort.rating": { az: "Reytinqə görə", ru: "По рейтингу" },
  "results.sort.nearest": { az: "Ən yaxındakı", ru: "Ближайшие" },
  "results.sort.cheapest": { az: "Ən sərfəli", ru: "Подешевле" },
  "results.empty": {
    az: "Heç bir nəticə tapılmadı. Filtrləri dəyişməyi sınayın.",
    ru: "Ничего не найдено. Попробуйте изменить фильтры.",
  },

  // stylist card
  "card.beauty": { az: "Beauty", ru: "Beauty" },
  "card.todayFree": { az: "Bu gün boş", ru: "Свободен сегодня" },
  "card.priceFrom": { az: "-dən", ru: " и выше" },
  "card.reviews": { az: "rəy", ru: "отзыв(ов)" },
  "card.profile": { az: "Profil", ru: "Профиль" },
  "card.book": { az: "Bron et", ru: "Забронировать" },
  "card.favorite.aria": {
    az: "Sevimlilərə əlavə et",
    ru: "Добавить в избранное",
  },

  // booking modal
  "booking.title": { az: "Görüş təyin et", ru: "Запись на приём" },
  "booking.serviceLabel": { az: "Xidmət", ru: "Услуга" },
  "booking.dateLabel": { az: "Tarix", ru: "Дата" },
  "booking.timeLabel": { az: "Vaxt", ru: "Время" },
  "booking.nameLabel": { az: "Adınız", ru: "Ваше имя" },
  "booking.namePlaceholder": {
    az: "Adınızı daxil edin",
    ru: "Введите ваше имя",
  },
  "booking.nameAria": { az: "Müştəri adı", ru: "Имя клиента" },
  "booking.confirm": { az: "Bronu təsdiqlə", ru: "Подтвердить бронь" },
  "booking.confirming": { az: "Təsdiqlənir…", ru: "Подтверждаем…" },
  "booking.minutes": { az: "dəq", ru: "мин" },
  "booking.today": { az: "bu gün", ru: "сегодня" },
  "booking.pickPrompt": {
    az: "Xidmət və vaxt seçin",
    ru: "Выберите услугу и время",
  },
  "booking.success.title": {
    az: "Görüşünüz təsdiqləndi",
    ru: "Запись подтверждена",
  },
  "booking.success.close": { az: "Bağla", ru: "Закрыть" },

  // time grid
  "time.legend.free": { az: "Boş", ru: "Свободно" },
  "time.legend.selected": { az: "Seçilib", ru: "Выбрано" },
  "time.legend.taken": { az: "Tutub", ru: "Занято" },
  "time.unavailableSuffix": {
    az: "(mövcud deyil)",
    ru: "(недоступно)",
  },
  "time.selectionSuffix": { az: "seçimi", ru: "— выбрать" },

  // dashboard
  "dash.eyebrowPanel": { az: "PANEL", ru: "ПАНЕЛЬ" },
  "dash.greeting": { az: "Salam", ru: "Привет" },
  "dash.openToday": { az: "Bu gün açıqdır", ru: "Сегодня открыт(а)" },
  "dash.stats.today": { az: "Bu gün görüşlər", ru: "Записей сегодня" },
  "dash.stats.week": { az: "Bu həftə", ru: "На этой неделе" },
  "dash.stats.completed": { az: "Tamamlanmış", ru: "Завершено" },
  "dash.stats.revenue": { az: "Gəlir (bu həftə)", ru: "Доход (за неделю)" },
  "dash.avail.title": { az: "Mövcudluq", ru: "Доступность" },
  "dash.avail.hours.title": { az: "İş saatları", ru: "Рабочие часы" },
  "dash.avail.hours.sub": {
    az: "Hər gün üçün başlama və bitirmə vaxtı",
    ru: "Время начала и окончания каждого дня",
  },
  "dash.avail.hours.start": { az: "Başlama", ru: "Начало" },
  "dash.avail.hours.end": { az: "Bitirmə", ru: "Окончание" },
  "dash.avail.days.title": { az: "Aktiv günlər", ru: "Активные дни" },
  "dash.avail.days.sub": {
    az: "Hansı günlər müraciət qəbul edirsiniz",
    ru: "В какие дни вы принимаете заявки",
  },
  "dash.avail.breaks.title": { az: "Fasilələr", ru: "Перерывы" },
  "dash.avail.breaks.sub": {
    az: "Nahar və qısa fasilələri əlavə edin",
    ru: "Добавьте обед и короткие перерывы",
  },
  "dash.avail.breaks.removeAria": {
    az: "fasiləsini sil",
    ru: "удалить перерыв",
  },
  "dash.avail.breaks.add": { az: "Əlavə et", ru: "Добавить" },
  "dash.avail.save": { az: "Yadda saxla", ru: "Сохранить" },
  "dash.avail.saved": { az: "Yeniləndi", ru: "Сохранено" },
  "dash.avail.edit": { az: "Redaktə et", ru: "Редактировать" },
  "dash.avail.cancelEdit": { az: "İmtina", ru: "Отмена" },
  "dash.avail.location.title": { az: "Məkan", ru: "Местоположение" },
  "dash.avail.location.sub": {
    az: "Şəhər və dəqiq adresinizi yazın",
    ru: "Укажите город и точный адрес",
  },
  "dash.avail.location.city.placeholder": {
    az: "Şəhər (məs. Bakı)",
    ru: "Город (напр. Баку)",
  },
  "dash.avail.location.address.placeholder": {
    az: "Adres (qəsəbə, küçə)",
    ru: "Адрес (район, улица)",
  },
  "dash.avail.confirm.title": {
    az: "Məlumatları dəyişməyə razısız?",
    ru: "Сохранить изменения?",
  },
  "dash.avail.confirm.body": {
    az: "Cədvəliniz və məkan məlumatınız yenilənəcək.",
    ru: "Ваш график и данные о местоположении будут обновлены.",
  },
  "dash.avail.confirm.no": { az: "Xeyr", ru: "Нет" },
  "dash.avail.confirm.yes": { az: "Yadda saxla", ru: "Сохранить" },
  "dash.appts.title": { az: "Görüşlərim", ru: "Мои записи" },
  "dash.appts.tab.upcoming": { az: "Gələcək", ru: "Предстоящие" },
  "dash.appts.tab.past": { az: "Keçmiş", ru: "Прошедшие" },
  "dash.appts.status.upcoming": { az: "Gözlənilir", ru: "Ожидается" },
  "dash.appts.status.late": { az: "Gecikir", ru: "Опаздывает" },
  "dash.appts.status.completed": { az: "Tamamlandı", ru: "Завершено" },
  "dash.appts.status.cancelled": { az: "Ləğv edildi", ru: "Отменено" },
  "dash.appts.status.noShow": { az: "Gəlmədi", ru: "Не пришёл" },
  "dash.appts.cancel": { az: "Ləğv et", ru: "Отменить" },
  "dash.appts.cancel.confirm.title": {
    az: "Görüşü ləğv et?",
    ru: "Отменить запись?",
  },
  "dash.appts.cancel.confirm.body": {
    az: "Bu görüşü ləğv etmək istədiyinizə əminsiniz? Müştəriyə bildiriş göndəriləcək.",
    ru: "Уверены, что хотите отменить эту запись? Клиенту будет отправлено уведомление.",
  },
  "dash.appts.cancel.confirm.no": { az: "İmtina", ru: "Отмена" },
  "dash.appts.cancel.confirm.yes": { az: "Bəli, ləğv et", ru: "Да, отменить" },
  "dash.appts.empty.title": {
    az: "Hələ görüş yoxdur",
    ru: "Записей пока нет",
  },
  "dash.appts.empty.sub": {
    az: "Yeni bronlar burada görünəcək",
    ru: "Новые бронирования появятся здесь",
  },

  // weekday short labels (index 0=Sun)
  "weekday.short.0": { az: "B", ru: "Вс" },
  "weekday.short.1": { az: "B.e.", ru: "Пн" },
  "weekday.short.2": { az: "Ç.a.", ru: "Вт" },
  "weekday.short.3": { az: "Ç.", ru: "Ср" },
  "weekday.short.4": { az: "C.a.", ru: "Чт" },
  "weekday.short.5": { az: "C.", ru: "Пт" },
  "weekday.short.6": { az: "Ş.", ru: "Сб" },

  // calendar
  "calendar.monthFormat": { az: "{month} {year}", ru: "{month} {year}" },
  "calendar.legend.free": { az: "Boş", ru: "Свободно" },
  "calendar.legend.busy": { az: "Tutub", ru: "Занято" },
  "calendar.legend.today": { az: "Bu gün", ru: "Сегодня" },

  // contact
  "contact.whatsapp": { az: "WhatsApp", ru: "WhatsApp" },
  "contact.telegram": { az: "Telegram", ru: "Telegram" },

  // month full names (Jan=0)
  "month.long.0": { az: "Yanvar", ru: "Январь" },
  "month.long.1": { az: "Fevral", ru: "Февраль" },
  "month.long.2": { az: "Mart", ru: "Март" },
  "month.long.3": { az: "Aprel", ru: "Апрель" },
  "month.long.4": { az: "May", ru: "Май" },
  "month.long.5": { az: "İyun", ru: "Июнь" },
  "month.long.6": { az: "İyul", ru: "Июль" },
  "month.long.7": { az: "Avqust", ru: "Август" },
  "month.long.8": { az: "Sentyabr", ru: "Сентябрь" },
  "month.long.9": { az: "Oktyabr", ru: "Октябрь" },
  "month.long.10": { az: "Noyabr", ru: "Ноябрь" },
  "month.long.11": { az: "Dekabr", ru: "Декабрь" },

  // weekday very short (calendar grid header; index 0=Sun)
  "weekday.veryshort.0": { az: "ba", ru: "вс" },
  "weekday.veryshort.1": { az: "be", ru: "пн" },
  "weekday.veryshort.2": { az: "ça", ru: "вт" },
  "weekday.veryshort.3": { az: "ç", ru: "ср" },
  "weekday.veryshort.4": { az: "ca", ru: "чт" },
  "weekday.veryshort.5": { az: "cm", ru: "пт" },
  "weekday.veryshort.6": { az: "şn", ru: "сб" },

  // sections
  "section.categories": { az: "Kateqoriyalar", ru: "Категории" },
  "section.freeToday": { az: "Bu gün boş", ru: "Свободны сегодня" },
  "section.allLink": { az: "Hamısı →", ru: "Все →" },
  "section.discoverDemand": { az: "Tələb analitikası", ru: "Аналитика спроса" },
  "section.about": { az: "Mənim haqqımda", ru: "О себе" },
  "section.priceList": { az: "Qiymət siyahısı", ru: "Прайс" },
  "section.reviews": { az: "Rəylər 2.0", ru: "Отзывы 2.0" },

  // tier badges
  "tier.event": { az: "Event", ru: "Event" },
  "tier.beauty": { az: "Beauty", ru: "Beauty" },

  // provider page
  "provider.verified": { az: "Doğrulandı", ru: "Проверенный" },
  "provider.freeToday": { az: "Bu gün boş", ru: "Свободна сегодня" },
  "provider.experienceYears": { az: "il təcrübə", ru: "лет опыта" },
  "provider.respondsIn": {
    az: "{n} dəq cavab verir",
    ru: "отвечает за {n} мин",
  },
  "provider.reviewsCount": { az: "{n} rəy", ru: "{n} отзывов" },
  "provider.reliability": { az: "etibarlılıq", ru: "надёжность" },
  "provider.priceFrom": { az: "minimum", ru: "от" },
  "provider.bookOn": {
    az: "{date} tarixində bron et",
    ru: "Забронировать {date}",
  },
  "provider.cancelFree": {
    az: "Ləğv 24 saat ərzində pulsuzdur",
    ru: "Отмена бесплатна за 24 часа",
  },
  "provider.savedToFavs": {
    az: "Seçilmişlərə əlavə edilib",
    ru: "Сохранили в избранное",
  },
  "provider.topQueries": { az: "Top sorğular", ru: "Топ-запросы" },
  "provider.responseSpeed": { az: "Cavab sürəti", ru: "Скорость ответа" },
  "provider.minutes": { az: "dəq", ru: "мин" },
  "provider.gallery": { az: "Qalereya", ru: "Галерея" },

  // card actions per kind
  "action.profile": { az: "Profilə bax", ru: "Посмотреть" },
  "action.book": { az: "Bron et", ru: "Забронировать" },
  "action.bookTable": { az: "Stol bron et", ru: "Забронировать стол" },
  "action.menu": { az: "Menyu", ru: "Меню" },
  "action.demoSet": { az: "Demo-set", ru: "Демо-сет" },
  "action.priceList": { az: "Qiymət", ru: "Прайс" },
  "action.bookNow": { az: "İndi qeydiyyatdan keç", ru: "Записаться сейчас" },
  "action.askInChat": { az: "Çatda soruş", ru: "Спросить в чате" },

  // card meta
  "meta.weddingPhotographer": {
    az: "Toy fotoqrafı",
    ru: "Свадебный фотограф",
  },
  "meta.weddingHost": { az: "Toy aparıcısı", ru: "Ведущий свадеб" },
  "meta.weddingsAndCorp": {
    az: "Toy · korporativ",
    ru: "Свадьбы · корпоративы",
  },
  "meta.banquetsUpTo": {
    az: "Banketlər · {n} qonağa qədər",
    ru: "Банкеты · до {n} гостей",
  },
  "meta.barberServices": {
    az: "Saç · saqqal · uşaq",
    ru: "Стрижка · борода · детская",
  },
  "meta.dancehall": { az: "Zal", ru: "Зал" },
  "meta.dishes": { az: "yemək", ru: "блюд" },
  "meta.menuOf": { az: "Menyu", ru: "Меню" },
  "meta.servicesCount": { az: "xidmət", ru: "услуг" },
  "meta.minPriceSuffix": { az: "minimum", ru: "от" },

  // common
  "common.city.baku": { az: "Bakı", ru: "Bakı" },
  "common.dot": { az: "·", ru: "·" },

  // crumbs
  "crumbs.catalog": { az: "Kataloq", ru: "Каталог" },

  // dashboard profile editor
  "dash.profile.goTo": { az: "Profili redaktə et", ru: "Перейти в профиль" },
  "dash.profile.title": { az: "Profili redaktə et", ru: "Редактировать профиль" },
  "dash.profile.subtitle": {
    az: "Bu məlumatlar müştərilərə göstəriləcək",
    ru: "Эта информация будет видна клиентам",
  },
  "dash.profile.back": { az: "Panelə qayıt", ru: "Назад в панель" },
  "dash.profile.section.bio.title": { az: "Mənim haqqımda", ru: "О себе" },
  "dash.profile.section.bio.sub": {
    az: "Hər iki dildə təsvir əlavə edin",
    ru: "Добавьте описание на обоих языках",
  },
  "dash.profile.section.district.title": { az: "Şəhər və rayon", ru: "Город и район" },
  "dash.profile.section.district.sub": {
    az: "Müştərilər sizi yerə görə tapır",
    ru: "Клиенты находят вас по местоположению",
  },
  "dash.profile.section.experience.title": { az: "Təcrübə", ru: "Опыт работы" },
  "dash.profile.section.experience.sub": {
    az: "Neçə ildir bu sahədəsiniz",
    ru: "Сколько лет вы в этой сфере",
  },
  "dash.profile.section.gallery.title": { az: "Şəkillər", ru: "Фотографии" },
  "dash.profile.section.gallery.sub": {
    az: "İşlərinizdən nümunələr — 8 şəklə qədər",
    ru: "Примеры ваших работ — до 8 фото",
  },
  "dash.profile.bio.placeholder": {
    az: "Özünüz və işiniz haqqında qısaca yazın…",
    ru: "Коротко расскажите о себе и своей работе…",
  },
  "dash.profile.lang.az": { az: "Azərbaycanca", ru: "На азербайджанском" },
  "dash.profile.lang.ru": { az: "Rusca", ru: "На русском" },
  "dash.profile.experience.years": { az: "il", ru: "лет" },
  "dash.profile.gallery.add": { az: "Şəkil əlavə et", ru: "Добавить фото" },
  "dash.profile.gallery.empty": {
    az: "Hələ şəkil yoxdur",
    ru: "Пока нет фотографий",
  },
  "dash.profile.gallery.remove": { az: "Sil", ru: "Удалить" },
  "dash.profile.gallery.limit": {
    az: "Maksimum 8 şəkil. Lokalda saxlanılır (prototip).",
    ru: "Максимум 8 фото. Хранятся локально (прото).",
  },
  "dash.profile.save": { az: "Yadda saxla", ru: "Сохранить" },
  "dash.profile.saved": { az: "Saxlanıldı", ru: "Сохранено" },

  // urgent page
  "urgent.title": { az: "Yaxınlıqda təcili", ru: "Срочно рядом" },
  "urgent.subtitle": {
    az: "Sənə yaxın olub, indi sərbəst olan icraçılar. Bir kliklə zəng et.",
    ru: "Исполнители рядом, готовые приехать прямо сейчас. Один клик — и звонок.",
  },
  "urgent.list.title": { az: "İndi sərbəst", ru: "Свободны прямо сейчас" },
  "urgent.list.nearby": { az: "{n} yaxınlıqda", ru: "{n} рядом" },
  "urgent.km": { az: "{n} km", ru: "{n} км" },
  "urgent.eta": { az: "ETA {n} dəq", ru: "ETA {n} мин" },
  "urgent.action.call": { az: "Zəng et", ru: "Вызвать" },
  "urgent.action.profile": { az: "Profil", ru: "Профиль" },
  "urgent.cluster": { az: "+{n} yaxınlıqda", ru: "+{n} рядом" },
  "urgent.empty": { az: "Yaxınlıqda heç kim yoxdur", ru: "Никого рядом" },
  "urgent.filters.kind": { az: "Peşə", ru: "Профессия" },
  "urgent.filters.distance": { az: "Məsafə", ru: "Расстояние" },
  "urgent.filters.budget": { az: "Büdcə", ru: "Бюджет" },
  "urgent.filters.km1": { az: "1 km-ə qədər", ru: "до 1 км" },
  "urgent.filters.km3": { az: "3 km-ə qədər", ru: "до 3 км" },
  "urgent.filters.km5": { az: "5 km-ə qədər", ru: "до 5 км" },
  "urgent.filters.kmAny": { az: "İstənilən", ru: "Любое" },
  "urgent.filters.budget50": { az: "50 ₼-ə qədər", ru: "до 50 ₼" },
  "urgent.filters.budget100": { az: "100 ₼-ə qədər", ru: "до 100 ₼" },
  "urgent.filters.budget200": { az: "200 ₼-ə qədər", ru: "до 200 ₼" },
  "urgent.filters.budgetAny": { az: "İstənilən qiymət", ru: "Любая цена" },

  // tenders page
  "tenders.title": { az: "Tender meydançası", ru: "Тендерная площадка" },
  "tenders.subtitle": {
    az: "Sifarişinizi qoyun — icraçılar özləri sizi tapsın və qiymət təklif etsin.",
    ru: "Опишите заказ — исполнители сами найдут вас и предложат цену.",
  },
  "tenders.create": { az: "Tender yarat", ru: "Создать тендер" },
  "tenders.howItWorks": { az: "Necə işləyir", ru: "Как это работает" },
  "tenders.featured": { az: "Aktual tender", ru: "Активный тендер" },
  "tenders.allTenders": { az: "Bütün tenderlər", ru: "Все тендеры" },
  "tenders.tenderBadge": { az: "Tender", ru: "Тендер" },
  "tenders.openedAgo": {
    az: "{n} dəq əvvəl açılıb",
    ru: "открыт {n} мин назад",
  },
  "tenders.bidsCount": { az: "{n} təklif", ru: "{n} ставки" },
  "tenders.budget": { az: "Büdcə", ru: "Бюджет" },
  "tenders.deadline": { az: "Son tarix", ru: "Дедлайн" },
  "tenders.author": { az: "Müştəri", ru: "Заказчик" },
  "tenders.bidPanel.title": {
    az: "İcraçı təklifləri",
    ru: "Ставки исполнителей",
  },
  "tenders.action.bid": { az: "Təklif göndər", ru: "Прислать ставку" },
  "tenders.action.save": { az: "Yadda saxla", ru: "Сохранить" },
  "tenders.action.viewAll": { az: "Hamısına bax", ru: "Все ставки" },
  "tenders.filters.all": { az: "Hamısı", ru: "Все" },
  "tenders.filters.event": { az: "Event", ru: "Event" },
  "tenders.filters.beauty": { az: "Beauty", ru: "Beauty" },
  "tenders.filters.mine": { az: "Mənim", ru: "Мои" },
  "tenders.empty": { az: "Hələ tender yoxdur.", ru: "Тендеров пока нет." },
  "tenders.bidBadge.verified": { az: "Doğrulandı", ru: "Проверенный" },
  "tenders.bidBadge.topEvent": { az: "Top Event", ru: "Топ Event" },
  "tenders.bidBadge.fastResponse": {
    az: "Tez cavab verir",
    ru: "Отвечает быстро",
  },
  "tenders.cta.title": { az: "Yeni sifariş?", ru: "Новый заказ?" },
  "tenders.cta.subtitle": {
    az: "Tələbinizi qısaca yazın — bir saat ərzində 5–7 təklif gələcək.",
    ru: "Опишите запрос в двух строках — за час придёт 5–7 предложений.",
  },
  "tenders.cta.button": { az: "Tender yarat", ru: "Создать тендер" },

  // month abbrev (Jan=0)
  "month.short.0": { az: "yan", ru: "янв" },
  "month.short.1": { az: "fev", ru: "фев" },
  "month.short.2": { az: "mar", ru: "мар" },
  "month.short.3": { az: "apr", ru: "апр" },
  "month.short.4": { az: "may", ru: "май" },
  "month.short.5": { az: "iyn", ru: "июн" },
  "month.short.6": { az: "iyl", ru: "июл" },
  "month.short.7": { az: "avq", ru: "авг" },
  "month.short.8": { az: "sen", ru: "сен" },
  "month.short.9": { az: "okt", ru: "окт" },
  "month.short.10": { az: "noy", ru: "ноя" },
  "month.short.11": { az: "dek", ru: "дек" },

  // auth — login
  "auth.login.title": { az: "Daxil ol", ru: "Вход" },
  "auth.login.subtitle": {
    az: "Hesabınızla daxil olun",
    ru: "Войдите в свой аккаунт",
  },
  "auth.login.phone": { az: "Telefon nömrəsi", ru: "Номер телефона" },
  "auth.login.password": { az: "Şifrə", ru: "Пароль" },
  "auth.login.submit": { az: "Daxil ol", ru: "Войти" },
  "auth.login.noAccount": { az: "Hesabınız yoxdur?", ru: "Нет аккаунта?" },
  "auth.login.signupLink": {
    az: "Qeydiyyatdan keç",
    ru: "Зарегистрироваться",
  },
  "auth.login.error.notFound": {
    az: "Bu nömrə ilə hesab yoxdur",
    ru: "Аккаунт с этим номером не найден",
  },
  "auth.login.error.wrongPassword": {
    az: "Şifrə yanlışdır",
    ru: "Неверный пароль",
  },
  "auth.login.error.notVerified": {
    az: "Nömrə təsdiqlənməyib. Yenidən qeydiyyatdan keçin.",
    ru: "Номер не подтверждён. Зарегистрируйтесь заново.",
  },

  // auth — register shell
  "auth.register.title": { az: "Qeydiyyat", ru: "Регистрация" },
  "auth.register.subtitle": {
    az: "Vaxt-da hesab yaradın",
    ru: "Создайте аккаунт на Vaxt",
  },
  "auth.register.haveAccount": {
    az: "Hesabınız var?",
    ru: "Уже есть аккаунт?",
  },
  "auth.register.loginLink": { az: "Daxil ol", ru: "Войти" },

  // auth — role picker
  "auth.register.role.title": { az: "Hesab növü", ru: "Тип аккаунта" },
  "auth.register.role.subtitle": {
    az: "Necə istifadə edəcəksiniz?",
    ru: "Как вы будете пользоваться?",
  },
  "auth.register.role.client.title": { az: "Müştəri", ru: "Клиент" },
  "auth.register.role.client.desc": {
    az: "İcraçı tap, görüş təyin et",
    ru: "Найти исполнителя, забронировать",
  },
  "auth.register.role.provider.title": { az: "İcraçı", ru: "Исполнитель" },
  "auth.register.role.provider.desc": {
    az: "Elan yerləşdir, sifariş qəbul et",
    ru: "Разместить объявление, принимать заказы",
  },
  "auth.register.role.continue": { az: "Davam et", ru: "Продолжить" },
  "auth.register.back": { az: "Geri", ru: "Назад" },

  // auth — register form fields
  "auth.register.field.name": { az: "Ad", ru: "Имя" },
  "auth.register.field.namePlaceholder": {
    az: "Adınızı daxil edin",
    ru: "Введите ваше имя",
  },
  "auth.register.field.phone": { az: "Telefon nömrəsi", ru: "Номер телефона" },
  "auth.register.field.phonePlaceholder": {
    az: "+994 50 123 45 67",
    ru: "+994 50 123 45 67",
  },
  "auth.register.field.password": { az: "Şifrə", ru: "Пароль" },
  "auth.register.field.passwordPlaceholder": {
    az: "Ən az 6 simvol",
    ru: "Минимум 6 символов",
  },
  "auth.register.field.email": {
    az: "E-poçt (bildirişlər üçün)",
    ru: "Email (для уведомлений)",
  },
  "auth.register.field.emailPlaceholder": {
    az: "siz@misal.com",
    ru: "вы@example.com",
  },
  "auth.register.field.profession": { az: "Peşə", ru: "Профессия" },
  "auth.register.field.professionPlaceholder": {
    az: "Peşənizi seçin",
    ru: "Выберите профессию",
  },

  "auth.register.submit": {
    az: "Qeydiyyatdan keç",
    ru: "Зарегистрироваться",
  },
  "auth.register.error.invalidPhone": {
    az: "Düzgün nömrə daxil edin",
    ru: "Введите корректный номер",
  },
  "auth.register.error.phoneTaken": {
    az: "Bu nömrə artıq qeydiyyatdadır",
    ru: "Этот номер уже зарегистрирован",
  },
  "auth.register.error.passwordShort": {
    az: "Şifrə ən az 6 simvol olmalıdır",
    ru: "Пароль должен быть не короче 6 символов",
  },
  "auth.register.error.invalidEmail": {
    az: "Düzgün e-poçt ünvanı daxil edin",
    ru: "Введите корректный email",
  },
  "auth.register.error.required": {
    az: "Bu sahə tələb olunur",
    ru: "Это поле обязательно",
  },

  // auth — otp
  "auth.otp.title": { az: "Telefon təsdiqi", ru: "Подтверждение телефона" },
  "auth.otp.subtitle": {
    az: "{phone} nömrəsinə göndərilmiş 6 rəqəmli kodu daxil edin",
    ru: "Введите 6-значный код, отправленный на {phone}",
  },
  "auth.otp.hint": {
    az: "Test üçün kod: 123456",
    ru: "Тестовый код: 123456",
  },
  "auth.otp.submit": { az: "Təsdiqlə", ru: "Подтвердить" },
  "auth.otp.resend": { az: "Kodu yenidən göndər", ru: "Отправить код снова" },
  "auth.otp.error.wrong": {
    az: "Kod yanlışdır. Yenidən cəhd edin.",
    ru: "Неверный код. Попробуйте снова.",
  },

  // auth — success
  "auth.success.title": { az: "Hesab yaradıldı", ru: "Аккаунт создан" },
  "auth.success.subtitle.client": {
    az: "Vaxt-a xoş gəlmisiniz!",
    ru: "Добро пожаловать на Vaxt!",
  },
  "auth.success.subtitle.provider": {
    az: "İndi profilinizi tamamlayın",
    ru: "Теперь заполните свой профиль",
  },
  "auth.success.continue.client": {
    az: "Kataloga keç",
    ru: "Перейти в каталог",
  },
  "auth.success.continue.provider": {
    az: "Panelə keç",
    ru: "Перейти в панель",
  },

  // auth — user menu
  "auth.userMenu.profile": { az: "Profil", ru: "Профиль" },
  "auth.userMenu.dashboard": { az: "Panel", ru: "Панель" },
  "auth.userMenu.logout": { az: "Çıxış", ru: "Выйти" },
} as const satisfies Record<string, Localized>;

export type DictKey = keyof typeof DICT;

export function useT() {
  const lang = useStore((s) => s.language);
  return {
    lang,
    t: (key: DictKey): string => DICT[key][lang],
    pickLocalized: (v: Localized): string => v[lang],
  };
}
