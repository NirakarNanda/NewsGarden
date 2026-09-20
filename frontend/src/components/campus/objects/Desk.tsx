/**
 * Isometric desk: parallelogram top, four legs, a little clutter
 * (papers + mug) so workstations feel lived-in.
 */
export default function Desk({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 150;
  const h = 95;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w * scale, height: h * scale, pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        {/* legs */}
        <rect x="18" y="34" width="8" height="56" fill="#4a3320" />
        <rect x="124" y="34" width="8" height="56" fill="#4a3320" />
        <rect x="52" y="44" width="7" height="48" fill="#3d2b1c" />
        <rect x="92" y="44" width="7" height="48" fill="#3d2b1c" />
        {/* iso top */}
        <polygon points="8,36 52,18 142,18 98,36" fill="#a9743f" />
        <polygon points="8,36 98,36 98,44 8,44" fill="#7c5228" />
        <polygon points="98,36 142,18 142,26 98,44" fill="#8a5f33" />
        <polygon points="8,36 52,18 142,18 98,36" fill="#ffffff" opacity="0.06" />
        {/* papers */}
        <polygon points="60,26 84,26 76,33 52,33" fill="#f5efe0" opacity="0.95" />
        <polygon points="64,29 80,29 76,33 60,33" fill="#d8d2c2" opacity="0.9" />
        {/* mug */}
        <rect x="104" y="20" width="10" height="12" rx="2" fill="#c96f4a" />
        <rect x="114" y="23" width="4" height="6" rx="2" fill="none" stroke="#c96f4a" strokeWidth="2" />
      </svg>
    </div>
  );
}
