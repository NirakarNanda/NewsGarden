"use client";

import { useEffect, useState } from "react";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/constants";

/** Scale factor that fits the 1536x1024 stage inside the window. */
export function useStageScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return scale;
}
