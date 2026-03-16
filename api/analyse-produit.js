// api/analyse-produit.js — fonction serverless Vercel (GRATUIT via microlink.io)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  try {
    // Microlink.io — gratuit, pas de clé API
    const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false`);
    const ml = await mlRes.json();

    if (ml.status !== "success") {
      return res.status(200).json({ erreur: "Impossible de lire cette page" });
    }

    const d = ml.data;
    const titre = d.title || "";
    const description = d.description || "";
    const texte = (titre + " " + description).toLowerCase();

    // Détection marque véhicule
    const marques = ["renault","peugeot","citroen","volkswagen","vw","bmw","mercedes","audi","ford","opel","toyota","nissan","fiat","seat","skoda","volvo","hyundai","kia","honda","mitsubishi","mazda","suzuki","dacia","mini","smart","porsche","land rover","jaguar","lexus"];
    const marque = marques.find(m => texte.includes(m)) || "";

    // Détection fréquence
    const freqMatch = texte.match(/(\d{3}[\.,]\d+\s*mhz|\d{3}\s*mhz)/i);
    const freq = freqMatch ? freqMatch[0].toUpperCase().replace(",", ".") : "";

    // Détection transpondeur
    const transpMatch = texte.match(/id[\s-]?(\d{2,3})|pcf\d{4,}|hitag\s?\d?|megamos/i);
    const transpondeur = transpMatch ? transpMatch[0].toUpperCase() : "";

    // Détection lame
    const lameMatch = texte.match(/\b(va[0-9]+|hu[0-9]+|huf[0-9]+|toy[0-9]+|sip[0-9]+|hu[0-9]+|nf[0-9]+|vac[0-9]+|fiat[0-9]+|hy[0-9]+|rn[0-9]+)\b/i);
    const lame = lameMatch ? lameMatch[0].toUpperCase() : "";

    // Détection type
    let type = "Clé";
    if (texte.includes("télécommande") || texte.includes("remote") || texte.includes("keyfob")) type = "Télécommande";
    else if (texte.includes("coque") || texte.includes("shell") || texte.includes("boitier")) type = "Coque";
    else if (texte.includes("transpondeur") || texte.includes("transponder")) type = "Transpondeur";
    else if (texte.includes("lame") || texte.includes("blade")) type = "Lame";

    // Détection prix
    const prixMatch = (titre + " " + description).match(/(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/);
    const prix = prixMatch ? parseFloat((prixMatch[1] || prixMatch[2]).replace(",", ".")) : 0;

    // Référence depuis l'URL
    const urlParts = url.split("/").filter(Boolean);
    const refSlug = urlParts[urlParts.length - 1] || "";
    const ref = refSlug.split("-").slice(0, 4).join("-").toUpperCase().slice(0, 20);

    return res.status(200).json({
      nom: titre || "Produit importé",
      ref: ref || "",
      marque: marque ? marque.charAt(0).toUpperCase() + marque.slice(1) : "",
      modeles: "",
      prix,
      type,
      freq,
      transpondeur,
      lame,
    });

  } catch (e) {
    return res.status(500).json({ erreur: "Erreur serveur : " + e.message });
  }
}
