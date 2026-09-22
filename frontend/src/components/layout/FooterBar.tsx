"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK, rand } from "@/lib/motion";

export default function FooterBar() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionOK()) return;
    let alive = true;
    const ctx = gsap.context(() => {
      gsap.to(".foot-cat", { scaleY: 1.05, scaleX: 0.99, transformOrigin: "50% 100%", duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".foot-leaf", { rotation: 7, transformOrigin: "50% 100%", duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
      // sleepy "z" drifting off the cat
      const z = () => {
        if (!alive) return;
        const el = document.createElement("span");
        el.textContent = "z";
        Object.assign(el.style, { position: "absolute", left: "1462px", top: "936px", fontSize: "12px", color: "#c5cbe6", fontFamily: "var(--font-pixel)" });
        root.current?.appendChild(el);
        gsap.fromTo(el, { y: 0, x: 0, opacity: 0, scale: 0.7 }, { y: -22, x: 10, opacity: 1, scale: 1.3, duration: 2.4, ease: "sine.out", onComplete: () => el.remove() });
        gsap.to(el, { opacity: 0, duration: 0.8, delay: 1.6 });
        gsap.delayedCall(rand(1.6, 2.6), z);
      };
      gsap.delayedCall(2, z);
    }, root);
    return () => {
      alive = false;
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} data-intro="footer" className="absolute inset-0 pointer-events-none">
      <svg width="1536" height="1024" viewBox="0 0 1536 1024" className="absolute inset-0">
        <defs>
          <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2635" />
            <stop offset="1" stopColor="#141c2a" />
          </linearGradient>
        </defs>
        <path
          data-testid="footer-bar"
          d="M54 925 H372 Q386 925 390 938 L396 952 Q400 965 414 965 H1000 Q1014 965 1018 952 L1022 936 Q1026 922 1040 922 H1500 Q1515 922 1515 937 V1000 Q1515 1015 1500 1015 H54 Q40 1015 40 1000 V939 Q40 925 54 925 Z"
          fill="url(#bar)"
          stroke="rgba(140,155,200,0.22)"
          strokeWidth="2"
        />
      </svg>

      <Image src="/ui/leaf.png" alt="" width={36} height={34} className="foot-leaf absolute" style={{ left: 78, top: 956 }} unoptimized />
      <p className="absolute m-0 text-[10.5px] leading-[13.5px] text-[#b9c0d8]" style={{ left: 146, top: 944 }}>
        A curious<br />newsroom<br />for a brighter<br />tomorrow.
      </p>

      <p className="absolute m-0 text-right text-[13px] text-[#c5cbe6]" style={{ right: 186, top: 955 }}>
        &ldquo;Ideas work while you sleep.&rdquo;
      </p>
      <p className="absolute m-0 text-right text-[10px] text-[#9aa3c6]" style={{ right: 186, top: 978 }}>
        – The AI Newsroom
      </p>
      <Image src="/ui/footer-cat.png" alt="" width={114} height={80} className="foot-cat absolute" style={{ left: 1380, top: 926 }} unoptimized />
    </div>
  );
}
