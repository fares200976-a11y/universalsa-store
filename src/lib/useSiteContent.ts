import { useEffect, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

export type Settings = Record<string, string>;

/**
 * Sanitize an admin-entered URL before rendering it into a public `<a href>`.
 * Internal paths ("/...") pass through; otherwise only http(s)/mailto/tel
 * schemes are allowed, blocking `javascript:` and other unsafe schemes.
 * Returns "" when the value is unsafe so callers can skip rendering the link.
 */
export function safeUrl(raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  try {
    const u = new URL(v);
    if (["http:", "https:", "mailto:", "tel:"].includes(u.protocol)) return v;
  } catch {
    /* not an absolute URL */
  }
  return "";
}

let cache: Settings | null = null;
let inflight: Promise<Settings> | null = null;
const subscribers = new Set<(s: Settings) => void>();

function fetchSettings(): Promise<Settings> {
  if (inflight) return inflight;
  inflight = fetch("/api/settings")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: Settings) => {
      cache = d;
      subscribers.forEach((fn) => fn(d));
      return d;
    })
    .catch(() => {
      const empty: Settings = {};
      cache = empty;
      return empty;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Shared, cached site settings map (one network request per page load). */
export function useSettingsMap(): Settings {
  const [settings, setSettings] = useState<Settings>(cache ?? {});
  useEffect(() => {
    let alive = true;
    const update = (s: Settings) => {
      if (alive) setSettings(s);
    };
    subscribers.add(update);
    if (cache) setSettings(cache);
    else fetchSettings();
    return () => {
      alive = false;
      subscribers.delete(update);
    };
  }, []);
  return settings;
}

/**
 * Language-aware accessor over the admin-managed site settings. All helpers
 * fall back gracefully so the storefront keeps working before settings load
 * or when a key has never been configured.
 */
export function useSiteContent() {
  const settings = useSettingsMap();
  const { lang } = useLang();

  const get = (key: string, fallback = "") => {
    const v = settings[key];
    return v === undefined || v === "" ? fallback : v;
  };

  const bool = (key: string, def = true) => {
    const v = settings[key];
    if (v === undefined) return def;
    return v !== "false";
  };

  /** Read a per-language override, e.g. tr("hero.title") -> "hero.title.<lang>". */
  const tr = (base: string, fallback = "") => {
    const v = settings[`${base}.${lang}`];
    return v === undefined || v === "" ? fallback : v;
  };

  const sectionVisible = (name: string) => bool(`section.${name}.visible`, true);

  /**
   * Returns the homepage block order, reconciled against the known defaults:
   * unknown saved keys are dropped and newly-added blocks are appended so the
   * page never loses a section after a code update.
   */
  const blockOrder = (def: string[]) => {
    try {
      const arr = JSON.parse(settings["home.blockOrder"] || "[]");
      if (Array.isArray(arr) && arr.length) {
        const merged = arr.map(String).filter((n) => def.includes(n));
        for (const d of def) if (!merged.includes(d)) merged.push(d);
        return merged;
      }
    } catch {
      /* ignore malformed value */
    }
    return def;
  };

  return { settings, get, bool, tr, sectionVisible, blockOrder, lang };
}
