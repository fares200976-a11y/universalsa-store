import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Package, Plus, Trash2, Copy, Pencil, Eye, EyeOff, Boxes,
  RefreshCw, CheckCircle2, XCircle, Sparkles, Tag, Star, Image as ImageIcon,
  FileSpreadsheet, Upload,
} from "lucide-react";
import { useAdminBrands } from "../lib/useAdminBrands";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { ImageField } from "../ui/ImageUpload";
import {
  Panel, SectionHeader, SearchInput, Select, Badge, IconButton, PrimaryButton,
  GhostButton, TextInput, Toggle, Modal, EmptyState, SkeletonRows, Pagination, usePagination,
} from "../ui/primitives";
import type { Product } from "../lib/types";

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

const TYPE_LABELS: Record<string, string> = {
  both: "7D + 5D", "7d": "7D", "5d": "5D", arriere: "Arrière",
};
const TYPE_OPTIONS = [
  { value: "both", label: "7D + 5D" },
  { value: "7d", label: "7D" },
  { value: "5d", label: "5D" },
  { value: "arriere", label: "Arrière" },
];

function StockInput({ product, onSaved }: { product: Product; onSaved: (stock: number) => void }) {
  const { token } = useAuth();
  const [value, setValue] = useState(String(product.stock ?? 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (val: number) => {
    setSaving(true);
    const ok = await notify.run(
      () => apiFetch(`/products/${product.id}`, { method: "PATCH", body: { stock: val }, token }),
      { error: "Échec de la mise à jour du stock" },
    );
    setSaving(false);
    if (ok !== null) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      onSaved(val);
    }
  }, [product.id, token, onSaved]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setValue(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(parseInt(raw || "0", 10)), 600);
  };

  const n = parseInt(value || "0", 10);
  const color = n === 0
    ? "text-red-400 border-red-500/40 bg-red-500/10"
    : n <= 3 ? "text-amber-400 border-amber-500/40 bg-amber-500/10"
    : "text-green-400 border-green-500/40 bg-green-500/10";

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${color}`}>
        <Boxes className="h-3 w-3 flex-shrink-0" />
        <input type="text" inputMode="numeric" value={value} onChange={handle}
          className="w-8 bg-transparent text-center text-xs font-bold focus:outline-none" title="Stock" />
      </div>
      {saving && <RefreshCw className="h-3 w-3 animate-spin text-white/30" />}
      {saved && <CheckCircle2 className="h-3 w-3 text-green-400" />}
    </div>
  );
}

function PriceInput({ product, onSaved }: { product: Product; onSaved: (price: number) => void }) {
  const { token } = useAuth();
  const [value, setValue] = useState(String(product.price ?? 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (val: number) => {
    setSaving(true);
    const ok = await notify.run(
      () => apiFetch(`/products/${product.id}`, { method: "PATCH", body: { price: val }, token }),
      { error: "Échec de la mise à jour du prix" },
    );
    setSaving(false);
    if (ok !== null) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      onSaved(val);
    }
  }, [product.id, token, onSaved]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setValue(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(parseInt(raw || "0", 10)), 600);
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-amber-300">
        <input type="text" inputMode="numeric" value={value} onChange={handle}
          className="w-14 bg-transparent text-right text-xs font-bold focus:outline-none" title="Prix (DA)" />
        <span className="text-[10px] font-semibold text-amber-300/70">DA</span>
      </div>
      {saving && <RefreshCw className="h-3 w-3 animate-spin text-white/30" />}
      {saved && <CheckCircle2 className="h-3 w-3 text-green-400" />}
    </div>
  );
}

interface ProductForm {
  brand: string;
  brandName: string;
  modelName: string;
  price: string;
  type: string;
  stock: string;
  imagePath: string | null;
  isNew: boolean;
  isPromo: boolean;
  isFeatured: boolean;
  active: boolean;
}

function emptyForm(): ProductForm {
  return {
    brand: "", brandName: "", modelName: "", price: "9500", type: "both",
    stock: "0", imagePath: null, isNew: false, isPromo: false, isFeatured: false, active: true,
  };
}

function ProductModal({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const { brands } = useAdminBrands();
  const [form, setForm] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        brand: initial.brand, brandName: initial.brandName, modelName: initial.modelName,
        price: String(initial.price), type: initial.type, stock: String(initial.stock),
        imagePath: initial.imagePath, isNew: initial.isNew, isPromo: initial.isPromo,
        isFeatured: initial.isFeatured, active: initial.active,
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const setBrand = (slug: string) => {
    const b = brands.find((x) => x.id === slug);
    setForm((f) => ({ ...f, brand: slug, brandName: b?.name ?? f.brandName }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.modelName.trim()) {
      notify.error("Marque et modèle sont obligatoires");
      return;
    }
    setSaving(true);
    const payload = {
      brand: form.brand,
      brandName: form.brandName || form.brand,
      modelName: form.modelName.trim(),
      price: parseInt(form.price || "0", 10),
      type: form.type,
      stock: parseInt(form.stock || "0", 10),
      imagePath: form.imagePath,
      isNew: form.isNew,
      isPromo: form.isPromo,
      isFeatured: form.isFeatured,
      active: form.active,
    };
    const res = await notify.run(
      () =>
        initial
          ? apiFetch(`/products/${initial.id}`, { method: "PATCH", body: payload, token })
          : apiFetch("/products", { method: "POST", body: payload, token }),
      { success: initial ? "Produit mis à jour" : "Produit ajouté", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier le produit" : "Nouveau produit"} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Marque" value={form.brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">— Choisir —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <TextInput label="Modèle" value={form.modelName}
            onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
            placeholder="Ex: Clio 4, Symbol…" />
          <TextInput label="Prix (DA)" inputMode="numeric" value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))} />
          <TextInput label="Stock" inputMode="numeric" value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value.replace(/\D/g, "") }))} />
          <Select label="Type" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        <ImageField label="Image du produit" value={form.imagePath}
          onChange={(url) => setForm((f) => ({ ...f, imagePath: url }))} />

        <div className="flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <Toggle checked={form.isNew} onChange={(v) => setForm((f) => ({ ...f, isNew: v }))} label="Nouveau" />
          <Toggle checked={form.isPromo} onChange={(v) => setForm((f) => ({ ...f, isPromo: v }))} label="Promo" />
          <Toggle checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="En vedette" />
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

export function ProductsSection() {
  const { token } = useAuth();
  const { brands: brandOptions, reload: reloadBrands } = useAdminBrands();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const importTypeRef = useRef<"7d" | "5d">("7d");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Product[]>("/products", { token }), {
      error: "Échec du chargement des produits",
    });
    if (data) setItems(data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const exportExcel = useCallback(() => {
    if (items.length === 0) {
      notify.error("Aucun produit à exporter");
      return;
    }
    const yesNo = (v: boolean) => (v ? "Oui" : "Non");
    const buildRows = (predicate: (p: Product) => boolean) =>
      items
        .filter(predicate)
        .sort((a, b) =>
          a.brandName.localeCompare(b.brandName, "fr") ||
          a.modelName.localeCompare(b.modelName, "fr"))
        .map((p, i) => ({
          "N°": i + 1,
          Marque: p.brandName,
          Modèle: p.modelName,
          Type: TYPE_LABELS[p.type] ?? p.type,
          "Prix (DA)": p.price,
          Stock: p.stock,
          Nouveau: yesNo(p.isNew),
          Promo: yesNo(p.isPromo),
          Vedette: yesNo(p.isFeatured),
          Visible: yesNo(p.active),
        }));

    const rows7d = buildRows((p) => p.type === "7d");
    const rows5d = buildRows((p) => p.type === "5d");

    if (rows7d.length === 0 && rows5d.length === 0) {
      notify.error("Aucun produit 7D ou 5D à exporter");
      return;
    }

    const wb = XLSX.utils.book_new();
    const colWidths = [
      { wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 10 },
      { wch: 12 }, { wch: 8 }, { wch: 9 }, { wch: 8 }, { wch: 9 }, { wch: 9 },
    ];
    if (rows7d.length) {
      const ws = XLSX.utils.json_to_sheet(rows7d);
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Tapis 7D");
    }
    if (rows5d.length) {
      const ws = XLSX.utils.json_to_sheet(rows5d);
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, "Tapis 5D");
    }
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `produits-7d-5d-${date}.xlsx`);
    notify.success("Fichier Excel téléchargé");
  }, [items]);

  const triggerImport = (type: "7d" | "5d") => {
    importTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const pick = (row: Record<string, unknown>, keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k.toLowerCase());
      if (found && row[found] != null && String(row[found]).trim() !== "") {
        return String(row[found]).trim();
      }
    }
    return "";
  };

  const toBool = (v: string, fallback: boolean): boolean => {
    const s = v.trim().toLowerCase();
    if (!s) return fallback;
    return ["oui", "yes", "true", "1", "vrai", "نعم"].includes(s);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const type = importTypeRef.current;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) {
        notify.error("Fichier Excel vide ou illisible");
        return;
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) {
        notify.error("Aucune ligne à importer");
        return;
      }

      const brandSlugByName = new Map(
        brandOptions.map((b) => [b.name.trim().toLowerCase(), b.id]),
      );
      const existsKey = new Set(
        items.map((p) => `${p.brand}|${p.modelName.trim().toLowerCase()}|${p.type}`),
      );

      let created = 0, skipped = 0, failed = 0;
      for (const row of rows) {
        const brandName = pick(row, ["Marque", "Brand", "marque"]);
        const modelName = pick(row, ["Modèle", "Modele", "Model", "modèle"]);
        if (!brandName || !modelName) { skipped++; continue; }

        const slug = brandSlugByName.get(brandName.toLowerCase()) || slugify(brandName);
        const key = `${slug}|${modelName.toLowerCase()}|${type}`;
        if (existsKey.has(key)) { skipped++; continue; }

        const priceStr = pick(row, ["Prix (DA)", "Prix", "Price"]).replace(/[^\d]/g, "");
        const stockStr = pick(row, ["Stock", "Quantité", "Qte"]).replace(/[^\d]/g, "");
        const payload = {
          brand: slug,
          brandName,
          modelName,
          price: parseInt(priceStr || "0", 10),
          type,
          stock: parseInt(stockStr || "0", 10),
          imagePath: null,
          isNew: toBool(pick(row, ["Nouveau", "New"]), false),
          isPromo: toBool(pick(row, ["Promo"]), false),
          isFeatured: toBool(pick(row, ["Vedette", "Featured"]), false),
          active: toBool(pick(row, ["Visible", "Actif", "Active"]), true),
        };

        const res = await apiFetch("/products", { method: "POST", body: payload, token }).catch(() => null);
        if (res === null) { failed++; } else { created++; existsKey.add(key); }
      }

      if (created > 0) {
        notify.success(
          `Import ${type.toUpperCase()} terminé : ${created} ajouté(s)` +
          `${skipped ? `, ${skipped} ignoré(s)` : ""}${failed ? `, ${failed} échec(s)` : ""}`,
        );
        await Promise.all([load(), reloadBrands()]);
      } else {
        notify.error(
          `Aucun produit ajouté` +
          `${skipped ? ` — ${skipped} ligne(s) ignorée(s) (doublons ou incomplètes)` : ""}` +
          `${failed ? ` — ${failed} échec(s)` : ""}`,
        );
      }
    } catch {
      notify.error("Échec de la lecture du fichier Excel");
    } finally {
      setImporting(false);
    }
  };

  const patchLocal = (id: number, patch: Partial<Product>) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const toggleField = async (p: Product, field: "active" | "isNew" | "isPromo" | "isFeatured") => {
    const next = !p[field];
    patchLocal(p.id, { [field]: next });
    const ok = await notify.run(
      () => apiFetch(`/products/${p.id}`, { method: "PATCH", body: { [field]: next }, token }),
      { error: "Échec de la mise à jour" },
    );
    if (ok === null) patchLocal(p.id, { [field]: p[field] });
  };

  const duplicate = async (p: Product) => {
    const payload = {
      brand: p.brand, brandName: p.brandName, modelName: `${p.modelName} (copie)`,
      price: p.price, type: p.type, stock: p.stock, imagePath: p.imagePath,
      isNew: p.isNew, isPromo: p.isPromo, isFeatured: p.isFeatured, active: p.active,
    };
    const res = await notify.run(
      () => apiFetch("/products", { method: "POST", body: payload, token }),
      { success: "Produit dupliqué", error: "Échec de la duplication" },
    );
    if (res !== null) load();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const ok = await notify.run(
      () => apiFetch(`/products/${toDelete.id}`, { method: "DELETE", token }),
      { success: "Produit supprimé", error: "Échec de la suppression" },
    );
    setDeleting(false);
    if (ok !== null) {
      setItems((prev) => prev.filter((p) => p.id !== toDelete.id));
      setToDelete(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (q && !`${p.brandName} ${p.modelName}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "hidden" && p.active) return false;
      if (statusFilter === "featured" && !p.isFeatured) return false;
      if (statusFilter === "promo" && !p.isPromo) return false;
      if (statusFilter === "out" && p.stock > 0) return false;
      return true;
    });
  }, [items, search, typeFilter, statusFilter]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 10);

  return (
    <div>
      <SectionHeader
        title="Produits"
        description="Gérez votre catalogue de tapis"
        icon={<Package className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <GhostButton onClick={exportExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Export Excel (7D/5D)
            </GhostButton>
            <GhostButton onClick={() => triggerImport("7d")} disabled={importing}>
              <Upload className="h-4 w-4" /> Importer 7D
            </GhostButton>
            <GhostButton onClick={() => triggerImport("5d")} disabled={importing}>
              <Upload className="h-4 w-4" /> Importer 5D
            </GhostButton>
            <PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Ajouter
            </PrimaryButton>
          </>
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleImportFile}
        className="hidden"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un produit…" className="flex-1" />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-40">
          <option value="all">Tous les types</option>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
          <option value="all">Tous les statuts</option>
          <option value="active">Visibles</option>
          <option value="hidden">Masqués</option>
          <option value="featured">En vedette</option>
          <option value="promo">En promo</option>
          <option value="out">Rupture de stock</option>
        </Select>
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={6} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Package className="h-7 w-7" />}
            title="Aucun produit"
            description="Ajoutez votre premier produit pour commencer."
            action={<PrimaryButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Ajouter</PrimaryButton>}
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((p) => (
                <div key={p.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    {p.imagePath ? (
                      <img src={p.imagePath} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-white/20" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{p.brandName}</span>
                      <span className="truncate text-sm text-white/50">{p.modelName}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone="neutral">{TYPE_LABELS[p.type] ?? p.type}</Badge>
                      {p.isNew && <Badge tone="blue"><Sparkles className="h-3 w-3" /> Nouveau</Badge>}
                      {p.isPromo && <Badge tone="red"><Tag className="h-3 w-3" /> Promo</Badge>}
                      {p.isFeatured && <Badge tone="amber"><Star className="h-3 w-3" /> Vedette</Badge>}
                    </div>
                  </div>

                  <PriceInput product={p} onSaved={(price) => patchLocal(p.id, { price })} />
                  <StockInput product={p} onSaved={(stock) => patchLocal(p.id, { stock })} />

                  <div className="flex items-center gap-1">
                    <IconButton
                      icon={p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      onClick={() => toggleField(p, "active")}
                      title={p.active ? "Masquer" : "Afficher"}
                      tone={p.active ? "primary" : "neutral"}
                    />
                    <IconButton icon={<Star className="h-4 w-4" />} onClick={() => toggleField(p, "isFeatured")}
                      title="En vedette" tone={p.isFeatured ? "primary" : "neutral"} />
                    <IconButton icon={<Pencil className="h-4 w-4" />}
                      onClick={() => { setEditing(p); setModalOpen(true); }} title="Modifier" />
                    <IconButton icon={<Copy className="h-4 w-4" />} onClick={() => duplicate(p)} title="Dupliquer" />
                    <IconButton icon={<Trash2 className="h-4 w-4" />} onClick={() => setToDelete(p)} title="Supprimer" tone="danger" />
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>

      <ProductModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!toDelete}
        message={toDelete ? `Supprimer définitivement « ${toDelete.brandName} ${toDelete.modelName} » ?` : ""}
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
