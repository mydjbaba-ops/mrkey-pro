import React, { useEffect, lazy, Suspense } from "react";
import { supabase } from "./supabase";
import { useStore } from "./store";
import { Header, BottomNav } from "./components/layout";
import { Toast } from "./components/ui";
import Auth, { ResetPassword } from "./pages/Auth";
import Invoice from "./pages/Invoice";
import UrlImport from "./pages/UrlImport";
import { KeyRound } from "lucide-react";

// Lazy load heavy pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Stock = lazy(() => import("./pages/Stock"));
const Aftermarket = lazy(() => import("./pages/Aftermarket"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Clients = lazy(() => import("./pages/Clients"));
const ClientDetail = lazy(() => import("./pages/ClientDetail"));
const Devis = lazy(() => import("./pages/Devis"));
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));

// Loading spinner for lazy pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center animate-pulse">
          <KeyRound className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm text-text-muted font-medium">Chargement...</p>
      </div>
    </div>
  );
}

// History modal for stock movements
function HistoryModal() {
  const { showHistory, setShowHistory, stock } = useStore();
  if (!showHistory) return null;

  const history = stock[showHistory]?.historique || [];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-end"
      onClick={() => setShowHistory(null)}
    >
      <div
        className="bg-surface-elevated rounded-t-3xl p-6 w-full max-h-[65vh] overflow-y-auto border-t border-border-strong shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-extrabold text-text-primary mb-4 tracking-tight">
          Historique des mouvements
        </h3>
        {history.length === 0 ? (
          <p className="text-text-secondary text-sm">Aucun mouvement enregistré</p>
        ) : (
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-border text-xs">
                <span className={`font-bold ${h.action.startsWith("+") ? "text-success-dark" : "text-danger"}`}>
                  {h.action}
                </span>
                <span className="text-text-muted">{h.date}</span>
                <span className="text-text-secondary font-semibold">→ {h.qty}</span>
              </div>
            ))}
          </div>
        )}
        <button
          className="w-full mt-4 py-3 bg-surface rounded-xl text-text-secondary font-bold text-sm"
          onClick={() => setShowHistory(null)}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const {
    user, authReady, page, toast,
    setUser, setAuthReady, loadFromSupabase,
    showUrlImport, factureUrl, showHistory,
  } = useStore();

  // Auth initialization
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      useStore.getState().setUser(session?.user ?? null);
      useStore.getState().setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!window.location.hash.includes("type=recovery")) {
        useStore.getState().setUser(session?.user ?? null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (!user) return;
    loadFromSupabase(user.id);
  }, [user]);

  // Reload on tab focus
  useEffect(() => {
    const reload = () => {
      const { user } = useStore.getState();
      if (user) loadFromSupabase(user.id);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Auto-persist to Supabase on data changes
  useEffect(() => {
    if (!user) return;
    const unsub = useStore.subscribe((state, prevState) => {
      if (!state.dataLoaded) return;
      const userId = state.user?.id;
      if (!userId) return;

      const checks = [
        ["products", "mrkey_products_v2"],
        ["stock", "mrkey_stock_v2"],
        ["clients", "mrkey_clients_v1"],
        ["interventions", "mrkey_interventions_v1"],
        ["devis", "mrkey_devis_v1"],
        ["settings", "mrkey_settings_v1"],
        ["customAftermarket", "mrkey_custom_am_v1"],
        ["oeLinksOverrides", "mrkey_oe_links_v1"],
      ];

      for (const [key, dbKey] of checks) {
        if (state[key] !== prevState[key]) {
          useStore.getState().saveToSupabase(userId, dbKey, state[key]);
        }
      }
    });
    return unsub;
  }, [user]);

  // Loading state
  if (!authReady) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-primary/30">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
      </div>
    );
  }

  // Password reset page
  if (window.location.hash.includes("type=recovery")) return <ResetPassword />;

  // Auth screen
  if (!user) return <Auth onAuth={(u) => useStore.getState().setUser(u)} />;

  const showNav = !["detail", "clientDetail"].includes(page);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div className="font-sans bg-surface text-text-primary min-h-screen max-w-[480px] mx-auto relative">
        {/* Toast */}
        <Toast message={toast?.msg} type={toast?.type} visible={!!toast} />

        {/* Header */}
        {showNav && <Header />}

        {/* Pages */}
        <Suspense fallback={<PageLoader />}>
          {page === "home" && <Home />}
          {page === "stock" && <Stock />}
          {page === "aftermarket" && <Aftermarket />}
          {page === "detail" && <ProductDetail />}
          {page === "clients" && <Clients />}
          {page === "clientDetail" && <ClientDetail />}
          {page === "devis" && <Devis />}
          {page === "stats" && <Stats />}
          {page === "settings" && <Settings />}
        </Suspense>

        {/* Bottom Nav */}
        {showNav && <BottomNav />}

        {/* Modals */}
        <HistoryModal />
        {factureUrl && <Invoice />}
        {showUrlImport && <UrlImport />}
      </div>
    </>
  );
}
