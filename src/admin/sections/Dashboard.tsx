import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  LayoutDashboard, RefreshCw, Wallet, ShoppingCart, Package, Users as UsersIcon,
  TrendingUp,
} from "lucide-react";
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import {
  Panel, SectionHeader, Badge, IconButton, StatCard, SkeletonRows, EmptyState,
} from "../ui/primitives";
import type { Order, Product } from "../lib/types";

const CANCELLED = "annulé";

const STATUS_TONES: Record<string, "amber" | "blue" | "purple" | "green" | "red" | "neutral"> = {
  nouveau: "amber",
  confirmé: "blue",
  "en préparation": "purple",
  expédié: "blue",
  livré: "green",
  annulé: "red",
};

const STATUS_COLORS: Record<string, string> = {
  nouveau: "#f59e0b",
  confirmé: "#3b82f6",
  "en préparation": "#a855f7",
  expédié: "#06b6d4",
  livré: "#22c55e",
  annulé: "#ef4444",
};

const PRIMARY = "#ef4444";
const ACCENTS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#a855f7", "#06b6d4"];

const fmtDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;

const tooltipStyle = {
  backgroundColor: "#15151d",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "#fff",
};

function ChartPanel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      {children}
    </Panel>
  );
}

export function DashboardSection() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [visitors, setVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [ord, prod, vis] = await Promise.all([
      notify.run(() => apiFetch<Order[]>("/orders", { token }), { error: "Échec du chargement des commandes" }),
      notify.run(() => apiFetch<Product[]>("/products", { token }), { error: "Échec du chargement des produits" }),
      notify.run(() => apiFetch<{ active: number }>("/visitors", { token }), {}),
    ]);
    if (ord) setOrders(ord);
    if (prod) setProducts(prod);
    if (vis) setVisitors(vis.active ?? 0);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== CANCELLED).reduce((s, o) => s + (o.total ?? 0), 0),
    [orders],
  );
  const activeProducts = useMemo(() => products.filter((p) => p.active).length, [products]);

  const revenueByDay = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 13);
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const dayOrders = orders.filter(
        (o) => o.status !== CANCELLED && isSameDay(new Date(o.createdAt), day),
      );
      return {
        date: format(day, "dd MMM", { locale: fr }),
        revenue: dayOrders.reduce((s, o) => s + (o.total ?? 0), 0),
        commandes: dayOrders.length,
      };
    });
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status, (map.get(o.status) ?? 0) + 1);
    return Array.from(map.entries()).map(([status, count]) => ({
      status,
      count,
      color: STATUS_COLORS[status] ?? "#64748b",
    }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const key = `${o.brand} ${o.modelName}`.trim();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 7), [orders]);

  return (
    <div>
      <SectionHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires"
          value={loading ? "—" : fmtDA(totalRevenue)}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
          hint="Hors commandes annulées"
        />
        <StatCard
          label="Commandes"
          value={loading ? "—" : orders.length.toLocaleString("fr-DZ")}
          icon={<ShoppingCart className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="Produits actifs"
          value={loading ? "—" : activeProducts.toLocaleString("fr-DZ")}
          icon={<Package className="h-5 w-5" />}
          tone="blue"
          hint={`${products.length} au total`}
        />
        <StatCard
          label="Visiteurs en ligne"
          value={loading ? "—" : visitors.toLocaleString("fr-DZ")}
          icon={<UsersIcon className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      {loading ? (
        <Panel className="p-4">
          <SkeletonRows rows={6} />
        </Panel>
      ) : orders.length === 0 ? (
        <Panel className="p-2 sm:p-3">
          <EmptyState
            icon={<LayoutDashboard className="h-7 w-7" />}
            title="Pas encore de données"
            description="Les statistiques s'afficheront dès la première commande."
          />
        </Panel>
      ) : (
        <div className="space-y-4">
          <ChartPanel title="Chiffre d'affaires — 14 derniers jours" icon={<TrendingUp className="h-4 w-4" />}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueByDay} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} width={56}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(v: number) => [fmtDA(v), "CA"]} />
                <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2}
                  fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartPanel title="Commandes par statut" icon={<ShoppingCart className="h-4 w-4" />}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                    outerRadius={90} innerRadius={50} paddingAngle={2}>
                    {ordersByStatus.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n) => [v, n]} />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Top produits" icon={<Package className="h-4 w-4" />}>
              {topProducts.length === 0 ? (
                <div className="py-16 text-center text-sm text-white/40">Aucune donnée</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={10}
                      width={120} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      formatter={(v: number) => [v, "Commandes"]} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {topProducts.map((_, i) => (
                        <Cell key={i} fill={ACCENTS[i % ACCENTS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartPanel>
          </div>

          <ChartPanel title="Commandes récentes" icon={<ShoppingCart className="h-4 w-4" />}>
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-white/40">Aucune commande</div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((o) => (
                  <div key={o.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{o.prenom} {o.nom}</p>
                      <p className="truncate text-xs text-white/45">{o.brand} {o.modelName} · {o.wilaya}</p>
                    </div>
                    <Badge tone={STATUS_TONES[o.status] ?? "neutral"}>{o.status}</Badge>
                    <span className="text-sm font-bold text-primary">{fmtDA(o.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartPanel>
        </div>
      )}
    </div>
  );
}
