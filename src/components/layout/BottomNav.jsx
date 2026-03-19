import React from "react";
import { Home, Package, KeyRound, Users, BarChart3, Settings } from "lucide-react";
import { useStore } from "../../store";

const tabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "stock", label: "Stock", icon: Package },
  { id: "aftermarket", label: "Aftermkt", icon: KeyRound },
  { id: "clients", label: "Clients", icon: Users },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "settings", label: "Réglages", icon: Settings },
];

export default function BottomNav() {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const alertCount = useStore((s) => s.statsData?.alertCount || 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="mx-auto flex max-w-[480px] items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {tabs.map((tab) => {
          const isActive = page === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === "stock" && alertCount > 0;

          return (
            <button
              key={tab.id}
              onClick={() => setPage(tab.id)}
              className="flex flex-1 flex-col items-center gap-0.5 border-none bg-transparent py-2"
            >
              {/* Icon container */}
              <div className="relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                    isActive
                      ? "gradient-primary shadow-md shadow-primary/30"
                      : ""
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${
                      isActive ? "text-white" : "text-text-secondary"
                    }`}
                  />
                </div>

                {/* Alert badge */}
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-primary" : "text-text-secondary"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
