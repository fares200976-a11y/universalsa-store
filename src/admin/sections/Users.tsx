import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users, Plus, Trash2, Pencil, RefreshCw, ShieldCheck, ShieldAlert, User,
} from "lucide-react";
import { apiFetch, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, Toggle, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { StaffMember } from "../lib/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  employe: "Employé",
  "gérant": "Gérant",
};

function roleLabelOf(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

const ROLE_TONES: Record<string, "primary" | "blue" | "neutral" | "amber"> = {
  super_admin: "primary",
  admin: "blue",
  employe: "neutral",
  "gérant": "amber",
};

interface UserForm {
  username: string;
  password: string;
  role: string;
  active: boolean;
}

function UserModal({
  open, initial, roles, onClose, onSaved,
}: {
  open: boolean;
  initial: StaffMember | null;
  roles: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<UserForm>({ username: "", password: "", role: "employe", active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({ username: initial.username, password: "", role: initial.role, active: initial.active });
    } else {
      setForm({ username: "", password: "", role: roles[0] ?? "employe", active: true });
    }
  }, [open, initial, roles]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial && (!form.username.trim() || !form.password.trim())) {
      notify.error("Nom d'utilisateur et mot de passe requis");
      return;
    }
    setSaving(true);
    let res: unknown;
    if (initial) {
      const payload: Record<string, unknown> = { role: form.role, active: form.active };
      if (form.password.trim()) payload.password = form.password.trim();
      res = await notify.run(
        () => apiFetch(`/staff/${initial.id}`, { method: "PATCH", body: payload, token }),
        { success: "Utilisateur mis à jour", error: "Échec de l'enregistrement" },
      );
    } else {
      res = await notify.run(
        () => apiFetch("/staff", {
          method: "POST",
          body: { username: form.username.trim(), password: form.password.trim(), role: form.role },
          token,
        }),
        { success: "Utilisateur ajouté", error: "Échec de l'enregistrement" },
      );
    }
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l'utilisateur" : "Nouvel utilisateur"} size="md">
      <form onSubmit={submit} className="space-y-4">
        <TextInput label="Nom d'utilisateur" value={form.username}
          disabled={!!initial}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          placeholder="ex: vendeur1" />

        <TextInput label={initial ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
          type="password" value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder={initial ? "Laisser vide pour conserver" : "••••••••"} />

        <Select label="Rôle" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          {roles.map((r) => (
            <option key={r} value={r}>{roleLabelOf(r)}</option>
          ))}
        </Select>

        {initial && (
          <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Compte actif" />
          </div>
        )}

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

export function UsersSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [toDelete, setToDelete] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const [staff, roleList] = await Promise.all([
        apiFetch<StaffMember[]>("/staff", { token }),
        apiFetch<string[]>("/roles", { token }),
      ]);
      setItems(staff);
      setRoles(roleList);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setForbidden(true);
      } else {
        notify.error(e instanceof Error ? e.message : "Échec du chargement");
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/staff/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Utilisateur supprimé", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((u) => u.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((u) => !q || `${u.username} ${roleLabelOf(u.role)}`.toLowerCase().includes(q));
  }, [items, search]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  if (forbidden) {
    return (
      <div>
        <SectionHeader
          title="Utilisateurs"
          description="Gérez le personnel et les rôles"
          icon={<Users className="h-5 w-5" />}
        />
        <Panel className="p-2 sm:p-3">
          <EmptyState
            icon={<ShieldAlert className="h-7 w-7" />}
            title="Accès réservé au Super Admin"
            description="Vous n'avez pas les permissions nécessaires pour gérer les utilisateurs."
          />
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Utilisateurs"
        description="Gérez le personnel et les rôles"
        icon={<Users className="h-5 w-5" />}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" />
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={5} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Aucun utilisateur"
            description="Ajoutez votre premier membre du personnel."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((u) => (
                <div key={u.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/40">
                    {u.role === "super_admin" ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{u.username}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={ROLE_TONES[u.role] ?? "neutral"}>{roleLabelOf(u.role)}</Badge>
                      {u.active ? <Badge tone="green">Actif</Badge> : <Badge tone="red">Inactif</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(u); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(u)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <UserModal open={modalOpen} initial={editing} roles={roles} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement l'utilisateur « ${toDelete.username} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
