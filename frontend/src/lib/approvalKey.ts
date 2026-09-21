"use client";

/**
 * Approval API key handling.
 *
 * The key is typed into the UI (ApprovalPanel / edition run control),
 * kept in this tab's sessionStorage only — never localStorage, never a
 * cookie — and sent as the `x-api-key` header on mutating requests.
 * The backend accepts requests without a key when API_KEY is unset.
 */

const STORAGE_KEY = "newsgarden.approvalKey";

export function loadApprovalKey(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(STORAGE_KEY) ?? "";
}

export function saveApprovalKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) window.sessionStorage.setItem(STORAGE_KEY, value);
  else window.sessionStorage.removeItem(STORAGE_KEY);
}

export function authHeaders(key: string): Record<string, string> | undefined {
  return key ? { "x-api-key": key } : undefined;
}
