import React, { useMemo } from "react";
import {
  Package,
  KeyRound,
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  X,
  AlertTriangle,
  Download,
} from "lucide-react";
import { useStore } from "../store";
import { SEUIL_DEFAULT, FALLBACK_IMG } from "../utils/constants";
import { SILCA_DB } from "../../silcaData.js";

export default function Home() {
  const {
    products,
    stock,
    search,
    setSearch,
    setPage,
    statsData,
    clients,
    devis,
    interventions,
    settings,
    setSelectedProduct,
  } = useStore();

  const { totalRefs, okCount, alertCount, valeurStock, budgetCommande } =
    statsData;

  const exportCSV = useStore((s) => s.exportCSV);

  // Filtered products for search
  const filtered = useMemo(() => {
    if (!search || search.trim().length < 2) return [];
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        (p.ref && p.ref.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q))
    );
  }, [search, products]);

  // Stock badge helper
  const getStockBadge = (product) => {
    const s = stock[product.ref];
    const seuil = settings?.seuil ?? SEUIL_DEFAULT;
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
        Tableau de bord
      </h1>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-2 mb-6">
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

        {/* Budget — clickable */}
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

      {/* ── Quick Access Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {/* Mon Stock */}
        <div
          onClick={() => setPage("stock")}
          className="relative flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <Package size={28} className="text-primary" />
          <span className="text-sm font-bold text-text-primary">Mon Stock</span>
          <span className="text-xs text-text-muted">
            {products.length} produits
          </span>
          {alertCount > 0 && (
            <span className="absolute top-2 right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-white text-[10px] font-bold">
              {alertCount}
            </span>
          )}
        </div>

        {/* Aftermarket */}
        <div
          onClick={() => setPage("aftermarket")}
          className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <KeyRound size={28} className="text-accent" />
          <span className="text-sm font-bold text-text-primary">
            Aftermarket
          </span>
          <span className="text-xs text-text-muted">
            {SILCA_DB.length} références
          </span>
        </div>

        {/* Clients */}
        <div
          onClick={() => setPage("clients")}
          className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <Users size={28} className="text-emerald-400" />
          <span className="text-sm font-bold text-text-primary">Clients</span>
          <span className="text-xs text-text-muted">
            {clients.length} clients
          </span>
        </div>

        {/* Devis */}
        <div
          onClick={() => setPage("devis")}
          className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <FileText size={28} className="text-amber-400" />
          <span className="text-sm font-bold text-text-primary">Devis</span>
          <span className="text-xs text-text-muted">
            {devis.length} devis
          </span>
        </div>

        {/* Statistiques */}
        <div
          onClick={() => setPage("stats")}
          className="flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <BarChart3 size={28} className="text-pink-400" />
          <span className="text-sm font-bold text-text-primary">
            Statistiques
          </span>
          <span className="text-xs text-text-muted">
            {interventions.length} interventions
          </span>
        </div>

        {/* Paramètres — full width */}
        <div
          onClick={() => setPage("settings")}
          className="col-span-2 flex flex-col items-center justify-center gap-2 bg-surface-elevated border border-border rounded-2xl p-5 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98] transition-all duration-200"
        >
          <Settings size={28} className="text-text-secondary" />
          <span className="text-sm font-bold text-text-primary">
            Paramètres
          </span>
        </div>
      </div>

      {/* ── Search Section ─────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-text-primary mb-3">
          Recherche par référence
        </h2>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tapez une référence ou un nom..."
            className="w-full bg-surface-elevated border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Search Results ─────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => {
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
                <img
                  src={p.image || FALLBACK_IMG}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMG;
                  }}
                  alt={p.name}
                  className="w-14 h-14 rounded-xl object-cover bg-surface flex-shrink-0"
                />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  {p.category && (
                    <span className="inline-flex self-start items-center px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-accent/15 text-accent">
                      {p.category}
                    </span>
                  )}
                  <span className="text-sm font-bold text-text-primary truncate">
                    {p.name}
                  </span>
                  <span className="text-xs text-text-muted truncate">
                    {p.ref}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap flex-shrink-0 ${badge.classes}`}
                >
                  {badge.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
