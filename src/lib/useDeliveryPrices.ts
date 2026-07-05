import { useEffect, useState } from "react";
import { wilayas, type Wilaya } from "./wilayas";

export interface DeliveryOverride {
  domicile?: number;
  bureau?: number;
}

/**
 * Returns the wilayas list with delivery prices overridden by the values
 * saved in the admin (site_settings key "deliveryPrices", a JSON map of
 * wilaya code -> { domicile, bureau }). Falls back to the static defaults
 * from wilayas.ts. Legacy single-number entries are ignored so the up-to-date
 * tariffs always show until the owner re-saves in the new format.
 */
export function useDeliveryWilayas(): Wilaya[] {
  const [overrides, setOverrides] = useState<Record<string, DeliveryOverride> | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        const raw = data["deliveryPrices"];
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const clean: Record<string, DeliveryOverride> = {};
          for (const [code, val] of Object.entries(parsed)) {
            if (val && typeof val === "object") {
              const o = val as DeliveryOverride;
              clean[code] = {
                domicile: typeof o.domicile === "number" ? o.domicile : undefined,
                bureau: typeof o.bureau === "number" ? o.bureau : undefined,
              };
            }
          }
          setOverrides(clean);
        } catch {
          /* ignore malformed value */
        }
      })
      .catch(() => {});
  }, []);

  if (!overrides) return wilayas;
  return wilayas.map(w => {
    const o = overrides[String(w.code)];
    if (!o) return w;
    return {
      ...w,
      domicile: typeof o.domicile === "number" && !Number.isNaN(o.domicile) ? o.domicile : w.domicile,
      bureau: typeof o.bureau === "number" && !Number.isNaN(o.bureau) ? o.bureau : w.bureau,
    };
  });
}
