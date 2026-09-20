const NOTES = [
  { x: 14, y: 16, c: "#f2d066", r: -6 },
  { x: 52, y: 12, c: "#e8879a", r: 4 },
  { x: 88, y: 18, c: "#a3c98a", r: -3 },
  { x: 30, y: 52, c: "#9fe8ff", r: 5 },
  { x: 72, y: 54, c: "#f5efe0", r: -5 },
];

/** Cork notice board with pinned notes. */
export default function NoticeBoard({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 130;
  const h = 96;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w * scale, height: h * scale, pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        <rect x="2" y="2" width={w - 4} height={h - 4} rx="4" fill="#6b4a2f" />
        <rect x="8" y="8" width={w - 16} height={h - 16} rx="2" fill="#b98d55" />
        <rect x="8" y="8" width={w - 16} height={h - 16} rx="2" fill="#8a5f3d" opacity="0.25" />
        {NOTES.map((n, i) => (
          <g key={i} transform={`translate(${n.x},${n.y}) rotate(${n.r})`}>
            <rect x="0" y="0" width="26" height="22" rx="1.5" fill={n.c} opacity="0.95" />
            <rect x="4" y="5" width="18" height="2" rx="1" fill="#221c12" opacity="0.35" />
            <rect x="4" y="10" width="13" height="2" rx="1" fill="#221c12" opacity="0.25" />
            <circle cx="13" cy="1.5" r="2.4" fill="#c0392b" />
          </g>
        ))}
      </svg>
    </div>
  );
}
