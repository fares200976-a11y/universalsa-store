import { useEffect, useState } from "react";
import { useProducts } from "./useProducts";

export interface CatalogBrand {
  id: string; // slug — matches product.brand and the catalog route param
  name: string;
  logoPath: string | null;
  displayOrder: number;
}

interface ApiBrand {
  id: number;
  slug: string;
  name: string;
  logoPath: string | null;
  displayOrder: number;
  active: boolean;
}

/**
 * Storefront brand universe, driven by the admin CMS:
 * - admin-managed brand entities (`/api/brands`, active only) control each
 *   brand's name, logo and display order;
 * - any brand that has active products is also included so the catalog never
 *   loses a purchasable brand even before an entity has been created for it.
 * Keyed by slug so it stays compatible with existing product.brand routing.
 */
export function useCatalogBrands() {
  const { products, loading: productsLoading } = useProducts();
  const [apiBrands, setApiBrands] = useState<ApiBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/brands")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: ApiBrand[]) => {
        if (alive && Array.isArray(d)) setApiBrands(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setBrandsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const map = new Map<string, CatalogBrand>();
  for (const b of apiBrands) {
    map.set(b.slug, {
      id: b.slug,
      name: b.name,
      logoPath: b.logoPath,
      displayOrder: b.displayOrder,
    });
  }
  for (const p of products) {
    if (!p.active) continue;
    if (!map.has(p.brand)) {
      map.set(p.brand, { id: p.brand, name: p.brandName, logoPath: null, displayOrder: 1000 });
    }
  }

  const brands = Array.from(map.values()).sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  );

  return { brands, loading: brandsLoading || productsLoading };
}
