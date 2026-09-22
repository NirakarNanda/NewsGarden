"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import Link from "next/link";
import { BarChart3, BookOpen, FileText, Home, Settings, Users } from "lucide-react";

const NAV = [
  { label: "Office", href: "/", icon: Home, active: true },
  { label: "Agents", href: "/newsroom/agents", icon: Users },
  { label: "Editions", href: "/newsroom/editions", icon: FileText },
  { label: "Library", href: "/newsroom", icon: BookOpen },
  { label: "Analytics", href: "/newsroom/activity", icon: BarChart3 },
  { label: "Settings", href: "/newsroom", icon: Settings },
];

export default function Sidebar() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionOK()) return;
    const ctx = gsap.context(() => {
      gsap.to(".side-moon", { y: -2.5, rotation: 4, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.fromTo(".side-glow", { opacity: 0.25, scale: 0.9 }, { opacity: 0.7, scale: 1.15, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.to(".side-cat", { scaleY: 1.06, scaleX: 0.99, transformOrigin: "50% 100%", duration: 1.9, yoyo: true, repeat: -1, ease: "sine.inOut" });
      gsap.from(".nav-item", { x: -24, opacity: 0, stagger: 0.07, delay: 0.5, duration: 0.5, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, []);

  const wiggle = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector("svg");
    if (icon && motionOK())
      gsap.fromTo(icon, { rotation: -14, scale: 0.85 }, { rotation: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <aside
      ref={root}
      data-testid="sidebar"
      data-intro="sidebar"
      className="absolute border-r border-white/5 bg-[#141b29] shadow-[4px_0_18px_rgba(0,0,0,0.35)]"
      style={{ left: 0, top: 0, width: 130, height: 888, borderRadius: "0 0 22px 0" }}
    >
      <span className="side-glow absolute rounded-full" style={{ left: 12, top: 26, width: 46, height: 40, background: "radial-gradient(circle, rgba(255,214,110,0.55), transparent 70%)" }} />
      <img src="/ui/logo-moon.png" alt="" className="side-moon absolute" style={{ left: 14, top: 22, width: 42, height: 46 }} />
      <div className="absolute text-[11px] leading-none text-[#dfe4ff]" style={{ left: 57, top: 29 }}>
        The Daily
      </div>
      <div className="absolute text-[19px] font-normal leading-none tracking-[0.08em] text-[#f2f4ff]" style={{ left: 57, top: 43 }}>
        NEXA
      </div>

      <nav className="absolute flex flex-col" style={{ left: 8, top: 93, width: 113, gap: 1.5 }}>
        {NAV.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            onMouseEnter={wiggle}
            className={`nav-item flex items-center rounded-xl text-[14.5px] ${
              active ? "bg-[#20294a] text-[#f2f4ff]" : "text-[#b8c0dc] hover:bg-white/5"
            }`}
            style={{ height: 40, paddingLeft: 10, gap: 12 }}
          >
            <Icon size={20} fill={active || label === "Agents" || label === "Settings" ? "currentColor" : "none"} strokeWidth={active ? 1.5 : 1.8} />
            {label}
          </Link>
        ))}
      </nav>

      <img src="/ui/sidebar-cat.png" alt="" className="side-cat absolute" style={{ left: 14, top: 731, width: 78, height: 42 }} />
      <p className="absolute m-0 text-[12.5px] leading-[15px] text-[#cfd5ee]" style={{ left: 19, top: 775 }}>
        Good<br />Ideas<br />Better<br />Tomorrows
      </p>
      <span className="absolute text-[11px] text-[#8f97b8]" style={{ left: 19, top: 853 }}>
        v0.1.0
      </span>
    </aside>
  );
}
