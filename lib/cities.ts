import type { Localized } from "./types";

export type City = {
  id: string;
  name: Localized;
};

export const CITIES: City[] = [
  { id: "baku", name: { az: "Bakı", ru: "Баку" } },
  { id: "ganja", name: { az: "Gəncə", ru: "Гянджа" } },
  { id: "sumqayit", name: { az: "Sumqayıt", ru: "Сумгаит" } },
  { id: "mingachevir", name: { az: "Mingəçevir", ru: "Мингячевир" } },
  { id: "shirvan", name: { az: "Şirvan", ru: "Ширван" } },
  { id: "nakhchivan", name: { az: "Naxçıvan", ru: "Нахчыван" } },
  { id: "sheki", name: { az: "Şəki", ru: "Шеки" } },
  { id: "yevlax", name: { az: "Yevlax", ru: "Евлах" } },
  { id: "lankaran", name: { az: "Lənkəran", ru: "Лянкяран" } },
  { id: "shamakhi", name: { az: "Şamaxı", ru: "Шемаха" } },
  { id: "quba", name: { az: "Quba", ru: "Куба" } },
  { id: "gabala", name: { az: "Qəbələ", ru: "Габала" } },
  { id: "khachmaz", name: { az: "Xaçmaz", ru: "Хачмаз" } },
  { id: "astara", name: { az: "Astara", ru: "Астара" } },
  { id: "salyan", name: { az: "Salyan", ru: "Сальяны" } },
  { id: "barda", name: { az: "Bərdə", ru: "Барда" } },
  { id: "zaqatala", name: { az: "Zaqatala", ru: "Загатала" } },
  { id: "agdam", name: { az: "Ağdam", ru: "Агдам" } },
  { id: "tovuz", name: { az: "Tovuz", ru: "Товуз" } },
  { id: "goychay", name: { az: "Göyçay", ru: "Гёйчай" } },
  { id: "ismayilli", name: { az: "İsmayıllı", ru: "Исмаиллы" } },
  { id: "qazax", name: { az: "Qazax", ru: "Казах" } },
  { id: "shabran", name: { az: "Şabran", ru: "Шабран" } },
  { id: "khirdalan", name: { az: "Xırdalan", ru: "Хырдалан" } },
];

export const DEFAULT_CITY_ID = "baku";
export const ALL_CITIES_ID = "all";
export const ALL_CITIES: City = {
  id: ALL_CITIES_ID,
  name: { az: "Hamısı", ru: "Все" },
};

export function getCityById(id: string): City {
  if (id === ALL_CITIES_ID) return ALL_CITIES;
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

const CITY_ID_BY_NAME = new Map<string, string>(
  CITIES.flatMap((c) => [
    [c.name.az, c.id],
    [c.name.ru, c.id],
  ]),
);

export function getCityIdByName(name: Localized): string | null {
  return CITY_ID_BY_NAME.get(name.az) ?? CITY_ID_BY_NAME.get(name.ru) ?? null;
}

// Some providers were saved with the same string in both az and ru
// (e.g. user typed "Gəncə" and the editor stored {az:"Gəncə", ru:"Gəncə"}).
// Look the value up against the known city list and, if found, return the
// canonical bilingual record. Falls back to the original Localized.
const CITY_BY_LOWER_NAME = new Map<string, City>(
  CITIES.flatMap((c) => [
    [c.name.az.toLowerCase(), c],
    [c.name.ru.toLowerCase(), c],
  ]),
);

export function normalizeCity(input: Localized): Localized {
  const az = CITY_BY_LOWER_NAME.get((input.az ?? "").trim().toLowerCase());
  if (az) return az.name;
  const ru = CITY_BY_LOWER_NAME.get((input.ru ?? "").trim().toLowerCase());
  if (ru) return ru.name;
  return input;
}
