import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Car, Plus, Trash2, Pencil, Eye, EyeOff, RefreshCw, Phone,
  Image as ImageIcon,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageField } from "../ui/ImageUpload";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, TextArea, Toggle, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { CarListing } from "../lib/types";

interface CarForm {
  title: string;
  description: string;
  price: string;
  contact: string;
  imagePath: string | null;
  active: boolean;
}

function emptyForm(): CarForm {
  return { title: "", description: "", price: "", contact: "", imagePath: null, active: true };
}

function CarModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: CarListing | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<CarForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? "",
        price: initial.price != null ? String(initial.price) : "",
        contact: initial.contact ?? "",
        imagePath: initial.imagePath,
        active: initial.active,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      notify.error("Le titre est obligatoire");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.price ? parseInt(form.price, 10) : null,
      contact: form.contact.trim() || null,
      imagePath: form.imagePath,
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/cars/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/cars", { method: "POST", body: payload, token }),
      { success: initial ? "Annonce mise à jour" : "Annonce ajoutée", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l'annonce" : "Nouvelle annonce"} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <TextInput label="Titre" value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Ex: Volkswagen Golf 7 — 2018" />

        <TextArea label="Description" value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="État, kilométrage, options…" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Prix (DA)" inputMode="numeric" value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))}
            placeholder="Optionnel" />
          <TextInput label="Contact" value={form.contact}
            onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
            placeholder="Téléphone ou WhatsApp" />
        </div>

        <ImageField label="Photo du véhicule" value={form.imagePath}
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

export function VoituresSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CarListing | null>(null);
  const [toDelete, setToDelete] = useState<CarListing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<CarListing[]>("/cars/all", { token }), {
      error: "Échec du chargement des annonces",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<CarListing>) =>
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const toggleActive = async (c: CarListing) => {
    const next = !c.active;
    patchLocal(c.id, { active: next });
    const ok = await notify.run(
      () => apiFetch(`/cars/${c.id}`, { method: "PATCH", body: { active: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(c.id, { active: c.active });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/cars/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Annonce supprimée", error: "Échec de la suppression" },
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
      if (q && !`${c.title} ${c.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "hidden" && c.active) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Voitures"
        description="Gérez les annonces de véhicules à vendre"
        icon={<Car className="h-5 w-5" />}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une annonce…" className="flex-1" />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">Tous les statuts</option>
          <option value="active">Visibles</option>
          <option value="hidden">Masquées</option>
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Car className="h-7 w-7" />}
            title="Aucune annonce"
            description="Ajoutez votre première annonce de véhicule."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((c) => (
                <div key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {c.imagePath ? (
                      <img src={c.imagePath} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-white/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{c.title}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {c.price != null && <Badge tone="amber">{c.price.toLocaleString("fr-DZ")} DA</Badge>}
                      {c.contact && <Badge tone="neutral"><Phone className="h-3 w-3" /> {c.contact}</Badge>}
                      {!c.active && <Badge tone="red">Masquée</Badge>}
                    </div>
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

      <CarModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement « ${toDelete.title} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
