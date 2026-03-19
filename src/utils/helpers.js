// ─── MrKey Pro — Helper functions ────────────────────────────────────────────
import { COUNTERS_KEY, BLADE_COLORS } from "./constants.js";

/**
 * Generate a sequential number like "FAC2026-0001" or "DEV2026-0012".
 * Uses localStorage to persist counters across sessions.
 * @param {string} type - Prefix (e.g. "FAC", "DEV", "INT")
 * @returns {string}
 */
export function getNextNum(type) {
  try {
    const counters = JSON.parse(localStorage.getItem(COUNTERS_KEY) || "{}");
    const year = new Date().getFullYear();
    const key = `${type}_${year}`;
    const next = (counters[key] || 0) + 1;
    counters[key] = next;
    localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
    return `${type}${year}-${String(next).padStart(4, "0")}`;
  } catch {
    return `${type}${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Badge color per product category.
 * @param {string} cat
 * @returns {string} CSS color
 */
export function catColor(cat) {
  if (cat === "Aftermarket France") return "#60a5fa";
  if (cat === "Xhorse") return "#f472b6";
  return "#60a5fa";
}

/**
 * Link label and style for a product's external link.
 * @param {object} product
 * @returns {{ label: string, bg: string, color: string } | null}
 */
export function lienLabel(product) {
  if (!product.lien) return null;
  if (product.lienType === "mk3") {
    return { label: "Voir sur MK3.com", bg: "linear-gradient(135deg,#ffa726,#ff6b00)", color: "#fff" };
  }
  if (product.lienType === "aliexpress") {
    return { label: "Voir sur AliExpress", bg: "linear-gradient(135deg,#ff4500,#ff6a00)", color: "#fff" };
  }
  return { label: "Voir le produit", bg: "rgba(255,255,255,0.05)", color: "#5a6585" };
}

/**
 * Color by blade profile prefix (e.g. "HU83" -> VA prefix -> "#a78bfa").
 * @param {string} blade
 * @returns {string} CSS color
 */
export function bladeColor(blade) {
  if (!blade) return "#888";
  for (const [prefix, col] of Object.entries(BLADE_COLORS)) {
    if (blade.toUpperCase().startsWith(prefix.toUpperCase())) return col;
  }
  return "#888";
}

/**
 * Parse a French-format date string "dd/mm/yyyy" into a Date object.
 * Falls back to `new Date(str)` on failure.
 * @param {string} str
 * @returns {Date}
 */
export function parseDate(str) {
  try {
    const [d, m, y] = (str || "").split("/");
    return new Date(+y, +m - 1, +d);
  } catch {
    return new Date(str);
  }
}

/**
 * Format a number as French-style currency "12.50 €".
 * @param {number} n
 * @returns {string}
 */
export function formatCurrency(n) {
  if (n == null || isNaN(n)) return "0.00 €";
  return n.toFixed(2) + " €";
}
