import { useRef, useState } from "react";
import { Bold, Italic, Heading2, List, ListOrdered, Link2, Image as ImageIcon, Eye, Pencil, RefreshCw } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { uploadImage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "./notify";
import { FieldLabel } from "./primitives";

type WrapAction = { kind: "wrap"; before: string; after: string; placeholder: string };
type LineAction = { kind: "line"; prefix: string; placeholder: string };
type LinkAction = { kind: "link"; placeholder: string };
type ToolAction = WrapAction | LineAction | LinkAction;

const TOOLS: { icon: typeof Bold; title: string; action: ToolAction }[] = [
  { icon: Heading2, title: "Titre", action: { kind: "line", prefix: "## ", placeholder: "Titre" } },
  { icon: Bold, title: "Gras", action: { kind: "wrap", before: "**", after: "**", placeholder: "texte en gras" } },
  { icon: Italic, title: "Italique", action: { kind: "wrap", before: "_", after: "_", placeholder: "texte en italique" } },
  { icon: List, title: "Liste à puces", action: { kind: "line", prefix: "- ", placeholder: "élément" } },
  { icon: ListOrdered, title: "Liste numérotée", action: { kind: "line", prefix: "1. ", placeholder: "élément" } },
  { icon: Link2, title: "Lien", action: { kind: "link", placeholder: "texte du lien" } },
];

export function MarkdownEditor({
  label,
  value,
  onChange,
  dir,
  placeholder,
  rows = 12,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "rtl" | "ltr";
  placeholder?: string;
  rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const replaceSrcRef = useRef<string | null>(null);
  const { token } = useAuth();
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  const promptAltAndCaption = (defaultAlt: string, defaultCaption: string) => {
    const description = window.prompt(
      "Décrivez l'image (texte alternatif pour l'accessibilité et le SEO) :",
      defaultAlt,
    );
    if (description === null) return null;
    const alt = description.trim() || "image";

    const captionInput = window.prompt("Légende à afficher sous l'image (facultatif) :", defaultCaption);
    if (captionInput === null) return null;
    const caption = captionInput.trim().replace(/"/g, "'");

    return { alt, caption };
  };

  const buildImageMarkdown = (alt: string, url: string, caption: string) =>
    caption ? `![${alt}](${url} "${caption}")` : `![${alt}](${url})`;

  const findImageAtCaret = (text: string, caret: number) => {
    const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (caret >= start && caret <= end) {
        return { start, end, alt: m[1], url: m[2], caption: m[3] ?? "" };
      }
    }
    return null;
  };

  const findImageByUrl = (text: string, url: string) => {
    const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m[2] === url) {
        return { start: m.index, end: m.index + m[0].length, alt: m[1], url: m[2], caption: m[3] ?? "" };
      }
    }
    return null;
  };

  const insertAtCursor = (insert: string, selectInner?: { start: number; length: number }) => {
    const el = ref.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      if (selectInner) {
        el.setSelectionRange(start + selectInner.start, start + selectInner.start + selectInner.length);
      } else {
        const caret = start + insert.length;
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await notify.run(() => uploadImage(file, token), { error: "Échec de l'envoi" });
    setUploading(false);
    e.target.value = "";
    if (!url) return;

    const result = promptAltAndCaption("", "");
    const alt = result?.alt ?? "image";
    const caption = result?.caption ?? "";

    const markdown = buildImageMarkdown(alt, url, caption);
    insertAtCursor(markdown, { start: 2, length: alt.length });
  };

  const handleImageButton = () => {
    const el = ref.current;
    const caret = el ? el.selectionStart : value.length;
    const existing = findImageAtCaret(value, caret);

    if (!existing) {
      fileRef.current?.click();
      return;
    }

    const result = promptAltAndCaption(existing.alt === "image" ? "" : existing.alt, existing.caption);
    if (!result) return;

    const markdown = buildImageMarkdown(result.alt, existing.url, result.caption);
    const next = value.slice(0, existing.start) + markdown + value.slice(existing.end);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(existing.start + 2, existing.start + 2 + result.alt.length);
    });
    notify.success("Image mise à jour");
  };

  const editImage = (image: { src?: string; alt?: string; title?: string }) => {
    if (!image.src) return;
    const target = findImageByUrl(value, image.src);
    if (!target) {
      notify.error("Impossible de retrouver cette image dans le texte.");
      return;
    }

    const wantsReplace = window.confirm(
      "Remplacer le fichier image ?\n\nOK : choisir un nouveau fichier (la description et la légende seront conservées).\nAnnuler : modifier la description et la légende.",
    );

    if (wantsReplace) {
      replaceSrcRef.current = target.url;
      replaceFileRef.current?.click();
      return;
    }

    const currentAlt = target.alt === "image" ? "" : target.alt;
    const result = promptAltAndCaption(currentAlt, target.caption);
    if (!result) return;

    const markdown = buildImageMarkdown(result.alt, target.url, result.caption);
    const next = value.slice(0, target.start) + markdown + value.slice(target.end);
    onChange(next);
    notify.success("Image mise à jour");
  };

  const handleReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const oldSrc = replaceSrcRef.current;
    replaceSrcRef.current = null;
    if (!file || !oldSrc) return;

    setUploading(true);
    const url = await notify.run(() => uploadImage(file, token), { error: "Échec de l'envoi" });
    setUploading(false);
    if (!url) return;

    const target = findImageByUrl(value, oldSrc);
    if (!target) {
      notify.error("Impossible de retrouver cette image dans le texte.");
      return;
    }

    const markdown = buildImageMarkdown(target.alt, url, target.caption);
    const next = value.slice(0, target.start) + markdown + value.slice(target.end);
    onChange(next);
    notify.success("Image remplacée");
  };

  const applyTool = (action: ToolAction) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    let insert: string;
    let cursorStart: number;
    let cursorEnd: number;

    if (action.kind === "wrap") {
      const inner = selected || action.placeholder;
      insert = `${action.before}${inner}${action.after}`;
      cursorStart = start + action.before.length;
      cursorEnd = cursorStart + inner.length;
    } else if (action.kind === "link") {
      const inner = selected || action.placeholder;
      insert = `[${inner}](https://)`;
      cursorStart = start + 1 + inner.length + 2;
      cursorEnd = cursorStart + "https://".length;
    } else {
      const inner = selected || action.placeholder;
      insert = `${action.prefix}${inner}`;
      cursorStart = start + action.prefix.length;
      cursorEnd = cursorStart + inner.length;
    }

    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/[0.02] p-1.5">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.title}
                type="button"
                onClick={() => applyTool(t.action)}
                title={t.title}
                disabled={preview}
                className="rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <button
            type="button"
            title="Image (insérer, ou modifier la description/légende de l'image sous le curseur)"
            onClick={handleImageButton}
            disabled={preview || uploading}
            className="flex rounded-lg p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            disabled={preview || uploading}
            className="hidden"
          />
          <input
            ref={replaceFileRef}
            type="file"
            accept="image/*"
            onChange={handleReplaceImageFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/55 transition-colors hover:bg-white/10 hover:text-white"
          >
            {preview ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Éditer" : "Aperçu"}
          </button>
        </div>

        {preview ? (
          <div className="min-h-[240px] p-4" dir={dir}>
            {value.trim() ? (
              <MarkdownContent onImageClick={editImage}>{value}</MarkdownContent>
            ) : (
              <p className="text-sm text-white/30">Rien à prévisualiser.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            dir={dir}
            rows={rows}
            placeholder={placeholder}
            className="block w-full resize-y border-0 bg-transparent px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none [min-height:240px]"
          />
        )}
      </div>
      <p className="mt-1.5 text-xs text-white/35">
        Mise en forme Markdown prise en charge : **gras**, _italique_, ## titres, listes, [liens](url) et images.
        Placez le curseur sur une image existante puis cliquez sur l'icône image — ou cliquez sur une image en mode Aperçu — pour modifier sa description/légende ou remplacer le fichier.
      </p>
    </div>
  );
}
