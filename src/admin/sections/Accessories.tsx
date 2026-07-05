import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Sparkles, Plus, Trash2, Pencil, Eye, EyeOff,
  RefreshCw, Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageField } from "../ui/ImageUpload";
import {
  Panel, SectionHeader, SearchInput, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, TextArea, Toggle, Modal, EmptyState, SkeletonRows,
  Pagination, usePagination,
} from "../ui/primitives";

interface Accessory {
  id: number;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  descriptionFr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  imagePath: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

interface AccessoryForm {
  nameFr: string;
  nameEn: string;
  nameAr: string;
  descriptionFr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: string;
  imagePath: string | null;
  sortOrder: string;
  active: boolean;
}

function emptyForm(): AccessoryForm {
  return {
    nameFr: "", nameEn: "", nameAr: "",
    descriptionFr: "", descriptionEn: "", descriptionAr: "",
    price: "0", imagePath: null, sortOrder: "0", active: true,
  };
}

function AccessoryModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: Accessory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<AccessoryForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        nameFr: initial.nameFr, nameEn: initial.nameEn, nameAr: initial.nameAr,
        descriptionFr: initial.descriptionFr, descriptionEn: initial.descriptionEn,
        descriptionAr: initial.descriptionAr, price: String(initial.price),
        imagePath: initial.imagePath, sortOrder: String(initial.sortOrder),
        active: initial.active,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameFr.trim()) {
      notify.error("Le nom (FR) est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      nameFr: form.nameFr.trim(),
      nameEn: form.nameEn.trim(),
      nameAr: form.nameAr.trim(),
      descriptionFr: form.descriptionFr.trim(),
      descriptionEn: form.descriptionEn.trim(),
      descriptionAr: form.descriptionAr.trim(),
      price: parseInt(form.price || "0", 10),
      imagePath: form.imagePath,
      sortOrder: parseInt(form.sortOrder || "0", 10),
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/accessories/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/accessories", { method: "POST", body: payload, token }),
      { success: initial ? "Accessoire mis à jour" : "Accessoire ajouté", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l'accessoire" : "Nouvel accessoire"} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextInput label="Nom (FR)" value={form.nameFr}
            onChange={(e) => setForm((f) => ({ ...f, nameFr: e.target.value }))}
            placeholder="Ex: Désodorisant, Volant…" />
          <TextInput label="Nom (EN)" value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
          <TextInput label="Nom (AR)" dir="rtl" value={form.nameAr}
            onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextArea label="Description (FR)" value={form.descriptionFr}
            onChange={(e) => setForm((f) => ({ ...f, descriptionFr: e.target.value }))} />
          <TextArea label="Description (EN)" value={form.descriptionEn}
            onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} />
          <TextArea label="Description (AR)" dir="rtl" value={form.descriptionAr}
            onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Prix (DA)" inputMode="numeric" value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))} />
          <TextInput label="Ordre d'affichage" inputMode="numeric" value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value.replace(/\D/g, "") }))} />
        </div>

        <ImageField label="Image de l'accessoire" value={form.imagePath}
          onChange={(url) => setForm((f) => ({ ...f, imagePath: url }))} />

        <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Visible" />
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

export function AccessoriesSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Accessory | null>(null);
  const [toDelete, setToDelete] = useState<Accessory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Accessory[]>("/accessories/all", { token }), {
      error: "Échec du chargement des accessoires",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<Accessory>) =>
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const toggleActive = async (a: Accessory) => {
    const next = !a.active;
    patchLocal(a.id, { active: next });
    const ok = await notify.run(
      () => apiFetch(`/accessories/${a.id}`, { method: "PATCH", body: { active: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(a.id, { active: a.active });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/accessories/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Accessoire supprimé", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((a) => a.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) =>
      `${a.nameFr} ${a.nameEn} ${a.nameAr}`.toLowerCase().includes(q));
  }, [items, search]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Accessoires Auto"
        description="Gérez les accessoires affichés sur la page d'accueil"
        icon={<Sparkles className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Ajouter
            </PrimaryButton>
          </>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un accessoire…" />
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="Aucun accessoire"
            description="Ajoutez votre premier accessoire auto pour l'afficher sur la page d'accueil."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((a) => (
                <div key={a.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {a.imagePath ? (
                      <img src={a.imagePath} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-white/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{a.nameFr}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {a.price > 0 && <Badge tone="amber">{a.price.toLocaleString("fr-DZ")} DA</Badge>}
                      <Badge tone="neutral">Ordre {a.sortOrder}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={a.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => toggleActive(a)}
                      title={a.active ? "Masquer" : "Afficher"}
                      tone={a.active ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(a); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(a)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <AccessoryModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement « ${toDelete.nameFr} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
