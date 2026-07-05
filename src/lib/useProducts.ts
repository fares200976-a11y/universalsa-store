import { useEffect, useState, useCallback } from "react";

export interface ApiProduct {
  id: number;
  brand: string;
  brandName: string;
  modelName: string;
  price: number;
  imagePath: string | null;
  active: boolean;
  type: string;
  isNew: boolean;
  isPromo: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 30_000; // 30 secondes

export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const r = await fetch("/api/products");
      if (r.ok) {
        const data = await r.json();
        setProducts(data);
      }
    } catch {
      // silently ignore network errors on background polls
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  return { products, loading };
}

export function useBrandProducts(brandId: string, typeFilter?: string) {
  const { products, loading } = useProducts();
  const brandProducts = products.filter(p => {
    if (!p.active) return false;
    if (p.brand !== brandId) return false;
    if (!typeFilter) return true;
    if (typeFilter === "arriere") return p.type === "arriere";
    return p.type === typeFilter || p.type === "both";
  });
  return { products: brandProducts, loading };
}
