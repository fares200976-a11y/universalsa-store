import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ Panel */

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#111118] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {description && <p className="text-sm text-white/45">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Search */

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-white/30 transition-colors focus:border-primary/50 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- Badge */

type BadgeTone = "primary" | "green" | "amber" | "red" | "blue" | "purple" | "neutral";

const BADGE_TONES: Record<BadgeTone, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  green: "bg-green-500/15 text-green-400 border-green-500/30",
  amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  red: "bg-red-500/15 text-red-400 border-red-500/30",
  blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  neutral: "bg-white/10 text-white/60 border-white/15",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- IconButton */

export function IconButton({
  icon,
  onClick,
  title,
  tone = "neutral",
  disabled = false,
}: {
  icon: ReactNode;
  onClick?: () => void;
  title?: string;
  tone?: "neutral" | "danger" | "primary";
  disabled?: boolean;
}) {
  const tones = {
    neutral: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
    danger: "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20",
    primary: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${tones[tone]}`}
    >
      {icon}
    </button>
  );
}

/* -------------------------------------------------------------- Buttons */

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  loading = false,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 ${className}`}
    >
      {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Fields */

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:border-primary/50 focus:outline-none";

export function TextInput({
  label,
  className = "",
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input {...props} className={inputClass} />
    </div>
  );
}

export function TextArea({
  label,
  className = "",
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea {...props} className={`${inputClass} min-h-[90px] resize-y`} />
    </div>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <select
        {...props}
        className={`${inputClass} cursor-pointer appearance-none bg-[#111118]`}
      >
        {children}
      </select>
    </div>
  );
}

/* ----------------------------------------------------------------- Toggle */

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex items-center gap-2.5 disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      {label && <span className="text-sm text-white/70">{label}</span>}
    </button>
  );
}

/* ----------------------------------------------------------------- Modal */

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative my-8 w-full ${widths[size]} rounded-2xl border border-white/10 bg-[#15151d] p-5 shadow-2xl sm:p-6`}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/30">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <p className="text-sm font-semibold text-white/70">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-white/40">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------------- Skeleton */

export function SkeletonRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-white/5 bg-white/5"
        />
      ))}
    </div>
  );
}

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="py-16 text-center text-white/40">
      <RefreshCw className="mx-auto mb-3 h-6 w-6 animate-spin opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------- StatCard */

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: BadgeTone;
  hint?: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
        </div>
        {icon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${BADGE_TONES[tone]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- Pagination */

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const paged = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );

  return {
    page: current,
    setPage,
    pageCount,
    paged,
    total: items.length,
    reset: () => setPage(1),
  };
}

export function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (pageCount <= 1) {
    return (
      <p className="px-1 py-3 text-xs text-white/35">{total} élément{total > 1 ? "s" : ""}</p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3">
      <p className="text-xs text-white/35">
        Page {page} / {pageCount} · {total} élément{total > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1.5">
        <IconButton
          icon={<ChevronLeft className="h-4 w-4" />}
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          title="Précédent"
        />
        <IconButton
          icon={<ChevronRight className="h-4 w-4" />}
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          title="Suivant"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Image upload field */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
