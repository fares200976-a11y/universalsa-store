import { useState, useEffect } from "react";
import productsData from "@/data/products.json";

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

export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mappedProducts = productsData.map(p => ({
      id: p.id,
      brand: p.brand,
      brandName: p.brand.charAt(0).toUpperCase() + p.brand.slice(1),
      modelName: p.model,
      price: p.price,
      imagePath: p.image || null,
      active: p.active,
      type: p.type,
      isNew: false,
      isPromo: false,
      createdAt: new Date().toISOString(),
    }));
    
    setProducts(mappedProducts);
    setLoading(false);
  }, []);

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
