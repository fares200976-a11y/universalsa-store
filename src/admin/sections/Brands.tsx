import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Tags, Plus, Trash2, Pencil, Eye, EyeOff, RefreshCw,
  ChevronUp, ChevronDown, Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageField } from "../ui/ImageUpload";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, Toggle, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { Brand } from "../lib/types";

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

interface BrandForm {
  name: string;
  slug: string;
  logoPath: string | null;
  displayOrder: string;
  active: boolean;
}

function emptyForm(): BrandForm {
  return { name: "", slug: "", logoPath: null, displayOrder: "0", active: true };
}

function BrandModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: Brand | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<BrandForm>(emptyForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name, slug: initial.slug, logoPath: initial.logoPath,
        displayOrder: String(initial.displayOrder), active: initial.active,
      });
      setSlugTouched(true);
    } else {
      setForm(emptyForm());
      setSlugTouched(false);
    }
  }, [open, initial]);

  const setName = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      notify.error("Nom et slug sont obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      logoPath: form.logoPath,
      displayOrder: parseInt(form.displayOrder || "0", 10),
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/brands/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/brands", { method: "POST", body: payload, token }),
      { success: initial ? "Marque mise à jour" : "Marque ajoutée", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier la marque" : "Nouvelle marque"} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Nom" value={form.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Volkswagen" />
          <TextInput label="Slug" value={form.slug}
            onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
            placeholder="ex: volkswagen" />
          <TextInput label="Ordre d'affichage" inputMode="numeric" value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value.replace(/\D/g, "") }))} />
        </div>

        <ImageField label="Logo de la marque" value={form.logoPath}
          onChange={(url) => setForm((f) => ({ ...f, logoPath: url }))} aspect="aspect-video" />

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

export function BrandsSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [toDelete, setToDelete] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Brand[]>("/brands/all", { token }), {
      error: "Échec du chargement des marques",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<Brand>) =>
    setItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const toggleActive = async (b: Brand) => {
    const next = !b.active;
    patchLocal(b.id, { active: next });
    const ok = await notify.run(
      () => apiFetch(`/brands/${b.id}`, { method: "PATCH", body: { active: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(b.id, { active: b.active });
  };

  const changeOrder = async (b: Brand, delta: number) => {
    const next = Math.max(0, b.displayOrder + delta);
    if (next === b.displayOrder) return;
    patchLocal(b.id, { displayOrder: next });
    const ok = await notify.run(
      () => apiFetch(`/brands/${b.id}`, { method: "PATCH", body: { displayOrder: next }, token }),
      { error: "Échec de la mise à jour de l'ordre" },
    );
    if (ok === null) patchLocal(b.id, { displayOrder: b.displayOrder });
    else load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/brands/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Marque supprimée", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((b) => b.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((b) => {
      if (q && !`${b.name} ${b.slug}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "active" && !b.active) return false;
      if (statusFilter === "hidden" && b.active) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Marques"
        description="Gérez les marques de véhicules"
        icon={<Tags className="h-5 w-5" />}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une marque…" className="flex-1" />
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
            icon={<Tags className="h-7 w-7" />}
            title="Aucune marque"
            description="Ajoutez votre première marque pour commencer."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((b) => (
                <div key={b.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {b.logoPath ? (
                      <img src={b.logoPath} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-white/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{b.name}</span>
                      <span className="truncate text-xs text-white/40">/{b.slug}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={b.active ? "green" : "neutral"}>{b.active ? "Active" : "Masquée"}</Badge>
                      <Badge tone="neutral">Ordre {b.displayOrder}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <IconButton icon={<ChevronUp className="h-4 w-4" />} onClick={() => changeOrder(b, -1)} title="Monter" />
                    <IconButton icon={<ChevronDown className="h-4 w-4" />} onClick={() => changeOrder(b, 1)} title="Descendre" />
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => toggleActive(b)}
                      title={b.active ? "Masquer" : "Afficher"}
                      tone={b.active ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(b); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(b)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <BrandModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement la marque « ${toDelete.name} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
