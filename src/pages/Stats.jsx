import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Wrench,
  Calendar,
  FileText,
  ShoppingBag,
  StickyNote,
  Hash,
} from 'lucide-react';
import { useStore } from '../store';
import { parseDate, formatCurrency } from '../utils/helpers';
import { FALLBACK_IMG } from '../utils/constants';

const PERIOD_OPTIONS = [
  { key: '7j', label: '7j' },
  { key: 'mois', label: 'Ce mois' },
  { key: 'annee', label: 'Année' },
];

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

function getFilteredInterventions(interventions, period) {
  const now = new Date();
  return interventions.filter((i) => {
    const d = parseDate(i.date);
    if (isNaN(d.getTime())) return false;
    if (period === '7j') {
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (period === 'mois') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === 'annee') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function getLast6MonthsCA(interventions) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth(), year: d.getFullYear() });
  }
  return months.map(({ month, year }) => {
    const matching = interventions.filter((iv) => {
      const d = parseDate(iv.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const ca = matching.reduce((sum, iv) => sum + (parseFloat(iv.prixTTC) || 0), 0);
    return {
      label: MONTHS_FR[month],
      ca,
      isCurrent: month === now.getMonth() && year === now.getFullYear(),
    };
  });
}

function BarChart({ data }) {
  const maxCA = Math.max(...data.map((d) => d.ca), 1);
  const svgW = 320;
  const svgH = 180;
  const barW = 36;
  const gap = (svgW - data.length * barW) / (data.length + 1);
  const topPad = 28;
  const bottomPad = 24;
  const chartH = svgH - topPad - bottomPad;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
      <defs>
        <linearGradient id="barGradCurrent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c63ff" />
          <stop offset="100%" stopColor="#00d4ff" />
        </linearGradient>
        <linearGradient id="barGradMuted" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8890aa" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8890aa" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const h = maxCA > 0 ? (d.ca / maxCA) * chartH : 0;
        const y = topPad + chartH - h;
        const fill = d.isCurrent ? 'url(#barGradCurrent)' : 'url(#barGradMuted)';
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 2)}
              rx={6}
              fill={fill}
            />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-text-secondary text-[9px] font-semibold"
            >
              {d.ca > 0 ? `${d.ca.toFixed(0)}€` : ''}
            </text>
            <text
              x={x + barW / 2}
              y={svgH - 4}
              textAnchor="middle"
              className="fill-text-muted text-[10px] font-medium"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function StatsTab({ interventions, clients, products, period, setPeriod }) {
  const filtered = useMemo(
    () => getFilteredInterventions(interventions, period),
    [interventions, period]
  );

  const chartData = useMemo(
    () => getLast6MonthsCA(interventions),
    [interventions]
  );

  const caTTC = useMemo(
    () => filtered.reduce((sum, i) => sum + (parseFloat(i.prixTTC) || 0), 0),
    [filtered]
  );
  const caHT = caTTC / 1.2;
  const tva = caTTC - caHT;

  const uniqueClients = useMemo(() => {
    const ids = new Set(filtered.map((i) => i.clientId).filter(Boolean));
    return ids.size;
  }, [filtered]);

  const topKeys = useMemo(() => {
    const counts = {};
    filtered.forEach((iv) => {
      const ref = iv.productRef || iv.produit;
      if (!ref) return;
      counts[ref] = (counts[ref] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ref, count]) => {
        const product = products.find(
          (p) => p.ref === ref || p.nom === ref || p.name === ref
        );
        return { ref, count, product };
      });
  }, [filtered, products]);

  return (
    <div className="flex flex-col gap-5">
      {/* Period filter */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriod(opt.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              period === opt.key
                ? 'gradient-primary text-white shadow-md shadow-primary/25'
                : 'bg-surface-elevated border border-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-primary" />
          <span className="text-sm font-bold text-text-primary">
            CA sur 6 mois
          </span>
        </div>
        <BarChart data={chartData} />
      </div>

      {/* KPI Grid — CA TTC, CA HT, TVA */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <span className="text-lg font-bold text-primary leading-tight">
            {formatCurrency(caTTC)}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            CA TTC
          </span>
        </div>
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <span className="text-lg font-bold text-accent leading-tight">
            {formatCurrency(caHT)}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            CA HT
          </span>
        </div>
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <span className="text-lg font-bold text-warning leading-tight">
            {formatCurrency(tva)}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            TVA 20%
          </span>
        </div>
      </div>

      {/* Count Grid — Interventions, Clients */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <Wrench size={18} className="text-primary mb-1" />
          <span className="text-2xl font-bold text-text-primary leading-tight">
            {filtered.length}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            Interventions
          </span>
        </div>
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <Users size={18} className="text-emerald-400 mb-1" />
          <span className="text-2xl font-bold text-text-primary leading-tight">
            {uniqueClients}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            Clients
          </span>
        </div>
      </div>

      {/* Top clés vendues */}
      {topKeys.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-success-dark" />
            <span className="text-sm font-bold text-text-primary">
              Top clés vendues
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {topKeys.map((item, idx) => (
              <div
                key={item.ref}
                className="flex items-center gap-3"
              >
                <span className="text-xs font-bold text-text-muted w-5 text-right flex-shrink-0">
                  {idx + 1}.
                </span>
                <img
                  src={item.product?.image || FALLBACK_IMG}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_IMG;
                  }}
                  alt={item.ref}
                  className="w-9 h-9 rounded-lg object-cover bg-surface flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {item.product?.name || item.product?.nom || item.ref}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">
                    {item.ref}
                  </p>
                </div>
                <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoriqueTab({ interventions, clients, products }) {
  const sorted = useMemo(
    () =>
      [...interventions].sort((a, b) => {
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        return db - da;
      }),
    [interventions]
  );

  const totalCA = useMemo(
    () => interventions.reduce((sum, i) => sum + (parseFloat(i.prixTTC) || 0), 0),
    [interventions]
  );

  const getClientName = (id) => {
    const c = clients.find((cl) => cl.id === id);
    return c?.nom || '—';
  };

  const getProductName = (iv) => {
    if (iv.produit) return iv.produit;
    if (iv.productRef) {
      const p = products.find((pr) => pr.ref === iv.productRef);
      return p?.name || p?.nom || iv.productRef;
    }
    return '—';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <span className="text-2xl font-bold text-primary leading-tight">
            {interventions.length}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            Total interventions
          </span>
        </div>
        <div className="flex flex-col items-center bg-surface-elevated border border-border rounded-2xl p-3">
          <span className="text-lg font-bold text-success-dark leading-tight">
            {formatCurrency(totalCA)}
          </span>
          <span className="text-[10px] font-semibold text-text-muted mt-1">
            CA Total
          </span>
        </div>
      </div>

      {/* Intervention cards */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Wrench size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Aucune intervention</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((iv) => (
            <div
              key={iv.id}
              className="bg-surface-elevated border border-border rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {getClientName(iv.clientId)}
                  </p>
                  {iv.plaque && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted mt-0.5">
                      <Hash size={11} />
                      {iv.plaque}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-primary flex-shrink-0">
                  {formatCurrency(parseFloat(iv.prixTTC) || 0)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {iv.date}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag size={11} />
                  {getProductName(iv)}
                </span>
                {iv.facture && (
                  <span className="flex items-center gap-1">
                    <FileText size={11} />
                    {iv.facture}
                  </span>
                )}
              </div>

              {iv.note && (
                <div className="flex items-start gap-1 mt-2 text-[11px] text-text-secondary">
                  <StickyNote size={11} className="flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{iv.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Stats() {
  const {
    interventions,
    clients,
    products,
    statsTab,
    setStatsTab,
    statPeriod,
    setStatPeriod,
  } = useStore();

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
      <h1 className="mb-5 text-xl font-extrabold tracking-tight text-text-primary">
        Statistiques
      </h1>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-surface-sunken rounded-xl p-1 mb-5">
        {[
          { key: 'stats', label: 'Stats', icon: BarChart3 },
          { key: 'historique', label: 'Historique', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStatsTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              statsTab === key
                ? 'bg-surface-elevated text-primary shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {statsTab === 'stats' ? (
        <StatsTab
          interventions={interventions}
          clients={clients}
          products={products}
          period={statPeriod}
          setPeriod={setStatPeriod}
        />
      ) : (
        <HistoriqueTab
          interventions={interventions}
          clients={clients}
          products={products}
        />
      )}
    </div>
  );
}
