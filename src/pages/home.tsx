import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ChevronRight, Sparkles, Tag, Car, Volume2, VolumeX,
  ShieldCheck, Ruler, Truck, BadgeCheck, Star, Users, Layers, MapPin, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { brands } from "@/lib/data";
import { BrandIcon } from "@/components/BrandIcon";
import { useBrandLogoVisible } from "@/lib/useSiteSettings";
import { useSiteContent, safeUrl } from "@/lib/useSiteContent";
import { useLang } from "@/contexts/LanguageContext";
import { setCanonical } from "@/lib/seo";
import { AccessoryOrderModal } from "@/components/AccessoryOrderModal";
import { trackAddToCart } from "@/lib/pixel";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6 },
};

interface FeaturedProduct {
  id: number;
  brand: string;
  brandName: string;
  modelName: string;
  type: string;
  price: number;
  imagePath: string | null;
  isNew: boolean;
  isPromo: boolean;
  isFeatured: boolean;
  active: boolean;
}

interface Accessory {
  id: number;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  descriptionFr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  imagePath: string | null;
}

function productHref(p: FeaturedProduct): string {
  const tp = p.type === "5d" ? "5d" : p.type === "arriere" ? "arriere" : "7d";
  return `/${tp}/${p.brand}`;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div className="text-center max-w-2xl mx-auto mb-12" {...fadeUp}>
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{title}</h2>
      <div className="w-16 h-1 rounded-full bg-primary mx-auto mb-4" />
      <p className="text-white/55 text-base md:text-lg">{subtitle}</p>
    </motion.div>
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const sc = useSiteContent();
  const h = t.home;
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [muted, setMuted] = useState(true);
  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [orderAccessory, setOrderAccessory] = useState<{ id: string | number; name: string; price: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLogoVisible = useBrandLogoVisible();

  const carSalesEnabled = sc.settings["carSalesEnabled"] === "true";

  useEffect(() => {
    setHeroVideoUrl(sc.settings["heroVideoUrl"] || "");
  }, [sc.settings]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: FeaturedProduct[]) => {
        if (Array.isArray(data)) {
          setFeatured(data.filter((p) => p.isFeatured && p.active));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/accessories")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Accessory[]) => {
        if (Array.isArray(data)) setAccessories(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setMuted(true); }, [heroVideoUrl]);

  useEffect(() => {
    document.title = "Universal.sa — Tapis de voiture 7D, 5D & Arrière";
    setCanonical("/");
  }, []);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) v.play().catch(() => {});
    setMuted(next);
  };

  // ── Admin-managed hero overrides (fall back to i18n) ──
  const heroTitle = sc.tr("hero.title");
  const heroSubtitle = sc.tr("hero.subtitle", h.subtitle);
  const heroButton = sc.tr("hero.button");
  const heroButtonLink = safeUrl(sc.get("hero.buttonLink"));
  const hasHeroCta = Boolean(heroButton && heroButtonLink);

  const stats = [
    { icon: Users, value: "+2 500", label: t.stats.clients },
    { icon: Layers, value: "+40", label: t.stats.models },
    { icon: MapPin, value: "58", label: t.stats.wilayas },
    { icon: Star, value: "4.9/5", label: t.stats.rating },
  ];

  const features = [
    { icon: ShieldCheck, title: t.why.f1Title, desc: t.why.f1Desc },
    { icon: Ruler, title: t.why.f2Title, desc: t.why.f2Desc },
    { icon: Truck, title: t.why.f3Title, desc: t.why.f3Desc },
    { icon: BadgeCheck, title: t.why.f4Title, desc: t.why.f4Desc },
  ];

  const reviews = [
    { text: t.reviews.r1Text, name: t.reviews.r1Name, loc: t.reviews.r1Loc },
    { text: t.reviews.r2Text, name: t.reviews.r2Name, loc: t.reviews.r2Loc },
    { text: t.reviews.r3Text, name: t.reviews.r3Name, loc: t.reviews.r3Loc },
  ];

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ];

  const marqueeBrands = [...brands, ...brands];

  const renderHeroCtaLink = (children: React.ReactNode) =>
    heroButtonLink.startsWith("/") ? (
      <Link href={heroButtonLink} className="w-full sm:w-auto">{children}</Link>
    ) : (
      <a href={heroButtonLink} className="w-full sm:w-auto">{children}</a>
    );

  // ── Reorderable / toggleable homepage blocks ──
  const blocks: Record<string, () => React.ReactNode> = {
    highlights: () => (
      <section key="highlights" className="container-px py-16">
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6" {...fadeUp}>
          <Link href="/7d">
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-card h-full cursor-pointer hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(225,29,72,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
              <div className="relative p-8 flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 rounded-full px-3 py-0.5 inline-block mb-3">
                    {h.newLabel}
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mb-2">{h.newArrivals}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{h.newArrivalsDesc}</p>
                  <div className="mt-5 flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                    {h.viewArrivals} <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/5d">
            <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-card h-full cursor-pointer hover:border-amber-500/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all duration-500" />
              <div className="relative p-8 flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Tag className="w-7 h-7 text-amber-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-0.5 inline-block mb-3">
                    {h.promoLabel}
                  </span>
                  <h3 className="text-2xl font-extrabold text-white mb-2">{h.promos}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{h.promosDesc}</p>
                  <div className="mt-5 flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                    {h.viewPromos} <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </section>
    ),

    voitures: () =>
      carSalesEnabled ? (
        <section key="voitures" className="container-px pb-16">
          <motion.div {...fadeUp}>
            <Link href="/voitures">
              <div className="group relative rounded-3xl overflow-hidden border border-white/10 bg-card cursor-pointer hover:border-sky-500/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(14,165,233,0.12)]">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-sky-500/10 blur-2xl group-hover:bg-sky-500/20 transition-all duration-500" />
                <div className="relative p-8 flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                    <Car className="w-7 h-7 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 border border-sky-500/30 rounded-full px-3 py-0.5 inline-block mb-3">
                      {h.carSalesLabel}
                    </span>
                    <h3 className="text-2xl font-extrabold text-white mb-2">{h.carSalesTitle}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{h.carSalesDesc}</p>
                    <div className="mt-5 flex items-center gap-2 text-sky-400 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
                      {h.carSalesView} <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      ) : null,

    featured: () =>
      featured.length > 0 ? (
        <section key="featured" className="container-px py-16">
          <SectionHeading title={h.featuredTitle} subtitle={h.featuredSubtitle} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {featured.slice(0, 8).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              >
                <Link href={productHref(p)}>
                  <div className="group rounded-3xl overflow-hidden border border-white/10 bg-card hover:border-primary/40 transition-all duration-300 h-full flex flex-col cursor-pointer">
                    <div className="relative aspect-square overflow-hidden bg-black/30">
                      {p.imagePath ? (
                        <img src={p.imagePath} alt={`${p.brandName} ${p.modelName}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Car className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 start-2 flex flex-col gap-1.5">
                        {p.isNew && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 border border-primary/30 rounded-full px-2 py-0.5 backdrop-blur">
                            {h.newLabel}
                          </span>
                        )}
                        {p.isPromo && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5 backdrop-blur">
                            {h.promoLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="text-xs text-white/40 mb-0.5">{p.brandName}</div>
                      <div className="text-sm font-bold text-white mb-2 line-clamp-1">{p.modelName}</div>
                      <div className="mt-auto text-primary font-extrabold">{p.price.toLocaleString("fr-DZ")} DA</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null,

    accessories: () =>
      accessories.length > 0 ? (
        <section key="accessories" className="container-px py-16">
          <SectionHeading title={h.accessoriesTitle} subtitle={h.accessoriesSubtitle} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {accessories.map((a, i) => {
              const name = lang === "ar" ? (a.nameAr || a.nameFr) : lang === "en" ? (a.nameEn || a.nameFr) : a.nameFr;
              const desc = lang === "ar" ? a.descriptionAr : lang === "en" ? a.descriptionEn : a.descriptionFr;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
                >
                  <div className="group rounded-3xl overflow-hidden border border-white/10 bg-card hover:border-primary/40 transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square overflow-hidden bg-black/30">
                      {a.imagePath ? (
                        <img src={a.imagePath} alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Star className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="text-sm font-bold text-white mb-1 line-clamp-1">{name}</div>
                      {desc && <div className="text-xs text-white/50 mb-2 line-clamp-2">{desc}</div>}
                      {a.price > 0 && (
                        <div className="text-primary font-extrabold mb-3">{a.price.toLocaleString("fr-DZ")} DA</div>
                      )}
                      <button
                        type="button"
                        onClick={() => { trackAddToCart(a.id, a.price); setOrderAccessory({ id: a.id, name, price: a.price }); }}
                        className="mt-auto w-full rounded-xl bg-primary/15 border border-primary/30 text-primary font-bold text-sm py-2.5 hover:bg-primary hover:text-white transition-colors"
                      >
                        {h.accessoriesOrder}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      ) : null,

    why: () => (
      <section key="why" className="container-px py-16">
        <SectionHeading title={t.why.title} subtitle={t.why.subtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group rounded-3xl border border-white/10 bg-card p-7 hover:border-primary/40 hover:bg-white/[0.04] transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    ),

    brands: () => (
      <section key="brands" className="py-16 overflow-hidden">
        <div className="container-px">
          <SectionHeading title={t.partners.title} subtitle={t.partners.subtitle} />
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />
          <div className="flex gap-4 w-max animate-marquee">
            {marqueeBrands.map((brand, i) => (
              <div
                key={`${brand.id}-${i}`}
                className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-card px-5 py-3 whitespace-nowrap"
              >
                {isLogoVisible(brand.id) && <BrandIcon id={brand.id} name={brand.name} className="text-white/70 w-6 h-6" />}
                <span className="text-white/70 font-semibold text-sm">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    reviews: () => (
      <section key="reviews" className="container-px py-16">
        <SectionHeading title={t.reviews.title} subtitle={t.reviews.subtitle} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl border border-white/10 bg-card p-7 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-white/75 text-sm leading-relaxed flex-1 mb-6">“{r.text}”</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{r.name}</div>
                  <div className="text-white/40 text-xs">{r.loc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    ),

    faq: () => (
      <section key="faq" className="container-px py-16 pb-24">
        <SectionHeading title={t.faq.title} subtitle={t.faq.subtitle} />
        <motion.div className="max-w-3xl mx-auto" {...fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-white/10 bg-card px-5 data-[state=open]:border-primary/40"
              >
                <AccordionTrigger className="text-white font-semibold text-start hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/55 text-sm leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>
    ),
  };

  const bodyOrder = sc.blockOrder(["highlights", "featured", "accessories", "voitures", "why", "brands", "reviews", "faq"]);

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      {sc.sectionVisible("hero") && (
        <section className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center relative overflow-hidden">
          {heroVideoUrl ? (
            <>
              <video
                ref={videoRef}
                key={heroVideoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay muted loop playsInline
                poster="/assets/hero-bg.jpeg"
              >
                <source src={heroVideoUrl} />
              </video>
              <button
                onClick={toggleSound}
                aria-pressed={!muted}
                aria-label={muted ? "Activer le son" : "Couper le son"}
                className="absolute bottom-6 end-6 z-20 w-12 h-12 rounded-full bg-black/50 border border-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105" style={{ backgroundImage: "url('/assets/hero-bg.jpeg')" }} />
          )}
          <div className={`absolute inset-0 ${heroVideoUrl ? "bg-black/45" : "bg-gradient-to-b from-black/70 via-black/60 to-background"}`} />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />

          <div className="container-px z-10 py-20 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-7 inline-flex items-center gap-2 tracking-wider uppercase backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5" /> {h.badge}
              </span>
              {heroTitle ? (
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95] text-white">
                  {heroTitle}
                </h1>
              ) : (
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-[0.95]">
                  <span className="text-white">{h.title1}</span> <br className="hidden md:block" />
                  <span className="text-white">{h.title2} </span>
                  <span className="text-gradient-red">{h.title3}</span>
                </h1>
              )}
              <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-12">{heroSubtitle}</p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              {hasHeroCta && renderHeroCtaLink(
                <Button size="lg" className="px-9 py-4 h-auto text-base w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-2xl group glow-primary">
                  <span className="relative z-10 flex items-center gap-2 font-bold">
                    {heroButton} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              )}
              <Link href="/7d" data-testid="link-home-7d" className="w-full sm:w-auto">
                <Button size="lg" className={`px-9 py-4 h-auto text-base w-full sm:w-auto rounded-2xl group font-bold ${hasHeroCta ? "border border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm" : "bg-primary hover:bg-primary/90 text-white glow-primary"}`}>
                  <span className="relative z-10 flex items-center gap-2">
                    {h.cta7d} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
              <Link href="/5d" data-testid="link-home-5d" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-auto px-9 py-4 text-base w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl group backdrop-blur-sm font-bold">
                  {h.cta5d} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ms-2 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/arriere" data-testid="link-home-arriere" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-auto px-9 py-4 text-base w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-2xl group backdrop-blur-sm font-bold">
                  {h.ctaRear} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform ms-2 rtl:rotate-180" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 text-white/40"
            animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </section>
      )}

      {/* ── Stats strip ── */}
      {sc.sectionVisible("stats") && (
        <section className="container-px -mt-4 relative z-10">
          <motion.div
            className="glass rounded-3xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/10 overflow-hidden"
            {...fadeUp}
          >
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 py-7 px-4">
                <s.icon className="w-6 h-6 text-primary" />
                <div className="text-2xl md:text-3xl font-black text-white">{s.value}</div>
                <div className="text-xs md:text-sm text-white/50">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Reorderable / toggleable body blocks ── */}
      {bodyOrder.map((name) => (sc.sectionVisible(name) ? blocks[name]?.() : null))}

      <AccessoryOrderModal
        isOpen={orderAccessory !== null}
        onClose={() => setOrderAccessory(null)}
        accessoryId={orderAccessory?.id ?? ""}
        accessoryName={orderAccessory?.name ?? ""}
        accessoryPrice={orderAccessory?.price ?? 0}
      />
    </div>
  );
}
