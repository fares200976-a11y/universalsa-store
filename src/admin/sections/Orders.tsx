import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ShoppingCart, RefreshCw, Eye, Trash2, Phone, MapPin, Package, Truck,
  Calendar, User, CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { Order } from "../lib/types";

type StatusTone = "amber" | "blue" | "purple" | "green" | "red" | "neutral";

interface StatusDef {
  value: string;
  label: string;
  tone: StatusTone;
}

const STATUS_DEFS: StatusDef[] = [
  { value: "nouveau", label: "Nouveau", tone: "amber" },
  { value: "confirmé", label: "Confirmé", tone: "blue" },
  { value: "en préparation", label: "En préparation", tone: "purple" },
  { value: "expédié", label: "Expédié", tone: "blue" },
  { value: "livré", label: "Livré", tone: "green" },
  { value: "annulé", label: "Annulé", tone: "red" },
];

function statusDef(value: string): StatusDef {
  return STATUS_DEFS.find((s) => s.value === value) ?? { value, label: value, tone: "neutral" };
}

function StatusBadge({ status }: { status: string }) {
  const def = statusDef(status);
  return <Badge tone={def.tone}>{def.label}</Badge>;
}

const fmtDA = (n: number) => `${n.toLocaleString("fr-DZ")} DA`;
const fmtDate = (iso: string) => {
  try {
    return format(new Date(iso), "dd MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return iso;
  }
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/40">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
        <p className="mt-0.5 break-words text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

function OrderModal({
  order, onClose, onStatusChange,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}) {
  const open = !!order;
  return (
    <Modal open={open} onClose={onClose} title={order ? `Commande #${order.id}` : ""} size="lg">
      {order && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="text-xs text-white/40">{fmtDate(order.createdAt)}</span>
            </div>
            <Select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value)}
              className="w-48"
            >
              {STATUS_DEFS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <DetailRow icon={<User className="h-4 w-4" />} label="Client" value={`${order.prenom} ${order.nom}`} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={order.telephone} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Wilaya" value={order.wilaya} />
            <DetailRow icon={<Truck className="h-4 w-4" />} label="Mode de livraison" value={order.modeLivraison} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Adresse" value={order.adresse} />
            <DetailRow
              icon={<Package className="h-4 w-4" />}
              label="Produit"
              value={`${order.brand} ${order.modelName} (${order.type})`}
            />
            <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Prix tapis" value={fmtDA(order.prixTapis)} />
            <DetailRow icon={<Truck className="h-4 w-4" />} label="Prix livraison" value={fmtDA(order.prixLivraison)} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4">
            <span className="text-sm font-semibold text-white/70">Total</span>
            <span className="text-xl font-bold text-primary">{fmtDA(order.total)}</span>
          </div>

          <div className="flex justify-end pt-1">
            <GhostButton onClick={onClose}>Fermer</GhostButton>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function OrdersSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewing, setViewing] = useState<Order | null>(null);
  const [toDelete, setToDelete] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const data = await apiFetch<Order[]>("/orders", { token });
      setItems(data);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setForbidden(true);
      } else {
        notify.error(e instanceof Error ? e.message : "Échec du chargement des commandes");
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<Order>) =>
    setItems((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const changeStatus = async (id: number, status: string) => {
    const prev = items.find((o) => o.id === id);
    if (!prev || prev.status === status) return;
    patchLocal(id, { status });
    setViewing((v) => (v && v.id === id ? { ...v, status } : v));
    const ok = await notify.run(
      () => apiFetch(`/orders/${id}/status`, { method: "PATCH", body: { status }, token }),
      { success: "Statut mis à jour", error: "Échec de la mise à jour du statut" },
    );
    if (ok === null) {
      patchLocal(id, { status: prev.status });
      setViewing((v) => (v && v.id === id ? { ...v, status: prev.status } : v));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/orders/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Commande supprimée", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((o) => o.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((o) => {
      if (q && !`${o.prenom} ${o.nom} ${o.telephone}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  if (forbidden) {
    return (
      <div>
        <SectionHeader
          title="Commandes"
          description="Gérez les commandes clients"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <Panel className="p-2 sm:p-3">
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="Accès refusé"
            description="Vous n'avez pas les autorisations nécessaires pour consulter les commandes."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Commandes"
        description="Gérez les commandes clients"
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher (nom, prénom, téléphone)…" className="flex-1" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-52">
          <option value="all">Tous les statuts</option>
          {STATUS_DEFS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-7 w-7" />}
            title="Aucune commande"
            description={search || statusFilter !== "all" ? "Aucun résultat pour ces filtres." : "Les commandes apparaîtront ici."}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((o) => (
                <div key={o.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{o.prenom} {o.nom}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {o.telephone}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {o.wilaya}</span>
                      <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3" /> {o.modeLivraison}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {fmtDate(o.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-white/55">
                      <Package className="h-3 w-3 text-white/35" />
                      <span className="truncate">{o.brand} {o.modelName} · {o.type}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{fmtDA(o.total)}</p>
                  </div>

                  <Select
                    value={o.status}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                    className="w-40"
                  >
                    {STATUS_DEFS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>

                  <div className="flex items-center gap-1">
                    <IconButton icon={<Eye className="h-4 w-4" />} onClick={() => setViewing(o)} title="Détails" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(o)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <OrderModal order={viewing} onClose={() => setViewing(null)} onStatusChange={changeStatus} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement la commande #${toDelete.id} de ${toDelete.prenom} ${toDelete.nom} ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
