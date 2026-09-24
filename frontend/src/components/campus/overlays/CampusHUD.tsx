"use client";

import { useEffect, useRef, useState } from "react";
import { Sun } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import ConnectionPill from "@/components/ui/ConnectionPill";

export default function CampusHUD() {
  // Mount-gated clock: placeholder until the client takes over, so the
  // server HTML and the first client render match exactly.
  const [now, setNow] = useState<Date | null>(null);
  const colon = useRef<HTMLSpanElement>(null);
  const sun = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.to(colon.current, { opacity: 0.2, duration: 0.5, yoyo: true, repeat: -1, ease: "steps(1)", repeatDelay: 0.5 });
      gsap.to(sun.current, { rotation: 360, duration: 40, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
      gsap.to(sun.current, { scale: 1.12, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    });
    return () => ctx.revert();
  }, []);

  const date = now
    ? now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const [time, meridiem] = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).split(/\s/)
    : ["--:--", ""];
  const [hh, mm] = time.split(":");

  return (
    <div
      data-testid="campus-hud"
      className="w-full rounded-[14px] border border-white/5 bg-white/[0.03]"
      style={{ padding: "8px 12px" }}
    >
      {/* Row 1: date left, connection pill right — flex keeps them apart. */}
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[13px] leading-5 text-[#a9b0d0]">{date}</div>
        <ConnectionPill />
      </div>
      {/* Row 2: the time, with the sun riding beside it in-flow — nothing
          overlaps because nothing is absolutely positioned here. */}
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <div className="leading-7 text-[#eef0ff]">
          <span className="text-[28px] font-normal tracking-[0.02em]">
            {hh}
            <span ref={colon}>:</span>
            {mm}
          </span>{" "}
          <span className="text-[18px] font-light">{meridiem}</span>
        </div>
        <Sun ref={sun} className="shrink-0 text-[#fff1b8]" size={20} />
      </div>
    </div>
  );
}
