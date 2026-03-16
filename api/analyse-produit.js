// api/analyse-produit.js — fonction serverless Vercel (GRATUIT via microlink.io)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  try {
    // Microlink.io — gratuit, pas de clé API
    const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&palette=false&audio=false&video=false&iframe=false&screenshot=false`);
    const ml = await mlRes.json();

    if (ml.status !== "success") {
      return res.status(200).json({ erreur: "Impossible de lire cette page" });
    }

    const d = ml.data;
    const titre = d.title || "";
    const description = d.description || "";
    const image = d.image?.url || d.logo?.url || "";
    const texte = (titre + " " + description).toLowerCase();

    // Détection marque véhicule
    const marques = ["renault","peugeot","citroen","volkswagen","vw","bmw","mercedes","audi","ford","opel","toyota","nissan","fiat","seat","skoda","volvo","hyundai","kia","honda","mitsubishi","mazda","suzuki","dacia","mini","smart","porsche","land rover","jaguar","lexus","xhorse","keydiy","autel"];
    const marque = marques.find(m => texte.includes(m)) || "";

    // Détection modèles compatibles
    const modelesConnus = [
      "clio","megane","scenic","laguna","kangoo","trafic","master","captur","twingo","zoe","fluence","duster",
      "206","207","208","306","307","308","406","407","408","508","3008","5008","partner","berlingo","c3","c4","c5","c8","xsara","picasso","dispatch",
      "golf","polo","passat","tiguan","touran","caddy","transporter","sharan","t5","t6","up","beetle",
      "serie 1","serie 2","serie 3","serie 4","serie 5","serie 7","x1","x3","x5","x6","m3",
      "classe a","classe b","classe c","classe e","classe s","vito","sprinter","ml","gl",
      "a1","a3","a4","a6","a8","q3","q5","q7","tt","rs",
      "fiesta","focus","mondeo","transit","kuga","ecosport","galaxy","s-max","c-max",
      "corsa","astra","vectra","zafira","meriva","insignia","vivaro","movano",
      "yaris","corolla","avensis","rav4","land cruiser","hilux","verso","auris","prius",
      "qashqai","micra","juke","x-trail","navara","note","almera","primera","pathfinder",
      "punto","panda","bravo","stilo","500","doblo","ducato","grande punto",
      "ibiza","leon","toledo","altea","alhambra","ateca",
      "octavia","fabia","superb","yeti","kodiaq","karoq",
      "s40","s60","s80","v40","v50","v60","xc60","xc90",
      "i10","i20","i30","i40","tucson","santa fe","ix35",
      "ceed","sportage","picanto","sorento","rio",
      "civic","jazz","cr-v","hr-v","accord",
      "outlander","asx","pajero","l200","galant",
      "3","6","cx-3","cx-5","cx-7","cx-9","2","mx-5",
      "swift","vitara","jimny","sx4","grand vitara",
      "sandero","logan","dokker","lodgy","duster",
    ];
    const modelesDetectes = modelesConnus.filter(m => texte.includes(m));
    const modeles = modelesDetectes.length > 0
      ? modelesDetectes.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")
      : "";

    // Détection fréquence
    const freqMatch = texte.match(/(\d{3}[\.,]\d+\s*mhz|\d{3}\s*mhz)/i);
    const freq = freqMatch ? freqMatch[0].toUpperCase().replace(",", ".").replace(" ", "") : "";

    // Détection transpondeur
    const transpMatch = texte.match(/id[\s-]?(\d{2,3})|pcf\s?\d{4,}|hitag\s?\d?|megamos|crypto/i);
    const transpondeur = transpMatch ? transpMatch[0].toUpperCase().replace(" ", "") : "";

    // Détection lame
    const lameMatch = texte.match(/\b(va\d+|hu\d+|huf\d+|toy\d+|sip\d+|nf\d+|vac\d+|hy\d+|rn\d+|df\d+|hca\d+|hca\d+|ya\d+)\b/i);
    const lame = lameMatch ? lameMatch[0].toUpperCase() : "";

    // Détection type
    let type = "Clé";
    if (texte.includes("télécommande") || texte.includes("remote") || texte.includes("keyfob") || texte.includes("plip")) type = "Télécommande";
    else if (texte.includes("coque") || texte.includes("shell") || texte.includes("boitier")) type = "Coque";
    else if (texte.includes("transpondeur") || texte.includes("transponder") || texte.includes("chip")) type = "Transpondeur";
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
