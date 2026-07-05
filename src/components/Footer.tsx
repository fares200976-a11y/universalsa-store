import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Phone, MapPin, Heart, Facebook, Instagram, Music2 } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useSiteContent, safeUrl } from "@/lib/useSiteContent";
import { normalizeDzWhatsapp } from "@/lib/useSiteSettings";

interface PageLink {
  slug: string;
  titleFr: string;
  titleEn: string;
  titleAr: string;
}

export function Footer() {
  const { t, lang } = useLang();
  const sc = useSiteContent();
  const f = t.footer;
  const year = new Date().getFullYear();
  const [pages, setPages] = useState<PageLink[]>([]);

  useEffect(() => {
    fetch("/api/pages")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PageLink[]) => {
        if (Array.isArray(data)) setPages(data);
      })
      .catch(() => {});
  }, []);

  const pageTitle = (p: PageLink) =>
    lang === "ar" ? p.titleAr : lang === "en" ? p.titleEn : p.titleFr;

  const categories = [
    { href: "/7d", label: t.nav.mats7d },
    { href: "/5d", label: t.nav.mats5d },
    { href: "/arriere", label: t.nav.rear },
  ];
  const links = [
    { href: "/", label: t.nav.home },
    ...pages.map((p) => ({ href: `/p/${p.slug}`, label: pageTitle(p) })),
  ];

  // Admin-managed content (falls back to i18n / defaults)
  const tagline = sc.tr("footer.about", f.tagline);
  const address = sc.tr("contact.address", f.address);
  const copyright = sc.get("footer.copyright");
  const phone = sc.get("contact.phone");
  const waNumber = normalizeDzWhatsapp(phone || "213553494318");
  const facebook = safeUrl(sc.get("social.facebook"));
  const instagram = safeUrl(sc.get("social.instagram"));
  const tiktok = safeUrl(sc.get("social.tiktok"));

  const socials = [
    { href: facebook, Icon: Facebook, label: "Facebook" },
    { href: instagram, Icon: Instagram, label: "Instagram" },
    { href: tiktok, Icon: Music2, label: "TikTok" },
  ].filter((s) => s.href);

  return (
    <footer className="relative border-t border-white/10 bg-carbon overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="container-px py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center bg-white rounded-lg px-3 py-1.5 shadow-md shadow-black/30">
              <img src="/assets/logo.jpeg" alt="Universal.sa" className="h-9 w-auto max-w-[180px] object-contain" />
            </Link>
            <p className="text-white/45 text-sm leading-relaxed mt-5 max-w-xs">{tagline}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3 mt-6">
                {socials.map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">{f.categories}</h4>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="text-white/50 hover:text-primary text-sm transition-colors">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">{f.quickLinks}</h4>
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-primary text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-4">{f.contact}</h4>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/30 text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <Phone className="w-4 h-4" /> {f.contactUs}
            </a>
            <div className="flex items-center gap-2 text-white/45 text-sm mt-4">
              <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" /> {address}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/35">
          <span>
            {copyright || `© ${year} Universal.sa — Ets Universel Service Automobile. ${f.rights}`}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              {f.madeIn} <Heart className="w-3 h-3 text-primary fill-primary" />
            </span>
            <a href="/admin" className="hover:text-white/60 transition-colors">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
