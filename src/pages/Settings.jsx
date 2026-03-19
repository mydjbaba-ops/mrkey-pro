import React, { useState, useRef, useMemo } from 'react';
import {
  Save,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  X,
  RotateCcw,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Link2,
  CircleDot,
} from 'lucide-react';
import { useStore } from '../store';
import { SILCA_DB } from '../../silcaData.js';

export default function Settings() {
  const {
    settings,
    updateSettings,
    products,
    clients,
    interventions,
    devis,
    stock,
    oeLinksOverrides,
    setOeLinksOverrides,
    showToast,
    customAftermarket,
  } = useStore();

  const exportBackup = useStore((s) => s.exportBackup);
  const importBackup = useStore((s) => s.importBackup);

  // ── Settings draft ──────────────────────────────────────────
  const [draft, setDraft] = useState({
    nom: settings?.nom || '',
    tel: settings?.tel || '',
    email: settings?.email || '',
    adresse: settings?.adresse || '',
    siret: settings?.siret || '',
  });

  const setField = (key, val) => setDraft((prev) => ({ ...prev, [key]: val }));

  const handleSaveSettings = () => {
    updateSettings({ ...settings, ...draft });
    showToast('Coordonnées enregistrées');
  };

  // ── Backup import ──────────────────────────────────────────
  const fileRef = useRef(null);

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        importBackup(data);
      } catch {
        showToast('Fichier JSON invalide', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── OE Links ───────────────────────────────────────────────
  const [oeOpen, setOeOpen] = useState(false);

  const refsWithOeLinks = useMemo(
    () => SILCA_DB.filter((item) => item.oeLinks && item.oeLinks.length > 0),
    []
  );

  const getLinksForRef = (ref) => {
    if (oeLinksOverrides[ref]) return oeLinksOverrides[ref];
    const item = SILCA_DB.find((s) => s.ref === ref);
    return item?.oeLinks || [];
  };

  const isModified = (ref) => {
    return !!oeLinksOverrides[ref];
  };

  const setLinksForRef = (ref, links) => {
    setOeLinksOverrides((prev) => ({ ...prev, [ref]: links }));
  };

  const resetLinksForRef = (ref) => {
    setOeLinksOverrides((prev) => {
      const next = { ...prev };
      delete next[ref];
      return next;
    });
  };

  const addLinkForRef = (ref) => {
    const current = getLinksForRef(ref);
    setLinksForRef(ref, [...current, { label: '', url: '' }]);
  };

  const removeLinkForRef = (ref, idx) => {
    const current = getLinksForRef(ref);
    setLinksForRef(ref, current.filter((_, i) => i !== idx));
  };

  const updateLinkForRef = (ref, idx, field, value) => {
    const current = getLinksForRef(ref);
    const updated = current.map((link, i) =>
      i === idx ? { ...link, [field]: value } : link
    );
    setLinksForRef(ref, updated);
  };

  // ── Danger zone ────────────────────────────────────────────
  const [confirmStep, setConfirmStep] = useState(0);

  const handleClearAll = () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }
    // Step 2: actually clear
    useStore.setState({
      products: [],
      stock: {},
      clients: [],
      interventions: [],
      devis: [],
      settings: { nom: '', tel: '', email: '', adresse: '', siret: '', logo: '' },
      customAftermarket: [],
      oeLinksOverrides: {},
    });
    setConfirmStep(0);
    setDraft({ nom: '', tel: '', email: '', adresse: '', siret: '' });
    showToast('Toutes les données ont été effacées', 'error');
  };

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
      <h1 className="mb-5 text-xl font-extrabold tracking-tight text-text-primary">
        Paramètres
      </h1>

      {/* ── Mes coordonnées pro ─────────────────────────────── */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
          <User size={16} className="text-primary" />
          Mes coordonnées pro
        </h2>
        <div className="bg-surface-elevated border border-border rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary pl-1">
              Nom / Société
            </label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={draft.nom}
                onChange={(e) => setField('nom', e.target.value)}
                placeholder="MrKey Pro"
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary pl-1">
              Téléphone
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="tel"
                value={draft.tel}
                onChange={(e) => setField('tel', e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary pl-1">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="contact@mrkey.fr"
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary pl-1">
              Adresse
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={draft.adresse}
                onChange={(e) => setField('adresse', e.target.value)}
                placeholder="12 rue de la Clé, 75001 Paris"
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary pl-1">
              SIRET
            </label>
            <div className="relative">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <input
                type="text"
                value={draft.siret}
                onChange={(e) => setField('siret', e.target.value)}
                placeholder="123 456 789 00012"
                className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200"
              />
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.97] transition-all duration-200 cursor-pointer mt-1"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </section>

      {/* ── Sauvegarde des données ─────────────────────────── */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary mb-3">
          <Download size={16} className="text-accent" />
          Sauvegarde des données
        </h2>
        <div className="bg-surface-elevated border border-border rounded-2xl p-4 flex flex-col gap-3">
          <button
            onClick={exportBackup}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <Download size={16} />
            Exporter une sauvegarde (JSON)
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-surface border border-border text-text-secondary text-sm font-semibold hover:border-primary/30 hover:text-primary active:scale-[0.97] transition-all duration-200 cursor-pointer"
          >
            <Upload size={16} />
            Importer une sauvegarde
          </button>

          <p className="text-[11px] text-text-muted text-center">
            {products.length} produits · {clients.length} clients · {interventions.length} interventions · {devis.length} devis
          </p>
        </div>
      </section>

      {/* ── Liens fournisseurs (OE) ──────────────────────── */}
      <section className="mb-6">
        <button
          onClick={() => setOeOpen(!oeOpen)}
          className="flex items-center justify-between w-full text-sm font-bold text-text-primary mb-3 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Link2 size={16} className="text-warning" />
            Liens fournisseurs (OE)
          </span>
          {oeOpen ? (
            <ChevronUp size={18} className="text-text-muted" />
          ) : (
            <ChevronDown size={18} className="text-text-muted" />
          )}
        </button>

        {oeOpen && (
          <div className="flex flex-col gap-3">
            {refsWithOeLinks.map((item) => {
              const links = getLinksForRef(item.ref);
              const modified = isModified(item.ref);

              return (
                <div
                  key={item.ref}
                  className={`bg-surface-elevated border rounded-2xl p-4 ${
                    modified ? 'border-warning/40' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDot size={14} className="text-primary flex-shrink-0" />
                      <span className="text-xs font-bold text-text-primary truncate">
                        {item.ref}
                      </span>
                      {modified && (
                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md bg-warning/15 text-warning text-[9px] font-bold">
                          Modifié
                        </span>
                      )}
                    </div>
                    {modified && (
                      <button
                        onClick={() => resetLinksForRef(item.ref)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-text-muted hover:text-warning transition-colors cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1 flex flex-col gap-1">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) =>
                              updateLinkForRef(item.ref, idx, 'label', e.target.value)
                            }
                            placeholder="Label"
                            className="w-full bg-surface border border-border rounded-lg py-1.5 px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all duration-200"
                          />
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) =>
                              updateLinkForRef(item.ref, idx, 'url', e.target.value)
                            }
                            placeholder="https://..."
                            className="w-full bg-surface border border-border rounded-lg py-1.5 px-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/15 transition-all duration-200"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          {link.url && (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button
                            onClick={() => removeLinkForRef(item.ref, idx)}
                            className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => addLinkForRef(item.ref)}
                    className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-primary hover:text-primary-light transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    Ajouter un lien
                  </button>
                </div>
              );
            })}

            {refsWithOeLinks.length === 0 && (
              <p className="text-xs text-text-muted text-center py-6">
                Aucune référence avec liens OE dans la base Silca.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Zone danger ─────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="flex items-center gap-2 text-sm font-bold text-danger mb-3">
          <AlertTriangle size={16} />
          Zone danger
        </h2>
        <div className="bg-surface-elevated border border-danger/20 rounded-2xl p-4">
          <p className="text-xs text-text-muted mb-3">
            Cette action supprimera toutes vos données (produits, clients, interventions, devis, paramètres). Cette action est irréversible.
          </p>
          <button
            onClick={handleClearAll}
            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              confirmStep === 0
                ? 'bg-danger/10 text-danger hover:bg-danger/20 active:scale-[0.97]'
                : confirmStep === 1
                ? 'bg-danger/30 text-danger animate-pulse'
                : 'bg-danger text-white shadow-md shadow-danger/25 hover:shadow-lg hover:shadow-danger/35 active:scale-[0.97]'
            }`}
          >
            <Trash2 size={16} />
            {confirmStep === 0
              ? 'Effacer toutes les données'
              : confirmStep === 1
              ? 'Êtes-vous sûr ? Cliquez pour confirmer'
              : 'Confirmer la suppression définitive'}
          </button>
          {confirmStep > 0 && (
            <button
              onClick={() => setConfirmStep(0)}
              className="w-full mt-2 py-2 text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
            >
              Annuler
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
