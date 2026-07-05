import { useState, type ReactNode, type ComponentType } from "react";
import { Toaster } from "sonner";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Boxes, Tag, Car,
  FileText, Image as ImageIcon, Palette, Phone, Truck, ShieldCheck, Layers, Sparkles,
} from "lucide-react";
import { useSessionState, AuthProvider, roleCan, type Permission, type Session } from "./lib/auth";
import { LoginScreen } from "./LoginScreen";
import { AdminLayout, type NavItem } from "./AdminLayout";

import { DashboardSection } from "./sections/Dashboard";
import { ProductsSection } from "./sections/Products";
import { OrdersSection } from "./sections/Orders";
import { CustomersSection } from "./sections/Customers";
import { BrandsSection } from "./sections/Brands";
import { CategoriesSection } from "./sections/Categories";
import { CarModelsSection } from "./sections/CarModels";
import { AccessoriesSection } from "./sections/Accessories";
import { PagesSection } from "./sections/Pages";
import { MediaSection } from "./sections/Media";
import { AppearanceSection } from "./sections/Appearance";
import { ContactFooterSection } from "./sections/ContactFooter";
import { UsersSection } from "./sections/Users";
import { LivraisonSection } from "./sections/Livraison";
import { VoituresSection } from "./sections/Voitures";

interface SectionDef {
  key: string;
  label: string;
  icon: ReactNode;
  group: string;
  perm: Permission;
  Component: ComponentType;
}

const SECTIONS: SectionDef[] = [
  { key: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard className="h-4 w-4" />, group: "Pilotage", perm: "catalog", Component: DashboardSection },

  { key: "products", label: "Produits", icon: <Package className="h-4 w-4" />, group: "Catalogue", perm: "catalog", Component: ProductsSection },
  { key: "brands", label: "Marques", icon: <Tag className="h-4 w-4" />, group: "Catalogue", perm: "cms", Component: BrandsSection },
  { key: "categories", label: "Catégories", icon: <Layers className="h-4 w-4" />, group: "Catalogue", perm: "cms", Component: CategoriesSection },
  { key: "carmodels", label: "Modèles de voitures", icon: <Boxes className="h-4 w-4" />, group: "Catalogue", perm: "cms", Component: CarModelsSection },
  { key: "accessories", label: "Accessoires Auto", icon: <Sparkles className="h-4 w-4" />, group: "Catalogue", perm: "cms", Component: AccessoriesSection },

  { key: "orders", label: "Commandes", icon: <ShoppingBag className="h-4 w-4" />, group: "Ventes", perm: "catalog", Component: OrdersSection },
  { key: "customers", label: "Clients", icon: <Users className="h-4 w-4" />, group: "Ventes", perm: "cms", Component: CustomersSection },

  { key: "pages", label: "Pages", icon: <FileText className="h-4 w-4" />, group: "Contenu", perm: "cms", Component: PagesSection },
  { key: "appearance", label: "Apparence", icon: <Palette className="h-4 w-4" />, group: "Contenu", perm: "cms", Component: AppearanceSection },
  { key: "contact", label: "Contact & Footer", icon: <Phone className="h-4 w-4" />, group: "Contenu", perm: "cms", Component: ContactFooterSection },
  { key: "media", label: "Médiathèque", icon: <ImageIcon className="h-4 w-4" />, group: "Contenu", perm: "cms", Component: MediaSection },

  { key: "voitures", label: "Voitures à vendre", icon: <Car className="h-4 w-4" />, group: "Modules", perm: "catalog", Component: VoituresSection },
  { key: "livraison", label: "Livraison", icon: <Truck className="h-4 w-4" />, group: "Configuration", perm: "catalog", Component: LivraisonSection },
  { key: "users", label: "Utilisateurs & rôles", icon: <ShieldCheck className="h-4 w-4" />, group: "Configuration", perm: "staff", Component: UsersSection },
];

function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const allowed = SECTIONS.filter((s) => roleCan(session.role, s.perm));
  const [active, setActive] = useState(allowed[0]?.key ?? "dashboard");
  const current = allowed.find((s) => s.key === active) ?? allowed[0];
  const nav: NavItem[] = allowed.map(({ key, label, icon, group }) => ({ key, label, icon, group }));
  const Active = current?.Component ?? DashboardSection;

  return (
    <AuthProvider session={session} onLogout={onLogout}>
      <AdminLayout nav={nav} active={current?.key ?? active} onNavigate={setActive}>
        <Active />
      </AdminLayout>
    </AuthProvider>
  );
}

export function AdminApp() {
  const { session, login, logout } = useSessionState();

  return (
    <>
      {session ? <Dashboard session={session} onLogout={logout} /> : <LoginScreen onLogin={login} />}
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        toastOptions={{ style: { background: "#15151d", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } }}
      />
    </>
  );
}
