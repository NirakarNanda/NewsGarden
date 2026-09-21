"use client";

import { useSyncExternalStore } from "react";
import { USE_MOCK } from "./api";

/**
 * Global backend connection state, derived from the health of every
 * polling channel (agents, activity, edition, events):
 *
 * - "demo"     — NEXT_PUBLIC_USE_MOCK=true; everything on screen is demo data.
 * - "live"     — every channel that reported recently succeeded.
 * - "degraded" — at least one channel failed and at least one succeeded.
 * - "offline"  — every channel that reported recently failed.
 *
 * Pollers report via reportChannel(); the state is a tiny module-level
 * store read with useSyncExternalStore, so any component can subscribe
 * without a provider. Reports older than STALE_MS are ignored, so a
 * channel that stops polling (e.g. socket.ts with no listeners) can't
 * pin the state forever.
 */

export type ConnectionState = "live" | "degraded" | "offline" | "demo";

const STALE_MS = 30_000;

interface ChannelHealth {
  ok: boolean;
  at: number;
}

const channels = new Map<string, ChannelHealth>();
const subscribers = new Set<() => void>();

function compute(): ConnectionState {
  if (USE_MOCK) return "demo";
  const now = Date.now();
  let ok = 0;
  let bad = 0;
  for (const h of channels.values()) {
    if (now - h.at > STALE_MS) continue;
    if (h.ok) ok += 1;
    else bad += 1;
  }
  if (bad > 0 && ok === 0) return "offline";
  if (bad > 0) return "degraded";
  return "live";
}

let current: ConnectionState = compute();

function emit(): void {
  const next = compute();
  if (next !== current) {
    current = next;
    subscribers.forEach((fn) => fn());
  }
}

/** A poller reports each tick: true when its endpoint answered, false on error. */
export function reportChannel(name: string, ok: boolean): void {
  channels.set(name, { ok, at: Date.now() });
  emit();
}

/** Non-react read of the current state (useful in tests and plain modules). */
export function getConnectionState(): ConnectionState {
  return current;
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Reactive global connection state. Re-renders the component on change. */
export function useConnection(): ConnectionState {
  return useSyncExternalStore(subscribe, getConnectionState, getConnectionState);
}
