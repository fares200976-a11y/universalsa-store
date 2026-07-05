import { useEffect, useState, useCallback, useMemo } from "react";
import {
  FileText, Plus, Trash2, Pencil, Eye, EyeOff, RefreshCw, ChevronDown, Search,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageField } from "../ui/ImageUpload";
import { MarkdownEditor } from "../ui/MarkdownEditor";
import {
  Panel, SectionHeader, SearchInput, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, TextArea, Toggle, Modal, EmptyState, SkeletonRows,
  Pagination, usePagination, FieldLabel,
} from "../ui/primitives";
import type { ContentPage } from "../lib/types";

type Lang = "fr" | "en" | "ar";

const LANG_TABS: { value: Lang; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface PageForm {
  slug: string;
  titleFr: string;
  titleEn: string;
  titleAr: string;
  bodyFr: string;
  bodyEn: string;
  bodyAr: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  published: boolean;
}

function emptyForm(): PageForm {
  return {
    slug: "", titleFr: "", titleEn: "", titleAr: "",
    bodyFr: "", bodyEn: "", bodyAr: "",
    seoTitle: "", seoDescription: "", seoKeywords: "", ogImage: "",
    published: false,
  };
}

function PageModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: ContentPage | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [form, setForm] = useState<PageForm>(emptyForm());
  const [lang, setLang] = useState<Lang>("fr");
  const [seoOpen, setSeoOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLang("fr");
    setSeoOpen(false);
    if (initial) {
      setForm({
        slug: initial.slug, titleFr: initial.titleFr, titleEn: initial.titleEn,
        titleAr: initial.titleAr, bodyFr: initial.bodyFr, bodyEn: initial.bodyEn,
        bodyAr: initial.bodyAr, seoTitle: initial.seoTitle, seoDescription: initial.seoDescription,
        seoKeywords: initial.seoKeywords, ogImage: initial.ogImage, published: initial.published,
      });
      setSlugTouched(true);
    } else {
      setForm(emptyForm());
      setSlugTouched(false);
    }
  }, [open, initial]);

  const setTitleFr = (value: string) => {
    setForm((f) => ({
      ...f,
      titleFr: value,
      slug: !initial && !slugTouched ? slugify(value) : f.slug,
    }));
  };

  const titleKey = `title${lang.charAt(0).toUpperCase()}${lang.slice(1)}` as "titleFr" | "titleEn" | "titleAr";
  const bodyKey = `body${lang.charAt(0).toUpperCase()}${lang.slice(1)}` as "bodyFr" | "bodyEn" | "bodyAr";
  const isAr = lang === "ar";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.titleFr.trim()) {
      notify.error("Le slug et le titre (FR) sont obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      titleFr: form.titleFr.trim(),
      titleEn: form.titleEn.trim(),
      titleAr: form.titleAr.trim(),
      bodyFr: form.bodyFr,
      bodyEn: form.bodyEn,
      bodyAr: form.bodyAr,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      seoKeywords: form.seoKeywords.trim(),
      ogImage: form.ogImage,
      published: form.published,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/pages/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/pages", { method: "POST", body: payload, token }),
      { success: initial ? "Page mise à jour" : "Page créée", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier la page" : "Nouvelle page"} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <TextInput
          label="Slug (URL)"
          value={form.slug}
          onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
          placeholder="ex: a-propos, conditions-generales"
        />

        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {LANG_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setLang(t.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                lang === t.value ? "bg-primary text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <TextInput
          label={`Titre (${lang.toUpperCase()})`}
          value={form[titleKey]}
          onChange={(e) =>
            lang === "fr"
              ? setTitleFr(e.target.value)
              : setForm((f) => ({ ...f, [titleKey]: e.target.value }))
          }
          dir={isAr ? "rtl" : undefined}
          placeholder="Titre de la page"
        />
        <MarkdownEditor
          label={`Contenu (${lang.toUpperCase()})`}
          value={form[bodyKey]}
          onChange={(value) => setForm((f) => ({ ...f, [bodyKey]: value }))}
          dir={isAr ? "rtl" : undefined}
          rows={12}
          placeholder="Contenu de la page…"
        />

        <div className="rounded-xl border border-white/10 bg-white/[0.03]">
          <button
            type="button"
            onClick={() => setSeoOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-white/80"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-white/40" /> SEO &amp; partage
            </span>
            <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${seoOpen ? "rotate-180" : ""}`} />
          </button>
          {seoOpen && (
            <div className="space-y-4 border-t border-white/10 p-4">
              <TextInput
                label="Titre SEO"
                value={form.seoTitle}
                onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                placeholder="Titre affiché dans les moteurs de recherche"
              />
              <TextArea
                label="Description SEO"
                value={form.seoDescription}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                placeholder="Résumé court (150-160 caractères)"
              />
              <TextInput
                label="Mots-clés"
                value={form.seoKeywords}
                onChange={(e) => setForm((f) => ({ ...f, seoKeywords: e.target.value }))}
                placeholder="mot1, mot2, mot3"
              />
              <ImageField
                label="Image de partage (Open Graph)"
                value={form.ogImage || null}
                onChange={(url) => setForm((f) => ({ ...f, ogImage: url ?? "" }))}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <Toggle checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} label="Publiée" />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <GhostButton onClick={onClose}>Annuler</GhostButton>
          <PrimaryButton type="submit" loading={saving}>
            {initial ? "Enregistrer" : "Créer"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

export function PagesSection() {
  const { token } = useAuth();
  const [items, setItems] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [toDelete, setToDelete] = useState<ContentPage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<ContentPage[]>("/pages/all", { token }), {
      error: "Échec du chargement des pages",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id: number, patch: Partial<ContentPage>) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const togglePublished = async (p: ContentPage) => {
    const next = !p.published;
    patchLocal(p.id, { published: next });
    const ok = await notify.run(
      () => apiFetch(`/pages/${p.id}`, { method: "PATCH", body: { published: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(p.id, { published: p.published });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/pages/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Page supprimée", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => `${p.titleFr} ${p.slug}`.toLowerCase().includes(q));
  }, [items, search]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Pages"
        description="Gérez les pages de contenu et leur référencement"
        icon={<FileText className="h-5 w-5" />}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une page…" className="flex-1" />
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-7 w-7" />}
            title="Aucune page"
            description="Créez votre première page de contenu pour commencer."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((p) => (
                <div key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <FileText className="h-5 w-5 text-white/20" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{p.titleFr || "(sans titre)"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="truncate font-mono text-xs text-white/40">/{p.slug}</span>
                      <Badge tone={p.published ? "green" : "neutral"}>{p.published ? "Publié" : "Brouillon"}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={p.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => togglePublished(p)}
                      title={p.published ? "Dépublier" : "Publier"}
                      tone={p.published ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(p); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(p)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <PageModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement la page « ${toDelete.titleFr || toDelete.slug} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
