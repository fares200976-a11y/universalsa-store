export const API_BASE = "/api";

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper for the admin. Attaches the bearer token, serializes JSON
 * bodies, and throws an ApiError with the server message on non-2xx responses.
 */
export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body, token, signal }: ApiFetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) Object.assign(headers, authHeader(token));
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : typeof data === "string" && data
          ? data
          : `Erreur ${res.status}`) || `Erreur ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/** Upload a single file (image or video) and return its public URL. */
export async function uploadImage(file: File, token: string): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: authHeader(token),
    body: fd,
  });
  if (!res.ok) {
    let msg = "Échec de l'envoi du fichier";
    try {
      const d = await res.json();
      if (d?.error) msg = String(d.error);
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status);
  }
  const data = await res.json();
  return data.url as string;
}
