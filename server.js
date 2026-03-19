import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// POST /api/photo  — extrait l'URL de la photo depuis une page produit
app.post("/api/photo", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "url manquante" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [
          {
            role: "user",
            content:
              `Visite cette page produit : ${url}\n` +
              `Trouve l'URL directe de la photo principale du produit (télécommande ou clé auto).\n` +
              `Réponds UNIQUEMENT avec un JSON : {"img":"URL_DIRECTE"}\n` +
              `Si pas de photo trouvée, réponds : {"img":""}`,
          },
        ],
      }),
    });

    const data = await response.json();

    // Extraire le texte de la réponse Claude
    let text = "";
    (data.content || []).forEach((block) => {
      if (block.type === "text") text += block.text;
    });

    // Parser le JSON retourné par Claude
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return res.json({ img: "" });

    const parsed = JSON.parse(match[0]);
    return res.json({ img: parsed.img || "" });

  } catch (err) {
    console.error("Erreur Anthropic:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Serveur KeyMaster sur http://localhost:${PORT}`));
