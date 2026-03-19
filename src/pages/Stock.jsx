import React, { useMemo, useState } from "react";
import {
  Search,
  X,
  Download,
  AlertTriangle,
  Info,
  Package,
} from "lucide-react";
import { useStore } from "../store";
import { SEUIL_DEFAULT, FALLBACK_IMG } from "../utils/constants";

export default function Stock() {
  const {
    products,
    stock,
    statsData,
    settings,
    setSelectedProduct,
    setPage,
  } = useStore();

  const exportCSV = useStore((s) => s.exportCSV);

  const { totalRefs, okCount, alertCount, valeurStock, budgetCommande } =
    statsData;

  const [localSearch, setLocalSearch] = useState("");

  const seuil = settings?.seuil ?? SEUIL_DEFAULT;

  // Sort: low stock first, then filter by search
  const sortedProducts = useMemo(() => {
    let list = [...products];

    // Sort: uninitialised first, then low stock, then ok
    list.sort((a, b) => {
      const sa = stock[a.ref];
      const sb = stock[b.ref];
      const scoreA =
        sa == null || sa === "" ? 0 : Number(sa) <= seuil ? 1 : 2;
      const scoreB =
        sb == null || sb === "" ? 0 : Number(sb) <= seuil ? 1 : 2;
      return scoreA - scoreB;
    });

    // Filter by search
    if (localSearch.trim().length >= 2) {
      const q = localSearch.toLowerCase();
      list = list.filter(
        (p) =>
          (p.ref && p.ref.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, stock, seuil, localSearch]);

  // Stock badge helper
  const getStockBadge = (product) => {
    const s = stock[product.ref];
    if (s == null || s === "")
      return {
        text: "— à saisir",
        classes: "bg-text-muted/15 text-text-muted",
      };
    if (Number(s) <= seuil)
      return {
        text: `⚠ ${s}`,
        classes: "bg-danger/15 text-danger",
      };
    return {
      text: `✓ ${s}`,
      classes: "bg-success-dark/15 text-success-dark",
    };
  };

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
      {/* ── Page Title ─────────────────────────────────────── */}
      <h1 className="mb-5 text-xl font-extrabold tracking-tight text-text-primary">
        Mon Stock
      </h1>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {/* Refs */}
        <div className="flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-2xl px-2 py-3">
          <span className="text-2xl font-bold text-purple-400 leading-tight">
            {totalRefs}
          </span>
          <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
            Réfs
          </span>
        </div>

        {/* OK */}
        <div className="flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-2xl px-2 py-3">
          <span className="text-2xl font-bold text-emerald-400 leading-tight">
            {okCount}
          </span>
          <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
            OK
          </span>
        </div>

        {/* Alertes */}
        <div className="flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-2xl px-2 py-3">
          <span
            className={`text-2xl font-bold leading-tight ${
              alertCount > 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {alertCount}
          </span>
          <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
            Alertes
          </span>
        </div>

        {/* Valeur */}
        <div className="flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-2xl px-2 py-3">
          <span className="text-2xl font-bold text-cyan-400 leading-tight">
            {valeurStock.toFixed(0)}€
          </span>
          <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
            Valeur
          </span>
        </div>

        {/* Budget */}
        <div
          onClick={exportCSV}
          className="flex flex-col items-center justify-center bg-surface-elevated border border-border rounded-2xl px-2 py-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 active:scale-[0.97] transition-all duration-200"
        >
          <span className="text-2xl font-bold text-orange-400 leading-tight">
            {budgetCommande.toFixed(0)}€
          </span>
          <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
            Budget
          </span>
        </div>
      </div>

      {/* ── Alert Banner ───────────────────────────────────── */}
      {alertCount > 0 && (
        <div className="flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-2xl p-4 mb-4">
          <AlertTriangle size={20} className="text-danger flex-shrink-0" />
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-bold text-danger">
              ⚠️ {alertCount} produit{alertCount > 1 ? "s" : ""} en alerte
            </span>
            <span className="text-xs text-text-muted">
              Budget de réapprovisionnement : {budgetCommande.toFixed(2)} €
            </span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-danger/15 hover:bg-danger/25 text-danger text-xs font-semibold rounded-xl px-3 py-2 transition-colors flex-shrink-0 cursor-pointer"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      )}

      {/* ── Info Banner ────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-2xl p-4 mb-5">
        <Info size={18} className="text-accent flex-shrink-0" />
        <span className="text-xs text-text-secondary">
          Alimentez le stock depuis l'onglet Aftermarket
        </span>
      </div>

      {/* ── Search ─────────────────────────────────────────── */}
      <div className="relative mb-5">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full bg-surface-elevated border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Product List ───────────────────────────────────── */}
      {sortedProducts.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {sortedProducts.map((p) => {
            const badge = getStockBadge(p);
            return (
              <div
                key={p.ref}
                onClick={() => {
                  setSelectedProduct(p);
                  setPage("detail");
                }}
                className="flex items-center gap-3 bg-surface-elevated border border-border rounded-2xl p-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
              >
                {/* Product Image */}
                <img
                  src={p.image || FALLBACK_IMG}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMG;
                  }}
                  alt={p.name}
                  className="w-[88px] h-[88px] rounded-xl object-cover bg-surface flex-shrink-0"
                />

                {/* Product Info */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {/* Category Badge */}
                  {p.category && (
                    <span className="inline-flex self-start items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-accent/15 text-accent">
                      {p.category}
                    </span>
                  )}

                  {/* Name */}
                  <span className="text-sm font-bold text-text-primary line-clamp-2 leading-snug">
                    {p.name}
                  </span>

                  {/* Ref + Blade */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted truncate">
                      {p.ref}
                    </span>
                    {p.blade && (
                      <span className="text-[10px] font-semibold text-text-secondary bg-surface px-1.5 py-0.5 rounded">
                        {p.blade}
                      </span>
                    )}
                  </div>

                  {/* Stock Badge */}
                  <span
                    className={`inline-flex self-start items-center px-2.5 py-1 text-xs font-semibold rounded-lg mt-0.5 ${badge.classes}`}
                  >
                    {badge.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ────────────────────────────────────── */
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-surface-elevated border border-border">
            <Package size={32} className="text-text-muted" />
          </div>
          <span className="text-lg font-bold text-text-primary">
            📦 Stock vide
          </span>
          <span className="text-sm text-text-muted text-center max-w-[280px]">
            Ajoutez des produits depuis le catalogue Aftermarket pour commencer
            à gérer votre stock.
          </span>
        </div>
      )}
    </div>
  );
}
