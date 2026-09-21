import { gsap } from "@/lib/gsap";

export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** False when the OS asks for reduced motion - skip every loop. */
export const motionOK = () =>
  typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pause every GSAP animation while the tab is hidden, resume on return.
 * GSAP's own rAF ticker is throttled by the browser when hidden, but
 * pausing the global timeline additionally prevents time-based jumps
 * and wasted work (timelines would otherwise "catch up" on return).
 * Safe to call multiple times; returns a cleanup that restores play.
 */
export function watchVisibilityPause(): () => void {
  if (typeof document === "undefined") return () => {};
  const apply = () => {
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.play();
  };
  apply(); // handles mounting into an already-hidden tab
  document.addEventListener("visibilitychange", apply);
  return () => {
    document.removeEventListener("visibilitychange", apply);
    // Another owner may still want pause; only resume if nothing is hidden.
    if (!document.hidden) gsap.globalTimeline.play();
  };
}
