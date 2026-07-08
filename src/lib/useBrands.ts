import { useState, useEffect } from "react";
import { brands as localBrands } from "@/data/brands";

export interface CatalogBrand {
  id: string;
  name: string;
  logoPath: string | null;
  displayOrder: number;
}

export function useCatalogBrands() {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Utiliser les données locales au lieu de l'API
    const mappedBrands = localBrands.map((b, index) => ({
      id: b.id,
      name: b.name,
      logoPath: null,
      displayOrder: index,
    }));
    setBrands(mappedBrands);
    setLoading(false);
  }, []);

  return { brands, loading };
}
