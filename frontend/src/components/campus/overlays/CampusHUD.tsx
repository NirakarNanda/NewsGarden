"use client";

import { useEffect, useRef, useState } from "react";
import { Sun } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import ConnectionPill from "@/components/ui/ConnectionPill";

export default function CampusHUD() {
  const [now, setNow] = useState(() => new Date());
  const colon = useRef<HTMLSpanElement>(null);
  const sun = useRef<SVGSVGElement>(null);

  useEffect(() => {
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

  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const [time, meridiem] = now
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    .split(/\s/);
  const [hh, mm] = time.split(":");

  return (
    <div
      className="absolute rounded-[14px] border border-white/5 bg-white/[0.03]"
      style={{ left: 11, top: 8, width: 254, height: 66, padding: "9px 14px" }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[14px] leading-5 text-[#a9b0d0]">{date}</div>
        {/* Sun sits at right:14 — keep the pill clear of it. */}
        <div className="mr-7">
          <ConnectionPill />
        </div>
      </div>
      <div className="mt-px leading-8 text-[#eef0ff]">
        <span className="text-[30px] font-normal tracking-[0.02em]">
          {hh}
          <span ref={colon}>:</span>
          {mm}
        </span>{" "}
        <span className="text-[20px] font-light">{meridiem}</span>
      </div>
      <Sun ref={sun} className="absolute text-[#fff1b8]" size={22} style={{ right: 14, top: 12 }} />
    </div>
  );
}
