export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
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
