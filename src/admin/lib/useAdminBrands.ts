import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "./api";
import { useAuth } from "./auth";
import type { Brand, Product } from "./types";

export interface AdminBrandOption {
  id: string; // slug — what gets stored on product.brand
  name: string;
}

/**
 * Brand options for admin selectors (product modal, brand-logo controls).
 * Unions admin-managed brand entities (`/brands/all`) with the distinct brands
 * already used by existing products, so:
 * - newly created CMS brands are immediately available, and
 * - products whose brand has no entity yet (e.g. seeded data) stay selectable
 *   and editable instead of silently losing their brand.
 * Keyed by slug for compatibility with the existing product.brand field.
 */
export function useAdminBrands() {
  const { token } = useAuth();
  const [options, setOptions] = useState<AdminBrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [entities, products] = await Promise.all([
        apiFetch<Brand[]>("/brands/all", { token }).catch(() => [] as Brand[]),
        apiFetch<Product[]>("/products", { token }).catch(() => [] as Product[]),
      ]);
      const map = new Map<string, AdminBrandOption>();
      for (const b of entities) map.set(b.slug, { id: b.slug, name: b.name });
      for (const p of products) {
        if (p.brand && !map.has(p.brand)) {
          map.set(p.brand, { id: p.brand, name: p.brandName || p.brand });
        }
      }
      setOptions(
        Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)),
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { brands: options, loading, reload: load };
}
