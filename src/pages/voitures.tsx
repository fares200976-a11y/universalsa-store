import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Car, Phone, Tag, Loader2, ZoomIn, X } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { setCanonical } from "@/lib/seo";

interface CarListing {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  contact: string | null;
  imagePath: string | null;
  active: boolean;
  createdAt: string;
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div
        className="relative max-w-2xl w-full"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute -top-4 -end-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
        <img src={src} alt={alt} className="w-full rounded-2xl object-contain max-h-[80vh] bg-white/5" />
      </motion.div>
    </motion.div>
  );
}

export default function Voitures() {
  const { t } = useLang();
  const c = t.cars;
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    fetch("/api/cars")
      .then(r => r.json())
      .then(data => setListings(data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = "Vente de Voiture — Universal.sa";
    setCanonical("/voitures");
  }, []);

  return (
    <div className="min-h-[calc(100dvh-4rem)] py-16 bg-carbon">
      <div className="container-px">
        {/* Header */}
        <motion.div
          className="flex items-center gap-6 mb-12"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-20 h-20 bg-card border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{c.pageTitle}</h1>
            <p className="text-white/60 text-lg">{c.pageSubtitle}</p>
          </div>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center text-white/40">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          </div>
        )}

        {/* Empty */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-20 text-white/50 border border-dashed border-white/10 rounded-2xl">
            <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{c.noListings}</p>
          </div>
        )}

        {/* Grid */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((car, i) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-card border border-white/10 rounded-3xl overflow-hidden hover:border-primary/40 hover:bg-white/[0.04] transition-all group flex flex-col"
              >
                {/* Image */}
                {car.imagePath ? (
                  <div
                    className="h-52 overflow-hidden bg-white/5 flex items-center justify-center cursor-zoom-in relative group/img"
                    onClick={() => setLightbox({ src: car.imagePath!, alt: car.title })}
                  >
                    <img
                      src={car.imagePath}
                      alt={car.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <div className="h-52 bg-white/5 flex items-center justify-center border-b border-white/5">
                    <Car className="w-16 h-16 text-white/10" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-extrabold text-white mb-2 leading-tight">{car.title}</h3>
                  {car.description && (
                    <p className="text-white/50 text-sm mb-4 leading-relaxed flex-1">{car.description}</p>
                  )}

                  <div className="mt-auto space-y-3">
                    {car.price !== null && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-2xl font-black text-white">
                          {car.price.toLocaleString('fr-DZ')}
                          <span className="text-base font-bold text-white/60 ms-1">{c.da}</span>
                        </span>
                      </div>
                    )}

                    {car.contact && (
                      <a
                        href={`https://wa.me/${car.contact.replace(/\D/g, "").replace(/^0/, "213")}?text=${encodeURIComponent(`Bonjour, je suis intéressé par : ${car.title}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/80 text-white rounded-2xl px-6 py-3 font-bold text-sm transition-colors shadow-lg shadow-primary/20"
                      >
                        <Phone className="w-4 h-4" />
                        {c.contact} WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </div>
  );
}
