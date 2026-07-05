import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] w-full flex items-center justify-center bg-carbon px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-7xl font-black text-gradient-red mb-3">404</h1>
        <p className="text-xl font-bold text-white mb-2">Page introuvable</p>
        <p className="text-white/50 mb-8">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link href="/">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6">
            <Home className="w-4 h-4" /> Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}
