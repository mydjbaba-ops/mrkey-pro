
import React, { useState, useMemo, useEffect, useRef } from "react";
import { supabase, dbSet, dbGetAll } from "./src/supabase";
import AuthScreen, { ResetPasswordScreen } from "./src/AuthScreen";
import { KEY_IMAGES } from "./keyImages.js";
import { SILCA_IMGS } from "./silcaImages.js";
import { XHORSE_IMAGES } from "./xhorseImages.js";



// ============================================================
// ===== IMAGES INLINE SVG PAR MARQUE (pas de dépendance réseau)
// ============================================================
const svgKey = (bg, accent, label) => {
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
};

const IMG_PSA        = svgKey("#1a1f35", "#60a5fa", "PSA");
const IMG_PSA2       = svgKey("#1a1f35", "#93c5fd", "PSA");
const IMG_RENAULT    = svgKey("#1f1a35", "#a78bfa", "RENAULT");
const IMG_RENAULT_CARTE = svgKey("#1a2535", "#7dd3fc", "CARTE");
const IMG_VW         = svgKey("#0f1a25", "#38bdf8", "VW");
const IMG_BMW        = svgKey("#1c1a10", "#fbbf24", "BMW");
const IMG_MINI       = svgKey("#1a1015", "#fb7185", "MINI");
const IMG_TOYOTA     = svgKey("#1a1010", "#f87171", "TOYOTA");
const IMG_MERCEDES   = svgKey("#101a10", "#4ade80", "MERCED.");
const IMG_SMART      = svgKey("#101520", "#34d399", "SMART");
const IMG_FORD       = svgKey("#101525", "#60a5fa", "FORD");
const IMG_NISSAN     = svgKey("#15101a", "#c084fc", "NISSAN");
const IMG_FIAT       = svgKey("#1a1010", "#fb923c", "FIAT");

// ============================================================
// ===== STOCK DYNAMIQUE (produits ajoutés depuis véhicule) ===
// ============================================================
// ALL_PRODUCTS est maintenant géré dynamiquement via le stock
// Les produits sont créés quand l'utilisateur ajoute depuis Véhicule

const SEUIL_DEFAULT = 3;

const STOCK_KEY   = "mrkey_stock_v2";
const CLIENT_KEY  = "mrkey_clients_v1";
const INTERV_KEY  = "mrkey_interventions_v1";
const DEVIS_KEY   = "mrkey_devis_v1";
const SETTINGS_KEY= "mrkey_settings_v1";
const OE_LINKS_KEY = "mrkey_oe_links_v1";
const COUNTERS_KEY= "mrkey_counters_v1";

// Générateur de numéros séquentiels légaux
const getNextNum = (type) => {
  try {
    const counters = JSON.parse(localStorage.getItem(COUNTERS_KEY) || "{}");
    const year = new Date().getFullYear();
    const key = `${type}_${year}`;
    const next = (counters[key] || 0) + 1;
    counters[key] = next;
    localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
    return `${type}${year}-${String(next).padStart(4, "0")}`;
  } catch { return `${type}${Date.now().toString().slice(-6)}`; }
};
const PRODUCTS_KEY = "mrkey_products_v2";
const CUSTOM_AM_KEY = "mrkey_custom_am_v1";
const loadProducts = () => {
  try { const s = localStorage.getItem(PRODUCTS_KEY); return s ? JSON.parse(s) : []; } catch(e) { return []; }
};

const initStock = () => {
  try { const s = localStorage.getItem(STOCK_KEY); return s ? JSON.parse(s) : {}; } catch(e) { return {}; }
};

// ============================================================
// ========================= ICONS ============================
// ============================================================
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SearchIcon = () => <Icon d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const KeyIcon = () => <Icon d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />;


// ============================================================
// =================== DETAIL PAGE COMPONENT =================
// ============================================================
function DetailPage({ product: p, stock, setStock, setPage, setShowHistory, catColor, lienLabel, SEUIL_DEFAULT, onDelete, onUpdatePrix, onUpdateNom, onUpdateImage, onUpdateChamps }) {
  const qtyRef = useRef();
  const seuilRef = useRef();
  const prixRef = useRef();
  const nomRef = useRef();
  const refRef = useRef();
  const imageRef = useRef();
  const [flash, setFlash] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNom, setEditingNom] = useState(false);
  const [editingPrix, setEditingPrix] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [editingChamps, setEditingChamps] = useState(false);
  const [champsForm, setChampsForm] = useState({
    lame: p.lame || "",
    boutons: p.buttons || p.boutons || "",
    freq: p.freq || p.frequence || "",
    transpondeur: p.transpondeur || "",
    pile: p.pile || "",
    modeles: p.modeles || "",
    notes: p.notes || "",
    lien: p.lien || "",
  });
  const [tab, setTab] = useState("infos");

  const s = stock[p.id];
  const isInit = s?.init === true;
  const qty = s?.qty ?? 0;
  const seuil = s?.seuil ?? SEUIL_DEFAULT;
  const isLow = !isInit && qty <= seuil;
  const ln = lienLabel(p);

  const showFlash = (type) => { setFlash(type); setTimeout(() => setFlash(null), 900); };

  const handleSetQty = () => {
    const val = parseInt(qtyRef.current?.value);
    if (!isNaN(val) && val >= 0) {
      setStock(prev => { const cur = prev[p.id]; return { ...prev, [p.id]: { ...cur, qty: val, init: false, historique: [{ action: `=${val} (manuel)`, date: new Date().toLocaleDateString("fr-FR"), qty: val }, ...cur.historique.slice(0, 9)] } }; });
      if (qtyRef.current) qtyRef.current.value = "";
      showFlash("qty");
    }
  };

  const handleSetSeuil = () => {
    const val = parseInt(seuilRef.current?.value);
    if (!isNaN(val) && val >= 0) {
      setStock(prev => ({ ...prev, [p.id]: { ...prev[p.id], seuil: val, init: false } }));
      if (seuilRef.current) seuilRef.current.value = "";
      showFlash("seuil");
    }
  };

  const adjustStock = (delta) => {
    setStock(prev => {
      const cur = prev[p.id];
      const newQty = Math.max(0, cur.qty + delta);
      return { ...prev, [p.id]: { ...cur, qty: newQty, init: false, historique: [{ action: delta > 0 ? `+${delta}` : `${delta}`, date: new Date().toLocaleDateString("fr-FR"), qty: newQty }, ...cur.historique.slice(0, 9)] } };
    });
  };

  const DIcon = ({ d }) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "#c8d0e8", borderBottom: "1px solid rgba(108,99,255,0.12)" }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: "#6c63ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
          <DIcon d="M19 12H5M12 5l-7 7 7 7" /> Retour
        </button>
        <div style={{ flex: 1 }} />
        {onDelete && (
          showDeleteConfirm ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#ff4757", fontWeight: 600 }}>Confirmer ?</span>
              <button onClick={() => { onDelete(p.id); setPage("home"); }} style={{ background: "#ff4757", border: "none", borderRadius: 8, padding: "5px 10px", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Oui</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ background: "none", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "5px 10px", color: "#5a6585", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>Non</button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)} style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 8, padding: "6px 10px", color: "#ff4757", fontSize: 13, cursor: "pointer" }}>🗑</button>
          )
        )}
      </div>

      {/* ── Onglets Infos / Modifier ── */}
      <div style={{ display: "flex", background: "#c8d0e8", borderBottom: "2px solid rgba(108,99,255,0.15)" }}>
        {[["infos","📋 Infos"],["modifier","✏️ Modifier"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex: 1, padding: "11px 0", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              color: tab === key ? "#6c63ff" : "#5a6585",
              borderBottom: tab === key ? "2.5px solid #6c63ff" : "2.5px solid transparent",
              transition: "all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <img src={p.image} alt={p.nom} style={{ width: "100%", height: 190, objectFit: "contain", background: "#c8d0e8", borderBottom: "1px solid rgba(108,99,255,0.1)" }} onError={e => { e.target.src = FALLBACK_IMG; }} />
      </div>
      {/* ── En-tête nom/ref toujours visible ── */}
      <div style={{ padding: "14px 18px 10px", background: "#c8d0e8", borderBottom: "1px solid rgba(108,99,255,0.08)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: catColor(p.categorie), textTransform: "uppercase", letterSpacing: 1 }}>{p.categorie}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#1a1d2e", marginTop: 3, lineHeight: 1.3 }}>{p.nom}</div>
        <div style={{ fontSize: 12, color: "#5a6585", marginTop: 2, fontFamily: "monospace" }}>Réf : {p.ref}</div>
      </div>

      {/* ── Contenu conditionné par onglet ── */}
      <div style={{ padding: 18 }}>

      {tab === "infos" && (<>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {p.type && <span style={{ fontSize: 10, fontWeight: 800, color: "#6c63ff", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", padding: "2px 8px", borderRadius: 5 }}>{p.type}</span>}
          {p.ref && <span style={{ fontSize: 10, fontWeight: 900, color: "#fff", background: "linear-gradient(135deg,#cc0000,#ff4444)", padding: "2px 9px", borderRadius: 5 }}>{p.ref}</span>}
          {p.marque && <span style={{ fontSize: 10, fontWeight: 700, color: "#cc0000", background: "rgba(204,0,0,0.08)", padding: "2px 7px", borderRadius: 5 }}>{p.marque}</span>}
          {p.prox && <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "#cc0000", padding: "2px 8px", borderRadius: 5 }}>🔒 Proximité</span>}
        </div>

        {/* Véhicules compatibles */}
        {p.applications && p.applications.length > 0 && (
          <div style={{ background: "#dde3f2", borderRadius: 12, padding: "10px 12px", marginBottom: 8, border: "1px solid rgba(108,99,255,0.15)" }}>
            <div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Véhicules compatibles ({p.applications.length})</div>
            {p.applications.map((a, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < p.applications.length - 1 ? "1px solid rgba(108,99,255,0.08)" : "none" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1d2e" }}>{a.make} <span style={{ fontWeight: 600 }}>{a.model}</span></span>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {a.ref && <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", background: "linear-gradient(135deg,#cc0000,#ff4444)", padding: "1px 6px", borderRadius: 4 }}>{a.ref}</span>}
                  {(a.from || a.to) && <span style={{ fontSize: 10, color: "#5a6585" }}>{a.from}{a.to && a.to !== a.from ? `–${a.to}` : ""}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specs techniques */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
          {[
            p.lame && ["Lame", p.lame],
            (p.buttons || p.boutons) && ["Boutons", (p.buttons || p.boutons) + " boutons"],
            (p.freq || p.frequence) && ["Fréquence", p.freq || p.frequence],
            p.transpondeur && ["Transpondeur", p.transpondeur],
            p.pile && ["Pile", p.pile],
            p.modeles && !p.applications?.length && ["Modèles", p.modeles],
            p.xhorse && ["Xhorse", p.xhorse],
            p.notes && ["Notes", p.notes],
          ].filter(Boolean).map(([label, val]) => (
            <div key={label} style={{ background: "#dde3f2", borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(108,99,255,0.15)" }}>
              <div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 12.5, color: "#1a1d2e", fontWeight: 600, marginTop: 2 }}>{val}</div>
            </div>
          ))}
          {p.prix > 0 && <div style={{ background: "#dde3f2", borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(108,99,255,0.15)" }}><div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Prix indicatif</div><div style={{ fontSize: 12.5, color: "#e8a020", fontWeight: 800, marginTop: 2 }}>{p.prix.toFixed(2)} €</div></div>}
        </div>

        {/* OE Part Numbers / liens */}
        {(p.oeLinks?.length > 0 || p.lien) && (
          <div style={{ background: "#dde3f2", borderRadius: 12, padding: "10px 12px", marginTop: 8, border: "1px solid rgba(108,99,255,0.15)" }}>
            <div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>🔗 OE Part Numbers</div>
            {p.oeLinks?.map((lk, i) => (
              <a key={i} href={lk.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < p.oeLinks.length - 1 ? "1px solid rgba(108,99,255,0.08)" : "none", textDecoration: "none" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6c63ff" }}>{lk.label}</span>
                <span style={{ fontSize: 10, color: "#5a6585", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lk.url}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            ))}
            {p.lien && !p.oeLinks?.length && (
              <a href={p.lien} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6c63ff" }}>Voir le produit</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </a>
            )}
          </div>
        )}
      </>)}

      {tab === "modifier" && (<>

        {/* ── Nom & Référence ── */}
        <div style={{ background: "#e8edf8", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid rgba(108,99,255,0.12)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Nom & Référence</div>
          {editingNom ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input ref={nomRef} defaultValue={p.nom}
                style={{ background: "#fff", border: "1px solid rgba(108,99,255,0.4)", borderRadius: 10, padding: "10px 12px", color: "#1a1d2e", fontSize: 14, fontWeight: 700, outline: "none", width: "100%" }}
                placeholder="Nom du produit" />
              <input ref={refRef} defaultValue={p.ref}
                style={{ background: "#fff", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 10, padding: "8px 12px", color: "#1a1d2e", fontSize: 12, fontFamily: "monospace", outline: "none", width: "100%" }}
                placeholder="Référence" />
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => {
                  const nom = nomRef.current?.value?.trim();
                  const ref = refRef.current?.value?.trim();
                  if (nom && onUpdateNom) { onUpdateNom(p.id, nom, ref || p.ref); setEditingNom(false); showFlash("nom"); }
                }} style={{ flex: 2, padding: "8px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>✓ Enregistrer</button>
                <button onClick={() => setEditingNom(false)} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d2e" }}>{flash === "nom" ? "✓ Nom mis à jour !" : p.nom}</div>
                <div style={{ fontSize: 11, color: "#5a6585", fontFamily: "monospace", marginTop: 2 }}>{p.ref}</div>
              </div>
              {onUpdateNom && <button onClick={() => setEditingNom(true)} style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "6px 10px", color: "#6c63ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</button>}
            </div>
          )}
        </div>

        {/* ── Photo ── */}
        <div style={{ background: "#e8edf8", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid rgba(108,99,255,0.12)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Photo</div>
          {editingImage ? (
            <div>
              <div style={{ fontSize: 11, color: "#5a6585", marginBottom: 8 }}>URL de la page produit ou URL directe de l'image</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={imageRef} type="text" placeholder="https://..."
                  style={{ flex: 1, background: "#fff", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 10, padding: "9px 12px", color: "#1a1d2e", fontSize: 12, outline: "none" }} />
                <button onClick={async () => {
                  const val = imageRef.current?.value?.trim();
                  if (!val) return;
                  if (val.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
                    if (onUpdateImage) { onUpdateImage(p.id, val); setEditingImage(false); showFlash("image"); }
                  } else {
                    showFlash("loading");
                    try {
                      const r = await fetch("/api/image-produit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: val }) });
                      const d = await r.json();
                      if (d.image && onUpdateImage) { onUpdateImage(p.id, d.image); setEditingImage(false); showFlash("image"); }
                      else { showFlash("error"); }
                    } catch { showFlash("error"); }
                  }
                }} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  {flash === "loading" ? "⏳" : "OK"}
                </button>
                <button onClick={() => setEditingImage(false)} style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", cursor: "pointer" }}>✕</button>
              </div>
              {flash === "error" && <div style={{ marginTop: 6, fontSize: 11, color: "#ff4757", fontWeight: 600 }}>⚠ Impossible de trouver la photo</div>}
            </div>
          ) : (
            <button onClick={() => setEditingImage(true)}
              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.2)", background: "rgba(108,99,255,0.05)", color: "#6c63ff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              {flash === "image" ? "✓ Photo mise à jour !" : "📸 Changer la photo"}
            </button>
          )}
        </div>

        {/* ── Prix ── */}
        {onUpdatePrix && (
          <div style={{ background: "#e8edf8", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid rgba(108,99,255,0.12)" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Prix indicatif HT</div>
            {editingPrix ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input ref={prixRef} type="number" min="0" step="0.01" defaultValue={p.prix || ""} placeholder="Prix HT (€)"
                  style={{ flex: 1, background: "#fff", border: "1px solid rgba(234,88,12,0.3)", borderRadius: 10, padding: "10px 12px", color: "#1a1d2e", fontSize: 13, outline: "none" }}
                  onKeyDown={e => { if (e.key === "Enter") { onUpdatePrix(p.id, parseFloat(prixRef.current.value)); setEditingPrix(false); showFlash("prix"); } }} />
                <button onClick={() => { const v = parseFloat(prixRef.current?.value); if (!isNaN(v) && v >= 0) { onUpdatePrix(p.id, v); setEditingPrix(false); showFlash("prix"); } }}
                  style={{ padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#ea580c,#f97316)", color: "#fff", fontWeight: 700, fontSize: 12 }}>OK</button>
                <button onClick={() => setEditingPrix(false)}
                  style={{ padding: "10px 10px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#e8a020" }}>{p.prix ? p.prix.toFixed(2) + " €" : "—"}</span>
                <button onClick={() => setEditingPrix(true)} style={{ background: "rgba(234,88,12,0.08)", border: "1px solid rgba(234,88,12,0.2)", borderRadius: 8, padding: "6px 10px", color: "#ea580c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {flash === "prix" ? "✓ Mis à jour !" : "✏️ Modifier"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Caractéristiques & Lien ── */}
        <div style={{ background: "#e8edf8", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid rgba(108,99,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editingChamps ? 12 : 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 1 }}>Caractéristiques & Lien</div>
            {!editingChamps && <button onClick={() => setEditingChamps(true)} style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "6px 10px", color: "#6c63ff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</button>}
          </div>
          {editingChamps ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["lame",         "🔑 Lame",          "ex: VA2, HU100"],
                ["boutons",      "🔢 Boutons",        "ex: 3"],
                ["freq",         "📡 Fréquence",      "ex: 433MHz"],
                ["transpondeur", "🔐 Transpondeur",   "ex: PCF7936"],
                ["pile",         "🔋 Pile",           "ex: CR2032"],
                ["modeles",      "🚗 Modèles",        "ex: 308, 3008 2013-2020"],
                ["notes",        "📝 Notes",          "Informations complémentaires"],
                ["lien",         "🔗 Lien fournisseur","https://..."],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: "#5a6585", fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <input
                    value={champsForm[key]}
                    onChange={e => setChampsForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: "100%", background: "#fff", border: "1px solid rgba(108,99,255,0.25)", borderRadius: 9, padding: "8px 11px", color: "#1a1d2e", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button onClick={() => {
                  if (onUpdateChamps) onUpdateChamps(p.id, champsForm);
                  setEditingChamps(false);
                  showFlash("champs");
                }} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>✓ Enregistrer</button>
                <button onClick={() => setEditingChamps(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {flash === "champs" ? (
                <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>✓ Caractéristiques mises à jour !</span>
              ) : (
                [
                  champsForm.lame         && ["Lame",         champsForm.lame],
                  champsForm.boutons      && ["Boutons",      champsForm.boutons],
                  champsForm.freq         && ["Fréq.",        champsForm.freq],
                  champsForm.transpondeur && ["Transp.",      champsForm.transpondeur],
                  champsForm.pile         && ["Pile",         champsForm.pile],
                  champsForm.modeles      && ["Modèles",      champsForm.modeles],
                  champsForm.notes        && ["Notes",        champsForm.notes],
                  champsForm.lien         && ["Lien",         "✓ défini"],
                ].filter(Boolean).map(([l, v]) => (
                  <span key={l} style={{ fontSize: 10, background: "#dde3f2", borderRadius: 6, padding: "3px 8px", color: "#1a1d2e" }}>
                    <span style={{ color: "#5a6585", marginRight: 3 }}>{l}</span>{v}
                  </span>
                ))
              )}
              {!flash && Object.values(champsForm).every(v => !v) && (
                <span style={{ fontSize: 11, color: "#5a6585" }}>Aucune caractéristique renseignée</span>
              )}
            </div>
          )}
        </div>

        {/* ── Stock ── */}
        <div style={{ background: "#e8edf8", borderRadius: 14, padding: 16, border: "1px solid rgba(108,99,255,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>Stock actuel</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: isInit ? "#5a6585" : isLow ? "#ff6b6b" : "#4ade80" }}>{isInit ? "—" : qty}</div>
              {isInit && <div style={{ fontSize: 11, color: "#5a6585", marginTop: 1 }}>Stock non renseigné</div>}
              {isLow && <div style={{ fontSize: 11, color: "#ff6b6b", marginTop: 1 }}>⚠ Seuil atteint ({seuil})</div>}
              {!isInit && (() => { const aCommander = Math.max(0, seuil * 2 - qty); return aCommander > 0 ? (
                <div style={{ marginTop: 6, background: "rgba(255,167,38,0.1)", border: "1px solid rgba(255,167,38,0.3)", borderRadius: 8, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#e8a020", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>À commander</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#e8a020" }}>{aCommander}</span>
                  <span style={{ fontSize: 10, color: "#5a6585" }}>clé{aCommander > 1 ? "s" : ""}</span>
                </div>
              ) : (
                <div style={{ marginTop: 6, background: "rgba(0,245,147,0.1)", border: "1px solid rgba(0,245,147,0.25)", borderRadius: 8, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#00b87a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Stock suffisant</span>
                  <span style={{ fontSize: 10, color: "#5a6585" }}>0 clé à commander</span>
                </div>
              ); })()}
            </div>
            <button onClick={() => setShowHistory(p.id)} style={{ background: "#e8edf8", border: "1px solid rgba(108,99,255,0.15)", color: "#5a6585", padding: "8px 12px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <DIcon d="M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3M3 4v4h4" /> Historique
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,71,87,0.2)", cursor: "pointer", background: "rgba(255,71,87,0.08)", color: "#ff4757", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => adjustStock(-1)}><DIcon d="M5 12h14" /></button>
            <div style={{ flex: 1, textAlign: "center", fontSize: 12, color: "#5a6585" }}>Ajuster</div>
            <button style={{ width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(0,245,147,0.2)", cursor: "pointer", background: "rgba(0,245,147,0.08)", color: "#00b87a", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => adjustStock(1)}><DIcon d="M12 5v14M5 12h14" /></button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            <input ref={qtyRef} type="number" min="0"
              placeholder={flash === "qty" ? "✓ Enregistré !" : isInit ? "Quantité exacte" : `Quantité exacte (actuel : ${qty})`}
              style={{ flex: 1, background: flash === "qty" ? "rgba(0,245,147,0.08)" : "#fff", border: `1px solid ${flash === "qty" ? "#00b87a" : "rgba(108,99,255,0.2)"}`, borderRadius: 12, padding: "10px 14px", color: flash === "qty" ? "#00b87a" : "#1a1d2e", fontSize: 13, outline: "none", transition: "all 0.3s" }}
              onKeyDown={e => e.key === "Enter" && handleSetQty()} />
            <button style={{ padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12 }} onClick={handleSetQty}>Définir</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
            <input ref={seuilRef} type="number" min="0"
              placeholder={flash === "seuil" ? `✓ Seuil → ${seuil}` : `Seuil alerte (actuel: ${seuil})`}
              style={{ flex: 1, background: flash === "seuil" ? "rgba(0,245,147,0.08)" : "#fff", border: `1px solid ${flash === "seuil" ? "#00b87a" : "rgba(108,99,255,0.2)"}`, borderRadius: 12, padding: "10px 14px", color: flash === "seuil" ? "#00b87a" : "#1a1d2e", fontSize: 13, outline: "none", transition: "all 0.3s" }}
              onKeyDown={e => e.key === "Enter" && handleSetSeuil()} />
            <button style={{ padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12 }} onClick={handleSetSeuil}>Seuil</button>
          </div>
        </div>
      </>)}

      </div>

        {ln && tab === "infos" && <div style={{ padding: "0 18px" }}><a href={p.lien} target="_blank" rel="noopener noreferrer" style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", background: ln.bg, color: ln.color, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}><DIcon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /> {ln.label}</a></div>}
        {tab === "infos" && <div style={{ padding: "0 18px 18px" }}><a href={`https://www.google.com/search?q=${encodeURIComponent(p.nom)}`} target="_blank" rel="noopener noreferrer" style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(66,133,244,0.25)", cursor: "pointer", background: "rgba(66,133,244,0.08)", color: "#2563eb", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Rechercher sur Google
        </a></div>}
    </div>
  );
}



// ============================================================
// ===== IMAGES CLÉS PAR PROFIL DE LAME (SVG base64) ==========
// ============================================================


// Obtenir l'image pour une lame (prend la première lame reconnue)
function getKeyImage(lameStr) {
  if (!lameStr) return null;
  var lames = lameStr.split(/[/\s,]+/);
  for (var i = 0; i < lames.length; i++) {
    var l = lames[i].trim().toUpperCase();
    if (KEY_IMAGES[l]) return KEY_IMAGES[l];
    // Match partiel
    for (var k in KEY_IMAGES) {
      if (l.startsWith(k) || k.startsWith(l.split("-")[0])) return KEY_IMAGES[k];
    }
  }
  return null;
}

// ============================================================
// ===== CATALOGUE XHORSE PAR MARQUE/MODÈLE (app V4.9.2) ====
// ============================================================
import { XHORSE_DB } from "./xhorseData.js";


const XHORSE_BADGE_COLORS = {
  "XN-Wireless":   "#1d4ed8",
  "XE-Wireless":   "#7c3aed",
  "NXP-SmartKey":  "#ea580c",
  "XM38-SmartKey": "#ea580c",
  "XM38-TOYOTA":   "#ea580c",
  "XM38-HYUNDAI":  "#ea580c",
  "XK-Wired":      "#991b1b",
};

// ============================================================
// =================== VEHICULE DATABASE ======================
// ============================================================


// ============================================================
// =================== SILCA CATALOGUE DB =====================
// ============================================================
// Source: Silca Proximity / Slot / Remote Car Keys - March 2026
// Type: P=Proximity, S=Slot, R=Remote
// Each entry: { ref, type, buttons, blade, freq, transponder, applications[] }
// applications: { make, model, chassis, from, to }
// ── Images réelles Silca (webp base64, 1 par référence) ─────────────────────


function getSilcaImage(ref) {
  // 1. Image webp directe dans SILCA_IMGS (clés Silca catalogue)
  if (SILCA_IMGS[ref]) return SILCA_IMGS[ref];
  // 2. Image custom stockée dans SILCA_IMGS avec une clé différente (ex. MK20310-BMW)
  const entry = SILCA_DB.find(e => e.ref === ref);
  if (entry && entry.image && SILCA_IMGS[entry.image]) return SILCA_IMGS[entry.image];
  return null;
}

import { SILCA_DB } from "./silcaData.js";


// Deduplicated brands from SILCA_DB
const SILCA_MARQUES = [...new Set(SILCA_DB.map(s => s.marque))].sort();


// ============================================================
// =================== RECHERCHE VEHICULE =====================
// ============================================================
// ============================================================
// =================== SILCA TAB COMPONENT ====================
// ============================================================
// ─────────────────────────────────────────────────────────────────────────────
// SILCA — SVG fallback par profil de lame (1 image par lame, pas par véhicule)
// ─────────────────────────────────────────────────────────────────────────────
const makeSilcaSVG = (blade, col) => {
  const c = col || "#cc0000";
  // Distinguish key shape by type letter in ref: P=proximity oval, S=card, R=flip
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
    // Generic remote / slot
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
};

// Couleurs par famille de lame
const BLADE_COLORS = {
  GT: "#6c63ff", SIP: "#cc0000", HU6: "#2563eb", HU9: "#f59e0b",
  CY: "#7c3aed", FO: "#0284c7", HU1: "#0284c7", HU8: "#0ea5e9",
  HO: "#dc2626", KIA: "#059669", HYN: "#059669",
  MAZ: "#d97706", HU10: "#f97316", NSN: "#8b5cf6",
  NE: "#a78bfa", VA: "#a78bfa", TOY: "#ef4444",
  HU13: "#16a34a", HU20: "#ec4899", YM: "#34d399",
};
function bladeColor(blade) {
  if (!blade) return "#888";
  for (const [prefix, col] of Object.entries(BLADE_COLORS)) {
    if (blade.toUpperCase().startsWith(prefix.toUpperCase())) return col;
  }
  return "#888";
}

// Cache global des SVG fallback (une entrée par lame unique)
const SVG_CACHE = {};
function getSilcaSVG(blade) {
  if (!SVG_CACHE[blade]) SVG_CACHE[blade] = makeSilcaSVG(blade, bladeColor(blade));
  return SVG_CACHE[blade];
}

// ─────────────────────────────────────────────────────────────────────────────
// SilcaPhoto — affiche l'image réelle webp de la clé (intégrée dans SILCA_IMGS)
// Pas d'appel réseau : l'image est déjà en base64 dans le bundle.
// Le SVG généré sert uniquement pour les quelques refs sans image (ex. NSN14R14).
// ─────────────────────────────────────────────────────────────────────────────
function SilcaPhoto({ entry }) {
  const realImg = getSilcaImage(entry.ref);
  const svg     = getSilcaSVG(entry.blade);
  const src     = realImg || svg;

  return (
    <div style={{ width: 90, flexShrink: 0 }}>
      <img
        src={src}
        alt={entry.ref}
        onError={e => { if (e.target.src !== svg) e.target.src = svg; }}
        style={{ width: 90, height: 90, objectFit: "contain", borderRadius: 12,
          background: "#f0f2f8", border: "1px solid rgba(204,0,0,0.13)", display: "block" }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SilcaTab — onglet principal : 1 carte = 1 référence Silca = 1 seule image
// ─────────────────────────────────────────────────────────────────────────────
function SilcaTab({ onAddToStock, stock, bgCard, accent, textDim, textMid, oeLinksOverrides, setOeLinksOverrides }) {
  const [editingRef, setEditingRef] = useState(null);
  const overrides = oeLinksOverrides || {};
  const [filterMarque, setFilterMarque] = useState("");
  const [cardEdits,   setCardEdits]   = useState(() => { try { return JSON.parse(localStorage.getItem("mrkey_card_edits_v1") || "{}"); } catch { return {}; } });
  const [editingCard, setEditingCard] = useState(null);
  const saveCardEdit = (ref, patch) => {
    setCardEdits(prev => {
      const next = { ...prev, [ref]: { ...(prev[ref] || {}), ...patch } };
      try { localStorage.setItem("mrkey_card_edits_v1", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const resetCardEdit = (ref) => {
    setCardEdits(prev => {
      const next = { ...prev }; delete next[ref];
      try { localStorage.setItem("mrkey_card_edits_v1", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [filterType,   setFilterType]   = useState(""); // "" | P | S | R
  const [search,       setSearch]       = useState("");
  const [openRef,      setOpenRef]      = useState(null); // which ref card is expanded
  const [added,        setAdded]        = useState({});   // ref → bool

  const RED   = "#cc0000";
  const GRAD  = "linear-gradient(135deg,#cc0000,#ff5050)";
  const TICON = { P: "🔒", S: "💳", R: "📡" };
  const TLBL  = { P: "Proximité", S: "Slot",     R: "Télécommande" };
  const TCOL  = { P: "#6c63ff",   S: "#0099cc",  R: "#cc0000"      };

  // ── Filtrage : une entrée par référence Silca unique ──────────────────────
  const filtered = useMemo(() => {
    let data = SILCA_DB;

    // Dédoublonner : si la même ref apparaît deux fois dans SILCA_DB (Smart/Renault),
    // on garde la première occurrence
    const seen = new Set();
    data = data.filter(e => { if (seen.has(e.ref)) return false; seen.add(e.ref); return true; });

    if (filterType)   data = data.filter(e => e.type === filterType);
    if (filterMarque) data = data.filter(e =>
      e.marque.toLowerCase() === filterMarque.toLowerCase() ||
      e.applications.some(a => a.make.toLowerCase().includes(filterMarque.toLowerCase()))
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        e.ref.toLowerCase().includes(q) ||
        e.blade.toLowerCase().includes(q) ||
        e.applications.some(a =>
          a.make.toLowerCase().includes(q) || a.model.toLowerCase().includes(q)
        )
      );
    }
    return data;
  }, [filterMarque, filterType, search]);

  function doAdd(entry) {
    if (added[entry.ref]) return;
    const mainApp = entry.applications[0];
    const marqueVehicule = mainApp ? mainApp.make : (entry.marque || "");
    const modeles = entry.applications ? entry.applications.map(a => a.model).filter(Boolean).join(", ") : "";
    const label = mainApp ? `${mainApp.make} ${mainApp.model}` : entry.marque;
    onAddToStock && onAddToStock({
      id:            "silca-" + entry.ref + "-" + Date.now(),
      nom:           label + " · " + TLBL[entry.type] + " [" + entry.ref + "]",
      ref:           entry.ref,
      lame:          entry.blade,
      marque:        marqueVehicule,
      modeles:       modeles,
      transpondeur:  entry.transponder || "",
      freq:          entry.freq,
      type:          TLBL[entry.type] || "Clé",
      buttons:       entry.buttons,
      prix:          0,
      categorie:     "Aftermarket France",
      emoji:         TICON[entry.type],
      silcaType:     entry.type,
      applications:  entry.applications,
      image:         getSilcaSVG(entry.blade),
    });
    setAdded(p => ({ ...p, [entry.ref]: true }));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ─ Bannière ─ */}
      <div style={{ background: GRAD, borderRadius: 16, padding: "13px 15px", marginBottom: 11,
        display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.18)", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🗝️</div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>Catalogue Aftermarket</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.82)", marginTop: 1 }}>
            Clés aftermarket compatibles · Mars 2026
          </div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.58)", marginTop: 1 }}>
            {SILCA_DB.length} références · {SILCA_MARQUES.length} marques
          </div>
        </div>
      </div>

      {/* ─ Filtre type ─ */}
      <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
        {[["", "Tous"], ["P", "🔒 Prox."], ["S", "💳 Slot"], ["R", "📡 Remote"]].map(([t, lbl]) => (
          <button key={t} onClick={() => { setFilterType(t); setOpenRef(null); }}
            style={{ flex: 1, padding: "8px 2px", borderRadius: 10, fontWeight: 700, fontSize: 11,
              cursor: "pointer", border: "1px solid " + (filterType === t ? RED : "rgba(204,0,0,0.22)"),
              background: filterType === t ? GRAD : "transparent",
              color: filterType === t ? "#fff" : RED }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ─ Marque ─ */}
      <div style={{ position: "relative", marginBottom: 7 }}>
        <select value={filterMarque} onChange={e => { setFilterMarque(e.target.value); setOpenRef(null); }}
          style={{ width: "100%", background: bgCard, border: "1px solid rgba(204,0,0,0.22)",
            borderRadius: 12, padding: "11px 36px 11px 13px", appearance: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 13, outline: "none", boxSizing: "border-box",
            color: filterMarque ? "#1a1d2e" : "#8890aa" }}>
          <option value="">— Toutes les marques —</option>
          {SILCA_MARQUES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", color: RED, fontSize: 12 }}>▼</div>
      </div>

      {/* ─ Recherche libre ─ */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Modèle de véhicule, lame, référence..."
        style={{ width: "100%", background: bgCard, border: "1px solid rgba(204,0,0,0.18)",
          borderRadius: 12, padding: "11px 13px", fontSize: 13, color: "#1a1d2e",
          outline: "none", boxSizing: "border-box", marginBottom: 9,
          fontFamily: "'Plus Jakarta Sans',sans-serif" }} />

      {/* ─ Compteur ─ */}
      <div style={{ fontSize: 11, color: textDim, marginBottom: 8 }}>
        {filtered.length} clé{filtered.length !== 1 ? "s" : ""} Aftermarket
      </div>

      {/* ─ Liste des cartes (1 par référence) ─ */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", color: textDim }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Aucune référence trouvée</div>
          <div style={{ fontSize: 12, marginTop: 5 }}>Modifiez les filtres ou la recherche</div>
        </div>
      ) : filtered.map(entry => {
        const isOpen = openRef === entry.ref;
        const isAdded = added[entry.ref];
        // Résumé des véhicules pour la ligne preview (collapsed)
        const makes = [...new Set(entry.applications.map(a => a.make))];
        const preview = makes.slice(0, 3).join(", ") + (makes.length > 3 ? ` +${makes.length - 3}` : "");

        return (
          <div key={entry.ref}
            style={{ background: bgCard, borderRadius: 16, marginBottom: 8, overflow: "hidden",
              border: "1px solid " + (isOpen ? "rgba(204,0,0,0.28)" : "rgba(204,0,0,0.1)"),
              transition: "border-color 0.15s" }}>

            {/* ── En-tête de carte (toujours visible) ─────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px",
              cursor: "pointer", background: isOpen ? "rgba(204,0,0,0.03)" : "transparent" }}
              onClick={() => setOpenRef(isOpen ? null : entry.ref)}>

              {/* Image réelle webp de la clé (base64 intégrée) */}
              <SilcaPhoto entry={entry} />

              {/* Infos de la clé */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Type badge + ref Aftermarket + marque auto */}
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: TCOL[entry.type],
                    background: TCOL[entry.type] + "18", border: "1px solid " + TCOL[entry.type] + "40",
                    padding: "2px 8px", borderRadius: 5 }}>
                    {TICON[entry.type]} {TLBL[entry.type]}
                  </span>
                  {/* Référence Aftermarket — toujours visible même carte fermée */}
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#fff",
                    background: GRAD, padding: "2px 9px", borderRadius: 5, letterSpacing: 0.3 }}>
                    {entry.ref}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: RED,
                    background: "rgba(204,0,0,0.08)", padding: "2px 7px", borderRadius: 5 }}>
                    {entry.marque}
                  </span>
                </div>

                {/* Véhicules compatibles — aperçu compact avec ref */}
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1a1d2e",
                  lineHeight: 1.4, marginBottom: 4, letterSpacing: "-0.1px" }}>
                  {entry.applications.slice(0, 4).map((a, i) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color: "#b0b8cc", margin: "0 3px" }}>·</span>}
                      <span style={{ color: "#1a1d2e" }}>{a.make} {a.model}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: RED,
                        background: "rgba(204,0,0,0.1)", padding: "1px 5px",
                        borderRadius: 4, marginLeft: 4, verticalAlign: "middle",
                        letterSpacing: 0.3 }}>{entry.ref}</span>
                    </span>
                  ))}
                  {entry.applications.length > 4 &&
                    <span style={{ fontSize: 10, color: textDim, marginLeft: 4 }}>
                      +{entry.applications.length - 4}
                    </span>
                  }
                </div>

                {/* Specs techniques inline */}
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {[
                    ["Lame", entry.blade],
                    [entry.buttons + " btn", null],
                    [entry.freq, null],
                    [entry.transponder, null],
                  ].map(([val, label], i) => (
                    <span key={i} style={{ fontSize: 9.5, fontWeight: label ? 600 : 700,
                      color: i === 0 ? "#1a1d2e" : "#5a6080",
                      background: i === 0 ? "rgba(108,99,255,0.1)" : "transparent",
                      padding: i === 0 ? "1px 6px" : "0", borderRadius: 4 }}>
                      {label ? <span style={{ color: "#8890aa", fontWeight: 600 }}>{label} </span> : null}
                      {val}
                    </span>
                  ))}
                </div>

                {/* Nb de véhicules compatibles */}
                <div style={{ fontSize: 10, color: textDim, marginTop: 3 }}>
                  {entry.applications.length} véhicule{entry.applications.length > 1 ? "s" : ""} compatible{entry.applications.length > 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ color: RED, fontSize: 18, flexShrink: 0,
                transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</div>
            </div>

            {/* ── Détail déroulé ───────────────────────────────────────────── */}
            {isOpen && (() => {
              const ed = cardEdits[entry.ref] || {};
              const dispRef   = ed.ref         ?? entry.ref;
              const dispBlade = ed.blade        ?? entry.blade;
              const dispBtn   = ed.buttons      ?? entry.buttons;
              const dispFreq  = ed.freq         ?? entry.freq;
              const dispTrans = ed.transponder  ?? entry.transponder;
              const dispApps  = ed.applications ?? entry.applications;
              const dispImg   = ed.image        ?? null; // photo override base64
              const isEditingCard = editingCard === entry.ref;
              const hasEdits  = !!cardEdits[entry.ref];
              return (
              <div style={{ borderTop: "1px solid rgba(204,0,0,0.1)" }}>

                {/* Bouton édition fiche + reset */}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:5, padding:"8px 13px 0" }}>
                  {hasEdits && !isEditingCard && (
                    <button onClick={() => resetCardEdit(entry.ref)}
                      style={{ fontSize:9, color:"#ff4757", background:"rgba(255,71,87,0.07)", border:"1px solid rgba(255,71,87,0.2)", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      ↺ Réinitialiser
                    </button>
                  )}
                  <button onClick={() => setEditingCard(isEditingCard ? null : entry.ref)}
                    style={{ fontSize:10, color:isEditingCard?"#fff":"#6c63ff", background:isEditingCard?"#6c63ff":"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {isEditingCard ? "✓ Enregistrer" : "✏️ Modifier la fiche"}
                  </button>
                </div>

                {/* ── MODE ÉDITION FICHE ── */}
                {isEditingCard && (
                  <div style={{ margin:"8px 13px", background:"rgba(108,99,255,0.05)", border:"1px solid rgba(108,99,255,0.2)", borderRadius:12, padding:12 }}>

                    {/* Photo */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:"#6c63ff", letterSpacing:0.5, marginBottom:5, textTransform:"uppercase" }}>📸 Photo</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                        <img src={dispImg || getSilcaImage(entry.ref) || getSilcaSVG(entry.blade)}
                          style={{ width:56, height:56, objectFit:"contain", borderRadius:8, background:"#e8edf8", flexShrink:0 }} />
                        <div style={{ flex:1 }}>
                          <input
                            type="text"
                            placeholder="Colle l'URL de la page ou de la photo…"
                            id={`img-url-${entry.ref}`}
                            style={{ width:"100%", background:"#fff", border:"1px solid rgba(108,99,255,0.25)", borderRadius:8, padding:"8px 10px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box" }} />
                          <button onClick={async () => {
                            const val = document.getElementById(`img-url-${entry.ref}`)?.value?.trim();
                            if (!val) return;
                            if (val.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i)) {
                              saveCardEdit(entry.ref, { image: val });
                            } else {
                              try {
                                const r = await fetch("/api/image-produit", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: val }) });
                                const d = await r.json();
                                if (d.image) saveCardEdit(entry.ref, { image: d.image });
                              } catch {}
                            }
                          }} style={{ marginTop:5, width:"100%", padding:"7px 0", borderRadius:8, border:"none", background:"linear-gradient(135deg,#6c63ff,#00d4ff)", color:"#fff", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                            📸 Appliquer la photo
                          </button>
                        </div>
                        {ed.image && <button onClick={() => saveCardEdit(entry.ref, { image: null })}
                          style={{ fontSize:10, color:"#ff4757", background:"none", border:"none", cursor:"pointer", fontWeight:700, flexShrink:0 }}>↺</button>}
                      </div>
                    </div>

                    {/* Champs texte */}
                    {[
                      ["Référence aftermarket", "ref",         dispRef,   "ex: SIP22R01"],
                      ["Lame",                  "blade",       dispBlade, "ex: SIP22"],
                      ["Boutons",               "buttons",     dispBtn,   "ex: 3"],
                      ["Fréquence",             "freq",        dispFreq,  "ex: 433 MHz"],
                      ["Transpondeur",          "transponder", dispTrans, "ex: ID46"],
                    ].map(([label, field, val, ph]) => (
                      <div key={field} style={{ marginBottom:8 }}>
                        <div style={{ fontSize:9, fontWeight:800, color:"#6c63ff", letterSpacing:0.5, marginBottom:3, textTransform:"uppercase" }}>{label}</div>
                        <input value={val ?? ""} placeholder={ph}
                          onChange={e => saveCardEdit(entry.ref, { [field]: e.target.value })}
                          style={{ width:"100%", background:"#fff", border:"1px solid rgba(108,99,255,0.25)", borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box" }} />
                      </div>
                    ))}

                    {/* Véhicules compatibles */}
                    <div style={{ marginTop:4 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:"#6c63ff", letterSpacing:0.5, marginBottom:6, textTransform:"uppercase" }}>
                        Véhicules compatibles
                      </div>
                      {dispApps.map((app, ai) => (
                        <div key={ai} style={{ display:"flex", gap:4, marginBottom:5, alignItems:"center" }}>
                          <input value={app.make} placeholder="Marque"
                            onChange={e => { const a=[...dispApps]; a[ai]={...a[ai],make:e.target.value}; saveCardEdit(entry.ref,{applications:a}); }}
                            style={{ flex:"0 0 80px", background:"#fff", border:"1px solid rgba(108,99,255,0.2)", borderRadius:7, padding:"6px 8px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box" }} />
                          <input value={app.model} placeholder="Modèle"
                            onChange={e => { const a=[...dispApps]; a[ai]={...a[ai],model:e.target.value}; saveCardEdit(entry.ref,{applications:a}); }}
                            style={{ flex:1, background:"#fff", border:"1px solid rgba(108,99,255,0.2)", borderRadius:7, padding:"6px 8px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box", minWidth:0 }} />
                          <input value={app.from ?? ""} placeholder="De"
                            onChange={e => { const a=[...dispApps]; a[ai]={...a[ai],from:parseInt(e.target.value)||e.target.value}; saveCardEdit(entry.ref,{applications:a}); }}
                            style={{ flex:"0 0 48px", background:"#fff", border:"1px solid rgba(108,99,255,0.2)", borderRadius:7, padding:"6px 6px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box", textAlign:"center" }} />
                          <input value={app.to ?? ""} placeholder="À"
                            onChange={e => { const a=[...dispApps]; a[ai]={...a[ai],to:parseInt(e.target.value)||null}; saveCardEdit(entry.ref,{applications:a}); }}
                            style={{ flex:"0 0 48px", background:"#fff", border:"1px solid rgba(108,99,255,0.2)", borderRadius:7, padding:"6px 6px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box", textAlign:"center" }} />
                          <button onClick={() => { const a=dispApps.filter((_,i)=>i!==ai); saveCardEdit(entry.ref,{applications:a}); }}
                            style={{ flexShrink:0, width:24, height:24, borderRadius:6, border:"1px solid rgba(255,71,87,0.3)", background:"rgba(255,71,87,0.08)", color:"#ff4757", fontSize:13, cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                        </div>
                      ))}
                      <button onClick={() => saveCardEdit(entry.ref,{applications:[...dispApps,{make:"",model:"",chassis:"",from:null,to:null}]})}
                        style={{ width:"100%", marginTop:2, fontSize:11, color:"#6c63ff", background:"rgba(108,99,255,0.07)", border:"1px dashed rgba(108,99,255,0.25)", borderRadius:7, padding:"6px 0", cursor:"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        + Ajouter un véhicule
                      </button>
                    </div>
                  </div>
                )}

                {/* ── MODE LECTURE ── */}
                {/* Grille infos techniques */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 8px",
                  padding: "12px 13px 8px" }}>
                  {/* Référence Aftermarket — pleine largeur, bien visible */}
                  <div style={{ gridColumn: "1 / -1", background: GRAD, borderRadius: 9,
                    padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: 700,
                        letterSpacing: 0.5, marginBottom: 1 }}>RÉFÉRENCE AFTERMARKET{hasEdits && <span style={{marginLeft:6,fontSize:8,background:"rgba(255,255,255,0.2)",padding:"1px 5px",borderRadius:3}}>MODIFIÉ</span>}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff",
                        letterSpacing: 0.5 }}>{dispRef}</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: 700,
                        letterSpacing: 0.5, marginBottom: 1 }}>TYPE</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                        {TICON[entry.type]} {TLBL[entry.type]}
                      </div>
                    </div>
                  </div>
                  {[
                    ["🔩 Lame",           dispBlade],
                    ["🔘 Boutons",        String(dispBtn) + " boutons"],
                    ["📶 Fréquence",      dispFreq],
                    ["🔐 Transpondeur",   dispTrans],
                  ].concat(entry.note ? [["ℹ️ Note", entry.note]] : [])
                  .map(([lbl, val]) => (
                    <div key={lbl} style={{ background: "#dde3f2", borderRadius: 9, padding: "7px 10px",
                      gridColumn: lbl.includes("Note") ? "1 / -1" : "auto" }}>
                      <div style={{ fontSize: 9, color: "#8890aa", fontWeight: 700,
                        letterSpacing: 0.3, marginBottom: 2 }}>{lbl}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#1a1d2e" }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Tableau des véhicules compatibles */}
                <div style={{ padding: "0 13px 8px" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                    color: RED, letterSpacing: 1, marginBottom: 6 }}>
                    Véhicules compatibles ({dispApps.length})
                  </div>
                  <div style={{ background: "#dde3f2", borderRadius: 10, overflow: "hidden" }}>
                    {dispApps.map((app, ai) => (
                      <div key={ai} style={{ display: "flex", alignItems: "center",
                        padding: "6px 10px",
                        borderBottom: ai < dispApps.length - 1
                          ? "1px solid rgba(204,0,0,0.08)" : "none" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: "#1a1d2e" }}>
                            {app.make}
                          </span>
                          <span style={{ fontSize: 12, color: "#5a6080" }}> {app.model}</span>
                          {app.chassis &&
                            <span style={{ fontSize: 9, color: "#9098b0", marginLeft: 5 }}>
                              [{app.chassis}]
                            </span>
                          }
                          <span style={{
                            display: "inline-block", marginLeft: 6,
                            fontSize: 9.5, fontWeight: 900, color: "#fff",
                            background: RED, padding: "1px 6px",
                            borderRadius: 4, letterSpacing: 0.3,
                            verticalAlign: "middle"
                          }}>{dispRef}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "#5a6080", whiteSpace: "nowrap", marginLeft: 8 }}>
                          {app.from}{app.to ? "–" + app.to : "→"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Liens OE Part Numbers — édition inline directe (toutes les refs) */}
                {(() => {
                  const effectiveLinks = overrides[entry.ref] ?? entry.oeLinks ?? [];
                  const isEditing = editingRef === entry.ref;
                  const hasOverride = !!overrides[entry.ref];
                  const setLinks = (nl) => typeof setOeLinksOverrides === "function" && setOeLinksOverrides(p => ({ ...p, [entry.ref]: nl }));
                  const resetLinks = () => typeof setOeLinksOverrides === "function" && setOeLinksOverrides(p => { const n={...p}; delete n[entry.ref]; return n; });
                  return (
                    <div style={{ padding: "0 13px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "#0284c7", letterSpacing: 1 }}>
                          🔗 OE Part Numbers
                          {hasOverride && <span style={{ marginLeft:6, fontSize:8, color:"#0284c7", background:"rgba(2,132,199,0.12)", padding:"1px 5px", borderRadius:3 }}>MODIFIÉ</span>}
                        </div>
                        <div style={{ display:"flex", gap:4 }}>
                          {hasOverride && !isEditing && <button onClick={resetLinks} style={{ fontSize:9, color:"#ff4757", background:"none", border:"none", cursor:"pointer", fontWeight:700 }}>↺</button>}
                          <button onClick={() => setEditingRef(isEditing ? null : entry.ref)}
                            style={{ fontSize:10, color:isEditing?"#fff":"#0284c7", background:isEditing?"#0284c7":"rgba(2,132,199,0.1)", border:"1px solid rgba(2,132,199,0.3)", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                            {isEditing ? "✓ OK" : "✏️"}
                          </button>
                        </div>
                      </div>
                      {!isEditing && effectiveLinks.length > 0 && (
                        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                          {effectiveLinks.map((lnk, li) => (
                            <a key={li} href={lnk.url} target="_blank" rel="noopener noreferrer"
                              style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(2,132,199,0.08)", border:"1px solid rgba(2,132,199,0.25)", borderRadius:9, padding:"8px 12px", textDecoration:"none" }}>
                              <span style={{ fontSize:14 }}>🔗</span>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:11, fontWeight:800, color:"#0284c7" }}>{lnk.label}</div>
                                <div style={{ fontSize:9, color:"#64748b", marginTop:1 }}>{lnk.url.replace("https://","")}</div>
                              </div>
                              <span style={{ fontSize:11, color:"#0284c7", fontWeight:700 }}>↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                      {!isEditing && effectiveLinks.length === 0 && (
                        <div style={{ fontSize:10, color:"#94a3b8", fontStyle:"italic", marginTop:2 }}>Aucun lien — cliquez ✏️ pour en ajouter</div>
                      )}
                      {isEditing && (
                        <div style={{ background:"rgba(2,132,199,0.05)", borderRadius:10, padding:"10px", border:"1px solid rgba(2,132,199,0.2)" }}>
                          {effectiveLinks.map((lnk, li) => (
                            <div key={li} style={{ display:"flex", gap:5, marginBottom:7, alignItems:"center" }}>
                              <input value={lnk.label} placeholder="Libellé" onChange={e => { const l=[...effectiveLinks]; l[li]={...l[li],label:e.target.value}; setLinks(l); }}
                                style={{ flex:"0 0 90px", background:"#fff", border:"1px solid rgba(2,132,199,0.3)", borderRadius:7, padding:"7px 9px", fontSize:11, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box" }} />
                              <input value={lnk.url} placeholder="https://..." onChange={e => { const l=[...effectiveLinks]; l[li]={...l[li],url:e.target.value}; setLinks(l); }}
                                style={{ flex:1, background:"#fff", border:"1px solid rgba(2,132,199,0.3)", borderRadius:7, padding:"7px 9px", fontSize:10, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#1a1d2e", boxSizing:"border-box", minWidth:0 }} />
                              <button onClick={() => setLinks(effectiveLinks.filter((_,i)=>i!==li))}
                                style={{ flexShrink:0, width:26, height:26, borderRadius:6, border:"1px solid rgba(255,71,87,0.3)", background:"rgba(255,71,87,0.08)", color:"#ff4757", fontSize:14, cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
                            </div>
                          ))}
                          <button onClick={() => setLinks([...effectiveLinks,{label:"",url:"https://"}])}
                            style={{ width:"100%", marginTop:4, fontSize:11, color:"#0284c7", background:"rgba(2,132,199,0.07)", border:"1px dashed rgba(2,132,199,0.3)", borderRadius:7, padding:"6px 0", cursor:"pointer", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                            + Ajouter un lien
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Boutons actions */}
                <div style={{ display: "flex", gap: 7, padding: "6px 13px 13px" }}>
                  <a href={"https://www.google.com/search?q=aftermarket+" + encodeURIComponent(entry.ref)}
                    target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: "9px 0", borderRadius: 9, textAlign: "center",
                      border: "1px solid rgba(37,99,235,0.3)", background: "rgba(37,99,235,0.07)",
                      color: "#2563eb", fontWeight: 700, fontSize: 11, textDecoration: "none" }}>
                    🔍 Aftermarket
                  </a>
                  <button onClick={() => doAdd(entry)}
                    style={{ flex: 2, padding: "9px 0", borderRadius: 9, border: "none",
                      background: isAdded ? "linear-gradient(135deg,#4ade80,#22c55e)" : GRAD,
                      color: "#fff", fontWeight: 800, fontSize: 12,
                      cursor: isAdded ? "default" : "pointer" }}>
                    {isAdded ? "✓ Ajouté au stock" : "+ Ajouter au stock"}
                  </button>
                </div>
              </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

function DevisForm({ clients, products, onSave, onClose, initial }) {
  const [form, setForm] = React.useState(initial || {
    clientId: "", produitId: "", qty: 1, prixHT: "", note: "",
    date: new Date().toLocaleDateString("fr-FR"),
    validite: new Date(Date.now() + 30*86400000).toLocaleDateString("fr-FR"),
    statut: "en_attente"
  });
  const prixTTC = form.prixHT ? (parseFloat(form.prixHT) * 1.2).toFixed(2) : "";
  const prod = products.find(p => p.id === form.produitId);
  React.useEffect(() => { if (prod && !initial) setForm(f => ({ ...f, prixHT: (prod.prix * (parseInt(f.qty) || 1)).toFixed(2) })); }, [form.produitId, form.qty]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#c8d0e8", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(108,99,255,0.15)" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1d2e", marginBottom: 18 }}>
          {initial ? "Modifier le devis" : "Nouveau devis"}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Client *</div>
          <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }}>
            <option value="">-- Sélectionner --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.plaque && `(${c.plaque})`}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Clé / Prestation *</div>
          <select value={form.produitId} onChange={e => setForm(p => ({ ...p, produitId: e.target.value }))}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }}>
            <option value="">-- Sélectionner --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Quantité</div>
            <input type="number" min="1" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Prix HT (€)</div>
            <input type="number" value={form.prixHT} onChange={e => setForm(p => ({ ...p, prixHT: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
        </div>
        {prixTTC && <div style={{ background: "rgba(108,99,255,0.1)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#6c63ff", fontWeight: 700 }}>Total TTC (TVA 20%) : {prixTTC} €</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Date devis</div>
            <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Valide jusqu'au</div>
            <input value={form.validite} onChange={e => setForm(p => ({ ...p, validite: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Note / Description</div>
          <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={2}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none", resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={() => form.clientId && form.produitId && onSave({ ...form, prixTTC, id: Date.now().toString() })}
            style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Créer le devis</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// =================== CLIENT FORM ============================
// ============================================================
function ClientForm({ onSave, onClose, initial }) {
  const [form, setForm] = React.useState(initial || { nom: "", tel: "", email: "", adresse: "", vehicule: "", plaque: "", vin: "" });
  const fields = [["nom","Nom complet *"],["tel","Téléphone"],["email","Email"],["adresse","Adresse"],["vehicule","Véhicule (ex: Renault Clio 2018)"],["plaque","Plaque d'immatriculation"],["vin","Numéro VIN"]];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#c8d0e8", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(108,99,255,0.15)" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1d2e", marginBottom: 18 }}>{initial ? "Modifier le client" : "Nouveau client"}</div>
        {fields.map(([k, lbl]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>{lbl}</div>
            <input value={form[k] || ""} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={() => form.nom.trim() && onSave(form)} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// =================== INTERVENTION FORM =====================
// ============================================================
function InterventionForm({ clients, products, onSave, onClose, defaultClientId, defaultProduitId }) {
  const [form, setForm] = React.useState({ clientId: defaultClientId || "", produitId: defaultProduitId || "", qty: 1, prixHT: "", note: "", date: new Date().toLocaleDateString("fr-FR"), photo: "" });
  const prixTTC = form.prixHT ? (parseFloat(form.prixHT) * 1.2).toFixed(2) : "";
  const prod = products.find(p => p.id === form.produitId);
  React.useEffect(() => { if (prod) setForm(f => ({ ...f, prixHT: (prod.prix * (parseInt(f.qty) || 1)).toFixed(2) })); }, [form.produitId, form.qty]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#c8d0e8", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(108,99,255,0.15)" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1d2e", marginBottom: 18 }}>Nouvelle intervention</div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Client *</div>
          <select value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }}>
            <option value="">-- Sélectionner --</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nom} {c.plaque && `(${c.plaque})`}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Clé utilisée *</div>
          <select value={form.produitId} onChange={e => setForm(p => ({ ...p, produitId: e.target.value }))}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }}>
            <option value="">-- Sélectionner --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Quantité</div>
            <input type="number" min="1" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Prix HT (€)</div>
            <input type="number" value={form.prixHT} onChange={e => setForm(p => ({ ...p, prixHT: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
          </div>
        </div>
        {prixTTC && <div style={{ background: "rgba(108,99,255,0.1)", borderRadius: 10, padding: "8px 14px", marginBottom: 12, fontSize: 13, color: "#6c63ff", fontWeight: 700 }}>Prix TTC (TVA 20%) : {prixTTC} €</div>}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Note / Description</div>
          <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={2}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none", resize: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>Date</div>
          <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={() => form.clientId && form.produitId && onSave({ ...form, prixTTC, id: Date.now().toString() })}
            style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

const FALLBACK_IMG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="#e8edf8"/><text x="40" y="48" text-anchor="middle" font-size="32">🔑</text></svg>')}`;

// ============================================================
// ============= AJOUT PRODUIT AVEC ANALYSE URL ===============
// ============================================================
// ============================================================
// =================== AFTERMARKET TAB =======================
// ============================================================
function DragScrollTabs({ filterMarque, setFilterMarque, marques }) {
  const tabsRef = React.useRef(null);
  const dragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const onMouseDown = (e) => {
    dragging.current = true;
    startX.current = e.pageX - tabsRef.current.offsetLeft;
    scrollLeft.current = tabsRef.current.scrollLeft;
    tabsRef.current.style.cursor = "grabbing";
  };
  const onMouseUp = () => { dragging.current = false; if (tabsRef.current) tabsRef.current.style.cursor = "grab"; };
  const onMouseMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    tabsRef.current.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  return (
    <div ref={tabsRef} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onMouseMove={onMouseMove}
      style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", marginBottom: 10, cursor: "grab", userSelect: "none" }}>
      <button onClick={() => setFilterMarque("")}
        style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: `1px solid ${!filterMarque ? "#6c63ff" : "rgba(108,99,255,0.2)"}`, background: !filterMarque ? "#6c63ff" : "transparent", color: !filterMarque ? "#fff" : "#3d4870", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
        Toutes
      </button>
      {marques.map(m => (
        <button key={m} onClick={() => setFilterMarque(m === filterMarque ? "" : m)}
          style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterMarque === m ? "#6c63ff" : "rgba(108,99,255,0.2)"}`, background: filterMarque === m ? "#6c63ff" : "transparent", color: filterMarque === m ? "#fff" : "#3d4870", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          {m}
        </button>
      ))}
    </div>
  );
}

function AftermarketTab({ products, stock, onAddToStock, onViewStock, onShowUrlImport, oeLinksOverrides, S, customItems = [], onDeleteCustom }) {
  const [search, setSearch] = React.useState("");
  const [filterMarque, setFilterMarque] = React.useState("");
  const [openRef, setOpenRef] = React.useState(null);
  const [openCustomId, setOpenCustomId] = React.useState(null);

  const marques = React.useMemo(() => {
    const fromSilca = SILCA_DB.map(e => e.marque);
    const fromCustom = customItems.filter(p => p.marque).map(p => p.marque);
    return [...new Set([...fromSilca, ...fromCustom])].sort();
  }, [customItems]);

  const filtered = React.useMemo(() => {
    const seen = new Set();
    const q = search.trim().toLowerCase();
    return SILCA_DB.filter(e => {
      if (seen.has(e.ref)) return false;
      seen.add(e.ref);
      if (filterMarque && e.marque !== filterMarque) return false;
      if (q) return (
        e.ref.toLowerCase().includes(q) ||
        e.marque.toLowerCase().includes(q) ||
        e.blade.toLowerCase().includes(q) ||
        e.applications.some(a => a.make.toLowerCase().includes(q) || a.model.toLowerCase().includes(q))
      );
      return true;
    });
  }, [search, filterMarque]);

  const filteredCustom = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return customItems.filter(p => {
      if (filterMarque && p.marque !== filterMarque) return false;
      if (q) return (
        (p.nom || '').toLowerCase().includes(q) ||
        (p.ref || '').toLowerCase().includes(q) ||
        (p.marque || '').toLowerCase().includes(q) ||
        (p.modeles || '').toLowerCase().includes(q)
      );
      return true;
    });
  }, [customItems, search, filterMarque]);

  const isInStock = (ref) => products.some(p => p.ref === ref);

  const handleAdd = (entry) => {
    const id = "silca-" + entry.ref.replace(/[^a-zA-Z0-9]/g, "") + "-" + Date.now();
    const mainApp = entry.applications[0];
    onAddToStock({
      id,
      nom: (mainApp ? `${mainApp.make} ${mainApp.model}` : entry.marque) + " · " + entry.ref,
      ref: entry.ref,
      lame: entry.blade,
      marque: mainApp ? mainApp.make : entry.marque,
      modeles: entry.applications.map(a => a.model).join(", "),
      transpondeur: entry.transponder || "",
      freq: entry.freq || "",
      type: entry.type === "P" ? "Proximité" : entry.type === "S" ? "Slot" : "Télécommande",
      prix: 0,
      categorie: "Aftermarket France",
      emoji: "🔑",
      image: getSilcaImage(entry.ref) || getSilcaSVG(entry.blade),
      oeLinks: entry.oeLinks || [],
    });
  };

  const TCOL = { P: "#6c63ff", S: "#0099cc", R: "#cc0000" };
  const TLBL = { P: "Prox.", S: "Slot", R: "Remote" };

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Bouton ajout par URL */}
      <div style={{ padding: "12px 16px 0" }}>
        <button onClick={onShowUrlImport}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,212,255,0.08))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 16, padding: "12px 16px", marginBottom: 12, cursor: "pointer" }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6c63ff,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🔗</div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d2e" }}>Ajouter un produit par URL</div>
            <div style={{ fontSize: 11, color: "#5a6585", marginTop: 1 }}>Coller le lien d'une page fournisseur</div>
          </div>
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Recherche */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1d2e" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 14, padding: "11px 36px", color: "#1a1d2e", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            placeholder="Référence, marque, modèle, lame…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5a6585", fontSize: 16 }}>✕</button>}
        </div>

        {/* Filtre marque — drag scroll PC + touch mobile */}
        <DragScrollTabs filterMarque={filterMarque} setFilterMarque={setFilterMarque} marques={marques} />

        <div style={{ fontSize: 11, color: "#8890aa", marginBottom: 8 }}>{filtered.length} référence{filtered.length !== 1 ? "s" : ""} catalogue</div>

        {/* ── Fiches ajoutées manuellement (par URL) ── */}
        {filteredCustom.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6c63ff", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              🔗 Ajoutés par URL ({customItems.length})
            </div>
            {filteredCustom.map(p => {
              const inStock = products.some(x => x.id === p.id);
              const isOpen = openCustomId === p.id;
              // Champs techniques pour le panneau déplié
              const techPills = [
                p.mainLibre === "oui" ? "🖐 Mains libres" : p.mainLibre === "non" ? "🔒 Non mains libres" : null,
                p.boutons ? `🔢 ${p.boutons} bouton${p.boutons > 1 ? "s" : ""}` : null,
                p.transpondeur ? `🔐 ${p.transpondeur}${p.pcf ? " / PCF" + p.pcf : ""}` : null,
                p.freq ? `📡 ${p.freq}` : null,
                p.pile ? `🔋 ${p.pile}` : null,
                p.lame ? `🔑 Lame ${p.lame}` : null,
              ].filter(Boolean);
              const metaPills = [
                p.ean ? `EAN ${p.ean}` : null,
                p.refOrigine ? `Réf. origine : ${p.refOrigine}` : null,
              ].filter(Boolean);
              return (
                <div key={p.id} style={{ background: "#e8edf8", borderRadius: 16, marginBottom: 8, border: `1px solid ${isOpen ? "rgba(108,99,255,0.3)" : inStock ? "rgba(0,245,147,0.3)" : "rgba(108,99,255,0.2)"}`, overflow: "hidden", transition: "border-color 0.15s" }}>

                  {/* ── Ligne principale ── */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 10px 10px" }}>
                    {/* Photo cliquable */}
                    <div onClick={() => setOpenCustomId(isOpen ? null : p.id)}
                      style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 12, overflow: "hidden", background: "#c8d0e8", border: "1px solid rgba(108,99,255,0.1)", cursor: "pointer" }}>
                      {p.image && p.image !== FALLBACK_IMG
                        ? <img src={p.image} alt={p.nom} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🔑</div>
                      }
                    </div>
                    {/* Infos cliquables */}
                    <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setOpenCustomId(isOpen ? null : p.id)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 3 }}>
                        {p.ref && <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", padding: "2px 8px", borderRadius: 5 }}>{p.ref}</span>}
                        {inStock && <span style={{ fontSize: 9, fontWeight: 800, color: "#00b87a", background: "rgba(0,245,147,0.12)", border: "1px solid rgba(0,245,147,0.3)", padding: "1px 6px", borderRadius: 4 }}>✓ STOCK</span>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1d2e", lineHeight: 1.4, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nom}</div>
                      {(p.marque || p.lame) && <div style={{ fontSize: 10, color: "#8890aa" }}>{p.marque}{p.lame ? ` · Lame ${p.lame}` : ""}{p.freq ? ` · ${p.freq}` : ""}</div>}
                      {p.modeles && <div style={{ fontSize: 10, color: "#5a6585", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🚗 {p.modeles}</div>}
                    </div>
                    {/* Boutons + chevron */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => inStock ? onViewStock() : onAddToStock(p)}
                        style={{ padding: "8px 10px", borderRadius: 10, border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", lineHeight: 1.3, textAlign: "center",
                          background: inStock ? "rgba(0,245,147,0.12)" : "linear-gradient(135deg,#0284c7,#00d4ff)",
                          color: inStock ? "#00b87a" : "#fff" }}>
                        {inStock ? "📦\nStock" : "+ Ajouter\nau stock"}
                      </button>
                      <button onClick={() => setOpenCustomId(isOpen ? null : p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#8890aa", padding: "2px 4px", display: "flex", alignItems: "center", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* ── Panneau déplié custom PREMIUM ── */}
                  {isOpen && (() => {
                    const cTrans = (p.transpondeur || "").toUpperCase();
                    const cAES   = cTrans.includes("AES") || cTrans.includes("PCF7961") || cTrans.includes("ID49") || cTrans.includes("ID4A");
                    const cBSI   = cTrans.includes("ID88") || cTrans.includes("ID50");
                    const cML    = p.mainLibre === "oui";
                    const cDiff  = cAES ? "Expert" : cBSI ? "Avancé" : "Standard";
                    const cDiffC = cAES ? "#ff4757" : cBSI ? "#e8a020" : "#00b87a";
                    const cTemps = cAES ? "45min" : cBSI ? "35min" : "25min";
                    const cMeth  = cML ? "OBD" : "Standard";
                    const variantesListe = (p.modeles || "").split(/[,;]+/).map(m => m.trim()).filter(Boolean);
                    return (
                      <div style={{ borderTop: "1px solid rgba(108,99,255,0.15)", background: "#1a1d2e", padding: "0 0 12px" }}>

                        {/* ── HEADER FICHE PREMIUM ── */}
                        <div style={{ padding: "14px 14px 0" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(108,99,255,0.7)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>Clé Automobile</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, marginRight: 8 }}>{p.nom}</div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#00b87a", background: "rgba(0,245,147,0.12)", border: "1px solid rgba(0,245,147,0.3)", borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {inStock ? "✓ En stock" : "— Stock"}
                            </span>
                          </div>
                          {variantesListe.length > 0 && (
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                              {variantesListe.join(" · ")}
                            </div>
                          )}
                        </div>

                        {/* ── GRILLE SPECS ── */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "12px 14px 0" }}>
                          {[
                            p.ref           && ["Référence",      p.ref,                    "#a78bfa"],
                            p.transpondeur  && ["Transpondeur",   p.transpondeur, "#6c63ff"],
                            p.id_transpondeur && ["ID transpondeur", p.id_transpondeur, "#a78bfa"],
                            p.freq          && ["Fréquence",      p.freq,                   "#fff"],
                            p.lame          && ["Lame",           p.lame,                   "#fff"],
                            p.pile          && ["Batterie",       p.pile,                   "#fff"],
                            p.boutons       && ["Boutons",        p.boutons + " (" + ["verrouiller","déverrouiller","démarrer"].slice(0, parseInt(p.boutons)||3).join(" · ") + ")", "#fff"],
                          ].filter(Boolean).map(([label, value, color]) => (
                            <div key={label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: color || "#fff", lineHeight: 1.4 }}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* ── COMPATIBILITÉ ── */}
                        <div style={{ margin: "12px 14px 0", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Compatibilité</span>
                            <div style={{ display: "flex", gap: 30 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>Modèle</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5 }}>Années</span>
                            </div>
                          </div>
                          {variantesListe.length > 0 ? variantesListe.map((m, i) => {
                            const parts = m.match(/^(.+?)\s*\((\d{4}[^)]*)\)$/) || [null, m, null];
                            const nom = parts[1]?.trim() || m;
                            const annees = parts[2] || (p.annees || "");
                            return (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 13px", borderBottom: i < variantesListe.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{nom}</span>
                                {annees && <span style={{ fontSize: 11, fontWeight: 600, color: "#6c63ff", background: "rgba(108,99,255,0.15)", borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap" }}>{annees}</span>}
                              </div>
                            );
                          }) : (
                            <div style={{ padding: "10px 13px", fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>À vérifier sur la page fournisseur</div>
                          )}
                        </div>

                        {/* ── RÉFÉRENCES OEM ── */}
                        {metaPills.length > 0 && (
                          <div style={{ margin: "10px 14px 0", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", padding: "10px 13px" }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Références OEM</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>{metaPills.join(" · ")}</div>
                          </div>
                        )}

                        {/* ── OÙ ACHETER ── */}
                        <div style={{ margin: "10px 14px 0", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", padding: "10px 13px" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Où acheter</div>
                          {p.lien_achat ? (
                            <a href={p.lien_achat} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,167,38,0.12)", border: "1px solid rgba(255,167,38,0.3)", borderRadius: 10, padding: "9px 13px", textDecoration: "none" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffa726" }}>🛒 Acheter chez MK3</span>
                              <span style={{ fontSize: 11, color: "#ffa726" }}>↗</span>
                            </a>
                          ) : p.lien ? (
                            <a href={p.lien} target="_blank" rel="noopener noreferrer"
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(2,132,199,0.1)", border: "1px solid rgba(2,132,199,0.25)", borderRadius: 10, padding: "9px 13px", textDecoration: "none" }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>🔗 Voir la page fournisseur</span>
                              <span style={{ fontSize: 11, color: "#38bdf8" }}>↗</span>
                            </a>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Lien MK3 — à compléter</span>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "3px 10px" }}>en attente</span>
                            </div>
                          )}
                        </div>

                        {/* ── SUPPRIMER ── */}
                        {onDeleteCustom && (
                          <div style={{ margin: "10px 14px 0" }}>
                            <button onClick={() => onDeleteCustom(p.id)}
                              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(255,71,87,0.25)", background: "rgba(255,71,87,0.08)", color: "#ff4757", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                              🗑 Supprimer cette fiche
                            </button>
                          </div>
                        )}

                        <div style={{ height: 14 }} />
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#5a6585", fontSize: 13 }}>Aucun résultat</div>
        )}

        {filtered.map(entry => {
          const inStock = isInStock(entry.ref);
          const photo = getSilcaImage(entry.ref) || getSilcaSVG(entry.blade);
          const oeLinks = (oeLinksOverrides && oeLinksOverrides[entry.ref]) ?? entry.oeLinks ?? [];
          const apps = entry.applications.slice(0, 3);
          const isOpen = openRef === entry.ref;
          return (
            <div key={entry.ref} style={{ background: "#e8edf8", borderRadius: 16, marginBottom: 8, border: `1px solid ${isOpen ? "rgba(108,99,255,0.3)" : inStock ? "rgba(0,245,147,0.3)" : "rgba(108,99,255,0.12)"}`, overflow: "hidden", transition: "border-color 0.15s" }}>

              {/* ── CARD PREMIUM TERRAIN ── */}
              {(() => {
                const _trans = (entry.transponder || "").toUpperCase();
                const _isAES = _trans.includes("AES") || _trans.includes("PCF7961") || _trans.includes("HITAG PRO") || _trans.includes("ID49") || _trans.includes("ID4A");
                const _isBSI = _trans.includes("ID88") || _trans.includes("ID50") || ["BMW","Audi","Mercedes"].includes(entry.marque);
                const _isRare = entry.applications.length <= 1;
                const _isML = entry.type === "P";
                const _diff = _isAES ? "Expert" : _isBSI ? "Avancé" : "Standard";
                const _diffC = _isAES ? "#ff4757" : _isBSI ? "#e8a020" : "#00b87a";
                return (
                  <div style={{ display:"flex", alignItems:"stretch", gap:0, cursor:"pointer" }} onClick={() => setOpenRef(isOpen ? null : entry.ref)}>
                    {/* Bande latérale difficulté */}
                    <div style={{ width:4, background:_diffC, flexShrink:0, borderRadius:"0 0 0 0" }} />
                    {/* Photo */}
                    <div style={{ width:68, height:68, flexShrink:0, margin:"10px 10px 10px 8px", borderRadius:11, overflow:"hidden", background:"#c8d0e8", border:"1px solid rgba(108,99,255,0.1)", alignSelf:"center" }}>
                      <img src={photo} alt={entry.ref} onError={e => { e.target.src = getSilcaSVG(entry.blade); }} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                    </div>
                    {/* Infos */}
                    <div style={{ flex:1, minWidth:0, padding:"9px 0 9px 0" }}>
                      {/* Ligne 1 : ref + badges */}
                      <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", marginBottom:4 }}>
                        <span style={{ fontSize:11, fontWeight:900, color:"#fff", background:"linear-gradient(135deg,#cc0000,#ff4040)", padding:"2px 8px", borderRadius:5, letterSpacing:0.3 }}>{entry.ref}</span>
                        <span style={{ fontSize:9, fontWeight:700, color:TCOL[entry.type], background:TCOL[entry.type]+"18", border:"1px solid "+TCOL[entry.type]+"33", padding:"1px 6px", borderRadius:4 }}>{TLBL[entry.type]}</span>
                        {inStock
                          ? <span style={{ fontSize:9, fontWeight:800, color:"#00b87a", background:"rgba(0,245,147,0.12)", border:"1px solid rgba(0,245,147,0.35)", padding:"1px 7px", borderRadius:4 }}>✓ STOCK</span>
                          : <span style={{ fontSize:9, fontWeight:700, color:"#0284c7", background:"rgba(2,132,199,0.09)", border:"1px solid rgba(2,132,199,0.25)", padding:"1px 6px", borderRadius:4 }}>+ Stock</span>
                        }
                        {_isRare && <span style={{ fontSize:9, fontWeight:700, color:"#ff4757", background:"rgba(255,71,87,0.09)", border:"1px solid rgba(255,71,87,0.25)", padding:"1px 6px", borderRadius:4 }}>⚠ RARE</span>}
                      </div>
                      {/* Ligne 2 : modèles */}
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1d2e", lineHeight:1.35, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {apps.map(a => `${a.make} ${a.model}`).join(" · ")}{entry.applications.length > 3 ? ` +${entry.applications.length - 3}` : ""}
                      </div>
                      {/* Ligne 3 : infos rapides terrain */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
                        <span style={{ fontSize:10, fontWeight:600, color:_isML?"#6c63ff":"#5a6585", background:_isML?"rgba(108,99,255,0.09)":"rgba(90,101,133,0.07)", border:`1px solid ${_isML?"rgba(108,99,255,0.2)":"rgba(90,101,133,0.15)"}`, borderRadius:20, padding:"2px 7px" }}>
                          {_isML ? "🖐 ML" : "🔑 NON ML"}
                        </span>
                        <span style={{ fontSize:10, fontWeight:600, color:"#5a6585", background:"rgba(90,101,133,0.07)", border:"1px solid rgba(90,101,133,0.15)", borderRadius:20, padding:"2px 7px" }}>
                          {entry.blade} · {entry.freq}
                        </span>
                        <span style={{ fontSize:10, fontWeight:700, color:_diffC, background:_diffC+"11", border:`1px solid ${_diffC}30`, borderRadius:20, padding:"2px 7px" }}>
                          {_diff}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, padding:"10px 10px 10px 6px", flexShrink:0 }}>
                      <button onClick={e => { e.stopPropagation(); inStock ? onViewStock() : handleAdd(entry); }}
                        style={{ padding:"7px 9px", borderRadius:9, border:"none", fontSize:10, fontWeight:700, cursor:"pointer", lineHeight:1.3, textAlign:"center", whiteSpace:"pre",
                          background: inStock ? "rgba(0,245,147,0.12)" : "linear-gradient(135deg,#0284c7,#00d4ff)",
                          color: inStock ? "#00b87a" : "#fff" }}>
                        {inStock ? "📦\nStock" : "+ Ajouter\nau stock"}
                      </button>
                      <button onClick={e => { e.stopPropagation(); setOpenRef(isOpen ? null : entry.ref); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#8890aa", padding:"2px 4px", display:"flex", alignItems:"center", transition:"transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── FICHE DÉTAIL TERRAIN ── */}
              {isOpen && (() => {
                const trans   = (entry.transponder || "").toUpperCase();
                const isAES   = trans.includes("AES") || trans.includes("PCF7961") || trans.includes("HITAG PRO") || trans.includes("ID49") || trans.includes("ID4A");
                const isBSI   = trans.includes("ID88") || trans.includes("ID50") || ["BMW","Audi","Mercedes"].includes(entry.marque);
                const isRare  = entry.applications.length <= 1;
                const isML    = entry.type === "P";
                const years   = entry.applications.flatMap(a => [a.from, a.to].filter(Boolean));
                const yMin    = years.length ? Math.min(...years) : null;
                const yMax    = years.length ? Math.max(...years) : null;
                const curOeLinks = (oeLinksOverrides && oeLinksOverrides[entry.ref]) ?? entry.oeLinks ?? [];
                const diff    = isAES ? "Expert" : isBSI ? "Avancé" : "Standard";
                const diffC   = isAES ? "#ff4757" : isBSI ? "#e8a020" : "#00b87a";
                const methode = isML ? "OBD" : "Standard";
                const temps   = isAES ? "45min" : isBSI ? "35min" : entry.buttons >= 3 ? "30min" : "25min";
                const equiv   = SILCA_DB
                  .filter(e => e.ref !== entry.ref && e.blade === entry.blade && e.transponder === entry.transponder)
                  .flatMap(e => e.applications.map(a => `${a.make} ${a.model}${isML ? " ML" : ""}`))
                  .filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
                const Row = ({ label, value, color, bold }) => (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", borderBottom:"1px solid rgba(108,99,255,0.06)" }}>
                    <span style={{ fontSize:12, color:"#7a84a0" }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight: bold ? 800 : 600, color: color || "#1a1d2e" }}>{value}</span>
                  </div>
                );
                return (
                  <div style={{ borderTop:"1px solid rgba(108,99,255,0.1)", background:"#f0f3fa" }}>

                    {/* BLOC DÉCISION RAPIDE */}
                    <div style={{ margin:"10px 12px 0", background:"#1a1f35", borderRadius:14, padding:"12px 14px", border:"1px solid rgba(108,99,255,0.3)" }}>
                      <div style={{ fontSize:9, fontWeight:800, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:1.5, marginBottom:10 }}>⚡ Décision rapide</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:9, padding:"8px 9px", border:"1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>📅 Années</div>
                          <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{yMin ? `${yMin}${yMax && yMax !== yMin ? `–${yMax}` : "+"}` : "—"}</div>
                        </div>
                        <div style={{ background: isML ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.06)", borderRadius:9, padding:"8px 9px", border:`1px solid ${isML ? "rgba(108,99,255,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>🔑 Type</div>
                          <div style={{ fontSize:13, fontWeight:800, color: isML ? "#a78bfa" : "#fff" }}>{isML ? "ML" : "NON ML"}</div>
                        </div>
                        <div style={{ background: diffC + "22", borderRadius:9, padding:"8px 9px", border:`1px solid ${diffC}44` }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>⚠ Risque</div>
                          <div style={{ fontSize:13, fontWeight:800, color: diffC }}>{diff}</div>
                        </div>
                        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:9, padding:"8px 9px", border:"1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>⏱ Temps</div>
                          <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{temps}</div>
                        </div>
                        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:9, padding:"8px 9px", border:"1px solid rgba(255,255,255,0.08)" }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>🔌 Méthode</div>
                          <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>{methode}</div>
                        </div>
                        <div style={{ background: (isAES || isBSI) ? "rgba(232,160,32,0.2)" : "rgba(0,184,122,0.12)", borderRadius:9, padding:"8px 9px", border:`1px solid ${(isAES || isBSI) ? "rgba(232,160,32,0.4)" : "rgba(0,184,122,0.3)"}` }}>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>🔐 Chiffrement</div>
                          <div style={{ fontSize:12, fontWeight:800, color: (isAES || isBSI) ? "#e8a020" : "#00b87a" }}>{isAES ? "AES" : isBSI ? "BSI" : "Simple"}</div>
                        </div>
                      </div>
                    </div>

                    {/* ALERTES MÉTIER */}
                    {(isRare || isAES || isBSI) && (
                      <div style={{ margin:"9px 12px 0", display:"flex", flexDirection:"column", gap:5 }}>
                        {isRare && <div style={{ padding:"8px 12px", background:"rgba(255,71,87,0.08)", border:"1px solid rgba(255,71,87,0.25)", borderRadius:10, fontSize:11, fontWeight:600, color:"#cc2222", display:"flex", alignItems:"center", gap:7 }}>🔴 Très rare — confirmer {entry.transponder || "l'ID"} par lecture avant commande</div>}
                        {isAES  && <div style={{ padding:"8px 12px", background:"rgba(232,160,32,0.08)", border:"1px solid rgba(232,160,32,0.28)", borderRadius:10, fontSize:11, fontWeight:600, color:"#7a4f00", display:"flex", alignItems:"center", gap:7 }}>⚠️ Attention AES — outil Pro compatible requis</div>}
                        {isBSI && !isAES && <div style={{ padding:"8px 12px", background:"rgba(232,160,32,0.08)", border:"1px solid rgba(232,160,32,0.28)", borderRadius:10, fontSize:11, fontWeight:600, color:"#7a4f00", display:"flex", alignItems:"center", gap:7 }}>⚠️ BSI / CAS — logiciel à jour obligatoire</div>}
                      </div>
                    )}

                    {/* BADGES TECHNIQUES */}
                    <div style={{ padding:"9px 12px 0", display:"flex", gap:5, flexWrap:"wrap" }}>
                      {entry.transponder && <span style={{ fontSize:10, fontWeight:700, color:"#6c63ff", background:"rgba(108,99,255,0.09)", border:"1px solid rgba(108,99,255,0.22)", borderRadius:20, padding:"3px 10px" }}>{entry.transponder}</span>}
                      {entry.blade       && <span style={{ fontSize:10, fontWeight:700, color:"#5a6585", background:"rgba(90,101,133,0.07)", border:"1px solid rgba(90,101,133,0.18)", borderRadius:20, padding:"3px 10px" }}>{entry.blade}</span>}
                      {entry.freq        && <span style={{ fontSize:10, fontWeight:700, color:"#5a6585", background:"rgba(90,101,133,0.07)", border:"1px solid rgba(90,101,133,0.18)", borderRadius:20, padding:"3px 10px" }}>{entry.freq}</span>}
                      <span style={{ fontSize:10, fontWeight:700, color:"#5a6585", background:"rgba(90,101,133,0.07)", border:"1px solid rgba(90,101,133,0.18)", borderRadius:20, padding:"3px 10px" }}>{temps}</span>
                    </div>

                    {/* VARIANTES COMPATIBLES */}
                    <div style={{ margin:"9px 12px 0", background:"#fff", borderRadius:13, border:"1px solid rgba(108,99,255,0.1)", overflow:"hidden" }}>
                      <div style={{ padding:"8px 13px 7px", borderBottom:"1px solid rgba(108,99,255,0.07)", fontSize:10, fontWeight:800, color:"#3d4870", textTransform:"uppercase", letterSpacing:1.2 }}>🚗 Variantes compatibles</div>
                      {entry.applications.map((a, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 13px", borderBottom: i < entry.applications.length - 1 ? "1px solid rgba(108,99,255,0.06)" : "none" }}>
                          <span style={{ fontSize:13, fontWeight:600, color:"#1a1d2e" }}>{a.make} {a.model}</span>
                          {(a.from || a.to) && <span style={{ fontSize:11, fontWeight:600, color:"#6c63ff", background:"rgba(108,99,255,0.08)", borderRadius:20, padding:"2px 9px", whiteSpace:"nowrap", marginLeft:7 }}>{a.from}{a.to && a.to !== a.from ? ` – ${a.to}` : ""}</span>}
                        </div>
                      ))}
                    </div>

                    {/* TECHNIQUE */}
                    <div style={{ margin:"9px 12px 0", background:"#fff", borderRadius:13, border:"1px solid rgba(108,99,255,0.1)", overflow:"hidden" }}>
                      <div style={{ padding:"8px 13px 7px", borderBottom:"1px solid rgba(108,99,255,0.07)", display:"flex", alignItems:"center", gap:6 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                        <span style={{ fontSize:10, fontWeight:800, color:"#3d4870", textTransform:"uppercase", letterSpacing:1.2 }}>Technique</span>
                      </div>
                      {entry.transponder && <Row label="ID transpondeur" value={entry.transponder} color="#6c63ff" bold/>}
                      {entry.transponder && entry.transponder.match(/PCF\w+/) && <Row label="PCF" value={entry.transponder.match(/PCF\w+/)[0]} color="#6c63ff"/>}
                      {entry.freq        && <Row label="Fréquence" value={entry.freq}/>}
                      {entry.blade       && <Row label="Lame" value={entry.blade}/>}
                      {entry.buttons != null && <Row label="Boutons" value={`${entry.buttons} bouton${entry.buttons > 1 ? "s" : ""}`}/>}
                      <Row label="Type" value={entry.type === "P" ? "Carte ML" : entry.type === "S" ? "Slot" : "Remote"}/>
                      <Row label="Système" value="UCH"/>
                      <Row label="Mains libres" value={isML ? "✅ Oui" : "Non"} color={isML ? "#00b87a" : "#5a6585"}/>
                    </div>

                    {/* FABRICANT */}
                    {curOeLinks.length > 0 && (
                      <div style={{ margin:"9px 12px 0", background:"#fff", borderRadius:13, border:"1px solid rgba(108,99,255,0.1)", overflow:"hidden" }}>
                        <div style={{ padding:"8px 13px 7px", borderBottom:"1px solid rgba(108,99,255,0.07)", fontSize:10, fontWeight:800, color:"#3d4870", textTransform:"uppercase", letterSpacing:1.2 }}>🏭 Fabricant / Électronique</div>
                        {curOeLinks.map((lnk, li) => (
                          <a key={li} href={lnk.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 13px", borderBottom: li < curOeLinks.length - 1 ? "1px solid rgba(108,99,255,0.06)" : "none", textDecoration:"none" }}>
                            <span style={{ fontSize:12, color:"#0284c7", fontWeight:600, flex:1 }}>🔗 {lnk.label}</span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8890aa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* ÉQUIVALENTS */}
                    {equiv.length > 0 && (
                      <div style={{ margin:"9px 12px 0", background:"#fff", borderRadius:13, border:"1px solid rgba(108,99,255,0.1)", overflow:"hidden" }}>
                        <div style={{ padding:"8px 13px 7px", borderBottom:"1px solid rgba(108,99,255,0.07)", fontSize:10, fontWeight:800, color:"#3d4870", textTransform:"uppercase", letterSpacing:1.2 }}>≡ Équivalents</div>
                        {equiv.map((eq, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 13px", borderBottom: i < equiv.length - 1 ? "1px solid rgba(108,99,255,0.06)" : "none" }}>
                            <span style={{ fontSize:14, color:"#8890aa" }}>≡</span>
                            <span style={{ fontSize:13, color:"#1a1d2e" }}>{eq}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.note && (
                      <div style={{ margin:"9px 12px 0", padding:"9px 13px", background:"rgba(108,99,255,0.04)", border:"1px solid rgba(108,99,255,0.1)", borderRadius:11 }}>
                        <div style={{ fontSize:10, color:"#5a6585", lineHeight:1.6 }}>ℹ️ {entry.note}</div>
                      </div>
                    )}
                    <div style={{ height:12 }}/>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UrlProductImport({ onProductCreated, onClose }) {
  const empty = { nom: "", ref: "", marque: "", modeles: "", prix: "", type: "Clé", freq: "", transpondeur: "", id_transpondeur: "", lame: "", lien: "", lien_achat: "" };
  const [form, setForm] = React.useState(empty);
  const [loading, setLoading] = React.useState(false);
  const [analysed, setAnalysed] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAnalyse = async () => {
    const url = form.lien.trim();
    if (!url) return;
    setLoading(true);
    setErrorMsg("");
    setAnalysed(false);
    try {
      const res = await fetch("/api/analyse-produit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.erreur) { setErrorMsg(data.erreur); setLoading(false); return; }
      setForm(prev => ({
        ...prev,
        nom: data.nom || prev.nom,
        ref: data.ref || prev.ref,
        marque: data.marque || prev.marque,
        modeles: data.modeles || prev.modeles,
        prix: data.prix || prev.prix,
        type: data.type || prev.type,
        freq: data.freq || prev.freq,
        transpondeur: data.transpondeur || prev.transpondeur,
        id_transpondeur: data.id_transpondeur || data.transpondeur || prev.id_transpondeur,
        lame: data.lame || prev.lame,
        pile: data.pile || prev.pile,
        image: data.image || prev.image || "",
      }));
      setAnalysed(true);
    } catch (e) {
      setErrorMsg("Erreur réseau — vérifie ta connexion");
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!form.nom.trim()) return;
    const newProd = {
      id: "manuel-" + Date.now(),
      nom: form.nom.trim(),
      ref: form.ref.trim() || ("REF-" + Date.now().toString().slice(-6)),
      marque: form.marque.trim() || "Autre",
      modeles: form.modeles.trim(),
      prix: parseFloat(form.prix) || 0,
      categorie: "Aftermarket France",
      type: form.type || "Clé",
      freq: form.freq.trim(),
      transpondeur: form.transpondeur.trim(),
      lame: form.lame.trim(),
      emoji: "🔑",
      image: form.image || FALLBACK_IMG,
      lien: form.lien.trim(),
      lien_achat: (form.lien_achat || "").trim(),
      id_transpondeur: (form.id_transpondeur || "").trim(),
      oeLinks: (form.lien_achat || "").trim()
        ? [{ label: "Acheter chez MK3", url: form.lien_achat.trim() }]
        : form.lien.trim() ? [{ label: "Voir la page produit", url: form.lien.trim() }] : [],
    };
    onProductCreated(newProd);
  };

  const inp = {
    width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)",
    borderRadius: 12, padding: "10px 12px", color: "#1a1d2e", fontSize: 13,
    outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box",
  };
  const lbl = { fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4, display: "block" };
  const row = { marginBottom: 11 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", zIndex: 600, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#c8d0e8", borderRadius: "24px 24px 0 0", padding: "22px 20px 36px", width: "100%", maxHeight: "93vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(108,99,255,0.18)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1d2e" }}>➕ Ajouter un produit</div>
            <div style={{ fontSize: 11, color: "#5a6585", marginTop: 3 }}>Colle l'URL — l'IA remplit la fiche automatiquement</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a6585", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        {/* URL + bouton analyser */}
        <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.08),rgba(0,212,255,0.06))", border: "1px solid rgba(108,99,255,0.25)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, marginTop: 10 }}>
          <label style={{ ...lbl, color: "#6c63ff" }}>🔗 URL de la page produit</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={form.lien}
              onChange={e => { set("lien", e.target.value); setAnalysed(false); setErrorMsg(""); }}
              onKeyDown={e => e.key === "Enter" && form.lien.trim() && handleAnalyse()}
              placeholder="https://www.fournisseur.fr/produit/..."
              style={{ ...inp, background: "#fff", flex: 1 }}
              autoFocus
              inputMode="url"
            />
            <button
              onClick={handleAnalyse}
              disabled={loading || !form.lien.trim()}
              style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 12, border: "none", background: loading ? "#a0a0a0" : "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: loading || !form.lien.trim() ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              {loading
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Analyse…</>
                : "🔍 Analyser"}
            </button>
          </div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          {errorMsg && (
            <div style={{ marginTop: 8, background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#ff4757", fontWeight: 600 }}>⚠ {errorMsg}</div>
          )}
          {analysed && (
            <div style={{ marginTop: 8, background: "rgba(0,245,147,0.08)", border: "1px solid rgba(0,245,147,0.25)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#00b87a", fontWeight: 600 }}>✅ Fiche remplie automatiquement — vérifie et complète si besoin</div>
          )}
        </div>

        {/* Champs produit */}
        <div style={row}>
          <label style={lbl}>Nom du produit *</label>
          <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="ex: Clé Renault Clio 4 boutons 433MHz" style={inp} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={row}>
            <label style={lbl}>Numéros de pièce</label>
            <input value={form.ref} onChange={e => set("ref", e.target.value)} placeholder="ex: 8T0959754" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>Prix d'achat (€)</label>
            <input type="number" min="0" step="0.01" value={form.prix} onChange={e => set("prix", e.target.value)} placeholder="0.00" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>Marque véhicule</label>
            <input value={form.marque} onChange={e => set("marque", e.target.value)} placeholder="ex: Renault" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)} style={{ ...inp, appearance: "none" }}>
              {["Clé","Télécommande","Coque","Transpondeur","Lame","Accessoire"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={row}>
            <label style={lbl}>Fréquence</label>
            <input value={form.freq} onChange={e => set("freq", e.target.value)} placeholder="ex: 433MHz" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>PCF</label>
            <input value={form.transpondeur} onChange={e => set("transpondeur", e.target.value)} placeholder="ex: PCF7945" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>ID transpondeur</label>
            <input value={form.id_transpondeur || ""} onChange={e => set("id_transpondeur", e.target.value)} placeholder="ex: ID46, ID47, ID4A" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>Pile</label>
            <input value={form.pile || ""} onChange={e => set("pile", e.target.value)} placeholder="ex: CR2032" style={inp} />
          </div>
          <div style={row}>
            <label style={lbl}>Nombre de boutons</label>
            <input type="number" min="1" max="6" value={form.boutons || ""} onChange={e => set("boutons", e.target.value)} placeholder="ex: 3" style={inp} />
          </div>
        </div>

        <div style={row}>
          <label style={lbl}>Modèles compatibles</label>
          <input value={form.modeles} onChange={e => set("modeles", e.target.value)} placeholder="ex: Clio 3, Mégane 2, Kangoo" style={inp} />
        </div>

        <div style={row}>
          <label style={lbl}>Lame</label>
          <input value={form.lame} onChange={e => set("lame", e.target.value)} placeholder="ex: VA2" style={inp} />
        </div>

        <div style={row}>
          <label style={lbl}>🛒 Lien d'achat MK3</label>
          <input value={form.lien_achat || ""} onChange={e => set("lien_achat", e.target.value)} placeholder="https://mk3.fr/produit/..." style={inp} inputMode="url" />
        </div>

        {/* Champ image */}
        <div style={{ ...row, background: "rgba(108,99,255,0.05)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: 12, padding: "10px 12px" }}>
          <label style={{ ...lbl, color: "#6c63ff" }}>📸 URL de la photo du produit</label>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {form.image && form.image !== FALLBACK_IMG && (
              <img src={form.image} alt="" onError={e => { e.target.style.display="none"; }}
                style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, background: "#e8edf8", flexShrink: 0, border: "1px solid rgba(108,99,255,0.2)" }} />
            )}
            <input
              value={form.image === FALLBACK_IMG ? "" : (form.image || "")}
              onChange={e => set("image", e.target.value)}
              placeholder="Appui long sur la photo → Copier le lien"
              style={{ ...inp, fontSize: 11 }}
              inputMode="url"
            />
          </div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 6 }}>💡 Sur mobile : ouvre la page produit → appui long sur la photo → "Copier le lien de l'image"</div>
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 13, borderRadius: 12, border: "1px solid rgba(108,99,255,0.2)", background: "transparent", color: "#5a6585", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
            Annuler
          </button>
          <button onClick={handleConfirm} disabled={!form.nom.trim()}
            style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: form.nom.trim() ? "linear-gradient(135deg,#6c63ff,#00d4ff)" : "rgba(108,99,255,0.3)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: form.nom.trim() ? "pointer" : "default" }}>
            ✅ Créer la fiche produit
          </button>
        </div>

      </div>
    </div>
  );
}

// ============================================================
// ========================= APP ==============================
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState({});
  const [showHistory, setShowHistory] = useState(null);

  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [settings, setSettings] = useState({ nom: "", tel: "", email: "", adresse: "", siret: "", logo: "" });
  // oeLinksOverrides : { [ref]: [{label, url}, ...] } — remplace/complète les oeLinks du catalogue
  const [oeLinksOverrides, setOeLinksOverrides] = useState({});
  const [oeOpen, setOeOpen] = useState(false);
  const [statsTab, setStatsTab] = useState("stats");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showIntervForm, setShowIntervForm] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [statPeriod, setStatPeriod] = useState("mois");
  const [settingsDraft, setSettingsDraft] = useState(null);
  const [factureUrl, setFactureUrl] = useState(null);
  const [devis, setDevis] = useState([]);
  const [showDevisForm, setShowDevisForm] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [intervFormProduct, setIntervFormProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [customAftermarket, setCustomAftermarket] = useState([]);
  const [showUrlImport, setShowUrlImport] = useState(false);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.ref.toLowerCase().includes(q) ||
      p.marque.toLowerCase().includes(q) ||
      (p.modeles && p.modeles.toLowerCase().includes(q)) ||
      (p.lame && p.lame.toLowerCase().includes(q)) ||
      (p.transpondeur && p.transpondeur.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  }, [search, products]);

  const lowStockProducts = useMemo(() =>
    products.filter(p => {
      const s = stock[p.id];
      if (s?.init) return false; // jamais modifié, pas d'alerte
      return s?.qty <= (s?.seuil || SEUIL_DEFAULT);
    }), [stock]);



  const statsData = useMemo(() => {
    const totalRefs = products.length;
    const okCount = products.filter(p => {
      const s = stock[p.id];
      return !s?.init && s?.qty > (s?.seuil || SEUIL_DEFAULT);
    }).length;
    const alertCount = lowStockProducts.length;
    const valeurStock = products.reduce((sum, p) => {
      const s = stock[p.id];
      if (s?.init) return sum;
      return sum + (s?.qty ?? 0) * (p.prix || 0);
    }, 0);
    const budgetCommande = lowStockProducts.reduce((sum, p) => {
      const s = stock[p.id];
      const manquant = Math.max(0, (s?.seuil || SEUIL_DEFAULT) + 2 - (s?.qty ?? 0));
      return sum + manquant * (p.prix || 0);
    }, 0);
    return { totalRefs, okCount, alertCount, valeurStock, budgetCommande };
  }, [stock, lowStockProducts, products]);

  // Persist stock to localStorage on every change
// Auth
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null);
    setAuthReady(true);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
    if (!window.location.hash.includes("type=recovery")) {
      setUser(session?.user ?? null);
    }
  });
  return () => subscription.unsubscribe();
}, []);

  // Charge les données depuis Supabase
  useEffect(() => {
    if (!user) return;
    setDataLoaded(false);
    setSyncing(true);
    dbGetAll(user.id).then(all => {
      React.startTransition(() => {
        if (all[PRODUCTS_KEY]) setProducts(all[PRODUCTS_KEY]);
        if (all[STOCK_KEY])    setStock(all[STOCK_KEY]);
        if (all[CLIENT_KEY])   setClients(all[CLIENT_KEY]);
        if (all[INTERV_KEY])   setInterventions(all[INTERV_KEY]);
        if (all[DEVIS_KEY])    setDevis(all[DEVIS_KEY]);
        if (all[SETTINGS_KEY]) setSettings(all[SETTINGS_KEY]);
        if (all[CUSTOM_AM_KEY]) setCustomAftermarket(all[CUSTOM_AM_KEY]);
        if (all[OE_LINKS_KEY]) setOeLinksOverrides(all[OE_LINKS_KEY]);
        setSyncing(false);
        setDataLoaded(true);
      });
    });
  }, [user]);

  // Recharge les données quand l'onglet reprend le focus + polling 30s
  useEffect(() => {
    const reload = () => {
      if (!user) return;
      dbGetAll(user.id).then(all => {
        if (all[PRODUCTS_KEY]) setProducts(all[PRODUCTS_KEY]);
        if (all[STOCK_KEY])    setStock(all[STOCK_KEY]);
        if (all[CLIENT_KEY])   setClients(all[CLIENT_KEY]);
        if (all[INTERV_KEY])   setInterventions(all[INTERV_KEY]);
        if (all[DEVIS_KEY])    setDevis(all[DEVIS_KEY]);
        if (all[SETTINGS_KEY]) setSettings(all[SETTINGS_KEY]);
        if (all[CUSTOM_AM_KEY]) setCustomAftermarket(all[CUSTOM_AM_KEY]);
        if (all[OE_LINKS_KEY]) setOeLinksOverrides(all[OE_LINKS_KEY]);
      });
    };
    const onVisibility = () => { if (document.visibilityState === "visible") reload(); };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  // Persist vers Supabase
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, STOCK_KEY, stock); }, [stock, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, PRODUCTS_KEY, products); }, [products, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, CLIENT_KEY, clients); }, [clients, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, DEVIS_KEY, devis); }, [devis, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, INTERV_KEY, interventions); }, [interventions, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, SETTINGS_KEY, settings); }, [settings, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, OE_LINKS_KEY, oeLinksOverrides); }, [oeLinksOverrides, user, dataLoaded]);
  useEffect(() => { if (user && dataLoaded) dbSet(user.id, CUSTOM_AM_KEY, customAftermarket); }, [customAftermarket, user, dataLoaded]);

  // Badge color per category
  const catColor = (cat) => {
    if (cat === "Aftermarket France") return "#60a5fa";
    if (cat === "Xhorse") return "#f472b6";
    return "#60a5fa";
  };

  const lienLabel = (p) => {
    if (!p.lien) return null;
    if (p.lienType === "mk3") return { label: "Voir sur MK3.com", bg: "linear-gradient(135deg,#ffa726,#ff6b00)", color: "#fff" };
    if (p.lienType === "aliexpress") return { label: "Voir sur AliExpress", bg: "linear-gradient(135deg,#ff4500,#ff6a00)", color: "#fff" };
    return { label: "Voir le produit", bg: "rgba(255,255,255,0.05)", color: "#5a6585" };
  };

  const exportCSV = () => {
    const rows = lowStockProducts.map(p => {
      const s = stock[p.id];
      const manquant = Math.max(0, (s?.seuil || SEUIL_DEFAULT) + 2 - (s?.qty ?? 0));
      return [p.ref, `"${p.nom.replace(/"/g, "'")}"`, p.marque, s?.qty ?? 0, s?.seuil ?? SEUIL_DEFAULT, manquant, (manquant * (p.prix || 0)).toFixed(2)].join(";");
    });
    const csv = ["Référence;Nom;Marque;Stock actuel;Seuil;À commander;Total €", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "reapprovisionnement.csv"; a.click();
    URL.revokeObjectURL(url);
  };


  // =================== STYLES 2025 PREMIUM ===================
  const XH = {
    bg:       "#c8d0e8",
    bgCard:   "#e8edf8",
    bgCard2:  "#c8d0e8",
    bgGlass:  "rgba(220,228,248,0.9)",
    border:   "rgba(108,99,255,0.12)",
    border2:  "rgba(108,99,255,0.2)",
    borderHi: "rgba(108,99,255,0.6)",
    accent:   "#6c63ff",
    accentLt: "#9d97ff",
    accentAlt:"#ff6b9d",
    cyan:     "#00d4ff",
    green:    "#00f593",
    red:      "#ff4757",
    orange:   "#ffa726",
    text:     "#1a1d2e",
    textDim:  "#8890aa",
    textMid:  "#5a6080",
    grad1:    "linear-gradient(135deg,#6c63ff,#00d4ff)",
    grad2:    "linear-gradient(135deg,#ff6b9d,#ffa726)",
    grad3:    "linear-gradient(135deg,#00f593,#00d4ff)",
  };
  const S = {
    app: { fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#c8d0e8", color: "#1a1d2e", minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" },
    header: { background: "rgba(200,208,232,0.97)", padding: "16px 20px 14px", borderBottom: `1px solid ${XH.border}`, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" },
    logo: { display: "flex", alignItems: "center", gap: 12 },
    logoIcon: { width: 38, height: 38, background: XH.grad1, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${XH.accent}55`, flexShrink: 0 },
    logoText: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.8px", color: "#1a1d2e" },
    logoSub: { fontSize: 10, color: "#5a6585", letterSpacing: 0.3 },
    page: { padding: "16px 16px 110px" },
    searchInput: { flex: 1, background: XH.bgGlass, border: `1px solid ${XH.border2}`, borderRadius: 14, padding: "12px 14px 12px 42px", color: "#1a1d2e", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    catRow: { display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" },
    catBtn: (a) => ({ whiteSpace: "nowrap", padding: "8px 16px", borderRadius: 24, border: `1px solid ${a ? XH.accent : XH.border2}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: a ? XH.accent : "transparent", color: a ? "#fff" : "#3d4870", transition: "all 0.15s", boxShadow: a ? `0 4px 20px ${XH.accent}44` : "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }),
    card: { background: "#e8edf8", borderRadius: 18, overflow: "hidden", marginBottom: 10, border: `1px solid ${XH.border}`, cursor: "pointer", display: "flex", boxShadow: "0 1px 4px rgba(108,99,255,0.08), 0 4px 20px rgba(108,99,255,0.06)" },
    cardImg: { width: 88, height: 88, objectFit: "contain", background: XH.bgCard2, flexShrink: 0, padding: 6 },
    cardBody: { padding: "12px 14px", flex: 1, minWidth: 0 },
    cardCat: (cat) => ({ fontSize: 9, fontWeight: 700, color: catColor(cat), textTransform: "uppercase", letterSpacing: 1.2 }),
    cardName: { fontSize: 13, fontWeight: 500, color: "#1a1d2e", lineHeight: 1.4, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" },
    cardRef: { fontSize: 10, color: "#5a6585", marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: 0.3, fontWeight: 400 },
    badge: (low) => ({ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 700, padding: "4px 12px", borderRadius: 24, marginTop: 6, background: low ? "rgba(255,71,87,0.1)" : "rgba(0,245,147,0.1)", color: low ? "#ff4757" : "#00b87a", border: `1px solid ${low ? XH.red + "33" : XH.green + "33"}` }),
    detailPage: { paddingBottom: 110 },
    detailImg: { width: "100%", height: 220, objectFit: "contain", background: `radial-gradient(ellipse at 50% 30%,${XH.accent}12 0%,${XH.bg} 70%)` },
    detailBody: { padding: "0 18px 18px" },
    infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 },
    infoBox: { background: "#e8edf8", borderRadius: 14, padding: "11px 13px", border: `1px solid ${XH.border}` },
    infoLabel: { fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
    infoValue: { fontSize: 13, color: "#1a1d2e", fontWeight: 600, marginTop: 4 },
    stockBox: { background: "#e8edf8", borderRadius: 18, padding: 18, marginTop: 14, border: `1px solid ${XH.border}` },
    stockNum: (low) => ({ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 900, color: low ? "#ff4757" : "#00b87a", textShadow: `0 0 30px ${low ? XH.red : XH.green}44` }),
    stockBtn: (col) => ({ width: 40, height: 40, borderRadius: 12, border: `1px solid ${col === "plus" ? XH.green + "33" : XH.red + "33"}`, cursor: "pointer", background: col === "plus" ? "rgba(0,245,147,0.12)" : "rgba(255,71,87,0.1)", color: col === "plus" ? XH.green : XH.red, display: "flex", alignItems: "center", justifyContent: "center" }),
    manualRow: { display: "flex", gap: 8, marginTop: 10 },
    manualInput: { flex: 1, background: "#e8edf8", border: `1px solid ${XH.border2}`, borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    manualBtn: { padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer", background: XH.grad1, color: "#fff", fontWeight: 600, fontSize: 13, boxShadow: `0 4px 20px ${XH.accent}44`, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    googleBtn: { width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(66,133,244,0.3)", cursor: "pointer", background: "rgba(66,133,244,0.1)", color: "#4285f4", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    linkBtn: (bg, color) => ({ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", background: bg, color: color, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", fontFamily: "'Plus Jakarta Sans', sans-serif" }),
    statsRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 },
    statBox: { background: "#e8edf8", borderRadius: 16, padding: "14px 6px", border: `1px solid ${XH.border}`, textAlign: "center", position: "relative", overflow: "hidden" },
    statNum: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: XH.accent },
    statLabel: { fontSize: 8, color: "#5a6585", fontWeight: 600, textTransform: "uppercase", marginTop: 4, letterSpacing: 0.6 },
    alertBanner: { background: "rgba(255,71,87,0.06)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 16, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 },
    historyModal: { position: "fixed", inset: 0, background: "rgba(10,12,30,0.5)", backdropFilter: "blur(8px)", zIndex: 999, display: "flex", alignItems: "flex-end" },
    historyPanel: { background: "#e8edf8", borderRadius: "24px 24px 0 0", padding: 24, width: "100%", maxHeight: "65vh", overflowY: "auto", border: `1px solid ${XH.border2}`, borderBottom: "none", boxShadow: "0 -8px 40px rgba(108,99,255,0.15)" },
    filterRow: { display: "flex", gap: 6, marginBottom: 14 },
    filterBtn: (a) => ({ padding: "8px 16px", borderRadius: 24, border: `1px solid ${a ? XH.accent : "rgba(108,99,255,0.15)"}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: a ? XH.accent : "transparent", color: a ? "#fff" : "#3d4870", fontFamily: "'Plus Jakarta Sans', sans-serif" }),
    stockCard: { background: "#e8edf8", borderRadius: 16, padding: "13px 15px", marginBottom: 8, border: `1px solid ${XH.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" },
    stockCardImg: { width: 52, height: 52, objectFit: "contain", background: XH.bgCard2, borderRadius: 12, flexShrink: 0 },
    sectionTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#3d4870", marginBottom: 14, letterSpacing: 1.5, textTransform: "uppercase" },
    quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 },
    quickCard: { background: "#e8edf8", borderRadius: 18, padding: 18, border: `1px solid ${XH.border}`, cursor: "pointer", position: "relative", overflow: "hidden", boxShadow: "0 2px 16px rgba(108,99,255,0.08)" },
  };

  // =================== RENDERS ===================
  const renderHome = () => (
    <div style={S.page}>
      <div style={S.statsRow}>
        {[
          { val: statsData.totalRefs, label: "Réfs", color: "#6c63ff" },
          { val: statsData.okCount, label: "OK", color: "#00f593" },
          { val: statsData.alertCount, label: "Alertes", color: statsData.alertCount > 0 ? "#ff4757" : "#00f593" },
          { val: statsData.valeurStock.toFixed(0) + "€", label: "Valeur", color: "#00d4ff" },
          { val: statsData.budgetCommande.toFixed(0) + "€", label: "Budget", color: "#ffa726", clickable: statsData.alertCount > 0 },
        ].map((s, i) => (
          <div key={i} className="mrkey-stat" onClick={i === 4 && s.clickable ? exportCSV : undefined}
            style={{ ...S.statBox, cursor: i === 4 && s.clickable ? "pointer" : "default", background: i === 4 && s.clickable ? "rgba(255,167,38,0.06)" : S.statBox.background }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 900, color: s.color, lineHeight: 1.1 }}>{s.val}</div>
            <div style={S.statLabel}>{s.label}{i === 4 && s.clickable ? " 📥" : ""}</div>
          </div>
        ))}
      </div>



      <div style={S.sectionTitle}>Accès rapide</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div onClick={() => setPage("stock")}
          style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.1),rgba(0,212,255,0.06))", borderRadius: 16, padding: "14px 14px", border: `1px solid rgba(108,99,255,${statsData.alertCount > 0 ? 0.5 : 0.2})`, cursor: "pointer", position: "relative" }}>
          {statsData.alertCount > 0 && <span style={{ position: "absolute", top: 8, right: 8, background: "#ff4757", color: "#fff", borderRadius: "50%", fontSize: 9, fontWeight: 800, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{statsData.alertCount}</span>}
          <div style={{ fontSize: 20, marginBottom: 6 }}>📦</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Mon Stock</div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 3 }}>{products.length} référence{products.length !== 1 ? "s" : ""}</div>
        </div>
        <div onClick={() => setPage("aftermarket")}
          style={{ background: "linear-gradient(135deg,rgba(2,132,199,0.08),rgba(14,165,233,0.04))", borderRadius: 16, padding: "14px 14px", border: "1px solid rgba(2,132,199,0.25)", cursor: "pointer" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🔑</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Aftermarket</div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 3 }}>Catalogue · {SILCA_DB.length} réf.</div>
        </div>
        <div onClick={() => setPage("clients")}
          style={{ background: "#e8edf8", borderRadius: 16, padding: "14px 14px", border: "1px solid rgba(96,165,250,0.3)", cursor: "pointer" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>👤</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Clients</div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 3 }}>{clients.length} client{clients.length !== 1 ? "s" : ""}</div>
        </div>
        <div onClick={() => setPage("devis")}
          style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.06),rgba(108,99,255,0.04))", borderRadius: 16, padding: "14px 14px", border: "1px solid rgba(0,212,255,0.2)", cursor: "pointer" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>📄</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Devis</div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 3 }}>{devis.length} devis</div>
        </div>
        <div onClick={() => setPage("stats")}
          style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.08),rgba(0,212,255,0.04))", borderRadius: 16, padding: "14px 14px", border: "1px solid rgba(108,99,255,0.15)", cursor: "pointer" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>📊</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Statistiques</div>
          <div style={{ fontSize: 10, color: "#5a6585", marginTop: 3 }}>{interventions.length} intervention{interventions.length !== 1 ? "s" : ""}</div>
        </div>
        <div onClick={() => setPage("settings")}
          style={{ background: "#e8edf8", borderRadius: 16, padding: "14px 14px", border: "1px solid rgba(108,99,255,0.12)", cursor: "pointer", gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20 }}>⚙️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>Paramètres</div>
              <div style={{ fontSize: 10, color: "#5a6585", marginTop: 2 }}>{settings.nom || "Non configuré"}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a6585" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      <div style={S.sectionTitle}>Recherche par référence</div>
      <div style={{ position: "relative", marginBottom: 10 }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><SearchIcon /></span>
        <input style={S.searchInput} placeholder="Référence, lame, transpondeur…"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5a6585", fontSize: 16 }}>✕</button>}
      </div>
      {search.trim() && (
        filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#5a6585", fontSize: 13 }}>Aucun résultat pour « {search} »</div>
        ) : filtered.map(p => {
          const s = stock[p.id];
          const isInit = s?.init;
          const isLow = !isInit && s?.qty <= (s?.seuil || SEUIL_DEFAULT);
          return (
            <div key={p.id} className="mrkey-card" style={S.card} onClick={() => { setSelectedProduct(p); setPage("detail"); }}>
              <img src={p.image} alt={p.nom} style={S.cardImg} onError={e => { e.target.src = FALLBACK_IMG; }} />
              <div style={S.cardBody}>
                <div style={S.cardCat(p.categorie)}>{p.categorie}</div>
                <div style={S.cardName}>{p.nom}</div>
                <div style={S.cardRef}>{p.ref}</div>
                <span style={S.badge(isLow)}>{isInit ? "— à saisir" : isLow ? `⚠ ${s?.qty}` : `✓ ${s?.qty}`}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );






  // ============================================================
  // ================== RENDER CLIENT DETAIL ===================
  // ============================================================
  const renderClientDetail = () => {
    if (!selectedClient) return null;
    const c = selectedClient;
    const intervs = interventions.filter(i => i.clientId === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const caTotal = intervs.reduce((s, i) => s + (parseFloat(i.prixTTC) || 0), 0);

    const genererFacture = (interv) => {
      const prod = products.find(p => p.id === interv.produitId);
      const num = getNextNum("FAC");
      const tva = (parseFloat(interv.prixTTC) - parseFloat(interv.prixHT)).toFixed(2);
      setFactureUrl({ interv, prod, num, tva, client: c });
    };

    return (
      <div style={{ paddingBottom: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "#c8d0e8", borderBottom: "1px solid rgba(108,99,255,0.12)", position: "sticky", top: 0, zIndex: 10 }}>
          <button onClick={() => { setPage("clients"); setSelectedClient(null); }} style={{ background: "none", border: "none", color: "#6c63ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> Retour
          </button>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 15, color: "#1a1d2e" }}>{c.nom}</div>
          <button onClick={() => setShowClientForm(c)} style={{ background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 8, padding: "6px 10px", color: "#6c63ff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️ Modifier</button>
          <button onClick={() => {
            if (window.confirm("Supprimer ce client et ses interventions ?")) {
              setClients(prev => prev.filter(cl => cl.id !== c.id));
              setInterventions(prev => prev.filter(iv => iv.clientId !== c.id));
              setPage("clients");
              setSelectedClient(null);
              showToast("🗑 Client supprimé");
            }
          }} style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 8, padding: "6px 10px", color: "#ff4757", fontSize: 13, cursor: "pointer" }}>🗑</button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ background: "#e8edf8", borderRadius: 16, padding: 16, marginBottom: 14, border: "1px solid rgba(108,99,255,0.12)" }}>
            {[["🚗", "Véhicule", c.vehicule], ["🔑", "Plaque", c.plaque], ["📱", "Téléphone", c.tel], ["📧", "Email", c.email], ["📍", "Adresse", c.adresse], ["🔢", "VIN", c.vin]].filter(([,, v]) => v).map(([ico, lbl, val]) => (
              <div key={lbl} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14 }}>{ico}</span>
                <div><div style={{ fontSize: 9, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 0.8 }}>{lbl}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d2e", marginTop: 1 }}>{val}</div></div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(108,99,255,0.1)" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#6c63ff" }}>{intervs.length}</div>
                <div style={{ fontSize: 10, color: "#5a6585", fontWeight: 600 }}>Interventions</div>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "#00f593" }}>{caTotal.toFixed(2)}€</div>
                <div style={{ fontSize: 10, color: "#5a6585", fontWeight: 600 }}>CA Total TTC</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#3d4870", letterSpacing: 1.5, textTransform: "uppercase" }}>Interventions</div>
            <button onClick={() => setShowIntervForm(true)} style={{ background: "linear-gradient(135deg,#6c63ff,#00d4ff)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Ajouter</button>
          </div>

          {intervs.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "#5a6585", fontSize: 13 }}>Aucune intervention enregistrée</div>}

          {intervs.map(interv => {
            const prod = products.find(p => p.id === interv.produitId);
            return (
              <div key={interv.id} style={{ background: "#e8edf8", borderRadius: 14, padding: 14, marginBottom: 8, border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: "#5a6585", fontWeight: 600 }}>{interv.date}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#6c63ff" }}>{interv.prixTTC} € TTC</div>
                </div>
                {prod && <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1d2e", marginBottom: 4 }}>{prod.nom}</div>}
                {interv.note && <div style={{ fontSize: 11, color: "#5a6585", marginBottom: 8 }}>{interv.note}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => genererFacture(interv)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ffa726,#ff6b00)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    📄 Voir facture
                  </button>
                  <a href={(() => { const pr = products.find(p => p.id === interv.produitId); const n = interv.numFacture || ("FAC-" + interv.id.slice(-6)); const tvaVal = (parseFloat(interv.prixTTC) - parseFloat(interv.prixHT)).toFixed(2); return `mailto:${c.email || ""}?subject=${encodeURIComponent("Facture " + n + " - MrKey Pro")}&body=${encodeURIComponent("Bonjour " + c.nom + ",\n\nVotre facture N° " + n + " du " + interv.date + ".\n\n" + (pr ? pr.nom : "Clé automobile") + " x" + (interv.qty || 1) + "\nHT : " + interv.prixHT + " €\nTVA 20% : " + tvaVal + " €\nTTC : " + interv.prixTTC + " €\n\nCordialement,\n" + (settings.nom || "MrKey Pro"))}`; })()}
                    style={{ flex: 1, padding: "9px", borderRadius: 10, background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    ✉️ Mail
                  </a>
                  <button onClick={() => {
                    if (window.confirm("Supprimer cette intervention ?")) {
                      setInterventions(prev => prev.filter(iv => iv.id !== interv.id));
                      showToast("🗑 Intervention supprimée");
                    }
                  }} style={{ padding: "9px 10px", borderRadius: 10, border: "1px solid rgba(255,71,87,0.25)", background: "rgba(255,71,87,0.06)", color: "#ff4757", fontSize: 13, cursor: "pointer" }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showClientForm && typeof showClientForm === "object" && (
          <ClientForm initial={showClientForm} onSave={(updated) => {
            setClients(prev => prev.map(cl => cl.id === c.id ? { ...cl, ...updated } : cl));
            setSelectedClient(prev => ({ ...prev, ...updated }));
            setShowClientForm(false);
          }} onClose={() => setShowClientForm(false)} />
        )}
        {showIntervForm && (
          <InterventionForm clients={clients} products={products} defaultClientId={c.id}
            onSave={(interv) => { setInterventions(prev => [interv, ...prev]); setShowIntervForm(false); }}
            onClose={() => setShowIntervForm(false)} />
        )}
      </div>
    );
  };

  // ============================================================
  // =================== RENDER DEVIS ==========================
  // ============================================================
  const renderDevis = () => {
    const statutColors = { en_attente: { bg: "rgba(255,167,38,0.12)", color: "#ffa726", label: "⏳ En attente" }, accepte: { bg: "rgba(0,245,147,0.12)", color: "#00b87a", label: "✅ Accepté" }, refuse: { bg: "rgba(255,71,87,0.12)", color: "#ff4757", label: "❌ Refusé" }, facture: { bg: "rgba(108,99,255,0.12)", color: "#6c63ff", label: "📄 Facturé" } };
    return (
      <div style={S.page}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#3d4870", letterSpacing: 1.5, textTransform: "uppercase" }}>Devis</div>
          <button onClick={() => setShowDevisForm(true)} style={{ background: "linear-gradient(135deg,#6c63ff,#00d4ff)", border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Nouveau</button>
        </div>

        {devis.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a6585" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1d2e" }}>Aucun devis</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Créez votre premier devis</div>
          </div>
        )}

        {devis.map(d => {
          const client = clients.find(c => c.id === d.clientId);
          const prod = products.find(p => p.id === d.produitId);
          const st = statutColors[d.statut] || statutColors.en_attente;
          return (
            <div key={d.id} className="mrkey-card" style={{ ...S.card, flexDirection: "column", padding: 14 }}>
              {/* Header devis */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 800, color: "#1a1d2e" }}>{d.numDevis || ("DEV-" + d.id.slice(-6))}</div>
                  <div style={{ fontSize: 11, color: "#5a6585", marginTop: 2 }}>{d.date} · Valide jusqu'au {d.validite}</div>
                </div>
                <div style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>{st.label}</div>
              </div>
              {/* Client + produit */}
              <div style={{ background: "#e8edf8", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1d2e" }}>{client?.nom || "Client inconnu"}</div>
                {client?.plaque && <div style={{ fontSize: 11, color: "#5a6585" }}>{client.plaque}</div>}
                {prod && <div style={{ fontSize: 12, color: "#6c63ff", marginTop: 4, fontWeight: 600 }}>🔑 {prod.nom}</div>}
              </div>
              {/* Prix */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#5a6585" }}>HT : {d.prixHT} € · TVA : {(parseFloat(d.prixTTC) - parseFloat(d.prixHT)).toFixed(2)} €</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 900, color: "#6c63ff" }}>{d.prixTTC} € TTC</div>
              </div>
              {/* Actions */}
              {d.statut !== "facture" && (
                <div style={{ display: "flex", gap: 6 }}>
                  {d.statut === "en_attente" && <>
                    <button onClick={() => setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: "accepte" } : x))}
                      style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: "rgba(0,245,147,0.12)", color: "#00b87a", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>✅ Accepté</button>
                    <button onClick={() => setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: "refuse" } : x))}
                      style={{ flex: 1, padding: "8px", borderRadius: 10, border: "none", background: "rgba(255,71,87,0.12)", color: "#ff4757", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>❌ Refusé</button>
                  </>}
                  {d.statut === "accepte" && (
                    <button onClick={() => {
                      const numFacture = getNextNum("FAC");
                      const interv = { id: Date.now().toString(), clientId: d.clientId, produitId: d.produitId, qty: d.qty, prixHT: d.prixHT, prixTTC: d.prixTTC, note: d.note, date: new Date().toLocaleDateString("fr-FR"), numFacture };
                      setInterventions(prev => [interv, ...prev]);
                      setDevis(prev => prev.map(x => x.id === d.id ? { ...x, statut: "facture", numFacture } : x));
                      showToast(`✅ Facture ${numFacture} créée !`);
                    }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      📄 Convertir en facture
                    </button>
                  )}
                  <button onClick={() => setDevis(prev => prev.filter(x => x.id !== d.id))}
                    style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,71,87,0.2)", background: "transparent", color: "#ff4757", fontSize: 11, cursor: "pointer" }}>🗑</button>
                </div>
              )}
              {d.statut === "facture" && (
                <div style={{ background: "rgba(108,99,255,0.08)", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#6c63ff", fontWeight: 600, textAlign: "center" }}>
                  📄 Facturé — {d.numFacture}
                </div>
              )}
            </div>
          );
        })}

        {showDevisForm && (
          <DevisForm clients={clients} products={products}
            onSave={(d) => { const numDevis = getNextNum("DEV"); setDevis(prev => [{ ...d, numDevis }, ...prev]); setShowDevisForm(false); }}
            onClose={() => setShowDevisForm(false)} />
        )}
      </div>
    );
  };

  // ============================================================
  // =================== RENDER CLIENTS ========================
  // ============================================================
  const renderClients = () => {
    const filtered = clients.filter(c =>
      c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.plaque && c.plaque.toLowerCase().includes(clientSearch.toLowerCase())) ||
      (c.tel && c.tel.includes(clientSearch))
    );
    return (
      <div style={S.page}>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1d2e" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ ...S.searchInput, paddingLeft: 36 }} placeholder="Rechercher un client..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowClientForm(true)} style={{ background: "linear-gradient(135deg,#6c63ff,#00d4ff)", border: "none", borderRadius: 12, padding: "10px 14px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ Nouveau</button>
        </div>

        {filtered.length === 0 && !showClientForm && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a6585" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1d2e" }}>Aucun client</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ajoutez votre premier client</div>
          </div>
        )}

        {filtered.map(c => {
          const intervs = interventions.filter(i => i.clientId === c.id);
          const caTotal = intervs.reduce((s, i) => s + (parseFloat(i.prixTTC) || 0), 0);
          return (
            <div key={c.id} className="mrkey-card" style={{ ...S.card, flexDirection: "column", padding: 14 }} onClick={() => { setSelectedClient(c); setPage("clientDetail"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6c63ff22,#00d4ff22)", border: "1px solid rgba(108,99,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{c.nom}</div>
                  <div style={{ fontSize: 12, color: "#5a6585", marginTop: 2 }}>{c.tel} {c.plaque && `· ${c.plaque}`}</div>
                  {c.vehicule && <div style={{ fontSize: 11, color: "#6c63ff", marginTop: 2, fontWeight: 600 }}>🚗 {c.vehicule}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#6c63ff" }}>{caTotal.toFixed(2)}€</div>
                  <div style={{ fontSize: 10, color: "#5a6585" }}>{intervs.length} interv.</div>
                </div>
              </div>
            </div>
          );
        })}

        {showClientForm && <ClientForm onSave={(c) => { setClients(prev => [...prev, { ...c, id: Date.now().toString() }]); setShowClientForm(false); }} onClose={() => setShowClientForm(false)} />}
      </div>
    );
  };

  // ============================================================
  // =================== RENDER STATS ==========================
  // ============================================================
  const renderStats = () => {
    const now = new Date();
    const parseDate = (s) => { try { const [d,m,y] = (s||"").split("/"); return new Date(+y,+m-1,+d); } catch { return new Date(s); } };
    const filtered = interventions.filter(i => {
      const d = parseDate(i.date);
      if (statPeriod === "semaine") return (now - d) < 7 * 86400000;
      if (statPeriod === "mois") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (statPeriod === "annee") return d.getFullYear() === now.getFullYear();
      return true;
    });
    const ca = filtered.reduce((s, i) => s + (parseFloat(i.prixTTC) || 0), 0);
    const caHT = filtered.reduce((s, i) => s + (parseFloat(i.prixHT) || 0), 0);
    const tva = ca - caHT;
    const keyCount = {};
    filtered.forEach(i => { if (i.produitId) keyCount[i.produitId] = (keyCount[i.produitId] || 0) + 1; });
    const topKeys = Object.entries(keyCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => ({ prod: products.find(p => p.id === id), n })).filter(x => x.prod);

    // Graphique CA 6 mois
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mois = d.toLocaleString("fr-FR", { month: "short" });
      const m = d.getMonth(); const y = d.getFullYear();
      const ca_m = interventions.filter(iv => { const dd = parseDate(iv.date); return dd.getMonth() === m && dd.getFullYear() === y; }).reduce((s, iv) => s + (parseFloat(iv.prixTTC) || 0), 0);
      months.push({ mois, ca: ca_m });
    }
    const maxCA = Math.max(...months.map(m => m.ca), 1);
    const W = 320, H = 100, PAD = 8, barW = (W - PAD * 2) / months.length - 6;
    const allIntervs = [...interventions].sort((a, b) => parseDate(b.date) - parseDate(a.date));

    return (
      <div style={S.page}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["stats", "📊 Stats"], ["history", "📋 Historique"]].map(([k, l]) => (
            <button key={k} onClick={() => setStatsTab(k)}
              style={{ flex: 1, padding: "10px 8px", borderRadius: 12, border: `1px solid ${statsTab === k ? "#6c63ff" : "rgba(108,99,255,0.2)"}`, background: statsTab === k ? "#6c63ff" : "transparent", color: statsTab === k ? "#fff" : "#5a6585", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {l}
            </button>
          ))}
        </div>

        {statsTab === "stats" && (<>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[["semaine", "7j"], ["mois", "Ce mois"], ["annee", "Année"]].map(([k, l]) => (
              <button key={k} onClick={() => setStatPeriod(k)} style={{ ...S.catBtn(statPeriod === k), fontSize: 12 }}>{l}</button>
            ))}
          </div>
          <div style={{ background: "#e8edf8", borderRadius: 18, padding: "16px 14px 10px", marginBottom: 16, border: "1px solid rgba(108,99,255,0.12)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5a6585", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>CA TTC — 6 mois</div>
            <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
              {months.map((m, i) => {
                const x = PAD + i * ((W - PAD * 2) / months.length) + 3;
                const barH = m.ca > 0 ? Math.max(4, (m.ca / maxCA) * (H - 10)) : 4;
                const y = H - barH;
                const isLast = i === months.length - 1;
                return (<g key={i}>
                  <rect x={x} y={y} width={barW} height={barH} rx="5" fill={isLast ? "url(#grad)" : "rgba(108,99,255,0.25)"} />
                  {m.ca > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="8" fill={isLast ? "#6c63ff" : "#8890aa"} fontWeight="700">{m.ca >= 1000 ? (m.ca / 1000).toFixed(1) + "k" : m.ca.toFixed(0)}€</text>}
                  <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#5a6585" fontWeight="600">{m.mois}</text>
                </g>);
              })}
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c63ff"/><stop offset="100%" stopColor="#00d4ff"/></linearGradient></defs>
            </svg>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[{ val: ca.toFixed(2) + "€", label: "CA TTC", color: "#6c63ff" }, { val: caHT.toFixed(2) + "€", label: "CA HT", color: "#00d4ff" }, { val: tva.toFixed(2) + "€", label: "TVA 20%", color: "#ffa726" }].map((s, i) => (
              <div key={i} style={{ background: "#e8edf8", borderRadius: 14, padding: "14px 8px", textAlign: "center", border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
            {[{ val: filtered.length, label: "Interventions", color: "#00f593" }, { val: clients.length, label: "Clients", color: "#ff6b9d" }].map((s, i) => (
              <div key={i} style={{ background: "#e8edf8", borderRadius: 14, padding: "14px 8px", textAlign: "center", border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "#5a6585", fontWeight: 700, textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {topKeys.length > 0 && (<>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#3d4870", marginBottom: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Top clés vendues</div>
            {topKeys.map(({ prod, n }) => (
              <div key={prod.id} style={{ background: "#e8edf8", borderRadius: 12, padding: "10px 14px", marginBottom: 6, border: "1px solid rgba(108,99,255,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
                <img src={prod.image || FALLBACK_IMG} alt="" style={{ width: 40, height: 40, objectFit: "contain", background: "#f0f4ff", borderRadius: 8 }} onError={e => { e.target.src = FALLBACK_IMG; }} />
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#1a1d2e" }}>{prod.nom}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#6c63ff" }}>{n}×</div>
              </div>
            ))}
          </>)}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a6585" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontWeight: 700 }}>Aucune intervention</div></div>}
        </>)}

        {statsTab === "history" && (<>
          <div style={{ fontSize: 12, color: "#5a6585", marginBottom: 12 }}>
            {allIntervs.length} intervention{allIntervs.length > 1 ? "s" : ""} · CA : <strong style={{ color: "#6c63ff" }}>{allIntervs.reduce((s,i) => s + (parseFloat(i.prixTTC)||0), 0).toFixed(2)} €</strong>
          </div>
          {allIntervs.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a6585" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><div style={{ fontWeight: 700 }}>Aucune intervention</div></div>}
          {allIntervs.map(interv => {
            const client = clients.find(c => c.id === interv.clientId);
            const prod = products.find(p => p.id === interv.produitId);
            return (
              <div key={interv.id} style={{ background: "#e8edf8", borderRadius: 14, padding: "12px 14px", marginBottom: 8, border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 13, color: "#1a1d2e" }}>{client?.nom || "Client inconnu"}</div>{client?.plaque && <div style={{ fontSize: 11, color: "#5a6585" }}>🚗 {client.plaque}</div>}</div>
                  <div style={{ textAlign: "right" }}><div style={{ fontWeight: 800, fontSize: 15, color: "#6c63ff" }}>{interv.prixTTC} €</div><div style={{ fontSize: 10, color: "#5a6585" }}>{interv.date}</div></div>
                </div>
                {prod && <div style={{ fontSize: 12, color: "#5a6585", marginBottom: 2 }}>🔑 {prod.nom}</div>}
                {interv.note && <div style={{ fontSize: 11, color: "#8890aa", fontStyle: "italic" }}>{interv.note}</div>}
                {interv.numFacture && <div style={{ fontSize: 10, fontWeight: 700, color: "#6c63ff", marginTop: 4 }}>📄 {interv.numFacture}</div>}
              </div>
            );
          })}
        </>)}
      </div>
    );
  };

  // ============================================================
  // =================== RENDER SETTINGS =======================
  // ============================================================
  const renderSettings = () => {
    const draft = settingsDraft || settings;
    const setDraft = setSettingsDraft;

    const exportBackup = () => {
      const data = {

        date: new Date().toISOString(),
        products, stock, clients, interventions, devis, settings
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mrkey-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("✅ Backup téléchargé !");
    };

    const importBackup = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.version && data.products) {
            if (window.confirm("Restaurer ce backup ? Les données actuelles seront remplacées.")) {
              if (data.products) setProducts(data.products);
              if (data.stock) setStock(data.stock);
              if (data.clients) setClients(data.clients);
              if (data.interventions) setInterventions(data.interventions);
              if (data.devis) setDevis(data.devis);
              if (data.settings) setSettings(data.settings);
              showToast("✅ Backup restauré !");
            }
          } else {
            showToast("❌ Fichier invalide", "error");
          }
        } catch { showToast("❌ Erreur de lecture", "error"); }
      };
      reader.readAsText(file);
    };

    return (
      <div style={S.page}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#3d4870", marginBottom: 14, letterSpacing: 1.5, textTransform: "uppercase" }}>Mes coordonnées pro</div>
        {[["nom", "Nom / Raison sociale"], ["tel", "Téléphone"], ["email", "Email"], ["adresse", "Adresse"], ["siret", "SIRET"]].map(([k, lbl]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a6585", marginBottom: 4 }}>{lbl}</div>
            <input value={draft[k] || ""} onChange={e => setDraft(p => ({ ...(p || settings), [k]: e.target.value }))}
              style={{ width: "100%", background: "#e8edf8", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 12, padding: "10px 14px", color: "#1a1d2e", fontSize: 13, outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
          </div>
        ))}
        <button onClick={() => { setSettings(draft); setSettingsDraft(null); showToast("✅ Coordonnées enregistrées !"); }}
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", fontWeight: 700, fontSize: 14, marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Enregistrer
        </button>

        {/* Section backup */}
        <div style={{ marginTop: 28, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#3d4870", marginBottom: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>Sauvegarde des données</div>
        <div style={{ background: "#e8edf8", borderRadius: 16, padding: 16, border: "1px solid rgba(108,99,255,0.12)", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "#5a6585", marginBottom: 12, lineHeight: 1.5 }}>
            Exportez toutes vos données ({products.length} produits · {clients.length} clients · {interventions.length} interventions) dans un fichier JSON.
          </div>
          <button onClick={exportBackup}
            style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#00b87a,#00f593)", color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            📥 Exporter le backup
          </button>
          <label style={{ width: "100%", display: "block", padding: 13, borderRadius: 12, border: "1px solid rgba(108,99,255,0.2)", cursor: "pointer", background: "transparent", color: "#6c63ff", fontWeight: 700, fontSize: 13, textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            📤 Importer un backup
            <input type="file" accept=".json" style={{ display: "none" }} onChange={importBackup} />
          </label>
        </div>

        {/* ─── Éditeur liens OE fournisseurs ─────────────────── */}
        {(() => {
          const catalogRefs = SILCA_DB.filter(e => e.oeLinks && e.oeLinks.length > 0).map(e => e.ref);
          const overrideRefs = Object.keys(oeLinksOverrides);
          const allRefs = [...new Set([...catalogRefs, ...overrideRefs])];
          const modifiedCount = overrideRefs.length;

          return (
            <div style={{ marginTop: 24, marginBottom: 10 }}>
              {/* Bouton accordéon */}
              <button onClick={() => setOeOpen(o => !o)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: oeOpen ? "rgba(2,132,199,0.12)" : "#e8edf8",
                  border: `1px solid ${oeOpen ? "rgba(2,132,199,0.4)" : "rgba(2,132,199,0.2)"}`,
                  borderRadius: oeOpen ? "14px 14px 0 0" : 14, padding: "14px 16px",
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔗</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0284c7", letterSpacing: 0.3 }}>
                      Liens fournisseurs (OE)
                    </div>
                    <div style={{ fontSize: 10, color: "#5a6585", marginTop: 1 }}>
                      {allRefs.length} références · {modifiedCount > 0 ? `${modifiedCount} modifiée${modifiedCount > 1 ? "s" : ""}` : "liens par défaut"}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: "#0284c7", fontWeight: 700, transform: oeOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>›</span>
              </button>

              {/* Contenu accordéon */}
              {oeOpen && (
                <div style={{ background: "#f4f7fb", border: "1px solid rgba(2,132,199,0.2)", borderTop: "none",
                  borderRadius: "0 0 14px 14px", padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#5a6585", marginBottom: 14, lineHeight: 1.6 }}>
                    Modifiez les liens de chaque référence. Vos changements remplacent les liens du catalogue et sont sauvegardés automatiquement.
                  </div>

                  {allRefs.map(ref => {
                    const catalogEntry = SILCA_DB.find(e => e.ref === ref);
                    const catalogLinks = catalogEntry?.oeLinks || [];
                    const userLinks    = oeLinksOverrides[ref] ?? catalogLinks;
                    const isModified   = !!oeLinksOverrides[ref];

                    const setLinks   = (newLinks) => setOeLinksOverrides(prev => ({ ...prev, [ref]: newLinks }));
                    const resetLinks = () => setOeLinksOverrides(prev => { const n = { ...prev }; delete n[ref]; return n; });

                    return (
                      <div key={ref} style={{ marginBottom: 14, background: "#fff", borderRadius: 12, padding: 12,
                        border: `1px solid ${isModified ? "rgba(2,132,199,0.35)" : "rgba(108,99,255,0.1)"}` }}>
                        {/* En-tête ref */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ background: "#cc0000", color: "#fff", fontWeight: 800, fontSize: 10,
                              padding: "2px 8px", borderRadius: 6 }}>{ref}</span>
                            {catalogEntry && <span style={{ fontSize: 10, color: "#5a6585" }}>{catalogEntry.marque}</span>}
                            {isModified && <span style={{ fontSize: 9, color: "#0284c7", fontWeight: 800,
                              background: "rgba(2,132,199,0.1)", padding: "2px 7px", borderRadius: 4 }}>✏ MODIFIÉ</span>}
                          </div>
                          {isModified && (
                            <button onClick={resetLinks}
                              style={{ fontSize: 10, color: "#ff4757", background: "rgba(255,71,87,0.07)",
                                border: "1px solid rgba(255,71,87,0.2)", borderRadius: 6, padding: "3px 9px",
                                cursor: "pointer", fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                              ↺ Réinitialiser
                            </button>
                          )}
                        </div>

                        {/* Champs label + URL pour chaque lien */}
                        {userLinks.map((lnk, li) => (
                          <div key={li} style={{ display: "flex", gap: 5, marginBottom: 6, alignItems: "center" }}>
                            <input value={lnk.label} placeholder="Libellé"
                              onChange={e => { const l = [...userLinks]; l[li] = { ...l[li], label: e.target.value }; setLinks(l); }}
                              style={{ flex: "0 0 100px", background: "#e8edf8", border: "1px solid rgba(2,132,199,0.25)",
                                borderRadius: 8, padding: "8px 10px", fontSize: 11, outline: "none",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#1a1d2e", boxSizing: "border-box" }} />
                            <input value={lnk.url} placeholder="https://..."
                              onChange={e => { const l = [...userLinks]; l[li] = { ...l[li], url: e.target.value }; setLinks(l); }}
                              style={{ flex: 1, background: "#e8edf8", border: "1px solid rgba(2,132,199,0.25)",
                                borderRadius: 8, padding: "8px 10px", fontSize: 11, outline: "none",
                                fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#1a1d2e", boxSizing: "border-box", minWidth: 0 }} />
                            <button onClick={() => setLinks(userLinks.filter((_, i) => i !== li))}
                              style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                                border: "1px solid rgba(255,71,87,0.3)", background: "rgba(255,71,87,0.08)",
                                color: "#ff4757", fontSize: 16, cursor: "pointer", fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                          </div>
                        ))}

                        <button onClick={() => setLinks([...userLinks, { label: "", url: "https://" }])}
                          style={{ marginTop: 2, fontSize: 11, color: "#0284c7", background: "rgba(2,132,199,0.07)",
                            border: "1px solid rgba(2,132,199,0.2)", borderRadius: 8, padding: "6px 13px",
                            cursor: "pointer", fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                          + Ajouter un lien
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Section danger */}
        <div style={{ marginTop: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#ff4757", marginBottom: 12, letterSpacing: 1.5, textTransform: "uppercase" }}>Zone danger</div>
        <button onClick={() => {
          if (window.confirm("⚠️ Effacer TOUTES les données ? Cette action est irréversible.")) {
            if (window.confirm("Dernière confirmation — tout sera supprimé.")) {
              setProducts([]); setStock({}); setClients([]); setInterventions([]); setDevis([]);
              showToast("🗑 Toutes les données effacées");
            }
          }
        }} style={{ width: "100%", padding: 13, borderRadius: 12, border: "1px solid rgba(255,71,87,0.3)", cursor: "pointer", background: "rgba(255,71,87,0.06)", color: "#ff4757", fontWeight: 700, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          🗑 Effacer toutes les données
        </button>
      </div>
    );
  };

  // ============================================================
  // =================== RENDER STOCK ==========================
  // ============================================================
  const renderStock = () => {
    const sorted = [...products].sort((a, b) => {
      const sa = stock[a.id]; const sb = stock[b.id];
      const lowA = !sa?.init && sa?.qty <= (sa?.seuil || SEUIL_DEFAULT);
      const lowB = !sb?.init && sb?.qty <= (sb?.seuil || SEUIL_DEFAULT);
      if (lowA && !lowB) return -1;
      if (!lowA && lowB) return 1;
      return 0;
    });
    const q = search.trim().toLowerCase();
    const visible = q ? sorted.filter(p =>
      p.nom.toLowerCase().includes(q) ||
      p.ref.toLowerCase().includes(q) ||
      (p.marque && p.marque.toLowerCase().includes(q)) ||
      (p.lame && p.lame.toLowerCase().includes(q)) ||
      (p.transpondeur && p.transpondeur.toLowerCase().includes(q))
    ) : sorted;

    return (
      <div style={S.page}>
        {/* Stats bar */}
        <div style={S.statsRow}>
          {[
            { val: statsData.totalRefs, label: "Réfs", color: "#6c63ff" },
            { val: statsData.okCount, label: "OK", color: "#00f593" },
            { val: statsData.alertCount, label: "Alertes", color: statsData.alertCount > 0 ? "#ff4757" : "#00f593" },
            { val: statsData.valeurStock.toFixed(0) + "€", label: "Valeur", color: "#ffa726" },
            { val: statsData.budgetCommande.toFixed(0) + "€", label: "Commande", color: "#00d4ff" },
          ].map(s => (
            <div key={s.label} className="mrkey-stat" style={S.statBox}>
              <div style={{ ...S.statNum, color: s.color }}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alerte stock bas */}
        {statsData.alertCount > 0 && (
          <div style={S.alertBanner}>
            <div style={{ fontSize: 22 }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ff4757" }}>{statsData.alertCount} référence{statsData.alertCount > 1 ? "s" : ""} en alerte</div>
              <div style={{ fontSize: 11, color: "#5a6585", marginTop: 2 }}>Budget réapprovisionnement : {statsData.budgetCommande.toFixed(2)} €</div>
            </div>
            <button onClick={exportCSV} style={{ background: "rgba(255,71,87,0.12)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 10, padding: "7px 10px", color: "#ff4757", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📥 CSV</button>
          </div>
        )}

        {/* Info */}
        <div style={{ background: "rgba(108,99,255,0.06)", border: "1px solid rgba(108,99,255,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#6c63ff", fontWeight: 600 }}>
          📦 Alimentez le stock depuis l'onglet <b>Aftermarket</b>
        </div>

        {/* Recherche */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}><SearchIcon /></span>
          <input style={S.searchInput} placeholder="Référence, lame, marque…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#5a6585", fontSize: 16 }}>✕</button>}
        </div>

        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#5a6585" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1d2e" }}>Stock vide</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Ajoutez vos premières clés</div>
          </div>
        )}

        {visible.map(p => {
          const s = stock[p.id];
          const isInit = s?.init;
          const isLow = !isInit && s?.qty <= (s?.seuil || SEUIL_DEFAULT);
          return (
            <div key={p.id} className="mrkey-card" style={S.card} onClick={() => { setSelectedProduct(p); setPage("detail"); }}>
              <img src={p.image} alt={p.nom} style={S.cardImg} onError={e => { e.target.src = FALLBACK_IMG; }} />
              <div style={S.cardBody}>
                <div style={S.cardCat(p.categorie)}>{p.categorie || p.type}</div>
                <div style={S.cardName}>{p.nom}</div>
                <div style={S.cardRef}>{p.ref}{p.lame ? ` · Lame ${p.lame}` : ""}</div>
                <span style={S.badge(isLow)}>{isInit ? "— à saisir" : isLow ? `⚠ ${s?.qty}` : `✓ ${s?.qty}`}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // ================= RENDER AFTERMARKET ======================
  // ============================================================
  const renderAftermarket = () => {
    return <AftermarketTab
      stock={stock}
      products={products}
      customItems={customAftermarket}
      onDeleteCustom={(id) => {
        setCustomAftermarket(prev => prev.filter(p => p.id !== id));
        setProducts(prev => prev.filter(p => p.id !== id));
        setStock(prev => { const n = {...prev}; delete n[id]; return n; });
        showToast("🗑 Fiche supprimée");
      }}
      oeLinksOverrides={oeLinksOverrides}
      onAddToStock={(newProd) => {
        setProducts(prev => prev.some(p => p.id === newProd.id) ? prev : [...prev, newProd]);
        setStock(prev => prev[newProd.id] ? prev : { ...prev, [newProd.id]: { qty: 0, seuil: SEUIL_DEFAULT, historique: [], init: false } });
        showToast(`✅ ${newProd.ref || newProd.nom} ajouté au stock !`);
      }}
      onViewStock={() => setPage("stock")}
      onShowUrlImport={() => setShowUrlImport(true)}
      S={S}
    />;
  };

  if (!authReady) return <div style={{ minHeight: "100vh", background: "#c8d0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🔑</div>;
  // Page reset mot de passe
if (window.location.hash.includes("type=recovery")) return <ResetPasswordScreen />;
  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .mrkey-card:hover { transform: translateY(-2px); border-color: rgba(108,99,255,0.4) !important; box-shadow: 0 8px 32px rgba(108,99,255,0.14) !important; transition: all 0.2s ease; }
        .mrkey-card { transition: all 0.2s ease; }
        .mrkey-stat:hover { border-color: rgba(108,99,255,0.3) !important; }
        .fade-in { animation: fadeUp 0.3s ease both; }
        input::placeholder { color: rgba(74,80,112,0.8); }
        input { caret-color: #6c63ff; }
      `}</style>
      
      <div style={S.app}>
        {/* TOAST NOTIFICATION */}
        {toast && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, background: toast.type === "error" ? "#ff4757" : "#1a1d2e",
            color: "#fff", borderRadius: 16, padding: "13px 22px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)", fontSize: 13, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "nowrap",
            border: `1px solid ${toast.type === "error" ? "#ff6b6b" : "rgba(108,99,255,0.4)"}`,
            animation: "fadeUp 0.3s ease both", maxWidth: "90vw", textAlign: "center"
          }}>
            {toast.msg}
          </div>
        )}
        {/* HEADER */}
        {page !== "detail" && (
  <div style={S.header}>
    <div style={S.logo}>
      <div style={S.logoIcon}><KeyIcon /></div>
      <div style={{ flex: 1 }}>
        <div style={S.logoText}>MrKey <span style={{ background: "linear-gradient(90deg,#6c63ff,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pro</span></div>
        <div style={S.logoSub}>{products.length} </div>
      </div>
      <button onClick={async () => {
          setSyncing(true);
          const all = await dbGetAll(user.id);
          React.startTransition(() => {
            if (all[PRODUCTS_KEY]) setProducts(all[PRODUCTS_KEY]);
            if (all[STOCK_KEY])    setStock(all[STOCK_KEY]);
            if (all[CLIENT_KEY])   setClients(all[CLIENT_KEY]);
            if (all[INTERV_KEY])   setInterventions(all[INTERV_KEY]);
            if (all[DEVIS_KEY])    setDevis(all[DEVIS_KEY]);
            if (all[SETTINGS_KEY]) setSettings(all[SETTINGS_KEY]);
            if (all[CUSTOM_AM_KEY]) setCustomAftermarket(all[CUSTOM_AM_KEY]);
            if (all[OE_LINKS_KEY]) setOeLinksOverrides(all[OE_LINKS_KEY]);
            setSyncing(false);
          });
          showToast("✅ Données actualisées !");
        }}
        style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: 10, padding: "6px 12px", color: "#6c63ff", fontSize: 11, fontWeight: 700, cursor: "pointer", marginRight: 6 }}>
        {syncing ? "⏳" : "🔄"}
      </button>
      <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
        style={{ background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)", borderRadius: 10, padding: "6px 12px", color: "#ff4757", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        🔓 Déco
      </button>
    </div>
  </div>
)}
        {/* BOTTOM NAV BAR */}
        {page !== "detail" && page !== "clientDetail" && (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(210,218,240,0.98)", borderTop: "1px solid rgba(108,99,255,0.15)", zIndex: 200, display: "flex", padding: "10px 6px 18px", gap: 0, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
            {[
              { key: "home",         icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Accueil" },
              { key: "stock",        icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: "Stock", badge: statsData.alertCount },
              { key: "aftermarket",  icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>, label: "Aftermkt" },
              { key: "clients",      icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "Clients" },
              { key: "stats",        icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: "Stats" },
              { key: "settings",     icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, label: "Réglages" },
            ].map(item => (
              <button key={item.key} onClick={() => setPage(item.key)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative", padding: "4px 0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ width: 36, height: 28, borderRadius: 10, background: page === item.key ? "linear-gradient(135deg,#6c63ff22,#00d4ff22)" : "transparent", border: page === item.key ? "1px solid rgba(108,99,255,0.4)" : "1px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", color: page === item.key ? "#6c63ff" : "#5a6585", transition: "all 0.2s" }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: page === item.key ? "#6c63ff" : "#5a6585", letterSpacing: 0.1 }}>{item.label}</span>
                {item.badge > 0 && <span style={{ position: "absolute", top: 0, right: "8%", background: "#ff4757", color: "#fff", borderRadius: "50%", fontSize: 8, fontWeight: 800, width: 15, height: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.badge}</span>}
              </button>
            ))}
          </div>
        )}
        {page === "home" && renderHome()}
        {page === "stock" && renderStock()}
        {page === "aftermarket" && renderAftermarket()}
        {page === "detail" && selectedProduct && (
          <DetailPage
            key={selectedProduct.id}
            product={selectedProduct}
            stock={stock}
            setStock={setStock}
            setPage={setPage}
            setShowHistory={setShowHistory}
            catColor={catColor}
            lienLabel={lienLabel}
            SEUIL_DEFAULT={SEUIL_DEFAULT}
            onDelete={(id) => {
              setProducts(prev => prev.filter(p => p.id !== id));
              setStock(prev => { const n = {...prev}; delete n[id]; return n; });
              showToast("🗑 Produit supprimé du stock");
            }}
            onUpdatePrix={(id, prix) => {
              setProducts(prev => prev.map(p => p.id === id ? {...p, prix} : p));
              showToast("✅ Prix mis à jour : " + prix.toFixed(2) + " €");
            }}
            onUpdateNom={(id, nom, ref) => {
              setProducts(prev => prev.map(p => p.id === id ? {...p, nom, ref} : p));
              setSelectedProduct(prev => prev ? {...prev, nom, ref} : prev);
              showToast("✅ Nom mis à jour !");
            }}
            onUpdateImage={(id, image) => {
              setProducts(prev => prev.map(p => p.id === id ? {...p, image} : p));
              setSelectedProduct(prev => prev ? {...prev, image} : prev);
              showToast("✅ Photo mise à jour !");
            }}
            onUpdateChamps={(id, champs) => {
              setProducts(prev => prev.map(p => p.id === id ? {
                ...p,
                lame: champs.lame || p.lame,
                boutons: champs.boutons || p.boutons,
                buttons: champs.boutons || p.buttons,
                freq: champs.freq || p.freq,
                transpondeur: champs.transpondeur || p.transpondeur,
                pile: champs.pile || p.pile,
                modeles: champs.modeles || p.modeles,
                notes: champs.notes || p.notes,
                lien: champs.lien || p.lien,
              } : p));
              setSelectedProduct(prev => prev && prev.id === id ? {
                ...prev,
                lame: champs.lame || prev.lame,
                boutons: champs.boutons || prev.boutons,
                buttons: champs.boutons || prev.buttons,
                freq: champs.freq || prev.freq,
                transpondeur: champs.transpondeur || prev.transpondeur,
                pile: champs.pile || prev.pile,
                modeles: champs.modeles || prev.modeles,
                notes: champs.notes || prev.notes,
                lien: champs.lien || prev.lien,
              } : prev);
              showToast("✅ Caractéristiques mises à jour !");
            }}
          />
        )}

        {page === "clients" && renderClients()}
        {page === "devis" && renderDevis()}
        {page === "clientDetail" && selectedClient && renderClientDetail()}
        {page === "stats" && renderStats()}
        {page === "settings" && renderSettings()}

        {factureUrl && (() => {
          const { interv, prod, num, tva, client: fc } = factureUrl;
          return (
          <div style={{ position: "fixed", inset: 0, background: "#f0f4ff", zIndex: 999, overflowY: "auto", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#c8d0e8", borderBottom: "1px solid rgba(108,99,255,0.15)", position: "sticky", top: 0, zIndex: 10 }}>
              <button onClick={() => setFactureUrl(null)} style={{ background: "none", border: "none", color: "#6c63ff", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg> Fermer
              </button>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#1a1d2e" }}>Facture N° {num}</div>
              <a href={`mailto:${fc.email || ""}?subject=${encodeURIComponent("Facture " + num + " - MrKey Pro")}&body=${encodeURIComponent("Bonjour " + fc.nom + ",\n\nVotre facture N\u00b0 " + num + " du " + interv.date + ".\n\n" + (prod ? prod.nom : "Cl\u00e9 automobile") + " x" + (interv.qty || 1) + "\nHT : " + interv.prixHT + " \u20ac\nTVA 20% : " + tva + " \u20ac\nTTC : " + interv.prixTTC + " \u20ac\n\nCordialement,\n" + (settings.nom || "MrKey Pro"))}`}
                style={{ background: "linear-gradient(135deg,#6c63ff,#00d4ff)", color: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>✉️ Email</a>
            </div>
            {/* Facture */}
            <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 60px" }}>
              {/* En-tête facture */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 900, color: "#6c63ff" }}>MrKey Pro</div>
                  <div style={{ fontSize: 13, color: "#5a6585", marginTop: 4 }}>Facture N° {num}</div>
                  <div style={{ fontSize: 13, color: "#5a6585" }}>Date : {interv.date}</div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#1a1d2e" }}>
                  {settings.nom && <div style={{ fontWeight: 700 }}>{settings.nom}</div>}
                  {settings.adresse && <div>{settings.adresse}</div>}
                  {settings.tel && <div>{settings.tel}</div>}
                  {settings.email && <div>{settings.email}</div>}
                  {settings.siret && <div>SIRET : {settings.siret}</div>}
                </div>
              </div>
              {/* Client */}
              <div style={{ background: "#e8edf8", borderRadius: 14, padding: 16, marginBottom: 20, border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#5a6585", letterSpacing: 1, marginBottom: 8 }}>Client</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1d2e" }}>{fc.nom}</div>
                {fc.adresse && <div style={{ fontSize: 12, color: "#5a6585", marginTop: 2 }}>{fc.adresse}</div>}
                {fc.tel && <div style={{ fontSize: 12, color: "#5a6585" }}>Tél : {fc.tel}</div>}
                {fc.vehicule && <div style={{ fontSize: 12, color: "#6c63ff", marginTop: 2 }}>🚗 {fc.vehicule}</div>}
                {fc.plaque && <div style={{ fontSize: 12, color: "#5a6585" }}>Plaque : {fc.plaque}</div>}
                {fc.vin && <div style={{ fontSize: 12, color: "#5a6585" }}>VIN : {fc.vin}</div>}
              </div>
              {/* Ligne produit */}
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(108,99,255,0.15)", marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#6c63ff", padding: "10px 14px", gap: 8 }}>
                  {["Désignation", "Qté", "HT", "TTC"].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "12px 14px", gap: 8, background: "#e8edf8" }}>
                  <div style={{ fontSize: 12, color: "#1a1d2e", fontWeight: 600 }}>{prod ? prod.nom : "Clé automobile"}</div>
                  <div style={{ fontSize: 12, color: "#1a1d2e" }}>{interv.qty || 1}</div>
                  <div style={{ fontSize: 12, color: "#1a1d2e" }}>{interv.prixHT}€</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#6c63ff" }}>{interv.prixTTC}€</div>
                </div>
              </div>
              {/* Note */}
              {interv.note && <div style={{ background: "#e8edf8", borderRadius: 12, padding: 14, marginBottom: 20, border: "1px solid rgba(108,99,255,0.12)" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#5a6585", letterSpacing: 1, marginBottom: 6 }}>Note</div>
                <div style={{ fontSize: 13, color: "#1a1d2e" }}>{interv.note}</div>
              </div>}
              {/* Totaux */}
              <div style={{ background: "#e8edf8", borderRadius: 14, padding: 16, border: "1px solid rgba(108,99,255,0.15)" }}>
                {[["Total HT", interv.prixHT + " €"], ["TVA 20%", tva + " €"]].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#5a6585" }}>
                    <span>{l}</span><span style={{ fontWeight: 600, color: "#1a1d2e" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "2px solid rgba(108,99,255,0.2)", fontSize: 18, fontWeight: 900, color: "#6c63ff" }}>
                  <span>Total TTC</span><span>{interv.prixTTC} €</span>
                </div>
              </div>
              {/* Mention légale */}
              <div style={{ fontSize: 10, color: "#5a6585", marginTop: 20, textAlign: "center", lineHeight: 1.5 }}>
                TVA non applicable - Art. 293B du CGI<br/>(À modifier selon votre statut fiscal)
              </div>
            </div>
          </div>
          );
        })()}
        {showHistory && (
          <div style={S.historyModal} onClick={() => setShowHistory(null)}>
            <div style={S.historyPanel} onClick={e => e.stopPropagation()}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#1a1d2e", letterSpacing: "-0.3px" }}>Historique des mouvements</div>
              {(stock[showHistory]?.historique || []).length === 0
                ? <div style={{ color: "#5a6585", fontSize: 13 }}>Aucun mouvement enregistré</div>
                : stock[showHistory].historique.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #252b3b", fontSize: 12 }}>
                    <span style={{ color: h.action.startsWith("+") ? "#4ade80" : "#ff6b6b", fontWeight: 700 }}>{h.action}</span>
                    <span style={{ color: "#5a6585" }}>{h.date}</span>
                    <span style={{ color: "#2d3352", fontWeight: 600 }}>→ {h.qty}</span>
                  </div>
                ))
              }
              <button style={{ width: "100%", marginTop: 12, padding: 11, background: "#e8edf8", border: "none", borderRadius: 10, color: "#5a6585", cursor: "pointer", fontWeight: 700 }} onClick={() => setShowHistory(null)}>Fermer</button>
            </div>
          </div>
        )}
        {showUrlImport && (
          <UrlProductImport
            onProductCreated={(newProd) => {
              // Ajoute dans le catalogue Aftermarket custom (visible dans l'onglet)
              setCustomAftermarket(prev => [newProd, ...prev]);
              // Ajoute aussi dans products + stock (avec init:true = qté à saisir)
              setProducts(prev => [newProd, ...prev]);
              setStock(prev => ({
                ...prev,
                [newProd.id]: { qty: 0, seuil: SEUIL_DEFAULT, historique: [], init: true },
              }));
              setShowUrlImport(false);
              setPage("aftermarket");
              showToast("✅ Fiche créée dans Aftermarket !");
            }}
            onClose={() => setShowUrlImport(false)}
          />
        )}
      </div>
    </>
  );
}
