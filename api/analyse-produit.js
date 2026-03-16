// api/analyse-produit.js  — fonction serverless Vercel
// Place ce fichier dans : api/analyse-produit.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ erreur: "Méthode non autorisée" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ erreur: "URL manquante" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ erreur: "Clé API non configurée sur le serveur" });

  const prompt = `Tu es un expert en clés et télécommandes automobiles aftermarket.

Visite cette page produit et extrait les informations : ${url}

Réponds UNIQUEMENT en JSON valide (sans markdown, sans backticks) avec ces champs :
{
  "nom": "nom complet du produit",
  "ref": "référence ou SKU",
  "marque": "marque du véhicule compatible (Renault, Peugeot, BMW...)",
  "modeles": "modèles compatibles",
  "prix": 0,
  "type": "Clé ou Télécommande ou Coque ou Transpondeur ou Lame ou Accessoire",
  "freq": "fréquence radio (ex: 433MHz) ou vide",
  "transpondeur": "type transpondeur (ex: ID46) ou vide",
  "lame": "référence lame ou vide"
}

Si impossible d'analyser : {"erreur": "raison"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(200).json({ erreur: "Impossible d'extraire les données de cette page" });

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ erreur: "Erreur serveur : " + e.message });
  }
}
