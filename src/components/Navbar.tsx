import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Phone, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/lib/useSiteContent";
import { normalizeDzWhatsapp } from "@/lib/useSiteSettings";
import type { Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'ع' },
];

export function Navbar() {
  const [location] = useLocation();
  const { t, lang, setLang } = useLang();
  const sc = useSiteContent();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const waNumber = normalizeDzWhatsapp(sc.get("contact.phone") || "213553494318");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { href: "/", label: t.nav.home, active: location === "/" },
    { href: "/7d", label: t.nav.mats7d, active: location.startsWith("/7d") },
    { href: "/5d", label: t.nav.mats5d, active: location.startsWith("/5d") },
    { href: "/arriere", label: t.nav.rear, active: location.startsWith("/arriere") },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-background/80 backdrop-blur-xl shadow-soft"
          : "border-b border-transparent bg-background/40 backdrop-blur-md"
      }`}
    >
      <div className="container-px h-16 flex items-center justify-between relative">
        {/* Left: desktop nav + mobile menu button */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative text-sm font-semibold transition-colors hover:text-white ${l.active ? "text-white" : "text-white/60"}`}
              data-testid={`link-nav-${l.href === "/" ? "home" : l.href.slice(1)}`}
            >
              {l.label}
              {l.active && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Center logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center bg-white rounded-lg px-3 py-1 shadow-md shadow-black/30"
          data-testid="link-home-logo"
        >
          <img src="/assets/logo.jpeg" alt="Universal.sa" style={{ height: "40px", width: "auto", maxWidth: "200px", objectFit: "contain" }} />
        </Link>

        {/* Right: language switcher + contact */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`px-2.5 py-1.5 text-xs font-bold transition-colors ${
                  lang === l.code ? "bg-primary text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                aria-pressed={lang === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>

          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" data-testid="btn-contact">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white hidden sm:flex rounded-xl">
              <Phone className="w-4 h-4" /> {t.nav.contact}
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white sm:hidden p-2 rounded-xl">
              <Phone className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="container-px py-3 flex flex-col">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`py-3 px-2 rounded-lg text-base font-semibold transition-colors ${
                    l.active ? "text-primary bg-primary/10" : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
