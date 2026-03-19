// ─── MrKey Pro — Image helpers ───────────────────────────────────────────────
import { KEY_IMAGES } from "../../keyImages.js";
import { SILCA_IMGS } from "../../silcaImages.js";
import { XHORSE_IMAGES } from "../../xhorseImages.js";
import { SILCA_DB } from "../../silcaData.js";
import { BLADE_COLORS } from "./constants.js";

// ─── Fallback image ─────────────────────────────────────────────────────────
export const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">' +
  '<rect width="80" height="80" rx="12" fill="#e8edf8"/>' +
  '<text x="40" y="48" text-anchor="middle" font-size="32">\u{1F511}</text>' +
  '</svg>'
)}`;

// ─── SVG key generator (inline brand image) ─────────────────────────────────
export function svgKey(bg, accent, label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
    <rect width='120' height='120' rx='14' fill='${bg}'/>
    <circle cx='42' cy='62' r='22' fill='none' stroke='${accent}' stroke-width='6'/>
    <circle cx='42' cy='62' r='8' fill='${accent}'/>
    <rect x='62' y='58' width='40' height='8' rx='4' fill='${accent}'/>
    <rect x='88' y='52' width='8' height='20' rx='3' fill='${accent}'/>
    <rect x='76' y='56' width='8' height='14' rx='3' fill='${accent}'/>
    <text x='60' y='100' text-anchor='middle' font-family='Arial,sans-serif' font-size='11' font-weight='bold' fill='${accent}' opacity='0.7'>${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Brand image constants ──────────────────────────────────────────────────
export const IMG_PSA           = svgKey("#1a1f35", "#60a5fa", "PSA");
export const IMG_PSA2          = svgKey("#1a1f35", "#93c5fd", "PSA");
export const IMG_RENAULT       = svgKey("#1f1a35", "#a78bfa", "RENAULT");
export const IMG_RENAULT_CARTE = svgKey("#1a2535", "#7dd3fc", "CARTE");
export const IMG_VW            = svgKey("#0f1a25", "#38bdf8", "VW");
export const IMG_BMW           = svgKey("#1c1a10", "#fbbf24", "BMW");
export const IMG_MINI          = svgKey("#1a1015", "#fb7185", "MINI");
export const IMG_TOYOTA        = svgKey("#1a1010", "#f87171", "TOYOTA");
export const IMG_MERCEDES      = svgKey("#101a10", "#4ade80", "MERCED.");
export const IMG_SMART         = svgKey("#101520", "#34d399", "SMART");
export const IMG_FORD          = svgKey("#101525", "#60a5fa", "FORD");
export const IMG_NISSAN        = svgKey("#15101a", "#c084fc", "NISSAN");
export const IMG_FIAT          = svgKey("#1a1010", "#fb923c", "FIAT");

// ─── Blade color helper (local) ─────────────────────────────────────────────
function bladeColor(blade) {
  if (!blade) return "#888";
  for (const [prefix, col] of Object.entries(BLADE_COLORS)) {
    if (blade.toUpperCase().startsWith(prefix.toUpperCase())) return col;
  }
  return "#888";
}

// ─── Silca SVG fallback by blade profile ────────────────────────────────────
export function makeSilcaSVG(blade, col) {
  const c = col || "#cc0000";
  const isCard = blade.startsWith("VA150") || blade.startsWith("VA2") || blade.startsWith("NSN");
  const isFlip = blade.startsWith("HU66") || blade.startsWith("SIP22") || blade.startsWith("HU101") || blade.startsWith("HU100") || blade.startsWith("KIA") || blade.startsWith("MAZ") || blade.startsWith("FO");
  const isProx = blade.startsWith("TOY5") || blade.startsWith("HON") || blade.startsWith("HYN") || blade.startsWith("MAZ-");

  let shape = "";
  if (isCard) {
    shape = `<rect x='22' y='28' width='66' height='54' rx='6' fill='none' stroke='${c}' stroke-width='2.5'/>
      <rect x='30' y='36' width='16' height='14' rx='3' fill='${c}' opacity='0.5'/>
      <rect x='30' y='56' width='50' height='3' rx='1.5' fill='${c}' opacity='0.4'/>
      <rect x='30' y='63' width='34' height='3' rx='1.5' fill='${c}' opacity='0.3'/>`;
  } else if (isProx) {
    shape = `<ellipse cx='55' cy='50' rx='28' ry='22' fill='none' stroke='${c}' stroke-width='2.5'/>
      <rect x='48' y='65' width='14' height='22' rx='3' fill='${c}' opacity='0.5'/>
      <circle cx='55' cy='48' r='6' fill='none' stroke='${c}' stroke-width='2'/>
      <circle cx='55' cy='48' r='2.5' fill='${c}'/>`;
  } else if (isFlip) {
    shape = `<rect x='16' y='34' width='54' height='42' rx='10' fill='none' stroke='${c}' stroke-width='2.5'/>
      <rect x='68' y='42' width='22' height='6' rx='3' fill='${c}' opacity='0.7'/>
      <rect x='68' y='52' width='16' height='4' rx='2' fill='${c}' opacity='0.4'/>
      <circle cx='32' cy='55' r='9' fill='none' stroke='${c}' stroke-width='2'/>
      <circle cx='32' cy='55' r='3.5' fill='${c}'/>
      <rect x='44' y='51' width='20' height='4' rx='2' fill='${c}' opacity='0.5'/>
      <rect x='44' y='59' width='14' height='3' rx='1.5' fill='${c}' opacity='0.4'/>`;
  } else {
    shape = `<rect x='20' y='30' width='70' height='50' rx='12' fill='none' stroke='${c}' stroke-width='2.5'/>
      <circle cx='40' cy='55' r='10' fill='none' stroke='${c}' stroke-width='2'/>
      <circle cx='40' cy='55' r='4' fill='${c}'/>
      <rect x='56' y='50' width='26' height='5' rx='2.5' fill='${c}' opacity='0.7'/>
      <rect x='56' y='59' width='18' height='4' rx='2' fill='${c}' opacity='0.4'/>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 110 110'>
    <rect width='110' height='110' rx='12' fill='#1e2235'/>
    ${shape}
    <text x='55' y='100' text-anchor='middle' font-family='Arial,sans-serif' font-size='8.5' font-weight='bold' fill='${c}' opacity='0.85'>${blade}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ─── Cached SVG fallback (one entry per unique blade) ───────────────────────
const SVG_CACHE = {};

export function getSilcaSVG(blade) {
  if (!SVG_CACHE[blade]) SVG_CACHE[blade] = makeSilcaSVG(blade, bladeColor(blade));
  return SVG_CACHE[blade];
}

// ─── Real Silca image (webp base64 from SILCA_IMGS) ─────────────────────────
export function getSilcaImage(ref) {
  if (SILCA_IMGS[ref]) return SILCA_IMGS[ref];
  const entry = SILCA_DB.find(e => e.ref === ref);
  if (entry && entry.image && SILCA_IMGS[entry.image]) return SILCA_IMGS[entry.image];
  return null;
}

// ─── Key image by blade string (matches from KEY_IMAGES) ────────────────────
export function getKeyImage(lameStr) {
  if (!lameStr) return null;
  const lames = lameStr.split(/[/\s,]+/);
  for (let i = 0; i < lames.length; i++) {
    const l = lames[i].trim().toUpperCase();
    if (KEY_IMAGES[l]) return KEY_IMAGES[l];
    for (const k in KEY_IMAGES) {
      if (l.startsWith(k) || k.startsWith(l.split("-")[0])) return KEY_IMAGES[k];
    }
  }
  return null;
}

// Re-export data references for convenience
export { KEY_IMAGES, SILCA_IMGS, XHORSE_IMAGES };
