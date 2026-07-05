import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, LogOut, Users as UsersIcon, ExternalLink } from "lucide-react";
import { useAuth, roleLabel } from "./lib/auth";

export interface NavItem {
  key: string;
  label: string;
  icon: ReactNode;
  group: string;
}

export function AdminLayout({
  nav,
  active,
  onNavigate,
  children,
}: {
  nav: NavItem[];
  active: string;
  onNavigate: (key: string) => void;
  children: ReactNode;
}) {
  const { username, role, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = () => {
      fetch("/api/visitors")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive && d) setVisitors(d.active ?? 0); })
        .catch(() => {});
    };
    poll();
    const t = setInterval(poll, 20_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const groups = Array.from(new Set(nav.map((n) => n.group)));
  const activeLabel = nav.find((n) => n.key === active)?.label ?? "";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary font-black">U</div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Universal.sa</p>
          <p className="text-[11px] text-white/40">Administration</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/30">{group}</p>
            <div className="space-y-0.5">
              {nav.filter((n) => n.group === group).map((item) => (
                <button
                  key={item.key}
                  onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                    active === item.key
                      ? "bg-primary/15 font-semibold text-primary"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{username}</p>
            <p className="text-[11px] text-white/40">{roleLabel(role)}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/55 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#0d0d12] lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0d0d12] lg:hidden">
            {sidebar}
          </aside>
        </>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-white">{activeLabel}</h1>
          {visitors !== null && (
            <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              <span className="text-xs font-semibold text-green-400">{visitors}</span>
              <span className="hidden text-xs text-green-400/70 sm:inline">en ligne</span>
            </div>
          )}
          <a href={import.meta.env.BASE_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10">
            <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Voir le site</span>
          </a>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </div>

      {/* close icon for mobile when open handled by overlay; explicit button */}
      {mobileOpen && (
        <button onClick={() => setMobileOpen(false)} className="fixed right-4 top-4 z-[60] rounded-lg bg-white/10 p-2 text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
