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

export interface ApiOptions {
  headers?: Record<string, string>;
}

/**
 * Every failed request throws this, so callers (and the dev console)
 * can see *which* endpoint failed and *how* — no more silent swallowing.
 * `status` is null for network-level failures (backend down, CORS block,
 * DNS, timeout).
 */
export class ApiError extends Error {
  readonly method: string;
  readonly path: string;
  readonly status: number | null;

  constructor(method: string, path: string, status: number | null) {
    super(
      status === null
        ? `${method} ${path} -> network error (backend unreachable?)`
        : `${method} ${path} -> ${status}`
    );
    this.name = "ApiError";
    this.method = method;
    this.path = path;
    this.status = status;
  }
}

// Dev-only: warn once per failing endpoint so breakage is visible in the
// console instead of hiding behind mock data. Deduped per failure streak —
// a success clears the flag, so a *new* outage warns again.
const warned = new Set<string>();

function warnOnce(method: string, path: string, status: number | null): void {
  if (process.env.NODE_ENV !== "development") return;
  const key = `${method} ${path}`;
  if (warned.has(key)) return;
  warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(
    `[NewsGarden] ${key} failed` +
      (status === null
        ? " (network error — is the backend running and the /api proxy rewrite in place?)"
        : ` (HTTP ${status})`)
  );
}

function clearWarning(method: string, path: string): void {
  warned.delete(`${method} ${path}`);
}

async function request<T>(method: "GET" | "POST", path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, init);
  } catch {
    warnOnce(method, path, null);
    throw new ApiError(method, path, null);
  }
  if (!res.ok) {
    warnOnce(method, path, res.status);
    throw new ApiError(method, path, res.status);
  }
  clearWarning(method, path);
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, opts?: ApiOptions): Promise<T> {
  return request<T>("GET", path, {
    cache: "no-store",
    headers: opts?.headers,
    signal: AbortSignal.timeout(4000),
  });
}

export async function apiPost<T>(path: string, body?: unknown, opts?: ApiOptions): Promise<T> {
  return request<T>("POST", path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...opts?.headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
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
