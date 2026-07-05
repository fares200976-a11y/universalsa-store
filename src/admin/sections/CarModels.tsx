import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Car, Plus, Trash2, Pencil, Eye, EyeOff, RefreshCw,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, Toggle, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { Brand, CarModel } from "../lib/types";

interface CarModelForm {
  brandId: string;
  name: string;
  displayOrder: string;
  active: boolean;
}

function emptyForm(): CarModelForm {
  return { brandId: "", name: "", displayOrder: "0", active: true };
}

function CarModelModal({
  open, initial, brands, onClose, onSaved,
}: {
  open: boolean;
  initial: CarModel | null;
  brands: Brand[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<CarModelForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        brandId: String(initial.brandId), name: initial.name,
        displayOrder: String(initial.displayOrder), active: initial.active,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brandId || !form.name.trim()) {
      notify.error("Marque et nom sont obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      brandId: parseInt(form.brandId, 10),
      name: form.name.trim(),
      displayOrder: parseInt(form.displayOrder || "0", 10),
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/car-models/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/car-models", { method: "POST", body: payload, token }),
      { success: initial ? "Modèle mis à jour" : "Modèle ajouté", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier le modèle" : "Nouveau modèle"} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Marque" value={form.brandId} onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}>
            <option value="">— Choisir —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <TextInput label="Nom du modèle" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Golf 8, Clio 4…" />
          <TextInput label="Ordre d'affichage" inputMode="numeric" value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, "") }))} />
        </div>

        <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Actif" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={onClose}>Annuler</GhostButton>
          <PrimaryButton type="submit" loading={saving}>
            {initial ? "Enregistrer" : "Ajouter"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

export function CarModelsSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CarModel | null>(null);
  const [toDelete, setToDelete] = useState<CarModel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadBrands = useCallback(async () => {
    const data = await notify.run(() => apiFetch<Brand[]>("/brands/all", { token }), {
      error: "Échec du chargement des marques",
    });
    if (data) setBrands(data);
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<CarModel[]>("/car-models/all", { token }), {
      error: "Échec du chargement des modèles",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { loadBrands(); }, [loadBrands]);
  useEffect(() => { load(); }, [load]);

  const brandName = useCallback(
    (id: number) => brands.find((b) => b.id === id)?.name ?? `#${id}`,
    [brands],
  );

  const patchLocal = (id: number, patch: Partial<CarModel>) =>
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const toggleActive = async (m: CarModel) => {
    const next = !m.active;
    patchLocal(m.id, { active: next });
    const ok = await notify.run(
      () => apiFetch(`/car-models/${m.id}`, { method: "PATCH", body: { active: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(m.id, { active: m.active });
  };

  const changeOrder = async (m: CarModel, delta: number) => {
    const next = Math.max(0, m.displayOrder + delta);
    if (next === m.displayOrder) return;
    patchLocal(m.id, { displayOrder: next });
    const ok = await notify.run(
      () => apiFetch(`/car-models/${m.id}`, { method: "PATCH", body: { displayOrder: next }, token }),
      { error: "Échec de la mise à jour de l'ordre" },
    );
    if (ok === null) patchLocal(m.id, { displayOrder: m.displayOrder });
    else load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/car-models/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Modèle supprimé", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((m) => m.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (q && !`${m.name} ${brandName(m.brandId)}`.toLowerCase().includes(q)) return false;
      if (brandFilter !== "all" && String(m.brandId) !== brandFilter) return false;
      if (statusFilter === "active" && !m.active) return false;
      if (statusFilter === "hidden" && m.active) return false;
      return true;
    });
  }, [items, search, brandFilter, statusFilter, brandName]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Modèles de voitures"
        description="Gérez les modèles par marque"
        icon={<Car className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={() => { loadBrands(); load(); }} title="Actualiser" />
            <PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Ajouter
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un modèle…" className="flex-1" />
        <Select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="sm:w-44">
          <option value="all">Toutes les marques</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="hidden">Masqués</option>
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Car className="h-7 w-7" />}
            title="Aucun modèle"
            description="Ajoutez votre premier modèle pour commencer."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((m) => (
                <div key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{m.name}</span>
                      <span className="truncate text-sm text-white/50">{brandName(m.brandId)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={m.active ? "green" : "neutral"}>{m.active ? "Actif" : "Masqué"}</Badge>
                      <Badge tone="neutral">Ordre {m.displayOrder}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <IconButton icon={<ChevronUp className="h-4 w-4" />} onClick={() => changeOrder(m, -1)} title="Monter" />
                    <IconButton icon={<ChevronDown className="h-4 w-4" />} onClick={() => changeOrder(m, 1)} title="Descendre" />
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={m.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => toggleActive(m)}
                      title={m.active ? "Masquer" : "Afficher"}
                      tone={m.active ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(m); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(m)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <CarModelModal open={modalOpen} initial={editing} brands={brands} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement le modèle « ${toDelete.name} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
