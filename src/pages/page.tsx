import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useLang } from "@/contexts/LanguageContext";
import { setSeo } from "@/lib/seo";
import NotFound from "@/pages/not-found";
import MarkdownContent from "@/components/MarkdownContent";

interface ContentPage {
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
}

export default function Page() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug;
  const { lang } = useLang();
  const [page, setPage] = useState<ContentPage | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    if (!slug) return;
    setStatus("loading");
    setPage(null);
    fetch(`/api/pages/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((p: ContentPage) => {
        setPage(p);
        setStatus("ok");
      })
      .catch(() => setStatus("notfound"));
  }, [slug]);

  const pick = (fr: string, en: string, ar: string) =>
    lang === "ar" ? ar : lang === "en" ? en : fr;
  const title = page ? pick(page.titleFr, page.titleEn, page.titleAr) : "";
  const body = page ? pick(page.bodyFr, page.bodyEn, page.bodyAr) : "";

  useEffect(() => {
    if (!page) return;
    setSeo({
      title: page.seoTitle || `${title} — Universal.sa`,
      description: page.seoDescription,
      keywords: page.seoKeywords,
      ogImage: page.ogImage,
      path: `/p/${page.slug}`,
    });
  }, [page, title]);

  if (status === "loading") {
    return (
      <div className="container-px py-24">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-10 w-2/3 rounded-lg bg-white/10" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
          <div className="h-4 w-4/6 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (status === "notfound" || !page) {
    return <NotFound />;
  }

  return (
    <article className="container-px py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
          {title}
        </h1>
        <div className="mb-10 h-1 w-16 rounded-full bg-primary" />
        <MarkdownContent className="text-base leading-relaxed">{body}</MarkdownContent>
      </div>
    </article>
  );
}
