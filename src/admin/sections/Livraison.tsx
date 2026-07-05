import { useEffect, useState, useCallback, useMemo } from "react";
import { Truck, RefreshCw, Save, Wand2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "../ui/notify";
import { wilayas } from "@/lib/wilayas";
import {
  Panel, SectionHeader, SearchInput, IconButton, PrimaryButton, GhostButton,
  TextInput, EmptyState, SkeletonRows, Pagination, usePagination, FieldLabel,
} from "../ui/primitives";

interface PriceEntry {
  domicile: string;
  bureau: string;
}

export function LivraisonSection() {
  const { token } = useAuth();
  const [prices, setPrices] = useState<Record<string, PriceEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [bulkDomicile, setBulkDomicile] = useState("");
  const [bulkBureau, setBulkBureau] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notify.run(() => apiFetch<Record<string, string>>("/settings", { token }), {
      error: "Échec du chargement des tarifs",
    });
    const map: Record<string, PriceEntry> = {};
    for (const w of wilayas) {
      map[String(w.code)] = { domicile: String(w.domicile), bureau: String(w.bureau) };
    }
    if (data && data["deliveryPrices"]) {
      try {
        const parsed = JSON.parse(data["deliveryPrices"]) as Record<string, unknown>;
        for (const [code, val] of Object.entries(parsed)) {
          if (val && typeof val === "object") {
            const o = val as { domicile?: number; bureau?: number };
            map[code] = {
              domicile: typeof o.domicile === "number" ? String(o.domicile) : (map[code]?.domicile ?? ""),
              bureau: typeof o.bureau === "number" ? String(o.bureau) : (map[code]?.bureau ?? ""),
            };
          }
        }
      } catch {
        /* ignore malformed value */
      }
    }
    setPrices(map);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setEntry = (code: string, field: keyof PriceEntry, value: string) => {
    const clean = value.replace(/\D/g, "");
    setPrices((prev) => ({ ...prev, [code]: { ...prev[code], [field]: clean } }));
  };

  const applyBulk = (mode: "empty" | "all") => {
    if (!bulkDomicile && !bulkBureau) {
      notify.error("Renseignez au moins un prix par défaut");
      return;
    }
    setPrices((prev) => {
      const next: Record<string, PriceEntry> = {};
      for (const w of wilayas) {
        const code = String(w.code);
        const cur = prev[code] ?? { domicile: "", bureau: "" };
        next[code] = {
          domicile: bulkDomicile && (mode === "all" || !cur.domicile) ? bulkDomicile : cur.domicile,
          bureau: bulkBureau && (mode === "all" || !cur.bureau) ? bulkBureau : cur.bureau,
        };
      }
      return next;
    });
    notify.info(mode === "all" ? "Tous les tarifs ont été remplis" : "Les tarifs vides ont été remplis");
  };

  const save = async () => {
    setSaving(true);
    const map: Record<string, { domicile: number; bureau: number }> = {};
    for (const w of wilayas) {
      const code = String(w.code);
      const e = prices[code];
      if (!e) continue;
      map[code] = {
        domicile: parseInt(e.domicile || "0", 10),
        bureau: parseInt(e.bureau || "0", 10),
      };
    }
    const res = await notify.run(
      () => apiFetch("/settings", { method: "PATCH", body: { deliveryPrices: JSON.stringify(map) }, token }),
      { success: "Tarifs de livraison enregistrés", error: "Échec de l'enregistrement" },
    );
    setSaving(false);
    if (res !== null) load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wilayas.filter((w) => !q || `${w.code} ${w.name}`.toLowerCase().includes(q));
  }, [search]);

  const { paged, page, setPage, pageCount, total } = usePagination(filtered, 12);

  return (
    <div>
      <SectionHeader
        title="Livraison"
        description="Tarifs de livraison par wilaya (domicile / bureau)"
        icon={<Truck className="h-5 w-5" />}
        actions={
          <>
            <IconButton icon={<RefreshCw className="h-4 w-4" />} onClick={load} title="Actualiser" />
            <PrimaryButton onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer
            </PrimaryButton>
          </>
        }
      />

      <Panel className="mb-4 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
          <Wand2 className="h-4 w-4 text-primary" /> Prix par défaut
        </div>
        <p className="mb-3 text-xs text-white/40">Appliquez un tarif à toutes les wilayas ou seulement à celles non renseignées.</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <TextInput label="Domicile (DA)" inputMode="numeric" value={bulkDomicile} className="sm:w-40"
            onChange={(e) => setBulkDomicile(e.target.value.replace(/\D/g, ""))} />
          <TextInput label="Bureau (DA)" inputMode="numeric" value={bulkBureau} className="sm:w-40"
            onChange={(e) => setBulkBureau(e.target.value.replace(/\D/g, ""))} />
          <div className="flex gap-2">
            <GhostButton onClick={() => applyBulk("empty")}>Remplir les vides</GhostButton>
            <GhostButton onClick={() => applyBulk("all")}>Tout remplacer</GhostButton>
          </div>
        </div>
      </Panel>

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une wilaya…" />
      </div>

      <Panel className="p-2 sm:p-3">
        {loading ? (
          <SkeletonRows rows={8} className="p-2" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-7 w-7" />}
            title="Aucune wilaya"
            description="Aucune wilaya ne correspond à votre recherche."
          />
        ) : (
          <>
            <div className="space-y-2">
              {paged.map((w) => {
                const code = String(w.code);
                const e = prices[code] ?? { domicile: "", bureau: "" };
                return (
                  <div key={w.code}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-2.5">
                    <div className="flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-xs font-bold text-white/60">
                      {String(w.code).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold text-white">{w.name}</span>
                    </div>
                    <div className="w-28">
                      <FieldLabel>Domicile</FieldLabel>
                      <input type="text" inputMode="numeric" value={e.domicile}
                        onChange={(ev) => setEntry(code, "domicile", ev.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 transition-colors focus:border-primary/50 focus:outline-none" />
                    </div>
                    <div className="w-28">
                      <FieldLabel>Bureau</FieldLabel>
                      <input type="text" inputMode="numeric" value={e.bureau}
                        onChange={(ev) => setEntry(code, "bureau", ev.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 transition-colors focus:border-primary/50 focus:outline-none" />
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
          </>
        )}
      </Panel>
    </div>
  );
}
