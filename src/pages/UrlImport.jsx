import React, { useState } from "react";
import { useStore } from "../store";
import { X, Search, Loader2, CheckCircle, AlertTriangle, Link as LinkIcon, Camera } from "lucide-react";
import { SEUIL_DEFAULT, FALLBACK_IMG } from "../utils/constants";

export default function UrlImport() {
  const { setShowUrlImport, addCustomAftermarket, addProduct, updateStock, setPage, showToast } = useStore();

  const empty = { nom: "", ref: "", marque: "", modeles: "", prix: "", type: "Clé", freq: "", transpondeur: "", id_transpondeur: "", lame: "", lien: "", lien_achat: "", pile: "", boutons: "", image: "" };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [analysed, setAnalysed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    } catch {
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
      boutons: form.boutons,
      pile: form.pile,
      oeLinks: (form.lien_achat || "").trim()
        ? [{ label: "Acheter chez MK3", url: form.lien_achat.trim() }]
        : form.lien.trim() ? [{ label: "Voir la page produit", url: form.lien.trim() }] : [],
    };
    addCustomAftermarket(newProd);
    addProduct(newProd);
    updateStock(newProd.id, { qty: 0, seuil: SEUIL_DEFAULT, historique: [], init: true });
    setShowUrlImport(false);
    setPage("aftermarket");
    showToast("Fiche créée dans Aftermarket !");
  };

  const Field = ({ label, children, className = "" }) => (
    <div className={className}>
      <label className="block text-[11px] font-semibold text-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-surface-elevated border border-border-strong rounded-xl px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans";

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-lg z-[600] flex items-end">
      <div className="bg-surface-sunken rounded-t-3xl p-5 pb-9 w-full max-h-[93vh] overflow-y-auto shadow-2xl shadow-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-extrabold text-text-primary">Ajouter un produit</h2>
            <p className="text-[11px] text-text-secondary mt-1">Colle l'URL — l'IA remplit la fiche automatiquement</p>
          </div>
          <button onClick={() => setShowUrlImport(false)} className="text-text-secondary text-xl p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Section */}
        <div className="bg-primary/5 border border-primary/25 rounded-2xl p-3.5 mb-4 mt-3">
          <label className="block text-[11px] font-semibold text-primary mb-2">
            <LinkIcon className="w-3.5 h-3.5 inline mr-1" /> URL de la page produit
          </label>
          <div className="flex gap-2">
            <input
              value={form.lien}
              onChange={e => { set("lien", e.target.value); setAnalysed(false); setErrorMsg(""); }}
              onKeyDown={e => e.key === "Enter" && form.lien.trim() && handleAnalyse()}
              placeholder="https://www.fournisseur.fr/produit/..."
              className="flex-1 bg-white border border-primary/25 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary"
              autoFocus
              inputMode="url"
            />
            <button
              onClick={handleAnalyse}
              disabled={loading || !form.lien.trim()}
              className="shrink-0 gradient-primary text-white font-bold text-xs px-4 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyse...</> : <><Search className="w-3.5 h-3.5" /> Analyser</>}
            </button>
          </div>
          {errorMsg && (
            <div className="mt-2 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-danger font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
            </div>
          )}
          {analysed && (
            <div className="mt-2 bg-success-dark/10 border border-success-dark/25 rounded-lg px-3 py-2 text-xs text-success-dark font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Fiche remplie automatiquement — vérifie et complète si besoin
            </div>
          )}
        </div>

        {/* Product Fields */}
        <Field label="Nom du produit *" className="mb-3">
          <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="ex: Clé Renault Clio 4 boutons 433MHz" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Numéros de pièce">
            <input value={form.ref} onChange={e => set("ref", e.target.value)} placeholder="ex: 8T0959754" className={inputCls} />
          </Field>
          <Field label="Prix d'achat (€)">
            <input type="number" min="0" step="0.01" value={form.prix} onChange={e => set("prix", e.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Marque véhicule">
            <input value={form.marque} onChange={e => set("marque", e.target.value)} placeholder="ex: Renault" className={inputCls} />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={e => set("type", e.target.value)} className={`${inputCls} appearance-none`}>
              {["Clé","Télécommande","Coque","Transpondeur","Lame","Accessoire"].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Fréquence">
            <input value={form.freq} onChange={e => set("freq", e.target.value)} placeholder="ex: 433MHz" className={inputCls} />
          </Field>
          <Field label="PCF">
            <input value={form.transpondeur} onChange={e => set("transpondeur", e.target.value)} placeholder="ex: PCF7945" className={inputCls} />
          </Field>
          <Field label="ID transpondeur">
            <input value={form.id_transpondeur || ""} onChange={e => set("id_transpondeur", e.target.value)} placeholder="ex: ID46" className={inputCls} />
          </Field>
          <Field label="Pile">
            <input value={form.pile || ""} onChange={e => set("pile", e.target.value)} placeholder="ex: CR2032" className={inputCls} />
          </Field>
          <Field label="Boutons">
            <input type="number" min="1" max="6" value={form.boutons || ""} onChange={e => set("boutons", e.target.value)} placeholder="ex: 3" className={inputCls} />
          </Field>
        </div>

        <Field label="Modèles compatibles" className="mt-3">
          <input value={form.modeles} onChange={e => set("modeles", e.target.value)} placeholder="ex: Clio 3, Mégane 2, Kangoo" className={inputCls} />
        </Field>
        <Field label="Lame" className="mt-3">
          <input value={form.lame} onChange={e => set("lame", e.target.value)} placeholder="ex: VA2" className={inputCls} />
        </Field>
        <Field label="Lien d'achat MK3" className="mt-3">
          <input value={form.lien_achat || ""} onChange={e => set("lien_achat", e.target.value)} placeholder="https://mk3.fr/produit/..." className={inputCls} inputMode="url" />
        </Field>

        {/* Image */}
        <div className="mt-3 bg-primary/5 border border-primary/15 rounded-xl p-3">
          <label className="block text-[11px] font-semibold text-primary mb-2">
            <Camera className="w-3.5 h-3.5 inline mr-1" /> Photo du produit
          </label>
          <div className="flex gap-2 items-start">
            {form.image && form.image !== FALLBACK_IMG && (
              <img src={form.image} alt="" onError={e => { e.target.style.display = "none"; }}
                className="w-14 h-14 object-contain rounded-lg bg-surface-elevated shrink-0 border border-border" />
            )}
            <input
              value={form.image === FALLBACK_IMG ? "" : (form.image || "")}
              onChange={e => set("image", e.target.value)}
              placeholder="URL de la photo"
              className={`${inputCls} text-[11px]`}
              inputMode="url"
            />
          </div>
          <p className="text-[10px] text-text-secondary mt-1.5">Sur mobile : appui long sur la photo → "Copier le lien"</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setShowUrlImport(false)}
            className="flex-1 py-3.5 rounded-xl border border-border-strong text-text-secondary font-semibold text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!form.nom.trim()}
            className="flex-[2] py-3.5 rounded-xl gradient-primary text-white font-bold text-sm disabled:opacity-40"
          >
            Créer la fiche produit
          </button>
        </div>
      </div>
    </div>
  );
}
