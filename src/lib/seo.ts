const SITE_ORIGIN = "https://universalsa.store";

export function setCanonical(path: string) {
  const url = `${SITE_ORIGIN}${path}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  if (!content) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export interface SeoOptions {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  path?: string;
}

/** Apply document title, meta description/keywords, Open Graph tags and canonical. */
export function setSeo(opts: SeoOptions) {
  if (opts.title) {
    document.title = opts.title;
    setMeta("og:title", opts.title, "property");
  }
  if (opts.description) {
    setMeta("description", opts.description);
    setMeta("og:description", opts.description, "property");
  }
  if (opts.keywords) setMeta("keywords", opts.keywords);
  if (opts.ogImage) setMeta("og:image", opts.ogImage, "property");
  if (opts.path) setCanonical(opts.path);
}
