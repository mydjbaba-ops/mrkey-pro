import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils/helpers';
import { User, Plus, Phone, Car, Search, Hash } from 'lucide-react';
import { Card, Button, Input, Modal } from '../components/ui';

function ClientForm({ onClose }) {
  const { showClientForm, addClient, updateClient, showToast } = useStore();
  const isEdit = showClientForm && typeof showClientForm === 'object';
  const [form, setForm] = useState({
    nom: isEdit ? showClientForm.nom || '' : '',
    tel: isEdit ? showClientForm.tel || '' : '',
    email: isEdit ? showClientForm.email || '' : '',
    adresse: isEdit ? showClientForm.adresse || '' : '',
    vehicule: isEdit ? showClientForm.vehicule || '' : '',
    plaque: isEdit ? showClientForm.plaque || '' : '',
    vin: isEdit ? showClientForm.vin || '' : '',
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    if (!form.nom.trim()) {
      showToast('Le nom est requis', 'error');
      return;
    }
    if (isEdit) {
      updateClient(showClientForm.id, form);
      showToast('Client modifie', 'success');
    } else {
      addClient({ id: Date.now().toString(), ...form });
      showToast('Client ajoute', 'success');
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Nom *"
        placeholder="Nom du client"
        value={form.nom}
        onChange={(e) => set('nom', e.target.value)}
      />
      <Input
        label="Telephone"
        placeholder="06 12 34 56 78"
        value={form.tel}
        onChange={(e) => set('tel', e.target.value)}
      />
      <Input
        label="Email"
        placeholder="email@exemple.com"
        value={form.email}
        onChange={(e) => set('email', e.target.value)}
      />
      <Input
        label="Adresse"
        placeholder="Adresse"
        value={form.adresse}
        onChange={(e) => set('adresse', e.target.value)}
      />
      <Input
        label="Vehicule"
        placeholder="Marque / Modele"
        value={form.vehicule}
        onChange={(e) => set('vehicule', e.target.value)}
      />
      <Input
        label="Plaque"
        placeholder="AA-123-BB"
        value={form.plaque}
        onChange={(e) => set('plaque', e.target.value)}
      />
      <Input
        label="VIN"
        placeholder="Numero VIN"
        value={form.vin}
        onChange={(e) => set('vin', e.target.value)}
      />
      <Button fullWidth onClick={handleSave} className="mt-2">
        {isEdit ? 'Modifier' : 'Enregistrer'}
      </Button>
    </div>
  );
}

export default function Clients() {
  const {
    clients,
    interventions,
    setPage,
    setSelectedClient,
    showClientForm,
    setShowClientForm,
    clientSearch,
    setClientSearch,
  } = useStore();

  const filtered = clients.filter((c) => {
    const q = (clientSearch || '').toLowerCase();
    if (!q) return true;
    return (
      (c.nom || '').toLowerCase().includes(q) ||
      (c.tel || '').toLowerCase().includes(q) ||
      (c.plaque || '').toLowerCase().includes(q) ||
      (c.vehicule || '').toLowerCase().includes(q)
    );
  });

  const getClientStats = (clientId) => {
    const clientIntervs = interventions.filter((i) => i.clientId === clientId);
    const ca = clientIntervs.reduce((sum, i) => sum + (parseFloat(i.prixTTC) || 0), 0);
    return { count: clientIntervs.length, ca };
  };

  const handleClick = (client) => {
    setSelectedClient(client);
    setPage('clientDetail');
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Input
          search
          clearable
          placeholder="Rechercher un client..."
          value={clientSearch || ''}
          onChange={(e) => setClientSearch(e.target.value)}
          onClear={() => setClientSearch('')}
          className="flex-1"
        />
        <Button size="md" onClick={() => setShowClientForm(true)}>
          <Plus size={18} />
          Nouveau
        </Button>
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <User size={48} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">Aucun client</p>
          <p className="text-xs mt-1">Ajoutez votre premier client</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c) => {
            const stats = getClientStats(c.id);
            return (
              <Card key={c.id} onClick={() => handleClick(c)}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User size={22} className="text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate">
                      {c.nom}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.tel && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Phone size={12} />
                          {c.tel}
                        </span>
                      )}
                      {c.plaque && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Hash size={12} />
                          {c.plaque}
                        </span>
                      )}
                    </div>
                    {c.vehicule && (
                      <span className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                        <Car size={12} />
                        {c.vehicule}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(stats.ca)}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {stats.count} interv.
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Client Form Modal */}
      <Modal
        open={!!showClientForm}
        onClose={() => setShowClientForm(false)}
        title={
          typeof showClientForm === 'object'
            ? 'Modifier le client'
            : 'Nouveau client'
        }
      >
        <ClientForm onClose={() => setShowClientForm(false)} />
      </Modal>
    </div>
  );
}
