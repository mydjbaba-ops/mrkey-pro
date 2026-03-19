// api/analyse-produit.js — Extraction avancée (sans IA payante)

// Rate limiting: simple in-memory tracker
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // stricter since this does more work

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

  const { url, existingProducts = [] } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  // Validate URL
  if (typeof url !== "string" || url.length > 2048 || !isValidUrl(url)) {
    return res.status(400).json({ erreur: "URL invalide" });
  }

  try {
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
    clearTimeout(timeout);
    const html = await pageRes.text();
    const texte = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();

    // Titre & image
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const titre = titleMatch ? titleMatch[1].trim().split(" - ")[0].split(" | ")[0] : "";

    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const wooImageMatch = html.match(/class=["'][^"']*wp-post-image[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
                          html.match(/<img[^>]+src=["'](https?:\/\/[^"']+\/wp-content\/uploads\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i);
    const image = ogImageMatch?.[1] || wooImageMatch?.[1] || "";

    // Marque
    const MARQUES = [
      "Maserati","Ferrari","Lamborghini","Bentley","Rolls Royce","Aston Martin","Porsche",
      "Alfa Romeo","Lancia","Fiat","Abarth","Land Rover","Jaguar","Volvo","Saab",
      "Volkswagen","Audi","BMW","Mercedes","Opel","Smart","Mini",
      "Renault","Peugeot","Citroën","DS","Dacia",
      "Ford","Chevrolet","Chrysler","Dodge","Jeep","Tesla","Cadillac",
      "Toyota","Honda","Nissan","Mazda","Subaru","Mitsubishi","Suzuki","Lexus","Infiniti",
      "Hyundai","Kia","Ssangyong","Seat","Skoda","Cupra",
    ];
    const titreEtTexte = titre + " " + texte.slice(0, 3000);
    const marque = MARQUES.find(m => titreEtTexte.toLowerCase().includes(m.toLowerCase())) || "";

    // Modèles — extraction STRICTE
    // 1. Section HTML explicite (tableau compatibilité)
    // 2. Fallback : titre uniquement, TOUS les modèles listés après "pour [Marque]"
    // Jamais de liste interne, jamais d'inférence
    let modeles = "";
    const compatPatterns = [
      /(?:convient aux mod[eè]les suivants|compatible avec les mod[eè]les suivants|v[eé]hicules compatibles|la cl[eé][^<]{0,80}convient|fits the following|suitable for)[\s\S]{0,8000}?<\/(?:table|div|ul|section)>/i,
      /<table[\s\S]{0,300}?(?:marque|make|mod[eè]le|model|ann[eé]e|year)[\s\S]{0,8000}?<\/table>/i,
    ];
    let compatHtml = "";
    for (const pat of compatPatterns) {
      const m = html.match(pat);
      if (m) { compatHtml = m[0]; break; }
    }
    if (compatHtml) {
      const compatTexte = compatHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const lignes = compatTexte.split(/[;|\n]/).map(l => l.trim()).filter(l => l.length > 3 && l.length < 80);
      const modelesSet = new Set();
      lignes.forEach(l => {
        if (/[A-Z][a-z]/.test(l)) {
          const clean = l.replace(/\(\d{4}[^)]*\)/g, "").replace(/\d{4,}/g, "").trim().replace(/\s+/g, " ");
          if (clean.length > 2 && clean.length < 50) modelesSet.add(clean);
        }
      });
      modeles = [...modelesSet].join(", ");
    }

    // Fallback titre — extrait TOUS les modèles après "pour [Marque] M1 M2 M3..."
    if (!modeles && titre) {
      // Nettoyer le titre des refs techniques (PCF, fréquences, numéros longs)
      const titreClean = titre
        .replace(/pcf\d+/gi, "").replace(/\d{3,}mhz/gi, "").replace(/\d{3,}hz/gi, "")
        .replace(/\d{5,}/g, "").replace(/hitag[^\s]*/gi, "").replace(/aes/gi, "").replace(/keyless[^\s]*/gi, "")
        .replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
      // Pattern : "pour Marque M1 M2 M3 ..." jusqu'à une rupture technique
      const pourMatch = titreClean.match(/pour\s+([A-ZÀ-Ÿa-zà-ÿ][a-zà-ÿ]+)\s+((?:[A-Z][A-Za-z0-9-]{1,8}\s*)+)/i);
      if (pourMatch) {
        const marqueDetectee = pourMatch[1].charAt(0).toUpperCase() + pourMatch[1].slice(1);
        // Extraire chaque token modèle (2-8 chars, alphanum)
        const mods = pourMatch[2].trim().split(/\s+/).map(m => m.trim())
          .filter(m => m.length >= 2 && m.length <= 8 && /^[A-Za-z0-9-]+$/.test(m));
        if (mods.length > 0) modeles = mods.map(m => marqueDetectee + " " + m).join(", ");
      }
    }

    // Retourner l'ID transpondeur séparé du PCF
    const idMatch = texte.match(/\b(id4[0-9a-f]|id46|id47|id48|id4b|id4d|id33|id11|id12|id13|id60|id61|id63|id70|id72|id82|id83|id88|id94|id95|megamos|crypto|hitag\s?(?:2|aes|pro)?|ti\s?\d+)\b/i);
    const id_transpondeur = idMatch ? idMatch[0].toUpperCase().replace(/\s/g, "") : "";

    if (!modeles) modeles = "";

    // Caractéristiques techniques
    const freqMatch = texte.match(/(\d{3}[\.,]\d+\s*mhz|\d{3}\s*mhz)/i);
    const freq = freqMatch ? freqMatch[0].toUpperCase().replace(",", ".").replace(/\s/g, "") : "";

    const transpMatch = texte.match(/\b(pcf\s?\d{4,}|id[\s-]?\d{2,3}|hitag\s?(?:2|aes|pro)?|id4[0-9d]|id46|id48|id33)\b/i);
    const transpondeur = transpMatch ? transpMatch[0].toUpperCase().replace(/\s/g, "") : "";

    const pcfMatch = texte.match(/\b(pcf\s?\d{4,})\b/i);
    const pcf = pcfMatch ? pcfMatch[0].toUpperCase().replace(/\s/g, "") : "";

    const lameMatch = texte.match(/\b(va\d+|hu\d+|sip\d+|nf\d+|hu83|hu66|hu64|hu100|hu92|sip22|ft22|toy\d+)\b/i);
    const lame = lameMatch ? lameMatch[0].toUpperCase() : "";

    const pileMatch = texte.match(/\b(cr2032|cr2016|cr1620|cr1616)\b/i);
    const pile = pileMatch ? pileMatch[0].toUpperCase() : "";

    const boutonsMatch = texte.match(/(\d)\s*(?:bouton|button|touche)/i);
    const boutons = boutonsMatch ? parseInt(boutonsMatch[1]) : 0;

    const mainLibre = (texte.includes("mains libres") || texte.includes("keyless") || texte.includes("hands free")) ? "oui" : "non";

    let type = "Clé";
    if (texte.includes("télécommande") || texte.includes("remote") || texte.includes("plip")) type = "Télécommande";
    else if (texte.includes("carte") || texte.includes("card key")) type = "Carte";
    else if (texte.includes("smart key") || texte.includes("keyless go")) type = "Smart Key";
    else if (texte.includes("coque") || texte.includes("boitier vide")) type = "Coque";
    else if (texte.includes("transpondeur chip") || texte.includes("puce seule")) type = "Transpondeur";

    const prixMatch = html.match(/(\d+[.,]\d{2})\s*€/);
    const prix = prixMatch ? parseFloat(prixMatch[1].replace(",", ".")) : 0;

    const urlParts = url.split("/").filter(Boolean);
    const refSlug = urlParts[urlParts.length - 1] || "";
    const ref = refSlug.split("-").slice(0, 4).join("-").toUpperCase().slice(0, 20);

    let fiabilite = 20;
    if (titre) fiabilite += 15;
    if (marque) fiabilite += 20;
    if (freq) fiabilite += 10;
    if (transpondeur) fiabilite += 10;
    if (lame) fiabilite += 10;
    if (modeles) fiabilite += 10;
    if (image) fiabilite += 5;
    fiabilite = Math.min(fiabilite, 100);

    // Détection doublon
    let statut = "nouveau";
    let doublonExistant = null;
    let champsMisAJour = [];

    if (existingProducts.length > 0) {
      const refLow = ref.toLowerCase();
      const nomLow = (titre || "").toLowerCase();

      let match = existingProducts.find(p => refLow && p.ref && p.ref.toLowerCase() === refLow);

      if (!match) {
        match = existingProducts.find(p => {
          const mots1 = new Set(nomLow.split(/\s+/).filter(w => w.length > 3));
          const mots2 = new Set((p.nom || "").toLowerCase().split(/\s+/).filter(w => w.length > 3));
          return [...mots1].filter(w => mots2.has(w)).length >= 3;
        });
      }

      if (!match && freq && transpondeur && marque) {
        match = existingProducts.find(p =>
          p.marque?.toLowerCase() === marque.toLowerCase() &&
          p.freq === freq && p.transpondeur === transpondeur
        );
      }

      if (match) {
        statut = "doublon";
        doublonExistant = match;
        const newData = { freq, transpondeur, lame, pile, modeles, image, marque };
        champsMisAJour = Object.entries(newData)
          .filter(([k, v]) => v && !match[k])
          .map(([k]) => k);
      }
    }

    return res.status(200).json({
      nom: titre || "Produit importé",
      ref, prix, marque, type, freq, transpondeur, pcf,
      modeles, lame, pile, mainLibre, boutons, image, id_transpondeur, fiabilite,
      statut,
      doublonId:  doublonExistant?.id || null,
      doublonNom: doublonExistant?.nom || null,
      champsMisAJour,
    });

  } catch (e) {
    return res.status(500).json({ erreur: "Erreur serveur : " + e.message });
  }
}
