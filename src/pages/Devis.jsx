import React, { useState, useMemo } from 'react';
import {
  Plus,
  FileText,
  Trash2,
  Calendar,
  Check,
  X,
  ArrowRightCircle,
  Hash,
  StickyNote,
  Clock,
} from 'lucide-react';
import { useStore } from '../store';
import { getNextNum, formatCurrency, parseDate } from '../utils/helpers';
import { Card, Button, Input, Modal, Badge, Select } from '../components/ui';

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  en_attente: { label: 'En attente', variant: 'warning' },
  accepte: { label: 'Accepté', variant: 'success' },
  refuse: { label: 'Refusé', variant: 'danger' },
  facture: { label: 'Facturé', variant: 'primary' },
};

/* ─── Devis Form (bottom-sheet modal) ───────────────────────────────────── */
function DevisForm({ onClose }) {
  const { clients, products, addDevis, showToast } = useStore();

  const defaultValidite = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('fr-FR');
  };

  const [form, setForm] = useState({
    clientId: '',
    produitId: '',
    qty: '1',
    prixHT: '',
    date: new Date().toLocaleDateString('fr-FR'),
    validite: defaultValidite(),
    note: '',
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const prixTTC = form.prixHT ? (parseFloat(form.prixHT) * 1.2).toFixed(2) : '';

  const handleSave = () => {
    if (!form.clientId) {
      showToast('Veuillez sélectionner un client', 'error');
      return;
    }
    if (!form.produitId) {
      showToast('Veuillez sélectionner un produit', 'error');
      return;
    }

    const client = clients.find((c) => c.id === form.clientId);
    const product = products.find((p) => p.id === form.produitId);

    addDevis({
      id: Date.now().toString(),
      numDevis: getNextNum('DEV'),
      clientId: form.clientId,
      clientNom: client?.nom || '',
      clientPlaque: client?.plaque || '',
      produitId: form.produitId,
      produitNom: product?.nom || product?.name || '',
      qty: parseInt(form.qty) || 1,
      prixHT: parseFloat(form.prixHT) || 0,
      prixTTC: parseFloat(prixTTC) || 0,
      date: form.date,
      validite: form.validite,
      note: form.note,
      statut: 'en_attente',
    });
    showToast('Devis créé');
    onClose();
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: `${c.nom}${c.plaque ? ` (${c.plaque})` : ''}`,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.nom || p.name || p.ref || p.id,
  }));

  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Client"
        options={clientOptions}
        value={form.clientId}
        onChange={(e) => set('clientId', e.target.value)}
        placeholder="Sélectionner un client..."
      />
      <Select
        label="Produit"
        options={productOptions}
        value={form.produitId}
        onChange={(e) => set('produitId', e.target.value)}
        placeholder="Sélectionner un produit..."
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Quantité"
          type="number"
          min="1"
          value={form.qty}
          onChange={(e) => set('qty', e.target.value)}
        />
        <Input
          label="Prix HT (€)"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={form.prixHT}
          onChange={(e) => set('prixHT', e.target.value)}
        />
      </div>
      {prixTTC && (
        <div className="flex items-center justify-between bg-surface-sunken rounded-xl px-4 py-2.5">
          <span className="text-xs font-semibold text-text-muted">Prix TTC</span>
          <span className="text-sm font-bold text-primary">{formatCurrency(parseFloat(prixTTC))}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          placeholder="jj/mm/aaaa"
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <Input
          label="Validité"
          placeholder="jj/mm/aaaa"
          value={form.validite}
          onChange={(e) => set('validite', e.target.value)}
        />
      </div>
      <Input
        label="Note"
        placeholder="Remarque..."
        value={form.note}
        onChange={(e) => set('note', e.target.value)}
      />
      <Button fullWidth onClick={handleSave} className="mt-2">
        Créer le devis
      </Button>
    </div>
  );
}

/* ─── Devis Page ────────────────────────────────────────────────────────── */
export default function Devis() {
  const {
    devis,
    clients,
    products,
    interventions,
    showDevisForm,
    setShowDevisForm,
    updateDevisStatus,
    addIntervention,
    deleteDevis,
    showToast,
  } = useStore();

  // Sort devis by date descending
  const sortedDevis = useMemo(() => {
    return [...devis].sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      return db - da;
    });
  }, [devis]);

  const handleAccept = (d) => {
    updateDevisStatus(d.id, 'accepte');
    showToast('Devis accepté');
  };

  const handleRefuse = (d) => {
    updateDevisStatus(d.id, 'refuse');
    showToast('Devis refusé');
  };

  const handleConvertToFacture = (d) => {
    // Create intervention from devis
    const numFacture = getNextNum('FAC');
    addIntervention({
      id: Date.now().toString(),
      numInterv: numFacture,
      clientId: d.clientId,
      produitId: d.produitId,
      produitNom: d.produitNom,
      qty: d.qty || 1,
      prixHT: d.prixHT || 0,
      prixTTC: d.prixTTC || 0,
      note: d.note ? `Devis ${d.numDevis} — ${d.note}` : `Devis ${d.numDevis}`,
      date: new Date().toLocaleDateString('fr-FR'),
      fromDevis: d.id,
      numFacture,
    });
    updateDevisStatus(d.id, 'facture');
    showToast('Devis converti en facture');
  };

  const handleDelete = (d) => {
    if (window.confirm(`Supprimer le devis ${d.numDevis} ?`)) {
      deleteDevis(d.id);
      showToast('Devis supprimé');
    }
  };

  // Find facture number for a converted devis
  const getFactureNum = (devisItem) => {
    const interv = interventions.find((i) => i.fromDevis === devisItem.id);
    return interv?.numFacture || interv?.numInterv || null;
  };

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary">
          Devis
        </h1>
        <Button size="md" onClick={() => setShowDevisForm(true)}>
          <Plus size={18} />
          Nouveau
        </Button>
      </div>

      {/* ── Devis List ───────────────────────────────────────── */}
      {sortedDevis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <FileText size={48} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">Aucun devis</p>
          <p className="text-xs mt-1">Créez votre premier devis</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedDevis.map((d) => {
            const statusCfg = STATUS_CONFIG[d.statut] || STATUS_CONFIG.en_attente;
            const factureNum = d.statut === 'facture' ? getFactureNum(d) : null;

            return (
              <Card key={d.id}>
                <div className="flex flex-col gap-2.5">
                  {/* Top row: numDevis + status badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-primary font-mono">
                      {d.numDevis}
                    </span>
                    <Badge variant={statusCfg.variant} size="sm">
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {/* Date + Validité */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-text-muted" />
                      <span className="text-xs text-text-muted">{d.date}</span>
                    </div>
                    {d.validite && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-text-muted" />
                        <span className="text-xs text-text-muted">Val. {d.validite}</span>
                      </div>
                    )}
                  </div>

                  {/* Client info */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary font-semibold truncate">
                      {d.clientNom}
                    </span>
                    {d.clientPlaque && (
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Hash size={12} />
                        {d.clientPlaque}
                      </span>
                    )}
                  </div>

                  {/* Product */}
                  {d.produitNom && (
                    <span className="text-xs text-text-secondary truncate">
                      {d.produitNom}
                      {d.qty > 1 ? ` x${d.qty}` : ''}
                    </span>
                  )}

                  {/* Prices */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-text-muted">HT</span>
                      <span className="text-sm font-semibold text-text-primary">
                        {formatCurrency(d.prixHT)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-text-muted">TTC</span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(d.prixTTC)}
                      </span>
                    </div>
                  </div>

                  {/* Note */}
                  {d.note && (
                    <div className="flex items-start gap-2">
                      <StickyNote size={13} className="text-text-muted flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-text-muted leading-relaxed">{d.note}</span>
                    </div>
                  )}

                  {/* Facture number if converted */}
                  {d.statut === 'facture' && factureNum && (
                    <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-1.5">
                      <FileText size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-primary font-mono">
                        {factureNum}
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {d.statut === 'en_attente' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAccept(d)}
                          className="flex-1"
                        >
                          <Check size={14} />
                          Accepter
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRefuse(d)}
                          className="flex-1"
                        >
                          <X size={14} />
                          Refuser
                        </Button>
                      </>
                    )}

                    {d.statut === 'accepte' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConvertToFacture(d)}
                        className="flex-1"
                      >
                        <ArrowRightCircle size={14} />
                        Convertir en facture
                      </Button>
                    )}

                    <button
                      onClick={() => handleDelete(d)}
                      className="flex items-center justify-center w-9 h-9 rounded-xl text-danger hover:bg-danger/10 transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Devis Form Modal ─────────────────────────────────── */}
      <Modal
        open={!!showDevisForm}
        onClose={() => setShowDevisForm(false)}
        title="Nouveau devis"
      >
        <DevisForm onClose={() => setShowDevisForm(false)} />
      </Modal>
    </div>
  );
}
