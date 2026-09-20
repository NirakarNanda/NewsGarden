/** A slightly messy stack of freshly printed papers. */
export default function NewspaperStack({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 74;
  const h = 52;
  const sheets = [0, 1, 2, 3, 4];
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w * scale, height: h * scale, pointerEvents: "none" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">
        {sheets.map((i) => (
          <g key={i} transform={`translate(${i % 2 === 0 ? i : -i}, ${h - 12 - i * 7})`}>
            <rect x="4" y="0" width={w - 10} height="10" rx="1" fill={i === sheets.length - 1 ? "#f7f2e7" : "#e4dcc8"} stroke="#221c12" strokeOpacity="0.15" />
            {i === sheets.length - 1 && (
              <g fill="#221c12" opacity="0.55">
                <rect x="10" y="2.5" width="30" height="2.4" rx="1" />
                <rect x="10" y="6" width="44" height="1.6" rx="0.8" opacity="0.7" />
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
