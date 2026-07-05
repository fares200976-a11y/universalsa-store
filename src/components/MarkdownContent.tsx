import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  children: string;
  className?: string;
  onImageClick?: (image: { src?: string; alt?: string; title?: string }) => void;
}

export default function MarkdownContent({ children, className, onImageClick }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "prose prose-invert max-w-none",
        "prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-white",
        "prose-p:text-white/75 prose-li:text-white/75",
        "prose-strong:text-white prose-em:text-white/80",
        "prose-a:text-primary prose-a:font-semibold hover:prose-a:text-primary/80",
        "prose-blockquote:border-primary prose-blockquote:text-white/60",
        "prose-code:text-white prose-hr:border-white/10",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ href, children: linkChildren, ...props }) => {
            const isExternal = !!href && /^https?:\/\//i.test(href);
            return (
              <a
                href={href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {linkChildren}
              </a>
            );
          },
          p: ({ node, children, ...props }) => {
            const onlyChild =
              node?.children.length === 1 ? node.children[0] : undefined;
            const isLoneImage =
              onlyChild?.type === "element" && onlyChild.tagName === "img";
            if (isLoneImage) return <>{children}</>;
            return <p {...props}>{children}</p>;
          },
          img: ({ src, alt, title, ...props }) => {
            const resolvedSrc = typeof src === "string" ? src : undefined;
            const clickable = !!onImageClick;
            const image = (
              <img
                src={resolvedSrc}
                alt={alt ?? ""}
                loading="lazy"
                title={clickable ? "Cliquez pour modifier la description/légende ou remplacer l'image" : title}
                onClick={
                  clickable
                    ? () => onImageClick({ src: resolvedSrc, alt, title })
                    : undefined
                }
                className={cn(
                  "mx-auto h-auto max-w-full rounded-xl border border-white/10",
                  clickable && "cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/60",
                )}
                {...props}
              />
            );
            if (!title) return image;
            return (
              <figure className="my-6 text-center">
                {image}
                <figcaption className="mt-2 text-sm italic text-white/50">{title}</figcaption>
              </figure>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
