import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Image as ImageIcon, Film, File as FileIcon, Trash2, Link2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageUploadButton } from "../ui/ImageUpload";
import {
  Panel, SectionHeader, SearchInput, Select, IconButton, GhostButton,
  EmptyState, SkeletonRows, formatBytes,
} from "../ui/primitives";
import type { MediaItem } from "../lib/types";

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return iso;
  }
}

export function MediaSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");

  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<MediaItem[]>("/media", { token }), {
      error: "Échec du chargement des médias",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const copyLink = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      notify.success("Lien copié");
    } catch {
      notify.error("Impossible de copier le lien");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/media/${encodeURIComponent(toDelete.name)}`, { method: "DELETE", token }),
      { success: "Fichier supprimé", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((m) => m.name !== toDelete.name));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      if (kindFilter !== "all" && m.kind !== kindFilter) return false;
      return true;
    });
  }, [items, search, kindFilter]);

  return (
    <div>
      <SectionHeader
        title="Médiathèque"
        description="Gérez vos images et vidéos"
        icon={<ImageIcon className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <ImageUploadButton label="Image" accept="image/*" onUploaded={() => load()} />
            <ImageUploadButton label="Vidéo" accept="video/*" onUploaded={() => load()} />
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un fichier…" className="flex-1" />
        <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="sm:w-44">
          <option value="all">Tous</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
        </Select>
      </div>

      <Panel className="p-3 sm:p-4">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-7 w-7" />}
            title="Aucun fichier"
            description="Envoyez une image ou une vidéo pour commencer."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((m) => (
              <div key={m.name}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black/40">
                  {m.kind === "image" ? (
                    <img src={m.url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : m.kind === "video" ? (
                    <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <FileIcon className="h-10 w-10 text-white/20" />
                  )}
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-black/60 px-1.5 py-1 text-[10px] font-semibold text-white/70">
                    {m.kind === "image" ? <ImageIcon className="h-3 w-3" /> : m.kind === "video" ? <Film className="h-3 w-3" /> : <FileIcon className="h-3 w-3" />}
                    {m.kind === "image" ? "Image" : m.kind === "video" ? "Vidéo" : "Fichier"}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <p className="truncate text-sm font-semibold text-white" title={m.name}>{m.name}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-white/40">
                    <span>{formatBytes(m.size)}</span>
                    <span>{formatDate(m.mtime)}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <GhostButton onClick={() => copyLink(m)} className="flex-1 !px-2.5 !py-1.5 !text-xs">
                      <Link2 className="h-3.5 w-3.5" /> Copier le lien
                    </GhostButton>
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(m)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement « ${toDelete.name} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
