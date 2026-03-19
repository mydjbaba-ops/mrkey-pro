// api/analyse-produit.js — fonction serverless Vercel (GRATUIT)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  try {
    // Récupère le HTML brut de la page directement
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9",
      }
    });
    const html = await pageRes.text();

    // Extraction titre
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titre = titleMatch ? titleMatch[1].trim().split(" - ")[0].split(" | ")[0] : "";

    // Extraction image — cherche og:image en priorité, puis première image produit WooCommerce
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const wooImageMatch = html.match(/class=["'][^"']*wp-post-image[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                          html.match(/class=["'][^"']*woocommerce-product-gallery[^"']*[\s\S]{0,500}?<img[^>]+src=["']([^"']+)["']/i) ||
                          html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/wp-content\/uploads\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
    const image = ogImageMatch?.[1] || wooImageMatch?.[1] || "";

    // Description
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const description = descMatch ? descMatch[1] : "";
    const texte = (titre + " " + description + " " + html.substring(0, 5000)).toLowerCase();

    // Détection marque véhicule
    const marques = ["renault","peugeot","citroen","volkswagen"," vw ","bmw","mercedes","audi","ford","opel","toyota","nissan","fiat","seat","skoda","volvo","hyundai","kia","honda","mitsubishi","mazda","suzuki","dacia","mini","smart","porsche","land rover","jaguar","lexus","xhorse","keydiy"];
    const marque = marques.find(m => texte.includes(m))?.trim() || "";

    // Modèles — extraction STRICTE depuis section compatibilité uniquement
    let modeles = "";
    const compatPatterns = [
      /(?:convient aux mod[eè]les suivants|compatible avec les mod[eè]les suivants|v[eé]hicules compatibles|la cl[eé][^<]{0,50}convient|fits the following|suitable for)[\s\S]{0,5000}?<\/(?:table|div|ul|section)>/i,
      /<table[\s\S]{0,300}?(?:marque|make|mod[eè]le|model|ann[eé]e|year)[\s\S]{0,6000}?<\/table>/i,
    ];
    let compatHtml = "";
    for (const pat of compatPatterns) {
      const m = html.match(pat);
      if (m) { compatHtml = m[0]; break; }
    }
    if (compatHtml) {
      const compatTexte = compatHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const lignes = compatTexte.split(/[;|\n]/).map(l => l.trim()).filter(l => l.length > 3 && l.length < 60);
      const modelesSet = new Set();
      lignes.forEach(l => {
        if (/[A-Z][a-z]/.test(l)) {
          const clean = l.replace(/\(\d{4}[^)]*\)/g, "").replace(/\d{4,}/g, "").trim().replace(/\s+/g, " ");
          if (clean.length > 2 && clean.length < 40) modelesSet.add(clean);
        }
      });
      modeles = [...modelesSet].join(", ");
    }

    // Détection fréquence
    const freqMatch = texte.match(/(\d{3}[\.,]\d+\s*mhz|\d{3}\s*mhz)/i);
    const freq = freqMatch ? freqMatch[0].toUpperCase().replace(",", ".").replace(" ", "") : "";

    // Détection transpondeur
    const transpMatch = texte.match(/pcf\s?\d{4,}|id[\s-]?\d{2,3}|hitag\s?\d?|megamos|crypto/i);
    const transpondeur = transpMatch ? transpMatch[0].toUpperCase().replace(" ", "") : "";

    // Détection lame
    const lameMatch = texte.match(/\b(va\d+|hu\d+|huf\d+|toy\d+|sip\d+|nf\d+|vac\d+|hy\d+|rn\d+|df\d+|ya\d+|hu127|hu100|hu92|hu66|hu83|hu64)\b/i);
    const lame = lameMatch ? lameMatch[0].toUpperCase() : "";

    // Détection type
    let type = "Clé";
    if (texte.includes("télécommande") || texte.includes("remote") || texte.includes("plip")) type = "Télécommande";
    else if (texte.includes("coque") || texte.includes("shell") || texte.includes("boitier")) type = "Coque";
    else if (texte.includes("transpondeur") || texte.includes("transponder") || texte.includes("chip")) type = "Transpondeur";
    else if (texte.includes("lame") || texte.includes("blade")) type = "Lame";

    // Détection prix
    const prixMatch = html.match(/class=["'][^"']*price[^"']*["'][^>]*>[\s\S]{0,100}?(\d+[.,]\d{2})\s*€/i) ||
                      html.match(/(\d+[.,]\d{2})\s*€/);
    const prix = prixMatch ? parseFloat(prixMatch[1].replace(",", ".")) : 0;

    // Référence depuis URL
    const urlParts = url.split("/").filter(Boolean);
    const refSlug = urlParts[urlParts.length - 1] || "";
    const ref = refSlug.split("-").slice(0, 4).join("-").toUpperCase().slice(0, 20);

    return res.status(200).json({
      nom: titre || "Produit importé",
      ref: ref || "",
      marque: marque ? marque.charAt(0).toUpperCase() + marque.slice(1) : "",
      modeles,
      prix,
      type,
      freq,
      transpondeur,
      lame,
      image,
    });

  } catch (e) {
    return res.status(500).json({ erreur: "Erreur serveur : " + e.message });
  }
}
