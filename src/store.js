// ─── MrKey Pro — Zustand Store ──────────────────────────────────────────────
import { create } from "zustand";
import { dbSet, dbGetAll } from "./supabase";
import {
  SEUIL_DEFAULT,
  STOCK_KEY,
  CLIENT_KEY,
  INTERV_KEY,
  DEVIS_KEY,
  SETTINGS_KEY,
  OE_LINKS_KEY,
  PRODUCTS_KEY,
  CUSTOM_AM_KEY,
} from "./utils/constants";

// Re-export for convenience
export { SEUIL_DEFAULT };

// ─── Toast auto-dismiss timer reference ─────────────────────────────────────
let toastTimer = null;

// ─── Store ──────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  // ── Auth ────────────────────────────────────────────────────────────────
  user: null,
  authReady: false,
  syncing: false,
  dataLoaded: false,

  // ── Navigation ──────────────────────────────────────────────────────────
  page: "home",

  // ── Search ──────────────────────────────────────────────────────────────
  search: "",
  clientSearch: "",

  // ── Data collections ────────────────────────────────────────────────────
  products: [],
  stock: {},
  clients: [],
  interventions: [],
  devis: [],
  settings: { nom: "", tel: "", email: "", adresse: "", siret: "", logo: "" },
  customAftermarket: [],
  oeLinksOverrides: {},

  // ── Selections ──────────────────────────────────────────────────────────
  selectedProduct: null,
  selectedClient: null,
  selectedDevis: null,

  // ── UI toggles ──────────────────────────────────────────────────────────
  showClientForm: false,
  showIntervForm: false,
  showDevisForm: false,
  showUrlImport: false,
  showHistory: null,
  factureUrl: null,

  // ── Toast ───────────────────────────────────────────────────────────────
  toast: null,

  // ── Stats / Settings UI ─────────────────────────────────────────────────
  statsTab: "stats",
  statPeriod: "mois",
  settingsDraft: null,

  // =====================================================================
  // ACTIONS
  // =====================================================================

  // ── Navigation ──────────────────────────────────────────────────────────
  setPage: (page) => set({ page }),

  // ── Toast ───────────────────────────────────────────────────────────────
  showToast: (msg, type = "success") => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: { msg, type } });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 2800);
  },

  // ── Auth ────────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }),
  setAuthReady: (authReady) => set({ authReady }),

  // ── Search setters ──────────────────────────────────────────────────────
  setSearch: (search) => set({ search }),
  setClientSearch: (clientSearch) => set({ clientSearch }),

  // ── Selection setters ───────────────────────────────────────────────────
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setSelectedClient: (selectedClient) => set({ selectedClient }),
  setSelectedDevis: (selectedDevis) => set({ selectedDevis }),

  // ── UI toggle setters ───────────────────────────────────────────────────
  setShowClientForm: (showClientForm) => set({ showClientForm }),
  setShowIntervForm: (showIntervForm) => set({ showIntervForm }),
  setShowDevisForm: (showDevisForm) => set({ showDevisForm }),
  setShowUrlImport: (showUrlImport) => set({ showUrlImport }),
  setShowHistory: (showHistory) => set({ showHistory }),
  setFactureUrl: (factureUrl) => set({ factureUrl }),
  setStatsTab: (statsTab) => set({ statsTab }),
  setStatPeriod: (statPeriod) => set({ statPeriod }),
  setSettingsDraft: (settingsDraft) => set({ settingsDraft }),
  setSyncing: (syncing) => set({ syncing }),
  setDataLoaded: (dataLoaded) => set({ dataLoaded }),

  // ── Products ────────────────────────────────────────────────────────────
  setProducts: (products) => set({ products }),

  addProduct: (product) =>
    set((state) => {
      const products = [...state.products, product];
      const stock = {
        ...state.stock,
        [product.id]: state.stock[product.id] || {
          qty: 0,
          seuil: SEUIL_DEFAULT,
          init: true,
          historique: [],
        },
      };
      return { products, stock };
    }),

  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  deleteProduct: (id) =>
    set((state) => {
      const products = state.products.filter((p) => p.id !== id);
      const stock = { ...state.stock };
      delete stock[id];
      return { products, stock };
    }),

  // ── Stock ───────────────────────────────────────────────────────────────
  setStock: (stock) => set({ stock }),

  updateStock: (id, updates) =>
    set((state) => ({
      stock: {
        ...state.stock,
        [id]: { ...state.stock[id], ...updates },
      },
    })),

  adjustStock: (id, delta) =>
    set((state) => {
      const cur = state.stock[id];
      if (!cur) return state;
      const newQty = Math.max(0, (cur.qty ?? 0) + delta);
      return {
        stock: {
          ...state.stock,
          [id]: {
            ...cur,
            qty: newQty,
            init: false,
            historique: [
              {
                action: delta > 0 ? `+${delta}` : `${delta}`,
                date: new Date().toLocaleDateString("fr-FR"),
                qty: newQty,
              },
              ...(cur.historique || []).slice(0, 9),
            ],
          },
        },
      };
    }),

  // ── Clients ─────────────────────────────────────────────────────────────
  setClients: (clients) => set({ clients }),

  addClient: (client) =>
    set((state) => ({ clients: [...state.clients, client] })),

  updateClient: (id, updates) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
    })),

  // ── Interventions ───────────────────────────────────────────────────────
  setInterventions: (interventions) => set({ interventions }),

  addIntervention: (interv) =>
    set((state) => ({
      interventions: [...state.interventions, interv],
    })),

  deleteIntervention: (id) =>
    set((state) => ({
      interventions: state.interventions.filter((i) => i.id !== id),
    })),

  // ── Devis ───────────────────────────────────────────────────────────────
  setDevis: (devis) => set({ devis }),

  addDevis: (devis) =>
    set((state) => ({ devis: [...state.devis, devis] })),

  updateDevisStatus: (id, status) =>
    set((state) => ({
      devis: state.devis.map((d) =>
        d.id === id ? { ...d, statut: status } : d
      ),
    })),

  deleteDevis: (id) =>
    set((state) => ({
      devis: state.devis.filter((d) => d.id !== id),
    })),

  // ── Custom Aftermarket ──────────────────────────────────────────────────
  setCustomAftermarket: (customAftermarket) => set({ customAftermarket }),

  addCustomAftermarket: (item) =>
    set((state) => ({
      customAftermarket: [...state.customAftermarket, item],
    })),

  deleteCustomAftermarket: (id) =>
    set((state) => ({
      customAftermarket: state.customAftermarket.filter((i) => i.id !== id),
    })),

  // ── Settings ────────────────────────────────────────────────────────────
  setSettings: (settings) => set({ settings }),

  updateSettings: (settings) => set({ settings }),

  setOeLinksOverrides: (updater) =>
    set((state) => ({
      oeLinksOverrides:
        typeof updater === "function"
          ? updater(state.oeLinksOverrides)
          : updater,
    })),

  // ── Supabase sync ─────────────────────────────────────────────────────
  loadFromSupabase: async (userId) => {
    set({ syncing: true, dataLoaded: false });
    try {
      const all = await dbGetAll(userId);
      set((state) => {
        const updates = {};
        if (all[PRODUCTS_KEY]) updates.products = all[PRODUCTS_KEY];
        if (all[STOCK_KEY]) updates.stock = all[STOCK_KEY];
        if (all[CLIENT_KEY]) updates.clients = all[CLIENT_KEY];
        if (all[INTERV_KEY]) updates.interventions = all[INTERV_KEY];
        if (all[DEVIS_KEY]) updates.devis = all[DEVIS_KEY];
        if (all[SETTINGS_KEY]) updates.settings = all[SETTINGS_KEY];
        if (all[CUSTOM_AM_KEY]) updates.customAftermarket = all[CUSTOM_AM_KEY];
        if (all[OE_LINKS_KEY]) updates.oeLinksOverrides = all[OE_LINKS_KEY];
        return { ...updates, syncing: false, dataLoaded: true };
      });
    } catch (err) {
      console.error("loadFromSupabase error:", err);
      set({ syncing: false });
    }
  },

  saveToSupabase: async (userId, key, value) => {
    try {
      await dbSet(userId, key, value);
    } catch (err) {
      console.error("saveToSupabase error:", key, err);
    }
  },

  // ── Export CSV (low-stock re-order list) ───────────────────────────────
  exportCSV: () => {
    const { products, stock } = get();
    const lowStock = products.filter((p) => {
      const s = stock[p.id];
      if (s?.init) return false;
      return (s?.qty ?? 0) <= (s?.seuil || SEUIL_DEFAULT);
    });
    const rows = lowStock.map((p) => {
      const s = stock[p.id];
      const manquant = Math.max(
        0,
        (s?.seuil || SEUIL_DEFAULT) + 2 - (s?.qty ?? 0)
      );
      return [
        p.ref,
        `"${(p.nom || "").replace(/"/g, "'")}"`,
        p.marque,
        s?.qty ?? 0,
        s?.seuil ?? SEUIL_DEFAULT,
        manquant,
        (manquant * (p.prix || 0)).toFixed(2),
      ].join(";");
    });
    const csv = [
      "Référence;Nom;Marque;Stock actuel;Seuil;À commander;Total €",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reapprovisionnement.csv";
    a.click();
    URL.revokeObjectURL(url);
  },

  // ── Export full backup ─────────────────────────────────────────────────
  exportBackup: () => {
    const { products, stock, clients, interventions, devis, settings } = get();
    const data = {
      version: 1,
      date: new Date().toISOString(),
      products,
      stock,
      clients,
      interventions,
      devis,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mrkey-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    get().showToast("Backup téléchargé !");
  },

  // ── Import backup ──────────────────────────────────────────────────────
  importBackup: (data) => {
    if (!data || !data.version || !data.products) {
      get().showToast("Fichier invalide", "error");
      return false;
    }
    const updates = {};
    if (data.products) updates.products = data.products;
    if (data.stock) updates.stock = data.stock;
    if (data.clients) updates.clients = data.clients;
    if (data.interventions) updates.interventions = data.interventions;
    if (data.devis) updates.devis = data.devis;
    if (data.settings) updates.settings = data.settings;
    set(updates);
    get().showToast("Backup restauré !");
    return true;
  },
}));

// =====================================================================
// COMPUTED SELECTORS (derived state, subscribed via useStore(selector))
// =====================================================================

/**
 * Products filtered by the current search query.
 * Usage: const filtered = useStore(selectFiltered);
 */
export const selectFiltered = (state) => {
  const q = (state.search || "").trim().toLowerCase();
  if (!q) return state.products;
  return state.products.filter(
    (p) =>
      (p.nom || "").toLowerCase().includes(q) ||
      (p.ref || "").toLowerCase().includes(q) ||
      (p.marque || "").toLowerCase().includes(q) ||
      (p.modeles || "").toLowerCase().includes(q) ||
      (p.lame || "").toLowerCase().includes(q) ||
      (p.transpondeur || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q)
  );
};

/**
 * Products whose stock is at or below the alert threshold.
 * Usage: const lowStock = useStore(selectLowStockProducts);
 */
export const selectLowStockProducts = (state) =>
  state.products.filter((p) => {
    const s = state.stock[p.id];
    if (s?.init) return false;
    return (s?.qty ?? 0) <= (s?.seuil || SEUIL_DEFAULT);
  });

/**
 * Stats summary object.
 * Usage: const stats = useStore(selectStatsData);
 */
export const selectStatsData = (state) => {
  const { products, stock } = state;
  const lowStockProducts = selectLowStockProducts(state);

  const totalRefs = products.length;
  const okCount = products.filter((p) => {
    const s = stock[p.id];
    return !s?.init && (s?.qty ?? 0) > (s?.seuil || SEUIL_DEFAULT);
  }).length;
  const alertCount = lowStockProducts.length;
  const valeurStock = products.reduce((sum, p) => {
    const s = stock[p.id];
    if (s?.init) return sum;
    return sum + (s?.qty ?? 0) * (p.prix || 0);
  }, 0);
  const budgetCommande = lowStockProducts.reduce((sum, p) => {
    const s = stock[p.id];
    const manquant = Math.max(
      0,
      (s?.seuil || SEUIL_DEFAULT) + 2 - (s?.qty ?? 0)
    );
    return sum + manquant * (p.prix || 0);
  }, 0);

  return { totalRefs, okCount, alertCount, valeurStock, budgetCommande };
};

export default useStore;
