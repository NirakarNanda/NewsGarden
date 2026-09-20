export const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** False when the OS asks for reduced motion - skip every loop. */
export const motionOK = () =>
  typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
