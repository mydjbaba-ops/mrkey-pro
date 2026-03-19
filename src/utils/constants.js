// ─── MrKey Pro — Constants ───────────────────────────────────────────────────

// Stock alert threshold default
export const SEUIL_DEFAULT = 3;

// ─── Storage / Supabase keys ────────────────────────────────────────────────
export const STOCK_KEY     = "mrkey_stock_v2";
export const CLIENT_KEY    = "mrkey_clients_v1";
export const INTERV_KEY    = "mrkey_interventions_v1";
export const DEVIS_KEY     = "mrkey_devis_v1";
export const SETTINGS_KEY  = "mrkey_settings_v1";
export const OE_LINKS_KEY  = "mrkey_oe_links_v1";
export const COUNTERS_KEY  = "mrkey_counters_v1";
export const PRODUCTS_KEY  = "mrkey_products_v2";
export const CUSTOM_AM_KEY = "mrkey_custom_am_v1";

// ─── Fallback image (SVG data URI) ─────────────────────────────────────────
export const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
  '<rect width="80" height="80" rx="12" fill="#e8edf8"/>' +
  '<text x="40" y="48" text-anchor="middle" font-size="32">🔑</text>' +
  '</svg>'
)}`;

// ─── Xhorse badge colors ───────────────────────────────────────────────────
export const XHORSE_BADGE_COLORS = {
  "XN-Wireless":   "#1d4ed8",
  "XE-Wireless":   "#7c3aed",
  "NXP-SmartKey":  "#ea580c",
  "XM38-SmartKey": "#ea580c",
  "XM38-TOYOTA":   "#ea580c",
  "XM38-HYUNDAI":  "#ea580c",
  "XK-Wired":      "#991b1b",
};

// ─── Blade profile colors ──────────────────────────────────────────────────
export const BLADE_COLORS = {
  GT:   "#6c63ff",
  SIP:  "#cc0000",
  HU6:  "#2563eb",
  HU9:  "#f59e0b",
  CY:   "#7c3aed",
  FO:   "#0284c7",
  HU1:  "#0284c7",
  HU8:  "#0ea5e9",
  HO:   "#dc2626",
  KIA:  "#059669",
  HYN:  "#059669",
  MAZ:  "#d97706",
  HU10: "#f97316",
  NSN:  "#8b5cf6",
  NE:   "#a78bfa",
  VA:   "#a78bfa",
  TOY:  "#ef4444",
  HU13: "#16a34a",
  HU20: "#ec4899",
  YM:   "#34d399",
};

// ─── Silca type icons / labels / colors ────────────────────────────────────
export const TICON = { P: "🔒", S: "💳", R: "📡" };
export const TLBL  = { P: "Proximité", S: "Slot", R: "Télécommande" };
export const TCOL  = { P: "#6c63ff", S: "#0099cc", R: "#cc0000" };
