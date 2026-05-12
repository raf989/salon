// URL-safe slug helpers. Transliterates Azerbaijani Latin diacritics and
// Russian Cyrillic to ASCII, then squashes everything else to hyphens.

const AZ_MAP: Record<string, string> = {
  // Lowercase
  ə: "e",
  ı: "i",
  ö: "o",
  ü: "u",
  ş: "sh",
  ç: "ch",
  ğ: "g",
  // Uppercase (kept here for explicitness; lowercase pass runs first but
  // some sources may slip through with different normalisation forms).
  Ə: "e",
  İ: "i",
  I: "i",
  Ö: "o",
  Ü: "u",
  Ş: "sh",
  Ç: "ch",
  Ğ: "g",
};

const RU_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    if (AZ_MAP[ch] !== undefined) {
      out += AZ_MAP[ch];
    } else if (RU_MAP[ch] !== undefined) {
      out += RU_MAP[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Produce a URL-safe slug from a free-form name.
 *
 * 1. Lowercase
 * 2. Transliterate Azerbaijani diacritics and Russian Cyrillic to Latin
 * 3. Replace anything non `[a-z0-9]` with `-`
 * 4. Collapse repeated hyphens, trim leading/trailing hyphens
 * 5. Fall back to "user" if the result is empty
 */
export function slugify(name: string): string {
  const lowered = name.toLowerCase();
  const transliterated = transliterate(lowered);
  const replaced = transliterated.replace(/[^a-z0-9]+/g, "-");
  const collapsed = replaced.replace(/-+/g, "-");
  const trimmed = collapsed.replace(/^-+|-+$/g, "");
  return trimmed || "user";
}

/**
 * Disambiguate `base` against an existing set. If `base` isn't taken,
 * returns `base`. Otherwise tries `base-2`, `base-3`, etc. until free.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
