import { useState, useEffect } from "react";
import { models as localModels } from "@/data/brands";

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
    // Convertir les modèles locaux en produits
    const allProducts: ApiProduct[] = [];
    let id = 1;
    
    for (const [brand, modelList] of Object.entries(localModels)) {
      for (const model of modelList) {
        allProducts.push({
          id: id++,
          brand: brand,
          brandName: brand.charAt(0).toUpperCase() + brand.slice(1),
          modelName: model.name,
          price: model.price,
          imagePath: model.image || null,
          active: true,
          type: "7d", // Par défaut, à ajuster selon vos besoins
          isNew: false,
          isPromo: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
    
    setProducts(allProducts);
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
