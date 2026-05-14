"use client";

import { useStore } from "./store";
import type { Localized } from "./types";

export const DICT = {
  // brand
  "brand.name": { az: "Vaxt", ru: "Vaxt" },
  "brand.homeAria": { az: "Vaxt ana səhifə", ru: "Vaxt — на главную" },

  // header / nav (Vaxt structure)
  "nav.catalog": { az: "Kataloq", ru: "Каталог" },
  "nav.tenders": { az: "Tenderlər", ru: "Тендеры" },
  "nav.favorites": { az: "Seçilmişlər", ru: "Избранное" },
  "nav.myBids": { az: "Mənim təkliflərim", ru: "Мои ставки" },

  // my-bids page
  "myBids.title": { az: "Mənim təkliflərim", ru: "Мои ставки" },
  "myBids.subtitle": {
    az: "Sənin göndərdiyin təkliflərin tarixi.",
    ru: "История твоих предложений на тендеры.",
  },
  "myBids.empty.title": {
    az: "Hələ təklif göndərməmisən",
    ru: "Пока нет ни одной ставки",
  },
  "myBids.empty.sub": {
    az: "Tender səhifəsində «Təklif göndər» düyməsini bas — buraya qayıt­acaq.",
    ru: "Откройте тендер и нажмите «Прислать ставку» — она появится здесь.",
  },
  "myBids.empty.notLoggedIn": {
    az: "Təkliflərini görmək üçün daxil ol.",
    ru: "Войдите, чтобы увидеть свои ставки.",
  },
  "myBids.goToTender": { az: "Tendərə bax", ru: "К тендеру" },
  "myBids.withdraw": { az: "Geri al", ru: "Отозвать" },
  "myBids.withdraw.confirm": {
    az: "Təklifi geri almaq istəyirsiniz?",
    ru: "Отозвать ставку?",
  },
  "myBids.withdraw.confirmYes": { az: "Bəli, geri al", ru: "Да, отозвать" },
  "myBids.withdraw.confirmNo": { az: "İmtina", ru: "Отмена" },

  // bid status (pending / accepted / rejected)
  "bid.status.pending": { az: "Gözləyir", ru: "Ожидает" },
  "bid.status.accepted": { az: "Qəbul edildi", ru: "Принято" },
  "bid.status.rejected": { az: "Rədd edildi", ru: "Отклонено" },
  "bid.accept": { az: "Qəbul et", ru: "Принять" },
  "bid.reject": { az: "Rədd et", ru: "Отклонить" },
  "bid.unaccept": { az: "Qərardan imtina", ru: "Сбросить" },

  // favorites page
  "favorites.title": { az: "Seçilmişlər", ru: "Избранное" },
  "favorites.subtitle": {
    az: "Saxladığın icraçılar və tenderlər burada.",
    ru: "Сохранённые исполнители и тендеры в одном месте.",
  },
  "favorites.section.providers": { az: "İcraçılar", ru: "Исполнители" },
  "favorites.section.tenders": { az: "Tenderlər", ru: "Тендеры" },
  "favorites.section.myBids": { az: "Mənim təkliflərim", ru: "Мои ставки" },
  "favorites.empty.title": { az: "Hələ heç nə yoxdur", ru: "Пока пусто" },
  "favorites.empty.sub": {
    az: "Kataloqdan və ya tenderlərdən ürək / əlfəcin nişanı ilə əlavə et.",
    ru: "Добавляй сердечком в каталоге и закладкой на тендерах.",
  },
  "nav.becomeProvider": { az: "Icraçı ol", ru: "Стать исполнителем" },
  "nav.login": { az: "Giriş", ru: "Вход" },

  // hero
  "hero.eyebrow": {
    az: "Tədbir və Gözəllik · Azərbaycan",
    ru: "Мероприятия и красота · Азербайджан",
  },
  "hero.title.before": {
    az: "Ən uyğun vaxtı seç,",
    ru: "Выбери удобное время,",
  },
  "hero.title.emphasis": {
    az: "surətli rezerv et",
    ru: "забронируй мгновенно",
  },
  "hero.title.after": { az: "", ru: "" },
  "hero.searchPlaceholder": {
    az: "Daxil edin",
    ru: "Введите",
  },

  // filters
  "filters.searchPlaceholder": {
    az: "Stilist və ya xidmət axtar…",
    ru: "Поиск стилиста или услуги…",
  },
  "filters.search.aria": { az: "Axtarış", ru: "Поиск" },
  "filters.search.button": { az: "Axtar", ru: "Найти" },

  // Advanced filter card under hero
  "search.label.specialist": { az: "Mütəxəssis", ru: "Специалист" },
  "search.label.city": { az: "Şəhər", ru: "Город" },
  "search.label.district": { az: "Rayon", ru: "Район" },
  "search.label.rating": { az: "Reytinq", ru: "Рейтинг" },
  "search.label.price": { az: "Qiymət (₼)", ru: "Цена (₼)" },
  "search.label.sort": { az: "Sıralama", ru: "Сортировка" },
  "search.placeholder.specialist": { az: "İstənilən", ru: "Любой" },
  "search.placeholder.city": { az: "Bütün şəhərlər", ru: "Все города" },
  "search.placeholder.district": { az: "Bütün rayonlar", ru: "Все районы" },
  "search.placeholder.priceFrom": { az: "min", ru: "от" },
  "search.placeholder.priceTo": { az: "max", ru: "до" },
  "search.sort.actuality": { az: "Aktuallığa görə", ru: "По актуальности" },
  "search.sort.rating": { az: "Reytinqə görə", ru: "По рейтингу" },
  "search.sort.cheap": { az: "Əvvəl ucuz", ru: "Сначала дешевле" },
  "search.sort.expensive": { az: "Əvvəl bahalı", ru: "Сначала дороже" },
  "search.sort.popular": { az: "Populyarlığa görə", ru: "По популярности" },
  "search.action.show": {
    az: "Mütəxəssisləri göstər",
    ru: "Показать специалистов",
  },
  "results.empty": {
    az: "Heç bir nəticə tapılmadı. Filtrləri dəyişməyi sınayın.",
    ru: "Ничего не найдено. Попробуйте изменить фильтры.",
  },

  // stylist card
  "card.beauty": { az: "Gözəllik", ru: "Красота" },
  "card.todayFree": { az: "Bu gün boş", ru: "Свободен сегодня" },
  "card.reviews": { az: "rəy", ru: "отзыв(ов)" },
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
  "dash.status.open": { az: "Açıqdır", ru: "Открыт" },
  "dash.status.closed": { az: "Bağlıdır", ru: "Закрыт" },
  "dash.status.break": { az: "İstirahətdədir", ru: "На перерыве" },
  "dash.status.optionOpen": { az: "Açıqdır", ru: "Открыт" },
  "dash.status.optionClosed": { az: "Bağlıdır", ru: "Закрыт" },
  "dash.status.updateError": {
    az: "Status dəyişdirilmədi. Bir az sonra cəhd edin.",
    ru: "Статус не обновился. Попробуйте чуть позже.",
  },
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
  "dash.appts.cancel.error": {
    az: "Ləğv etmək alınmadı. Yenidən cəhd edin.",
    ru: "Не получилось отменить. Попробуйте ещё раз.",
  },
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
  "section.about": { az: "Mənim haqqımda", ru: "О себе" },
  "section.priceList": { az: "Qiymət siyahısı", ru: "Прайс" },
  "priceList.empty": {
    az: "Hələ xidmət əlavə edilməyib.",
    ru: "Услуги пока не добавлены.",
  },
  "section.reviews": { az: "Rəylər", ru: "Отзывы" },

  // tier badges
  "tier.event": { az: "Tədbir", ru: "Мероприятия" },
  "tier.beauty": { az: "Gözəllik", ru: "Красота" },

  // provider page
  "provider.verified": { az: "Doğrulandı", ru: "Проверенный" },
  "provider.freeToday": { az: "Bu gün boş", ru: "Свободна сегодня" },
  "provider.experienceYears": { az: "il təcrübə", ru: "лет опыта" },
  "provider.reviewsCount": { az: "{n} rəy", ru: "{n} отзывов" },
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
  "provider.minutes": { az: "dəq", ru: "мин" },
  "provider.gallery": { az: "Qalereya", ru: "Галерея" },

  // card actions per kind
  "action.profile": { az: "Profilə bax", ru: "Посмотреть" },
  "action.book": { az: "Yazıl", ru: "Записаться" },
  "action.bookNow": { az: "İndi yazıl", ru: "Записаться сейчас" },

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
  "meta.minPriceSuffix": { az: "minimum", ru: "от" },

  // common
  "common.city.baku": { az: "Bakı", ru: "Bakı" },

  // crumbs
  "crumbs.catalog": { az: "Kataloq", ru: "Каталог" },

  // dashboard — no provider profile recovery card
  "dash.noProvider.title": {
    az: "İcraçı profili tapılmadı",
    ru: "Профиль исполнителя не найден",
  },
  "dash.noProvider.body": {
    az: "Bu hesabın icraçı profili yoxdur. İcraçı kimi qeydiyyatdan keçin.",
    ru: "У этого аккаунта нет профиля исполнителя. Зарегистрируйтесь как исполнитель.",
  },
  "dash.noProvider.cta": {
    az: "İcraçı kimi qeydiyyat",
    ru: "Регистрация исполнителя",
  },

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
  "dash.profile.avatar.change": { az: "Şəkli dəyiş", ru: "Изменить фото" },
  "dash.profile.avatar.uploading": { az: "Yüklənir…", ru: "Загрузка…" },
  "dash.profile.avatar.replace": {
    az: "Şəkli dəyişmək üçün üzərinə basın",
    ru: "Нажмите на фото, чтобы заменить",
  },
  "dash.profile.avatar.add": {
    az: "Şəkil əlavə etmək üçün avatara basın",
    ru: "Нажмите на аватар, чтобы добавить фото",
  },
  // image-upload validation — shown when a picked file fails the bucket
  // policy before it's even sent (size / format).
  "upload.error.type": {
    az: "Format dəstəklənmir. JPG, PNG, WebP və ya GIF istifadə edin.",
    ru: "Формат не поддерживается. Используйте JPG, PNG, WebP или GIF.",
  },
  "upload.error.size": {
    az: "Şəkil çox böyükdür ({mb} MB). Maksimum 5 MB.",
    ru: "Фото слишком большое ({mb} МБ). Максимум 5 МБ.",
  },
  "dash.profile.section.name.sub": {
    az: "Müştərilər sizi kataloqda və panelde belə görür",
    ru: "Так клиенты видят вас в каталоге и на дашборде",
  },
  "dash.profile.user.fallback": { az: "İstifadəçi", ru: "Пользователь" },
  "dash.profile.section.name.title": { az: "Ad", ru: "Имя" },
  "dash.profile.section.contacts.title": {
    az: "Əlaqə məlumatları",
    ru: "Контактные данные",
  },
  "dash.profile.section.contacts.sub": {
    az: "3 nömrəyə qədər və messencer/sosial şəbəkə hesabları",
    ru: "До 3 номеров, плюс мессенджеры и соцсети",
  },
  "dash.profile.name.placeholder": {
    az: "Ad və soyad",
    ru: "Имя и фамилия",
  },
  "dash.profile.phone.add": {
    az: "Yeni nömrə əlavə et",
    ru: "Добавить номер",
  },
  "dash.profile.phone.remove": {
    az: "Nömrəni sil",
    ru: "Удалить номер",
  },

  // tenders page
  "tenders.title": { az: "Tender meydançası", ru: "Тендерная площадка" },
  "tenders.subtitle": {
    az: "Sifarişinizi qoyun — icraçılar özləri sizi tapsın və qiymət təklif etsin.",
    ru: "Опишите заказ — исполнители сами найдут вас и предложат цену.",
  },
  "tenders.create": { az: "Tender yarat", ru: "Создать тендер" },
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
  "tenders.eventDate": { az: "Tarix", ru: "Дата" },
  "tenders.author": { az: "Müştəri", ru: "Заказчик" },
  "tenders.bidPanel.title": {
    az: "İcraçı təklifləri",
    ru: "Ставки исполнителей",
  },
  "tenders.action.bid": { az: "Təklif göndər", ru: "Прислать ставку" },
  "tenders.action.save": { az: "Yadda saxla", ru: "Сохранить" },
  "tenders.action.viewAll": { az: "Hamısına bax", ru: "Все ставки" },
  "tenders.filters.all": { az: "Hamısı", ru: "Все" },
  "tenders.filters.event": { az: "Tədbir", ru: "Мероприятия" },
  "tenders.filters.beauty": { az: "Gözəllik", ru: "Красота" },
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

  // tenders — submit bid modal
  "tenders.bid.title": { az: "Təklif göndər", ru: "Прислать ставку" },
  "tenders.bid.price": { az: "Qiymət (₼)", ru: "Цена (₼)" },
  "tenders.bid.note": { az: "Qeyd", ru: "Ваш комментарий" },
  "tenders.bid.submit": { az: "Göndər", ru: "Отправить" },
  "tenders.bid.submitting": { az: "Göndərilir…", ru: "Отправляем…" },
  "tenders.bid.success": { az: "Təklif göndərildi", ru: "Ставка отправлена" },
  "tenders.bid.outOfBudget": {
    az: "Qiymət büdcədən kənardadır",
    ru: "Цена вне бюджета тендера",
  },
  "tenders.bid.deadlinePassed": {
    az: "Tender bağlanıb — təklif qəbul edilmir",
    ru: "Тендер закрыт — ставки не принимаются",
  },

  // tenders — all bids modal
  "tenders.allBids.title": { az: "Bütün təkliflər", ru: "Все ставки" },

  // tenders — create tender modal
  "tenders.create.title": { az: "Tender yarat", ru: "Создать тендер" },
  "tenders.create.field.title": { az: "Başlıq", ru: "Заголовок" },
  "tenders.create.field.description": { az: "Təsvir", ru: "Описание" },
  "tenders.create.field.kind": { az: "Peşə", ru: "Профессия" },
  "tenders.create.field.tier": { az: "Kateqoriya", ru: "Категория" },
  "tenders.create.field.budget": { az: "Büdcə (₼)", ru: "Бюджет (₼)" },
  "tenders.create.field.deadline": { az: "Son tarix", ru: "Дедлайн" },
  "tenders.create.field.eventDate": {
    az: "Tədbir tarixi",
    ru: "Дата мероприятия",
  },
  "tenders.create.field.eventTime": {
    az: "Tədbir vaxtı",
    ru: "Время мероприятия",
  },
  "tenders.create.field.district": { az: "Rayon", ru: "Район" },
  "tenders.create.field.tags": {
    az: "Teqlər (vergüllə)",
    ru: "Теги (через запятую)",
  },
  "tenders.create.submit": { az: "Yerləşdir", ru: "Опубликовать" },
  "tenders.create.notLoggedIn": {
    az: "Tender yaratmaq üçün daxil olun",
    ru: "Войдите, чтобы создать тендер",
  },

  // reviews
  "reviews.leave": { az: "Rəy yaz", ru: "Оставить отзыв" },
  "reviews.empty": { az: "Hələ rəy yoxdur", ru: "Отзывов пока нет" },
  "reviews.field.author": { az: "Adınız", ru: "Ваше имя" },
  "reviews.field.rating": { az: "Reytinq", ru: "Оценка" },
  "reviews.field.text": { az: "Rəy mətni", ru: "Текст отзыва" },
  "reviews.submit": { az: "Göndər", ru: "Отправить" },

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
  "auth.login.error.invalidCredential": {
    az: "Nömrə və ya şifrə yanlışdır",
    ru: "Неверный номер или пароль",
  },
  "auth.login.error.invalidPhone": {
    az: "Düzgün nömrə daxil edin",
    ru: "Введите корректный номер",
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
  "auth.register.field.passwordConfirm": {
    az: "Şifrəni təkrarlayın",
    ru: "Повторите пароль",
  },
  "auth.register.field.passwordConfirmPlaceholder": {
    az: "Şifrəni yenidən daxil edin",
    ru: "Введите пароль ещё раз",
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
  "auth.register.error.linkFailed": {
    az: "Şifrə təyin edilmədi. Yenidən cəhd edin.",
    ru: "Не удалось задать пароль. Попробуйте снова.",
  },
  "auth.register.error.passwordShort": {
    az: "Şifrə ən az 6 simvol olmalıdır",
    ru: "Пароль должен быть не короче 6 символов",
  },
  "auth.register.error.passwordMismatch": {
    az: "Şifrələr uyğun gəlmir",
    ru: "Пароли не совпадают",
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
    az: "SMS bir neçə saniyə ərzində gəlir. Test nömrələri üçün — əvvəlcədən təyin edilmiş kodu daxil edin.",
    ru: "SMS приходит за несколько секунд. Для тестовых номеров — введите код, заданный в Firebase Console.",
  },
  "auth.otp.submit": { az: "Təsdiqlə", ru: "Подтвердить" },
  "auth.otp.resend": { az: "Kodu yenidən göndər", ru: "Отправить код снова" },
  "auth.otp.sending": { az: "Göndərilir…", ru: "Отправляем…" },
  "auth.otp.checking": { az: "Yoxlanılır…", ru: "Проверяем…" },
  "auth.otp.error.wrong": {
    az: "Kod yanlışdır. Yenidən cəhd edin.",
    ru: "Неверный код. Попробуйте снова.",
  },
  "auth.otp.error.expired": {
    az: "Kodun vaxtı bitdi. Yeni kod istəyin.",
    ru: "Срок действия кода истёк. Запросите новый.",
  },
  "auth.otp.error.tooManyRequests": {
    az: "Çox sayda cəhd. Bir neçə dəqiqədən sonra yenidən cəhd edin.",
    ru: "Слишком много запросов. Попробуйте через несколько минут.",
  },
  "auth.otp.error.quotaExceeded": {
    az: "SMS limiti tükənib. Daha sonra yenidən cəhd edin.",
    ru: "Лимит SMS исчерпан. Попробуйте позже.",
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

  // common UI primitives
  "common.close": { az: "Bağla", ru: "Закрыть" },

  // signup prompt — fires when an unauthenticated user tries to favorite
  // a provider or save a tender. Shared modal across heart-button +
  // favorite-toggle so the copy stays in one place.
  "auth.required.title": { az: "Daxil olmaq lazımdır", ru: "Нужен вход" },
  "auth.required.body": {
    az: "Seçilmişləri saxlamaq üçün hesab yaradın və ya daxil olun.",
    ru: "Зарегистрируйтесь или войдите, чтобы сохранять в избранное.",
  },
  "auth.required.signUp": { az: "Qeydiyyat", ru: "Регистрация" },
  "auth.required.login": { az: "Daxil ol", ru: "Войти" },
  "auth.required.cancel": { az: "İmtina", ru: "Отмена" },

  // provider profile units (per-hour fallback when provider.priceUnit empty)
  "unit.hour": { az: "saat", ru: "час" },

  // 404 page for /provider/[id]
  "notfound.provider": {
    az: "Bu icraçı tapılmadı.",
    ru: "Исполнитель не найден.",
  },
  "notfound.backToCatalog": {
    az: "← Kataloga qayıt",
    ru: "← Вернуться в каталог",
  },
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
