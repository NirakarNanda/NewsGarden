const SPINES = ["#c96f4a", "#7fb3d5", "#a3c98a", "#e0b64f", "#9b8cd9", "#d98a9b", "#6fc2b4"];

export default function Bookshelf({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 120;
  const h = 150;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w * scale, height: h * scale, pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        {/* frame */}
        <rect x="4" y="4" width={w - 8} height={h - 8} rx="3" fill="#6b4a2f" />
        <rect x="10" y="10" width={w - 20} height={h - 20} fill="#3d2b1c" />
        {/* shelves */}
        {[0, 1, 2].map((s) => {
          const sy = 16 + s * 42;
          return (
            <g key={s}>
              {SPINES.map((c, i) => (
                <rect
                  key={i}
                  x={16 + i * 14}
                  y={sy + (i % 3)}
                  width="11"
                  height={34 - (i % 3)}
                  rx="1.5"
                  fill={c}
                  opacity="0.92"
                />
              ))}
              <rect x="10" y={sy + 36} width={w - 20} height="5" fill="#6b4a2f" />
            </g>
          );
        })}
        {/* warm top glow */}
        <rect x="4" y="4" width={w - 8} height="6" rx="3" fill="#8a5f3d" opacity="0.8" />
      </svg>
    </div>
  );
}
