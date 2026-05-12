// One-off: split the combined "House · retro" tag on tender t2 into two
// separate chips. Safe to delete after it has been run once.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(here, "..", ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("=").map((s) => s.trim())),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const newTags = [
  { az: "Korporativ", ru: "Корпоратив" },
  { az: "4 saat", ru: "4 часа" },
  { az: "House", ru: "House" },
  { az: "Retro", ru: "Ретро" },
];

const { data, error } = await supabase
  .from("tenders")
  .update({ tags: newTags })
  .eq("id", "t2")
  .select("id, tags");

if (error) {
  console.error("Update failed:", error);
  process.exit(1);
}
console.log("Updated:", JSON.stringify(data, null, 2));
