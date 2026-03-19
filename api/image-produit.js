// api/image-produit.js — Extraction image + conversion WebP (GRATUIT)
// Installe sharp : npm install sharp

import sharp from "sharp";

// Rate limiting: simple in-memory tracker
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimiter.set(ip, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// URL validation
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return ["http:", "https:"].includes(u.protocol) && u.hostname.length > 0;
  } catch { return false; }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  // Rate limiting
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ erreur: "Trop de requêtes — réessaie dans 1 minute" });
  }

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  // Validate URL
  if (typeof url !== "string" || url.length > 2048 || !isValidUrl(url)) {
    return res.status(400).json({ erreur: "URL invalide" });
  }

  try {
    // 1. Récupère le HTML de la page pour trouver l'image
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const pageRes = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      }
    });
    const html = await pageRes.text();

    // 2. Cherche l'URL de l'image dans la page
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const wooImageMatch = html.match(/class=["'][^"']*wp-post-image[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                          html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/wp-content\/uploads\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);

    const imageUrl = ogImageMatch?.[1] || wooImageMatch?.[1] || "";
    if (!imageUrl) return res.status(200).json({ erreur: "Aucune image trouvée sur cette page" });

    // 3. Télécharge l'image
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    if (!imgRes.ok) return res.status(200).json({ erreur: "Impossible de télécharger l'image" });

    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 4. Convertit en WebP et redimensionne à max 400x400
    const webpBuffer = await sharp(imgBuffer)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 5. Retourne en base64 data URL
    const base64 = webpBuffer.toString("base64");
    const dataUrl = `data:image/webp;base64,${base64}`;

    return res.status(200).json({ image: dataUrl });

  } catch (e) {
    return res.status(500).json({ erreur: "Erreur : " + e.message });
  }
}
