import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search, X } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";
import { useBrandLogoVisible } from "@/lib/useSiteSettings";
import { useCatalogBrands } from "@/lib/useBrands";
import { useLang } from "@/contexts/LanguageContext";
import { setCanonical } from "@/lib/seo";

export default function Brands({ type }: { type: '7d' | '5d' | 'arriere' }) {
  const { t } = useLang();
  const b = t.brands;
  const isLogoVisible = useBrandLogoVisible();
  const { brands, loading } = useCatalogBrands();
  const [query, setQuery] = useState("");

  const title = type === '7d' ? b.title7d : type === '5d' ? b.title5d : b.titleRear;

  useEffect(() => {
    document.title = `${title} — Universal.sa`;
    setCanonical(`/${type}`);
  }, [title, type]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(br => br.name.toLowerCase().includes(q) || br.id.includes(q));
  }, [query, brands]);

  return (
    <div className="min-h-[calc(100dvh-4rem)] py-16 bg-carbon">
      <div className="container-px">
        <div className="text-center mb-10">
          <motion.h1 className="text-4xl md:text-5xl font-bold mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {title}
          </motion.h1>
          <motion.p className="text-white/55 text-lg max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            {b.subtitle}
          </motion.p>
        </div>

        {/* Search */}
        <motion.div
          className="max-w-md mx-auto mb-12"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.brandPh}
              className="w-full bg-card border border-white/10 rounded-2xl ps-11 pe-11 py-3.5 text-sm text-white placeholder-white/35 focus:outline-none focus:border-primary/50 transition-colors"
              data-testid="input-brand-search"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 -translate-y-1/2 end-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 bg-card border border-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/50 border border-dashed border-white/10 rounded-2xl max-w-md mx-auto">
            {t.search.noResults}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((brand, i) => (
              <motion.div key={brand.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.025, 0.4) }}>
                <Link href={`/${type}/${brand.id}`} data-testid={`link-brand-${brand.id}`}>
                  <div className="group h-32 bg-card border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.06] hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden px-2">
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                    {isLogoVisible(brand.id) && (
                      brand.logoPath ? (
                        <img src={brand.logoPath} alt="" className="h-12 w-12 object-contain z-10" />
                      ) : (
                        <BrandIcon id={brand.id} name={brand.name} className="text-white/80 group-hover:text-white transition-colors z-10" />
                      )
                    )}
                    <span className="font-semibold text-white/90 group-hover:text-white z-10 tracking-wide text-sm text-center leading-tight">
                      {brand.name}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
