import { useState } from "react";
import { Image as ImageIcon, RefreshCw, X, UploadCloud } from "lucide-react";
import { uploadImage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { notify } from "./notify";
import { FieldLabel } from "./primitives";

/** Compact button that uploads an image/video and reports back its URL. */
export function ImageUploadButton({
  onUploaded,
  label = "Photo",
  accept = "image/*",
}: {
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
}) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await notify.run(() => uploadImage(file, token), { error: "Échec de l'envoi" });
    setUploading(false);
    if (url) onUploaded(url);
    e.target.value = "";
  };

  return (
    <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/10">
      <input type="file" accept={accept} onChange={handleFile} className="hidden" />
      {uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
      {uploading ? "Envoi…" : label}
    </label>
  );
}

/** Full image field with drag preview + remove, bound to a URL value. */
export function ImageField({
  label,
  value,
  onChange,
  accept = "image/*",
  aspect = "aspect-video",
}: {
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  aspect?: string;
}) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await notify.run(() => uploadImage(file, token), { error: "Échec de l'envoi" });
    setUploading(false);
    if (url) onChange(url);
    e.target.value = "";
  };

  const isVideo = accept.includes("video");

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      {value ? (
        <div className={`relative ${aspect} w-full overflow-hidden rounded-xl border border-white/10 bg-black/30`}>
          {isVideo ? (
            <video src={value} className="h-full w-full object-cover" muted />
          ) : (
            <img src={value} alt="" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white/80 transition-colors hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={`flex ${aspect} w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 text-white/40 transition-colors hover:border-primary/40 hover:text-white/60`}
        >
          <input type="file" accept={accept} onChange={handleFile} className="hidden" />
          {uploading ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <UploadCloud className="h-6 w-6" />
              <span className="text-xs">{isVideo ? "Ajouter une vidéo" : "Ajouter une image"}</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
