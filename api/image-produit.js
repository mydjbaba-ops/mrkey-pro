// api/image-produit.js — Extraction image + conversion WebP (GRATUIT)
// Installe sharp : npm install sharp

import sharp from "sharp";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  try {
    // 1. Récupère le HTML de la page pour trouver l'image
    const pageRes = await fetch(url, {
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
