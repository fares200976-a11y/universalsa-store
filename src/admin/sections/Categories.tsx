import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FolderTree, Plus, Trash2, Pencil, Eye, EyeOff, RefreshCw,
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
import type { Category } from "../lib/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface CategoryForm {
  key: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  displayOrder: string;
  active: boolean;
}

function emptyForm(): CategoryForm {
  return { key: "", nameFr: "", nameEn: "", nameAr: "", displayOrder: "0", active: true };
}

function CategoryModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [keyTouched, setKeyTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        key: initial.key, nameFr: initial.nameFr, nameEn: initial.nameEn, nameAr: initial.nameAr,
        displayOrder: String(initial.displayOrder), active: initial.active,
      });
      setKeyTouched(true);
    } else {
      setForm(emptyForm());
      setKeyTouched(false);
    }
  }, [open, initial]);

  const setNameFr = (nameFr: string) => {
    setForm((f) => ({
      ...f,
      nameFr,
      key: keyTouched ? f.key : slugify(nameFr),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key.trim() || !form.nameFr.trim() || !form.nameEn.trim() || !form.nameAr.trim()) {
      notify.error("Clé et noms (FR/EN/AR) sont obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      key: form.key.trim(),
      nameFr: form.nameFr.trim(),
      nameEn: form.nameEn.trim(),
      nameAr: form.nameAr.trim(),
      displayOrder: parseInt(form.displayOrder || "0", 10),
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/categories/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/categories", { method: "POST", body: payload, token }),
      { success: initial ? "Catégorie mise à jour" : "Catégorie ajoutée", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier la catégorie" : "Nouvelle catégorie"} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Clé" value={form.key}
            onChange={(e) => { setKeyTouched(true); setForm((f) => ({ ...f, key: slugify(e.target.value) })); }}
            placeholder="ex: tapis-7d" />
          <TextInput label="Ordre d'affichage" inputMode="numeric" value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, "") }))} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <TextInput label="Nom (FR)" value={form.nameFr}
            onChange={(e) => setNameFr(e.target.value)}
            placeholder="Ex: Tapis 7D" />
          <TextInput label="Nom (EN)" value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            placeholder="Ex: 7D Mats" />
          <TextInput label="Nom (AR)" value={form.nameAr} dir="rtl"
            onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            placeholder="مثال: سجاد 7D" />
        </div>

        <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Active" />
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

export function CategoriesSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Category[]>("/categories/all", { token }), {
      error: "Échec du chargement des catégories",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<Category>) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const toggleActive = async (c: Category) => {
    const next = !c.active;
    patchLocal(c.id, { active: next });
    const ok = await notify.run(
      () => apiFetch(`/categories/${c.id}`, { method: "PATCH", body: { active: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(c.id, { active: c.active });
  };

  const changeOrder = async (c: Category, delta: number) => {
    const next = Math.max(0, c.displayOrder + delta);
    if (next === c.displayOrder) return;
    patchLocal(c.id, { displayOrder: next });
    const ok = await notify.run(
      () => apiFetch(`/categories/${c.id}`, { method: "PATCH", body: { displayOrder: next }, token }),
      { error: "Échec de la mise à jour de l'ordre" },
    );
    if (ok === null) patchLocal(c.id, { displayOrder: c.displayOrder });
    else load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/categories/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Catégorie supprimée", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (q && !`${c.key} ${c.nameFr} ${c.nameEn} ${c.nameAr}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "hidden" && c.active) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Catégories"
        description="Gérez les catégories de produits"
        icon={<FolderTree className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Ajouter
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une catégorie…" className="flex-1" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="hidden">Masquées</option>
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderTree className="h-7 w-7" />}
            title="Aucune catégorie"
            description="Ajoutez votre première catégorie pour commencer."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((c) => (
                <div key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{c.nameFr}</span>
                      <span className="truncate text-xs text-white/40">/{c.key}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                      <span>EN&nbsp;: {c.nameEn || "—"}</span>
                      <span dir="rtl">AR&nbsp;: {c.nameAr || "—"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={c.active ? "green" : "neutral"}>{c.active ? "Active" : "Masquée"}</Badge>
                      <Badge tone="neutral">Ordre {c.displayOrder}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <IconButton icon={<ChevronUp className="h-4 w-4" />} onClick={() => changeOrder(c, -1)} title="Monter" />
                    <IconButton icon={<ChevronDown className="h-4 w-4" />} onClick={() => changeOrder(c, 1)} title="Descendre" />
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={c.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => toggleActive(c)}
                      title={c.active ? "Masquer" : "Afficher"}
                      tone={c.active ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(c); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(c)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <CategoryModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement la catégorie « ${toDelete.nameFr} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
