export interface Order {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  adresse: string;
  wilaya: string;
  modeLivraison: string;
  brand: string;
  modelName: string;
  type: string;
  prixTapis: number;
  prixLivraison: number;
  total: number;
  status: string;
  createdAt: string;
}

export interface Product {
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
  isFeatured: boolean;
  stock: number;
  createdAt: string;
}

export interface CarListing {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  contact: string | null;
  imagePath: string | null;
  active: boolean;
  createdAt: string;
}

export interface Brand {
  id: number;
  slug: string;
  name: string;
  logoPath: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  key: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

export interface CarModel {
  id: number;
  brandId: number;
  name: string;
  displayOrder: number;
  active: boolean;
  createdAt: string;
}

export interface ContentPage {
  id: number;
  slug: string;
  titleFr: string;
  titleEn: string;
  titleAr: string;
  bodyFr: string;
  bodyEn: string;
  bodyAr: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  ogImage: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  telephone: string;
  nom: string;
  prenom: string;
  wilaya: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export interface StaffMember {
  id: number;
  username: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface MediaItem {
  name: string;
  url: string;
  kind: "image" | "video" | "other";
  size: number;
  mtime: string;
}
