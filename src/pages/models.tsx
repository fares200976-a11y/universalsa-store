import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoute } from "wouter";
import { useBrandProducts, type ApiProduct } from "@/lib/useProducts";
import { useCatalogBrands } from "@/lib/useBrands";
import { BrandIcon } from "@/components/BrandIcon";
import { useBrandLogoVisible } from "@/lib/useSiteSettings";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, ZoomIn, Search, Sparkles, Tag } from "lucide-react";
import { OrderModal } from "@/components/OrderModal";
import { useLang } from "@/contexts/LanguageContext";
import { setCanonical } from "@/lib/seo";
import { trackAddToCart } from "@/lib/pixel";

type Filter = "all" | "new" | "promo";

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
        <motion.div
          className="relative max-w-2xl w-full"
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute -top-4 -end-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <img src={src} alt={alt} className="w-full rounded-2xl object-contain max-h-[80vh] bg-white/5" />
          <p className="text-center text-white/60 text-sm mt-3">{alt}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-white/10 rounded-3xl p-8 min-h-[260px] animate-pulse">
      <div className="w-full h-44 mb-4 rounded-xl bg-white/5" />
      <div className="h-6 w-24 rounded-full bg-white/5 mb-4" />
      <div className="h-8 w-3/4 rounded bg-white/5 mb-3" />
      <div className="h-4 w-1/2 rounded bg-white/5 mb-8" />
      <div className="flex items-center justify-between">
        <div className="h-10 w-28 rounded bg-white/5" />
        <div className="h-12 w-32 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

export default function Models({ type }: { type: '7d' | '5d' | 'arriere' }) {
  const [, params] = useRoute("/:type/:brand");
  const brandId = params?.brand || "";
  const { t } = useLang();
  const m = t.models;

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ApiProduct | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const isLogoVisible = useBrandLogoVisible();
  const { products: brandProducts, loading } = useBrandProducts(brandId, type);
  const { brands: catalogBrands, loading: brandsLoading } = useCatalogBrands();

  const cbrand = catalogBrands.find(b => b.id === brandId);
  const brand = {
    id: brandId,
    name: cbrand?.name || brandProducts[0]?.brandName || brandId,
    logoPath: cbrand?.logoPath ?? null,
  };

  const badgeText = type === 'arriere' ? m.badgeRear : type === '7d' ? m.badge7d : m.badge5d;
  const badgeColor = type === 'arriere'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : 'bg-primary/20 text-primary border-primary/30';
  const subtitle = type === '7d' ? m.subtitle7d : type === '5d' ? m.subtitle5d : m.subtitleRear;

  useEffect(() => {
    const label = type === 'arriere' ? 'Arrière' : type.toUpperCase();
    document.title = brand
      ? `Tapis ${label} ${brand.name} — Universal.sa`
      : `Tapis ${label} — Universal.sa`;
    setCanonical(brand ? `/${type}/${brandId}` : `/${type}`);
  }, [type, brand, brandId]);

  const hasNew = brandProducts.some(p => p.isNew);
  const hasPromo = brandProducts.some(p => p.isPromo);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return brandProducts.filter(p => {
      if (filter === "new" && !p.isNew) return false;
      if (filter === "promo" && !p.isPromo) return false;
      if (q && !p.modelName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [brandProducts, query, filter]);

  if (!brandsLoading && !loading && !cbrand && brandProducts.length === 0) {
    return <div className="p-20 text-center text-xl text-white/60">{m.notFound}</div>;
  }

  const filterChips: { id: Filter; label: string; show: boolean }[] = [
    { id: "all", label: t.search.all, show: true },
    { id: "new", label: t.search.filterNew, show: hasNew },
    { id: "promo", label: t.search.filterPromo, show: hasPromo },
  ];

  return (
    <div className="min-h-[calc(100dvh-4rem)] py-16 bg-carbon">
      <div className="container-px">
        <motion.div className="flex items-center gap-6 mb-10" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {isLogoVisible(brand.id) && (
            <div className="w-20 h-20 bg-card border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              {brand.logoPath ? (
                <img src={brand.logoPath} alt="" className="w-12 h-12 object-contain" />
              ) : (
                <BrandIcon id={brand.id} name={brand.name} className="text-white w-10 h-10" />
              )}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{m.heading} {brand.name}</h1>
            <p className="text-white/55 text-lg">{subtitle}</p>
          </div>
        </motion.div>

        {/* Search + filters */}
        {!loading && brandProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-1/2 -translate-y-1/2 start-4 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search.modelPh}
                className="w-full bg-card border border-white/10 rounded-2xl ps-11 pe-4 py-3 text-sm text-white placeholder-white/35 focus:outline-none focus:border-primary/50 transition-colors"
                data-testid="input-model-search"
              />
            </div>
            <div className="flex items-center gap-2">
              {filterChips.filter(c => c.show).map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilter(c.id)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-semibold border transition-colors ${
                    filter === c.id
                      ? "bg-primary text-white border-primary"
                      : "bg-card text-white/60 border-white/10 hover:text-white hover:border-white/20"
                  }`}
                  data-testid={`filter-${c.id}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((model, i) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}
                className="bg-card border border-white/10 rounded-3xl p-8 hover:border-primary/40 hover:bg-white/[0.04] transition-all group flex flex-col relative overflow-hidden min-h-[260px]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Status badges */}
                {(model.isNew || model.isPromo) && (
                  <div className="absolute top-4 end-4 z-10 flex flex-col items-end gap-1.5">
                    {model.isNew && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary text-white shadow-lg">
                        <Sparkles className="w-3 h-3" /> {t.search.badgeNew}
                      </span>
                    )}
                    {model.isPromo && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-black shadow-lg">
                        <Tag className="w-3 h-3" /> {t.search.badgePromo}
                      </span>
                    )}
                  </div>
                )}

                {model.imagePath && (
                  <div
                    className="w-full h-44 mb-4 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center cursor-zoom-in relative group/img"
                    onClick={() => setLightboxImage({ src: model.imagePath!, alt: `${brand.name} ${model.modelName}` })}
                  >
                    <img src={model.imagePath} alt={model.modelName} className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/img:scale-105" />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-widest border ${badgeColor}`}>
                    {badgeText}
                  </span>
                </div>

                <h3 className="text-3xl font-extrabold mb-2 leading-tight">{model.modelName}</h3>
                <p className="text-primary/80 text-sm font-semibold mb-1">{m.guarantee}</p>
                <p className="text-white/45 text-sm mb-6 leading-relaxed">{m.guaranteeDesc}</p>

                <div className="mt-auto flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-white/40 uppercase tracking-widest mb-1">{m.priceLabel}</div>
                    <div className="text-4xl font-black text-white">
                      {model.price.toLocaleString('fr-DZ')}
                      <span className="text-xl font-bold text-white/60 ms-1">DA</span>
                    </div>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/80 text-white rounded-2xl px-6 py-4 h-auto text-base font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                    onClick={() => { trackAddToCart(model.id, model.price); setSelectedModel(model); setModalOpen(true); }}
                    data-testid={`btn-order-${brandId}-${model.modelName}`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {m.order}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && brandProducts.length === 0 && (
          <div className="text-center py-20 text-white/50 border border-dashed border-white/10 rounded-2xl">
            {m.noModels}
          </div>
        )}

        {!loading && brandProducts.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 text-white/50 border border-dashed border-white/10 rounded-2xl">
            {t.search.noResults}
          </div>
        )}
      </div>

      {selectedModel && (
        <OrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} productId={selectedModel.id} productName={selectedModel.modelName} productPrice={selectedModel.price} brandName={brand.name} type={type} />
      )}
      {lightboxImage && <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}
