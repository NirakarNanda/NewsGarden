/*
 * In the browser, API calls go to the relative /api/... path, which
 * next.config.ts rewrites() proxies to the backend — no CORS involved.
 * NEXT_PUBLIC_API_URL remains as an opt-in override for deployments where
 * the backend lives on another origin. Server-side, fall back to the
 * internal backend URL when no override is set.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? (process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000")
    : "");
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Accepts `[...]`, `{ data: [...] }` or `{ <key>: [...] }`. */
export function unwrapList(raw: unknown, key: string): Record<string, unknown>[] {
  const o = raw as Record<string, unknown> | null;
  const list = Array.isArray(raw) ? raw : (o?.data ?? o?.[key]);
  if (!Array.isArray(list)) throw new Error("Unexpected response shape");
  return list as Record<string, unknown>[];
}

export const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
export const num = (v: unknown) => {
  if (typeof v !== "number") throw new Error("Expected number");
  return v;
};
