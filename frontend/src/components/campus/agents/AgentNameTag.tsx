export default function AgentNameTag({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="inline-flex flex-col items-start rounded-md border border-white/10 bg-[#0b0f1a]/85 px-2 py-1 leading-none shadow-md backdrop-blur-sm">
      <span
        className="text-[11px] font-medium tracking-wide text-[#e6e9ff]"
        style={{ fontFamily: "var(--font-pixel)" }}
      >
        {name}
      </span>
      {sub && <span className="mt-0.5 text-[9px] uppercase tracking-widest text-[#8f97b8]">{sub}</span>}
    </span>
  );
}
