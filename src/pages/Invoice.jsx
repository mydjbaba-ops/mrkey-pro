import React from "react";
import { useStore } from "../store";
import { ArrowLeft, Mail } from "lucide-react";

export default function Invoice() {
  const { factureUrl, setFactureUrl, settings } = useStore();

  if (!factureUrl) return null;
  const { interv, prod, num, tva, client: fc } = factureUrl;

  const mailSubject = encodeURIComponent(`Facture ${num} - MrKey Pro`);
  const mailBody = encodeURIComponent(
    `Bonjour ${fc.nom},\n\nVotre facture N° ${num} du ${interv.date}.\n\n` +
    `${prod ? prod.nom : "Clé automobile"} x${interv.qty || 1}\n` +
    `HT : ${interv.prixHT} €\nTVA 20% : ${tva} €\nTTC : ${interv.prixTTC} €\n\n` +
    `Cordialement,\n${settings.nom || "MrKey Pro"}`
  );

  return (
    <div className="fixed inset-0 bg-surface-elevated z-[999] overflow-y-auto font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-sunken border-b border-border sticky top-0 z-10">
        <button
          onClick={() => setFactureUrl(null)}
          className="flex items-center gap-1.5 text-primary font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Fermer
        </button>
        <div className="flex-1 text-sm font-extrabold text-text-primary">
          Facture N° {num}
        </div>
        <a
          href={`mailto:${fc.email || ""}?subject=${mailSubject}&body=${mailBody}`}
          className="gradient-primary text-white rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
        >
          <Mail className="w-3.5 h-3.5" /> Email
        </a>
      </div>

      {/* Invoice Content */}
      <div className="max-w-[600px] mx-auto px-5 py-6 pb-16">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black text-primary">MrKey Pro</h1>
            <p className="text-sm text-text-secondary mt-1">Facture N° {num}</p>
            <p className="text-sm text-text-secondary">Date : {interv.date}</p>
          </div>
          <div className="text-right text-xs text-text-primary space-y-0.5">
            {settings.nom && <div className="font-bold">{settings.nom}</div>}
            {settings.adresse && <div>{settings.adresse}</div>}
            {settings.tel && <div>{settings.tel}</div>}
            {settings.email && <div>{settings.email}</div>}
            {settings.siret && <div>SIRET : {settings.siret}</div>}
          </div>
        </div>

        {/* Client */}
        <div className="bg-surface-elevated rounded-2xl p-4 mb-5 border border-border">
          <div className="text-[9px] font-bold uppercase text-text-secondary tracking-wider mb-2">Client</div>
          <div className="font-bold text-sm text-text-primary">{fc.nom}</div>
          {fc.adresse && <div className="text-xs text-text-secondary mt-0.5">{fc.adresse}</div>}
          {fc.tel && <div className="text-xs text-text-secondary">Tél : {fc.tel}</div>}
          {fc.vehicule && <div className="text-xs text-primary mt-1">🚗 {fc.vehicule}</div>}
          {fc.plaque && <div className="text-xs text-text-secondary">Plaque : {fc.plaque}</div>}
          {fc.vin && <div className="text-xs text-text-secondary">VIN : {fc.vin}</div>}
        </div>

        {/* Product Line */}
        <div className="rounded-2xl overflow-hidden border border-border-strong mb-5">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gradient-primary px-4 py-2.5 gap-2">
            {["Désignation", "Qté", "HT", "TTC"].map(h => (
              <div key={h} className="text-[11px] font-bold text-white uppercase tracking-wider">{h}</div>
            ))}
          </div>
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 gap-2 bg-surface-elevated">
            <div className="text-xs text-text-primary font-semibold">{prod ? prod.nom : "Clé automobile"}</div>
            <div className="text-xs text-text-primary">{interv.qty || 1}</div>
            <div className="text-xs text-text-primary">{interv.prixHT}€</div>
            <div className="text-sm font-extrabold text-primary">{interv.prixTTC}€</div>
          </div>
        </div>

        {/* Note */}
        {interv.note && (
          <div className="bg-surface-elevated rounded-xl p-4 mb-5 border border-border">
            <div className="text-[9px] font-bold uppercase text-text-secondary tracking-wider mb-1.5">Note</div>
            <div className="text-sm text-text-primary">{interv.note}</div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-surface-elevated rounded-2xl p-4 border border-border-strong">
          {[["Total HT", interv.prixHT + " €"], ["TVA 20%", tva + " €"]].map(([l, v]) => (
            <div key={l} className="flex justify-between mb-2 text-sm text-text-secondary">
              <span>{l}</span>
              <span className="font-semibold text-text-primary">{v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t-2 border-primary/20 text-lg font-black text-primary">
            <span>Total TTC</span>
            <span>{interv.prixTTC} €</span>
          </div>
        </div>

        {/* Legal */}
        <p className="text-[10px] text-text-secondary mt-5 text-center leading-relaxed">
          TVA non applicable - Art. 293B du CGI<br />(À modifier selon votre statut fiscal)
        </p>
      </div>
    </div>
  );
}
