import React from "react";
import { Key, RefreshCw, LogOut } from "lucide-react";
import { useStore } from "../../store";
import { supabase, dbGetAll } from "../../supabase";

export default function Header() {
  const products = useStore((s) => s.products);
  const syncing = useStore((s) => s.syncing);
  const user = useStore((s) => s.user);
  const showToast = useStore((s) => s.showToast);
  const loadFromSupabase = useStore((s) => s.loadFromSupabase);
  const setUser = useStore((s) => s.setUser);

  const handleSync = async () => {
    if (!user || syncing) return;
    try {
      await loadFromSupabase(user.id);
      showToast("Sync OK", "success");
    } catch {
      showToast("Erreur de sync", "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-3">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-lg shadow-primary/25">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold tracking-tight text-text-primary">
                MrKey
              </span>
              <span className="gradient-text text-lg font-extrabold tracking-tight">
                Pro
              </span>
            </div>
            <p className="text-xs font-medium text-text-muted">
              {products?.length || 0} produit{(products?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-text-secondary transition-all hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-danger/40 hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Déco</span>
          </button>
        </div>
      </div>
    </header>
  );
}
