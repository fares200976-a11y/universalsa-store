import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, RefreshCw, Phone, MapPin, ShoppingBag, Wallet, Calendar, ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, StatCard,
  EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { Customer } from "../lib/types";

const fmtDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;
const fmtDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: fr });
  } catch {
    return iso;
  }
};

type SortKey = "totalSpent" | "orderCount" | "lastOrderAt";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "totalSpent", label: "CA dépensé" },
  { value: "orderCount", label: "Nombre de commandes" },
  { value: "lastOrderAt", label: "Dernière commande" },
];

export function CustomersSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const data = await apiFetch<Customer[]>("/customers", { token });
      setItems(data);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setForbidden(true);
      } else {
        notify.error(e instanceof Error ? e.message : "Échec du chargement des clients");
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = useMemo(
    () => items.reduce((sum, c) => sum + (c.totalSpent ?? 0), 0),
    [items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = items.filter((c) => {
      if (!q) return true;
      return `${c.prenom} ${c.nom} ${c.telephone} ${c.wilaya}`.toLowerCase().includes(q);
    });
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "lastOrderAt") {
        return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
      }
      return (b[sortKey] ?? 0) - (a[sortKey] ?? 0);
    });
    return sorted;
  }, [items, search, sortKey]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  if (forbidden) {
    return (
      <div>
        <SectionHeader
          title="Clients"
          description="Vos clients et leur historique"
          icon={<Users className="h-5 w-5" />}
        />
        <Panel className="p-2 sm:p-3">
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Accès refusé"
            description="Vous n'avez pas les autorisations nécessaires pour consulter les clients."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Clients"
        description="Vos clients et leur historique"
        icon={<Users className="h-5 w-5" />}
        actions={
          <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          label="Total clients"
          value={loading ? "—" : items.length.toLocaleString("fr-DZ")}
          icon={<Users className="h-5 w-5" />}
          tone="primary"
        />
        <StatCard
          label="CA cumulé"
          value={loading ? "—" : fmtDA(totalRevenue)}
          icon={<Wallet className="h-5 w-5" />}
          tone="green"
        />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (nom, téléphone, wilaya)…" className="flex-1" />
        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="sm:w-56">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Trier : {o.label}</option>)}
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Aucun client"
            description={search ? "Aucun résultat pour cette recherche." : "Les clients apparaîtront ici dès la première commande."}
          />
        ) : (
          <>
            <div className="hidden items-center gap-3 px-3 py-2 text-xs font-medium uppercase tracking-wider text-white/35 sm:flex">
              <span className="flex-1">Client</span>
              <button
                onClick={() => setSortKey("orderCount")}
                className={`inline-flex w-24 items-center justify-end gap-1 hover:text-white/60 ${sortKey === "orderCount" ? "text-primary" : ""}`}
              >
                Commandes <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSortKey("totalSpent")}
                className={`inline-flex w-32 items-center justify-end gap-1 hover:text-white/60 ${sortKey === "totalSpent" ? "text-primary" : ""}`}
              >
                Total <ArrowUpDown className="h-3 w-3" />
              </button>
              <button
                onClick={() => setSortKey("lastOrderAt")}
                className={`inline-flex w-32 items-center justify-end gap-1 hover:text-white/60 ${sortKey === "lastOrderAt" ? "text-primary" : ""}`}
              >
                Dernière <ArrowUpDown className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {paged.map((c) => (
                <div key={c.telephone}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{c.prenom} {c.nom}</span>
                      <Badge tone="neutral"><MapPin className="h-3 w-3" /> {c.wilaya}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {c.telephone}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(c.lastOrderAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:w-24 sm:justify-end">
                    <Badge tone="blue"><ShoppingBag className="h-3 w-3" /> {c.orderCount}</Badge>
                  </div>

                  <div className="text-right sm:w-32">
                    <p className="text-sm font-bold text-primary">{fmtDA(c.totalSpent)}</p>
                  </div>

                  <div className="hidden text-right text-xs text-white/45 sm:block sm:w-32">
                    {fmtDate(c.lastOrderAt)}
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>
    </div>
  );
}
