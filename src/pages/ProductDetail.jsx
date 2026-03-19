import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Trash2,
  Camera,
  ExternalLink,
  Plus,
  Minus,
  History,
  Pencil,
  Check,
  X,
  Search,
  Package,
  AlertTriangle,
  Tag,
  Radio,
  Key,
  Battery,
  Cpu,
  Layers,
  Hash,
  StickyNote,
  ShoppingCart,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../store';
import { SEUIL_DEFAULT, FALLBACK_IMG } from '../utils/constants';
import { catColor, lienLabel } from '../utils/helpers';
import { Card, Badge, Button } from '../components/ui';

/* ─── Spec Row (2-col grid item) ──────────────────────────────────────── */
function SpecItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">{label}</div>
        <div className="text-xs text-text-primary font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

/* ─── Product Detail Page ─────────────────────────────────────────────── */
export default function ProductDetail() {
  const {
    selectedProduct,
    stock,
    setPage,
    showToast,
    updateStock,
    adjustStock,
    deleteProduct,
    updateProduct,
    showHistory,
    setShowHistory,
    setSelectedProduct,
  } = useStore();

  const p = selectedProduct;
  const s = p ? stock[p.id] : null;

  /* ── Edit modes ──────────────────────────────────────────────────────── */
  const [editingName, setEditingName] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingImage, setEditingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [flash, setFlash] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  /* ── Refs ─────────────────────────────────────────────────────────────── */
  const qtyRef = useRef(null);
  const seuilRef = useRef(null);
  const priceRef = useRef(null);
  const nameRef = useRef(null);
  const refRef = useRef(null);
  const imageRef = useRef(null);

  /* ── Flash helper ────────────────────────────────────────────────────── */
  const doFlash = useCallback((msg) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1600);
  }, []);

  /* ── Guard ───────────────────────────────────────────────────────────── */
  if (!p) {
    return (
      <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
        <p className="text-text-muted text-center py-20">Aucun produit sélectionné</p>
      </div>
    );
  }

  /* ── Derived values ──────────────────────────────────────────────────── */
  const qty = s?.qty ?? 0;
  const seuil = s?.seuil ?? SEUIL_DEFAULT;
  const isInit = s?.init !== false;
  const isLow = !isInit && qty <= seuil;
  const isOk = !isInit && qty > seuil;
  const aCommander = Math.max(0, seuil * 2 - qty);
  const lien = lienLabel(p);

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleBack = () => {
    setSelectedProduct(null);
    setPage('stock');
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteProduct(p.id);
    showToast('Produit supprimé');
    handleBack();
  };

  const handleSaveName = () => {
    const nom = nameRef.current?.value?.trim();
    const ref = refRef.current?.value?.trim();
    if (!nom) {
      showToast('Le nom est requis', 'error');
      return;
    }
    updateProduct(p.id, { nom, ref: ref || p.ref });
    setSelectedProduct({ ...p, nom, ref: ref || p.ref });
    setEditingName(false);
    doFlash('Nom mis à jour');
  };

  const handleSavePrice = () => {
    const val = parseFloat(priceRef.current?.value);
    if (isNaN(val) || val < 0) {
      showToast('Prix invalide', 'error');
      return;
    }
    updateProduct(p.id, { prix: val });
    setSelectedProduct({ ...p, prix: val });
    setEditingPrice(false);
    doFlash('Prix mis à jour');
  };

  const handleSaveImage = async () => {
    const url = imageRef.current?.value?.trim();
    if (!url) return;

    // Check if direct image URL
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
      updateProduct(p.id, { image: url });
      setSelectedProduct({ ...p, image: url });
      setEditingImage(false);
      doFlash('Image mise à jour');
      return;
    }

    // Try scraping via API
    setImgLoading(true);
    try {
      const res = await fetch('/api/image-produit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.image) {
        updateProduct(p.id, { image: data.image });
        setSelectedProduct({ ...p, image: data.image });
        setEditingImage(false);
        doFlash('Image mise à jour');
      } else {
        showToast('Impossible de récupérer l\'image', 'error');
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setImgLoading(false);
    }
  };

  const handleSetQty = () => {
    const val = parseInt(qtyRef.current?.value);
    if (isNaN(val) || val < 0) {
      showToast('Quantité invalide', 'error');
      return;
    }
    updateStock(p.id, {
      qty: val,
      init: false,
      historique: [
        { action: `=${val}`, date: new Date().toLocaleDateString('fr-FR'), qty: val },
        ...((s?.historique || []).slice(0, 9)),
      ],
    });
    if (qtyRef.current) qtyRef.current.value = '';
    doFlash('Stock mis à jour');
  };

  const handleSetSeuil = () => {
    const val = parseInt(seuilRef.current?.value);
    if (isNaN(val) || val < 0) {
      showToast('Seuil invalide', 'error');
      return;
    }
    updateStock(p.id, { seuil: val });
    if (seuilRef.current) seuilRef.current.value = '';
    doFlash('Seuil mis à jour');
  };

  const handleAdjust = (delta) => {
    adjustStock(p.id, delta);
    doFlash(delta > 0 ? `+${delta} ajouté` : `${delta} retiré`);
  };

  /* ── OE links parsing ────────────────────────────────────────────────── */
  const oeLinks = [];
  if (p.oe) {
    const parts = typeof p.oe === 'string' ? p.oe.split(/[,;\n]+/) : Array.isArray(p.oe) ? p.oe : [];
    parts.forEach((part) => {
      const trimmed = (typeof part === 'string' ? part : '').trim();
      if (trimmed) oeLinks.push(trimmed);
    });
  }

  /* ── Applications parsing ────────────────────────────────────────────── */
  const applications = p.applications
    ? (typeof p.applications === 'string' ? p.applications.split(/[,;\n]+/) : Array.isArray(p.applications) ? p.applications : [])
        .map((a) => (typeof a === 'string' ? a.trim() : ''))
        .filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">

      {/* ── Flash feedback ─────────────────────────────────────── */}
      {flash && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-success-dark text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-pulse">
          {flash}
        </div>
      )}

      {/* ── Header Bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-surface pb-3 pt-1 -mx-4 px-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-border hover:border-primary/30 transition-all cursor-pointer"
          >
            <ArrowLeft size={18} className="text-text-primary" />
            <span className="text-sm font-semibold text-text-primary">Retour</span>
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
              confirmDelete
                ? 'bg-danger text-white border-danger shadow-lg shadow-danger/30'
                : 'bg-surface-elevated border-border hover:border-danger/40 text-danger'
            }`}
          >
            <Trash2 size={16} />
            <span className="text-xs font-semibold">
              {confirmDelete ? 'Confirmer ?' : 'Supprimer'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Product Image ──────────────────────────────────────── */}
      <Card className="mb-4 !p-0 overflow-hidden relative">
        <div className="w-full h-[190px] bg-surface-sunken flex items-center justify-center">
          <img
            src={p.image || FALLBACK_IMG}
            alt={p.nom || 'Produit'}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.src = FALLBACK_IMG; }}
          />
        </div>
        <button
          onClick={() => setEditingImage(!editingImage)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold backdrop-blur-sm hover:bg-black/80 transition-all cursor-pointer"
        >
          <Camera size={14} />
          Changer la photo
        </button>
      </Card>

      {/* ── Image Edit Mode ────────────────────────────────────── */}
      {editingImage && (
        <Card className="mb-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-muted">URL de l'image ou de la page</label>
            <div className="flex gap-2">
              <input
                ref={imageRef}
                type="url"
                placeholder="https://..."
                className="flex-1 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              <button
                onClick={handleSaveImage}
                disabled={imgLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {imgLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
              </button>
              <button
                onClick={() => setEditingImage(false)}
                className="flex items-center px-2 py-2 rounded-lg bg-surface-sunken border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-text-muted">URL directe d'image ou lien vers une page produit</p>
          </div>
        </Card>
      )}

      {/* ── Product Info ───────────────────────────────────────── */}
      <Card className="mb-4">
        {/* Category badge */}
        {p.categorie && (
          <div className="mb-3">
            <span
              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-white"
              style={{ backgroundColor: catColor(p.categorie) }}
            >
              {p.categorie}
            </span>
          </div>
        )}

        {/* Product name (editable) */}
        {editingName ? (
          <div className="flex flex-col gap-2 mb-3">
            <input
              ref={nameRef}
              defaultValue={p.nom || ''}
              placeholder="Nom du produit"
              className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-bold text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            <input
              ref={refRef}
              defaultValue={p.ref || ''}
              placeholder="Référence"
              className="bg-surface-sunken border border-border rounded-lg px-3 py-2 text-xs text-text-secondary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveName}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-dark text-white text-xs font-semibold hover:bg-success-dark/90 transition-all cursor-pointer"
              >
                <Check size={14} />
                Enregistrer
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-sunken border border-border text-text-muted text-xs font-semibold hover:text-text-primary transition-all cursor-pointer"
              >
                <X size={14} />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-left w-full group mb-3 cursor-pointer"
          >
            <h1 className="text-lg font-extrabold tracking-tight text-text-primary group-hover:text-primary transition-colors leading-tight">
              {p.nom || 'Sans nom'}
              <Pencil size={12} className="inline ml-2 opacity-0 group-hover:opacity-60 transition-opacity" />
            </h1>
            {p.ref && (
              <span className="text-xs text-text-muted font-mono mt-0.5 block">{p.ref}</span>
            )}
          </button>
        )}

        {/* Type / Ref / Brand / Proximity badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.type && (
            <Badge variant="info" size="sm">{p.type}</Badge>
          )}
          {p.marque && (
            <Badge variant="primary" size="sm">{p.marque}</Badge>
          )}
          {p.proximite && (
            <Badge variant="warning" size="sm">Proximité</Badge>
          )}
          {p.slot && (
            <Badge variant="info" size="sm">Slot</Badge>
          )}
          {p.telecommande && (
            <Badge variant="danger" size="sm">Télécommande</Badge>
          )}
        </div>

        {/* Compatible vehicles */}
        {applications.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-2">
              Véhicules compatibles
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {applications.map((app, i) => (
                <Badge key={i} variant="neutral" size="sm">{app}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Technical specs grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SpecItem icon={Key} label="Lame" value={p.lame} />
          <SpecItem icon={Radio} label="Boutons" value={p.boutons} />
          <SpecItem icon={Radio} label="Fréquence" value={p.frequence} />
          <SpecItem icon={Cpu} label="Transpondeur" value={p.transpondeur} />
          <SpecItem icon={Battery} label="Pile" value={p.pile} />
          <SpecItem icon={Layers} label="Modèles" value={p.modeles} />
          <SpecItem icon={Tag} label="Xhorse" value={p.xhorse} />
          <SpecItem icon={StickyNote} label="Notes" value={p.notes} />
        </div>

        {/* Price display + edit */}
        {editingPrice ? (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <input
              ref={priceRef}
              type="number"
              step="0.01"
              defaultValue={p.prix || ''}
              placeholder="Prix (€)"
              className="flex-1 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={handleSavePrice}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-success-dark text-white text-xs font-semibold hover:bg-success-dark/90 transition-all cursor-pointer"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setEditingPrice(false)}
              className="flex items-center px-2 py-2 rounded-lg bg-surface-sunken border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <span className="text-xs font-semibold text-text-muted">Prix unitaire</span>
            <button
              onClick={() => setEditingPrice(true)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="text-lg font-extrabold text-primary">
                {p.prix != null ? `${Number(p.prix).toFixed(2)} €` : '— €'}
              </span>
              <Pencil size={12} className="text-text-muted opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          </div>
        )}
      </Card>

      {/* ── OE Part Numbers ────────────────────────────────────── */}
      {oeLinks.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-xs font-bold text-text-primary mb-3 flex items-center gap-2">
            <Hash size={14} className="text-text-muted" />
            Références OE
          </h3>
          <div className="flex flex-col gap-2">
            {oeLinks.map((oe, i) => (
              <a
                key={i}
                href={`https://www.google.com/search?q=${encodeURIComponent(oe + ' clé télécommande')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-sunken border border-border hover:border-primary/30 transition-all group"
              >
                <ExternalLink size={14} className="text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                <span className="text-sm text-text-primary font-mono group-hover:text-primary transition-colors truncate">
                  {oe}
                </span>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* ── Stock Management Box ───────────────────────────────── */}
      <Card className="mb-4">
        <h3 className="text-xs font-bold text-text-primary mb-4 flex items-center gap-2">
          <Package size={14} className="text-text-muted" />
          Gestion du stock
        </h3>

        {/* Current stock number */}
        <div className="flex flex-col items-center mb-4">
          <span
            className={`text-5xl font-black tabular-nums ${
              isInit ? 'text-text-muted' : isLow ? 'text-danger' : 'text-success-dark'
            }`}
          >
            {isInit ? '—' : qty}
          </span>
          <span className="text-xs text-text-muted mt-1">en stock</span>

          {/* Warnings */}
          {isInit && (
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-warning/10">
              <AlertTriangle size={14} className="text-warning" />
              <span className="text-xs font-semibold text-warning">Stock non renseigné</span>
            </div>
          )}
          {isLow && !isInit && (
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-danger/10">
              <AlertTriangle size={14} className="text-danger" />
              <span className="text-xs font-semibold text-danger">Seuil atteint</span>
            </div>
          )}
        </div>

        {/* A commander */}
        {!isInit && isLow && (
          <div className="flex items-center justify-between bg-surface-sunken rounded-xl px-4 py-2.5 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} className="text-accent" />
              <span className="text-xs font-semibold text-text-muted">À commander</span>
            </div>
            <span className="text-sm font-bold text-accent">{aCommander}</span>
          </div>
        )}

        {/* History button */}
        <button
          onClick={() => setShowHistory(p.id)}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 mb-4 rounded-xl bg-surface-sunken border border-border hover:border-primary/30 text-text-secondary hover:text-primary text-sm font-semibold transition-all cursor-pointer"
        >
          <History size={16} />
          Historique des mouvements
        </button>

        {/* +/- adjustment buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => handleAdjust(-1)}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-danger/10 border-2 border-danger/20 text-danger hover:bg-danger/20 hover:border-danger/40 active:scale-95 transition-all cursor-pointer"
          >
            <Minus size={24} strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Ajuster</span>
          </div>
          <button
            onClick={() => handleAdjust(1)}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-success-dark/10 border-2 border-success-dark/20 text-success-dark hover:bg-success-dark/20 hover:border-success-dark/40 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Exact quantity input */}
        <div className="flex gap-2 mb-3">
          <input
            ref={qtyRef}
            type="number"
            min="0"
            placeholder="Quantité exacte"
            className="flex-1 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleSetQty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Définir
          </button>
        </div>

        {/* Seuil alert input */}
        <div className="flex gap-2">
          <input
            ref={seuilRef}
            type="number"
            min="0"
            placeholder={`Seuil alerte (actuel: ${seuil})`}
            className="flex-1 bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleSetSeuil}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all cursor-pointer"
          >
            Seuil
          </button>
        </div>
      </Card>

      {/* ── Action Buttons ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {lien && p.lien && (
          <a
            href={p.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
            style={{ background: lien.bg, color: lien.color }}
          >
            <LinkIcon size={16} />
            {lien.label}
          </a>
        )}
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent((p.nom || '') + ' ' + (p.ref || '') + ' clé télécommande')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-surface-elevated border border-border text-text-secondary text-sm font-semibold hover:border-primary/30 hover:text-primary transition-all"
        >
          <Search size={16} />
          Rechercher sur Google
        </a>
      </div>
    </div>
  );
}
