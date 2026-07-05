import { useEffect, useState } from "react";

/** Fallback WhatsApp number used if the admin hasn't configured one yet. */
const DEFAULT_WHATSAPP = "213553494318";

export type WhatsappRole = "gerant" | "vendeur" | "livreur";

export interface WhatsappNumbers {
  gerant: string;
  vendeur: string;
  livreur: string;
}

/**
 * Normalize an Algerian phone number into the wa.me international format
 * (digits only, country code 213, no leading 0 or +).
 */
export function normalizeDzWhatsapp(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return "213" + digits.slice(1);
  return digits;
}

/**
 * Returns the WhatsApp number that should RECEIVE orders, based on the
 * numbers + active role configured in the admin (site_settings keys
 * "whatsappNumbers" JSON and "whatsappActiveRole"). Falls back to the
 * default owner number when nothing is configured.
 */
export function useOrderWhatsapp(): string {
  const [number, setNumber] = useState<string>(DEFAULT_WHATSAPP);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        let nums: Partial<WhatsappNumbers> = {};
        try {
          if (data["whatsappNumbers"]) nums = JSON.parse(data["whatsappNumbers"]);
        } catch { /* ignore malformed value */ }
        const role = (data["whatsappActiveRole"] as WhatsappRole) || "gerant";
        const picked = normalizeDzWhatsapp(nums[role] || "");
        if (picked) setNumber(picked);
      })
      .catch(() => {});
  }, []);

  return number;
}

/**
 * Returns whether brand/car logos should be shown on the public site
 * (site_settings key "showBrandLogos"). Defaults to true.
 */
export function useShowBrandLogos(): boolean {
  const [show, setShow] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        if (data["showBrandLogos"] === "false") setShow(false);
      })
      .catch(() => {});
  }, []);

  return show;
}

/**
 * Returns a predicate telling whether a given brand's logo should be shown.
 * A logo is visible when the global toggle is on (site_settings key
 * "showBrandLogos") AND the brand id is not in the per-brand hidden list
 * (site_settings key "hiddenBrandLogos", a JSON array of brand ids).
 */
export function useBrandLogoVisible(): (brandId: string) => boolean {
  const [globalShow, setGlobalShow] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/settings")
      .then(r => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        if (data["showBrandLogos"] === "false") setGlobalShow(false);
        try {
          const arr = data["hiddenBrandLogos"] ? JSON.parse(data["hiddenBrandLogos"]) : [];
          if (Array.isArray(arr)) setHidden(new Set(arr.map(String)));
        } catch { /* ignore malformed value */ }
      })
      .catch(() => {});
  }, []);

  return (brandId: string) => globalShow && !hidden.has(brandId);
}
