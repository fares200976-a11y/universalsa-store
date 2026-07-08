import { useState, useEffect } from "react";

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

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ33cuOQXP0RAlzfevrNPfKANI_iMTEDxGW_b-rOQLx7KU0QLRUphB99BnxIJTU9jg-4QMJTg0LzxZe/pub?output=csv";

function parseCSV(csvText: string): ApiProduct[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const products: ApiProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim();
    });
    
    if (row.id && row.name) {
      products.push({
        id: parseInt(row.id) || i,
        brand: row.brand || '',
        brandName: (row.brand || '').charAt(0).toUpperCase() + (row.brand || '').slice(1),
        modelName: row.model || row.name || '',
        price: parseInt(row.price) || 0,
        imagePath: row.image_url || null,
        active: row.active?.toLowerCase() === 'true' || row.active === '1',
        type: row.type || '7d',
        isNew: false,
        isPromo: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  return products;
}

export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(SHEET_URL)
      .then(r => r.text())
      .then(csvText => {
        const data = parseCSV(csvText);
        setProducts(data);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setLoading(false));
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
