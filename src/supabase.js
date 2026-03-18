import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dmhgymmbxlhtuimbidqv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtaGd5bW1ieGxodHVpbWJpZHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODcyOTAsImV4cCI6MjA4OTM2MzI5MH0.VeE6ACfm1HBqHUsi_SMPPPShwCkODTzXtmWC9DJc5_I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Helpers lecture/écriture ───────────────────────────────────────────────

export async function dbGet(userId, key) {
  const { data, error } = await supabase
    .from("user_data")
    .select("value")
    .eq("user_id", userId)
    .eq("key", key)
    .single();
  if (error || !data) return null;
  return data.value;
}

export async function dbSet(userId, key, value) {
  const { error } = await supabase
    .from("user_data")
    .upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() },
             { onConflict: "user_id,key" });
  if (error) console.error("dbSet error", key, error);
}

export async function dbGetAll(userId) {
  const { data, error } = await supabase
    .from("user_data")
    .select("key, value")
    .eq("user_id", userId);
  if (error || !data) return {};
  return Object.fromEntries(data.map(r => [r.key, r.value]));
}
