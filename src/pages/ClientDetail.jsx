import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Car,
  Hash,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Pencil,
  Trash2,
  Plus,
  FileText,
  Calendar,
  StickyNote,
  Wrench,
} from 'lucide-react';
import { useStore } from '../store';
import { getNextNum, formatCurrency, parseDate } from '../utils/helpers';
import { Card, Button, Input, Modal, Badge, StatBox, Select } from '../components/ui';

/* ─── Intervention Form (bottom-sheet modal) ────────────────────────────── */
function InterventionForm({ onClose, prefilledClientId }) {
  const { clients, products, addIntervention, showToast } = useStore();

  const [form, setForm] = useState({
    clientId: prefilledClientId || '',
    produitId: '',
    qty: '1',
    prixHT: '',
    note: '',
    date: new Date().toLocaleDateString('fr-FR'),
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

    const product = products.find((p) => p.id === form.produitId);
    addIntervention({
      id: Date.now().toString(),
      numInterv: getNextNum('INT'),
      clientId: form.clientId,
      produitId: form.produitId,
      produitNom: product?.nom || product?.name || '',
      qty: parseInt(form.qty) || 1,
      prixHT: parseFloat(form.prixHT) || 0,
      prixTTC: parseFloat(prixTTC) || 0,
      note: form.note,
      date: form.date,
    });
    showToast('Intervention ajoutée');
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
      <Input
        label="Date"
        placeholder="jj/mm/aaaa"
        value={form.date}
        onChange={(e) => set('date', e.target.value)}
      />
      <Input
        label="Note"
        placeholder="Remarque..."
        value={form.note}
        onChange={(e) => set('note', e.target.value)}
      />
      <Button fullWidth onClick={handleSave} className="mt-2">
        Enregistrer
      </Button>
    </div>
  );
}

/* ─── Client Detail Page ────────────────────────────────────────────────── */
export default function ClientDetail() {
  const {
    selectedClient,
    setSelectedClient,
    setPage,
    interventions,
    products,
    settings,
    showClientForm,
    setShowClientForm,
    showIntervForm,
    setShowIntervForm,
    deleteClient,
    deleteIntervention,
    showToast,
    factureUrl,
    setFactureUrl,
  } = useStore();

  const client = selectedClient;

  // Client interventions sorted by date descending
  const clientIntervs = useMemo(() => {
    if (!client) return [];
    return interventions
      .filter((i) => i.clientId === client.id)
      .sort((a, b) => {
        const da = parseDate(a.date);
        const db = parseDate(b.date);
        return db - da;
      });
  }, [interventions, client]);

  // Stats
  const intervCount = clientIntervs.length;
  const caTotal = clientIntervs.reduce((sum, i) => sum + (parseFloat(i.prixTTC) || 0), 0);

  if (!client) {
    return (
      <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
        <p className="text-text-muted text-center py-20">Aucun client sélectionné</p>
      </div>
    );
  }

  const handleBack = () => {
    setSelectedClient(null);
    setPage('clients');
  };

  const handleEdit = () => {
    setShowClientForm(client);
  };

  const handleDelete = () => {
    if (window.confirm(`Supprimer le client "${client.nom}" ?`)) {
      deleteClient(client.id);
      showToast('Client supprimé');
      handleBack();
    }
  };

  const handleDeleteInterv = (interv) => {
    if (window.confirm('Supprimer cette intervention ?')) {
      deleteIntervention(interv.id);
      showToast('Intervention supprimée');
    }
  };

  const buildMailtoLink = (interv) => {
    if (!client.email) return null;
    const subject = encodeURIComponent(`Facture intervention ${interv.numInterv || ''}`);
    const body = encodeURIComponent(
      `Bonjour ${client.nom},\n\nVeuillez trouver ci-joint les détails de votre intervention.\n\nIntervention : ${interv.numInterv || ''}\nDate : ${interv.date}\nMontant TTC : ${formatCurrency(interv.prixTTC)}\n\nCordialement,\n${settings?.nom || 'MrKey Pro'}`
    );
    return `mailto:${client.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-4">
      {/* ── Sticky Header ────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-surface pb-3 pt-1 -mx-4 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-elevated border border-border hover:border-primary/30 transition-all cursor-pointer"
          >
            <ArrowLeft size={20} className="text-text-primary" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-text-primary truncate">
            {client.nom}
          </h1>
        </div>
      </div>

      {/* ── Client Info Card ─────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex flex-col gap-2.5">
          {client.vehicule && (
            <div className="flex items-center gap-2.5">
              <Car size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-sm text-text-primary">{client.vehicule}</span>
            </div>
          )}
          {client.plaque && (
            <div className="flex items-center gap-2.5">
              <Hash size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-sm text-text-primary font-mono">{client.plaque}</span>
            </div>
          )}
          {client.tel && (
            <div className="flex items-center gap-2.5">
              <Phone size={16} className="text-text-muted flex-shrink-0" />
              <a href={`tel:${client.tel}`} className="text-sm text-primary hover:underline">
                {client.tel}
              </a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2.5">
              <Mail size={16} className="text-text-muted flex-shrink-0" />
              <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline truncate">
                {client.email}
              </a>
            </div>
          )}
          {client.adresse && (
            <div className="flex items-center gap-2.5">
              <MapPin size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-sm text-text-secondary">{client.adresse}</span>
            </div>
          )}
          {client.vin && (
            <div className="flex items-center gap-2.5">
              <KeyRound size={16} className="text-text-muted flex-shrink-0" />
              <span className="text-sm text-text-secondary font-mono">{client.vin}</span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox
          value={intervCount}
          label="Interventions"
          color="text-accent"
        />
        <StatBox
          value={formatCurrency(caTotal)}
          label="CA Total"
          color="text-primary"
        />
      </div>

      {/* ── Action Buttons ───────────────────────────────────── */}
      <div className="flex gap-3 mb-6">
        <Button variant="secondary" size="sm" onClick={handleEdit} className="flex-1">
          <Pencil size={16} />
          Modifier
        </Button>
        <Button variant="danger" size="sm" onClick={handleDelete} className="flex-1">
          <Trash2 size={16} />
          Supprimer
        </Button>
      </div>

      {/* ── Interventions Section ────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-text-primary">Interventions</h2>
        <Button size="sm" onClick={() => setShowIntervForm(true)}>
          <Plus size={16} />
          Ajouter
        </Button>
      </div>

      {clientIntervs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Wrench size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">Aucune intervention</p>
          <p className="text-xs mt-1">Ajoutez la première intervention</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clientIntervs.map((interv) => {
            const mailto = buildMailtoLink(interv);
            return (
              <Card key={interv.id}>
                <div className="flex flex-col gap-2">
                  {/* Top row: date + price */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-text-muted" />
                      <span className="text-xs font-semibold text-text-secondary">
                        {interv.date}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(interv.prixTTC)}
                    </span>
                  </div>

                  {/* Product name */}
                  {interv.produitNom && (
                    <div className="flex items-center gap-2">
                      <KeyRound size={14} className="text-text-muted flex-shrink-0" />
                      <span className="text-sm text-text-primary truncate">
                        {interv.produitNom}
                      </span>
                      {interv.qty > 1 && (
                        <Badge variant="neutral" size="sm">x{interv.qty}</Badge>
                      )}
                    </div>
                  )}

                  {/* Num interv */}
                  {interv.numInterv && (
                    <span className="text-[11px] text-text-muted font-mono">
                      {interv.numInterv}
                    </span>
                  )}

                  {/* Note */}
                  {interv.note && (
                    <div className="flex items-start gap-2 mt-1">
                      <StickyNote size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-text-muted leading-relaxed">
                        {interv.note}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-1 pt-2 border-t border-border">
                    {interv.factureUrl && (
                      <a
                        href={interv.factureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                      >
                        <FileText size={14} />
                        Voir facture
                      </a>
                    )}
                    {mailto && (
                      <a
                        href={mailto}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail size={14} />
                        Mail
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteInterv(interv)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:text-danger/80 transition-colors ml-auto cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Intervention Form Modal ──────────────────────────── */}
      <Modal
        open={!!showIntervForm}
        onClose={() => setShowIntervForm(false)}
        title="Nouvelle intervention"
      >
        <InterventionForm
          onClose={() => setShowIntervForm(false)}
          prefilledClientId={client.id}
        />
      </Modal>

      {/* ── Client Form Modal (edit) ─────────────────────────── */}
      <Modal
        open={!!showClientForm}
        onClose={() => setShowClientForm(false)}
        title="Modifier le client"
      >
        <ClientEditForm onClose={() => setShowClientForm(false)} />
      </Modal>
    </div>
  );
}

/* ─── Inline Client Edit Form (reuse pattern from Clients page) ─────── */
function ClientEditForm({ onClose }) {
  const { showClientForm, updateClient, showToast, setSelectedClient } = useStore();
  const client = typeof showClientForm === 'object' ? showClientForm : null;

  const [form, setForm] = useState({
    nom: client?.nom || '',
    tel: client?.tel || '',
    email: client?.email || '',
    adresse: client?.adresse || '',
    vehicule: client?.vehicule || '',
    plaque: client?.plaque || '',
    vin: client?.vin || '',
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    if (!form.nom.trim()) {
      showToast('Le nom est requis', 'error');
      return;
    }
    if (client) {
      updateClient(client.id, form);
      setSelectedClient({ ...client, ...form });
      showToast('Client modifié');
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <Input label="Nom *" placeholder="Nom du client" value={form.nom} onChange={(e) => set('nom', e.target.value)} />
      <Input label="Téléphone" placeholder="06 12 34 56 78" value={form.tel} onChange={(e) => set('tel', e.target.value)} />
      <Input label="Email" placeholder="email@exemple.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
      <Input label="Adresse" placeholder="Adresse" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
      <Input label="Véhicule" placeholder="Marque / Modèle" value={form.vehicule} onChange={(e) => set('vehicule', e.target.value)} />
      <Input label="Plaque" placeholder="AA-123-BB" value={form.plaque} onChange={(e) => set('plaque', e.target.value)} />
      <Input label="VIN" placeholder="Numéro VIN" value={form.vin} onChange={(e) => set('vin', e.target.value)} />
      <Button fullWidth onClick={handleSave} className="mt-2">
        Modifier
      </Button>
    </div>
  );
}
