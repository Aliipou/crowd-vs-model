import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 20 } },
  auth: { persistSession: false },
});

export const ROUND_SECONDS = 20;
export const TOTAL_ROUNDS = 8;

const ALPHABET = "BCDFGHJKLMNPQRSTVWXZ";
export function newCode() {
  return Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");
}
