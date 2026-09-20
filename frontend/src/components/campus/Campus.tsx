"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import { STAGE_HEIGHT, STAGE_WIDTH } from "@/lib/constants";
import { SPRITES, type SpriteDef } from "@/lib/sprites";
import CampusMap from "./CampusMap";
import AgentSprite from "./agents/AgentSprite";
import EditionProgress from "./overlays/EditionProgress";
import ActivityTimeline from "./overlays/ActivityTimeline";
import Sidebar from "@/components/layout/Sidebar";
import FooterBar from "@/components/layout/FooterBar";

/* ------------------------------------------------------------------ */
/*  How the layout fills any window                                    */
/*                                                                     */
/*  The scene is designed at 1536x1024. We scale it uniformly (no      */
/*  stretching) until it touches the window, then use the leftover     */
/*  width/height as extra "world":                                     */
/*    - the campus building is centred, with a pixel-art lawn on both  */
/*      sides (and below, on tall windows)                             */
/*    - the sidebar stays on the left edge, the two panels on the      */
/*      right edge, the footer along the bottom edge                   */
/* ------------------------------------------------------------------ */

// The building inside the reference art (removes the baked-in UI around it).
const BUILDING_CLIP =
  "polygon(131px 0px, 1246px 0px, 1246px 922px, 1008px 922px, 1008px 968px, 396px 968px, 396px 922px, 131px 922px)";

const GRASS = {
  base: "#447e4c",
  light: "#659247",
  dark: "#325b45",
  deep: "#22443a",
  flowers: ["#e8879a", "#f2d066", "#f4efe0"],
};

/** Small seeded PRNG so the lawn looks the same on every load. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Seamless pixel-art grass tile, drawn once on a canvas. */
function makeLawnTile(): string {
  const N = 64; // cells per side
  const C = 4; // px per cell
  const rand = lcg(20);
  const at = (x: number, y: number) => ((y + N) % N) * N + ((x + N) % N);
  const cells: string[] = new Array(N * N).fill(GRASS.base);

  for (let i = 0; i < N * N; i++) {
    const r = rand();
    if (r < 0.16) cells[i] = GRASS.light;
    else if (r < 0.28) cells[i] = GRASS.dark;
  }
  // darker soft patches
  for (let b = 0; b < 7; b++) {
    const cx = Math.floor(rand() * N);
    const cy = Math.floor(rand() * N);
    const rad = 4 + Math.floor(rand() * 5);
    for (let y = -rad; y <= rad; y++)
      for (let x = -rad; x <= rad; x++)
        if (x * x + y * y <= rad * rad && rand() < 0.55) cells[at(cx + x, cy + y)] = GRASS.dark;
  }
  // grass blades
  for (let b = 0; b < 46; b++) {
    const x = Math.floor(rand() * N);
    const y = Math.floor(rand() * N);
    cells[at(x, y)] = GRASS.deep;
    cells[at(x, y + 1)] = GRASS.deep;
    cells[at(x, y - 1)] = GRASS.light;
  }
  // a few flowers
  for (let f = 0; f < 5; f++) {
    const x = Math.floor(rand() * N);
    const y = Math.floor(rand() * N);
    cells[at(x, y)] = GRASS.flowers[Math.floor(rand() * GRASS.flowers.length)];
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = N * C;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      ctx.fillStyle = cells[y * N + x];
      ctx.fillRect(x * C, y * C, C, C);
    }
  return canvas.toDataURL("image/png");
}

/** Trees and bushes (from the reference art) scattered over the lawn gutters. */
function lawnDecor(extra: number): SpriteDef[] {
  if (extra < 200) return [];
  const pool = ["tree-left", "tree-right", "bush-left", "bush-right", "flowers"]
    .map((id) => SPRITES.find((s) => s.id === id))
    .filter((s): s is SpriteDef => !!s);
  const rand = lcg(7);
  const gutters = [
    { from: 150, to: 131 + extra / 2 - 12 }, // left of the building
    { from: 1246 + extra / 2 + 12, to: 1240 + extra - 12 }, // right of the building
  ];
  const out: SpriteDef[] = [];
  for (const g of gutters) {
    const width = g.to - g.from;
    if (width < 90) continue;
    let y = 30 + rand() * 50;
    while (y < 800) {
      const base = pool[Math.floor(rand() * pool.length)];
      const x = g.from + rand() * Math.max(0, width - base.w);
      out.push({ ...base, x, y });
      y += base.h * 0.75 + rand() * 110;
    }
  }
  return out.sort((a, b) => a.y + a.h - (b.y + b.h));
}

export default function Campus() {
  const [mounted, setMounted] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [vp, setVp] = useState({ w: STAGE_WIDTH, h: STAGE_HEIGHT });
  const [lawn, setLawn] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setLawn(makeLawnTile());
  }, []);

  // Track the real window size (also fires when entering/leaving full screen).
  useEffect(() => {
    const fit = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const sync = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  // Uniform scale + the leftover space in design pixels.
  const u = Math.min(vp.w / STAGE_WIDTH, vp.h / STAGE_HEIGHT);
  const W = vp.w / u;
  const H = vp.h / u;
  const extraX = Math.max(0, Math.round(W - STAGE_WIDTH));
  const extraY = Math.max(0, H - STAGE_HEIGHT);
  const wide = extraX > 0;

  const decor = useMemo(() => lawnDecor(extraX), [extraX]);

  // Opening sequence: scene fades in, then sidebar, panels and footer arrive.
  useEffect(() => {
    if (!mounted || !motionOK()) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-intro=lawn]", { opacity: 0, duration: 0.8 })
        .from("[data-intro=map]", { opacity: 0, scale: 1.04, duration: 1.1 }, "-=0.5")
        .from("[data-intro=sidebar]", { x: -140, opacity: 0, duration: 0.7 }, "-=0.7")
        .from("[data-intro=panel]", { x: 70, opacity: 0, duration: 0.7, stagger: 0.14 }, "-=0.5")
        .from("[data-intro=footer]", { y: 70, opacity: 0, duration: 0.7 }, "-=0.5");
    }, stage);
    return () => ctx.revert();
  }, [mounted]);

  // Clock/activity are time-based, so render on the client only.
  if (!mounted) return null;

  const frame = { position: "absolute", left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT } as const;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: GRASS.base }}>
      <div
        ref={stage}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `scale(${u})`,
          transformOrigin: "0 0",
          overflow: "hidden",
        }}
      >
        {/* Lawn, full window */}
        <div
          data-intro="lawn"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: GRASS.base,
            backgroundImage: lawn ? `url(${lawn})` : undefined,
            backgroundSize: "256px 256px",
            imageRendering: "pixelated",
          }}
        >
          {/* soft vignette toward the window edges */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at center, transparent 55%, rgba(8,20,24,0.4) 100%)",
            }}
          />
        </div>

        {/* Trees and bushes on the lawn */}
        {decor.map((d, i) => (
          <AgentSprite key={`${d.id}-${i}`} def={d} />
        ))}

        {/* The campus building, centred and cropped to remove baked-in UI */}
        <div style={{ ...frame, transform: `translateX(${Math.round(extraX / 2)}px)`, clipPath: BUILDING_CLIP }}>
          <CampusMap />
        </div>

        {/* Left edge */}
        <Sidebar />

        {/* Right edge */}
        <div style={{ ...frame, transform: `translateX(${extraX}px)`, pointerEvents: "none" }}>
          <div style={{ pointerEvents: "auto" }}>
            <EditionProgress />
            <ActivityTimeline />
          </div>
        </div>

        {/* Bottom edge: stretch the footer by joining its two ends */}
        <div style={{ ...frame, transform: `translateY(${extraY}px)`, pointerEvents: "none" }}>
          {wide ? (
            <>
              <div style={{ ...frame, clipPath: "inset(0 768px 0 0)" }}>
                <FooterBar />
              </div>
              <svg
                width={extraX + 2}
                height={STAGE_HEIGHT}
                style={{ position: "absolute", left: 767, top: 0 }}
                data-intro="footer"
              >
                <defs>
                  <linearGradient id="footer-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1c2635" />
                    <stop offset="1" stopColor="#141c2a" />
                  </linearGradient>
                </defs>
                <rect x="0" y="965" width={extraX + 2} height="50" fill="url(#footer-fill)" />
                <path
                  d={`M0 965 H${extraX + 2} M0 1015 H${extraX + 2}`}
                  stroke="rgba(140,155,200,0.22)"
                  strokeWidth="2"
                />
              </svg>
              <div style={{ ...frame, left: extraX, clipPath: "inset(0 0 0 768px)" }}>
                <FooterBar />
              </div>
            </>
          ) : (
            <FooterBar />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFull ? "Exit full screen" : "Enter full screen"}
        title={isFull ? "Exit full screen" : "Full screen"}
        className="fixed right-3 bottom-3 z-50 grid size-9 place-items-center rounded-lg border border-white/10 bg-[#141b29]/80 text-[#dfe4ff] opacity-60 backdrop-blur transition hover:opacity-100"
      >
        {isFull ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}