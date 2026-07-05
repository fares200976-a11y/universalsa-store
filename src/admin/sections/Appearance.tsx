import { useEffect, useState, useCallback } from "react";
import {
  Palette, RefreshCw, Save, Eye, Layers, ArrowUp, ArrowDown, Film,
  ToggleRight, Image as ImageIcon, Car,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { ImageField } from "../ui/ImageUpload";
import { useAdminBrands } from "../lib/useAdminBrands";
import {
  Panel, SectionHeader, TextInput, Toggle, IconButton, PrimaryButton, FieldLabel,
} from "../ui/primitives";

const TEXT_KEYS = [
  "hero.title.fr", "hero.title.en", "hero.title.ar",
  "hero.subtitle.fr", "hero.subtitle.en", "hero.subtitle.ar",
  "hero.button.fr", "hero.button.en", "hero.button.ar",
  "hero.buttonLink", "heroVideoUrl",
] as const;

const SECTION_NAMES = [
  "hero", "stats", "highlights", "featured", "accessories", "voitures", "why", "brands", "reviews", "faq",
] as const;

const SECTION_LABELS: Record<string, string> = {
  hero: "Héro (bannière)",
  stats: "Statistiques",
  highlights: "Arrivages & Promotions",
  featured: "Produits en vedette",
  accessories: "Accessoires Auto",
  voitures: "Vente de voitures",
  why: "Pourquoi nous choisir",
  brands: "Marques partenaires",
  reviews: "Avis clients",
  faq: "Questions fréquentes (FAQ)",
};

const DEFAULT_ORDER = ["highlights", "featured", "accessories", "voitures", "why", "brands", "reviews", "faq"];

type Values = Record<string, string>;

export function AppearanceSection() {
  const { token } = useAuth();
  const { brands } = useAdminBrands();
  const [values, setValues] = useState<Values>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [carSales, setCarSales] = useState(true);
  const [showLogos, setShowLogos] = useState(true);
  const [hiddenLogos, setHiddenLogos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Record<string, string>>("/settings", { token }), {
      error: "Échec du chargement des paramètres",
    });
    if (data) {
      const next: Values = {};
      for (const k of TEXT_KEYS) next[k] = data[k] ?? "";
      setValues(next);

      const vis: Record<string, boolean> = {};
      for (const s of SECTION_NAMES) vis[s] = data[`section.${s}.visible`] !== "false";
      setVisibility(vis);

      let ord: string[] = DEFAULT_ORDER;
      try {
        if (data["home.blockOrder"]) {
          const parsed = JSON.parse(data["home.blockOrder"]);
          if (Array.isArray(parsed) && parsed.length) ord = parsed.map(String);
        }
      } catch { /* ignore */ }
      setOrder(ord);

      setCarSales(data["carSalesEnabled"] !== "false");
      setShowLogos(data["showBrandLogos"] !== "false");

      try {
        const arr = data["hiddenBrandLogos"] ? JSON.parse(data["hiddenBrandLogos"]) : [];
        if (Array.isArray(arr)) setHiddenLogos(new Set(arr.map(String)));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const set = (key: string, value: string) => setValues((p) => ({ ...p, [key]: value }));

  const move = (index: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleLogo = (id: string) => {
    setHiddenLogos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const payload: Record<string, string> = { ...values };
    for (const s of SECTION_NAMES) {
      payload[`section.${s}.visible`] = visibility[s] ? "true" : "false";
    }
    payload["home.blockOrder"] = JSON.stringify(order);
    payload["carSalesEnabled"] = carSales ? "true" : "false";
    payload["showBrandLogos"] = showLogos ? "true" : "false";
    payload["hiddenBrandLogos"] = JSON.stringify(Array.from(hiddenLogos));
    const res = await notify.run(
      () => apiFetch("/settings", { method: "PATCH", body: payload, token }),
      { success: "Apparence enregistrée", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) load();
  };

  if (loading) {
    return (
      <div>
        <SectionHeader title="Apparence" description="Personnalisez la page d'accueil et le site"
          icon={<Palette className="h-5 w-5" />} />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Apparence"
        description="Personnalisez la page d'accueil et le site"
        icon={<Palette className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <PrimaryButton onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer
            </PrimaryButton>
          </>
        }
      />

      <div className="space-y-4">
        {/* Héro */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Film className="h-4 w-4 text-primary" /> Héro (bannière d'accueil)
          </div>

          <ImageField label="Vidéo de fond" accept="video/*"
            value={values["heroVideoUrl"] || null}
            onChange={(url) => set("heroVideoUrl", url ?? "")} />

          <div className="mt-3">
            <TextInput label="URL de la vidéo (alternative)" value={values["heroVideoUrl"] ?? ""}
              onChange={(e) => set("heroVideoUrl", e.target.value)} placeholder="https://… .mp4" />
          </div>

          <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-wider text-white/40">
            Textes (laisser vide pour utiliser la traduction par défaut)
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput label="Titre (FR)" value={values["hero.title.fr"] ?? ""}
                onChange={(e) => set("hero.title.fr", e.target.value)} />
              <TextInput label="Titre (EN)" value={values["hero.title.en"] ?? ""}
                onChange={(e) => set("hero.title.en", e.target.value)} />
              <TextInput label="Titre (AR)" dir="rtl" value={values["hero.title.ar"] ?? ""}
                onChange={(e) => set("hero.title.ar", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput label="Sous-titre (FR)" value={values["hero.subtitle.fr"] ?? ""}
                onChange={(e) => set("hero.subtitle.fr", e.target.value)} />
              <TextInput label="Sous-titre (EN)" value={values["hero.subtitle.en"] ?? ""}
                onChange={(e) => set("hero.subtitle.en", e.target.value)} />
              <TextInput label="Sous-titre (AR)" dir="rtl" value={values["hero.subtitle.ar"] ?? ""}
                onChange={(e) => set("hero.subtitle.ar", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextInput label="Bouton (FR)" value={values["hero.button.fr"] ?? ""}
                onChange={(e) => set("hero.button.fr", e.target.value)} />
              <TextInput label="Bouton (EN)" value={values["hero.button.en"] ?? ""}
                onChange={(e) => set("hero.button.en", e.target.value)} />
              <TextInput label="Bouton (AR)" dir="rtl" value={values["hero.button.ar"] ?? ""}
                onChange={(e) => set("hero.button.ar", e.target.value)} />
            </div>
            <TextInput label="Lien du bouton" value={values["hero.buttonLink"] ?? ""}
              onChange={(e) => set("hero.buttonLink", e.target.value)} placeholder="/voitures, #produits…" />
          </div>
        </Panel>

        {/* Visibilité */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Eye className="h-4 w-4 text-primary" /> Visibilité des sections
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SECTION_NAMES.map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                <span className="text-sm text-white/80">{SECTION_LABELS[s]}</span>
                <Toggle checked={visibility[s] ?? true}
                  onChange={(v) => setVisibility((p) => ({ ...p, [s]: v }))} />
              </div>
            ))}
          </div>
        </Panel>

        {/* Ordre des blocs */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <Layers className="h-4 w-4 text-primary" /> Ordre des blocs
          </div>
          <div className="space-y-2">
            {order.map((s, i) => (
              <div key={s} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-xs font-bold text-white/60">
                  {i + 1}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-white/80">{SECTION_LABELS[s] ?? s}</span>
                <div className="flex items-center gap-1">
                  <IconButton icon={<ArrowUp className="h-4 w-4" />} onClick={() => move(i, -1)}
                    title="Monter" disabled={i === 0} />
                  <IconButton icon={<ArrowDown className="h-4 w-4" />} onClick={() => move(i, 1)}
                    title="Descendre" disabled={i === order.length - 1} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Modules */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <ToggleRight className="h-4 w-4 text-primary" /> Modules
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-white/80">
              <Car className="h-4 w-4 text-white/40" /> Vente de voitures (/voitures)
            </span>
            <Toggle checked={carSales} onChange={setCarSales} />
          </div>
        </Panel>

        {/* Logos des marques */}
        <Panel className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
            <ImageIcon className="h-4 w-4 text-primary" /> Logos des marques
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
            <span className="text-sm text-white/80">Afficher les logos des marques</span>
            <Toggle checked={showLogos} onChange={setShowLogos} />
          </div>
          {showLogos && (
            <>
              <FieldLabel>Masquer certaines marques</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {brands.map((b) => {
                  const visible = !hiddenLogos.has(b.id);
                  return (
                    <button key={b.id} type="button" onClick={() => toggleLogo(b.id)}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition-colors ${
                        visible
                          ? "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/10"
                          : "border-red-500/30 bg-red-500/10 text-red-300/70"
                      }`}>
                      <span className="truncate">{b.name}</span>
                      {visible ? <Eye className="h-4 w-4 flex-shrink-0" /> : <Eye className="h-4 w-4 flex-shrink-0 opacity-40" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Panel>

        <div className="flex justify-end">
          <PrimaryButton onClick={save} loading={saving}>
            <Save className="h-4 w-4" /> Enregistrer
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
