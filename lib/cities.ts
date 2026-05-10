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

export function getCityById(id: string): City {
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
