"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import Link from "next/link";
import { BarChart3, BookOpen, FileText, Home, Settings, Users } from "lucide-react";
import { useInReviewEditions } from "@/features/editions/useInReviewEditions";

const NAV = [
  { label: "Office", href: "/", icon: Home, active: true },
  { label: "Agents", href: "/newsroom/agents", icon: Users },
  { label: "Editions", href: "/newsroom/editions", icon: FileText },
  { label: "Library", href: "/newsroom", icon: BookOpen },
  { label: "Analytics", href: "/newsroom/activity", icon: BarChart3 },
  { label: "Settings", href: "/newsroom", icon: Settings },
];

/**
 * Left rail — 276px, matching the right column, so the office building sits
 * exactly centred in the free space between the two side rails.
 */
export default function Sidebar() {
  const root = useRef<HTMLElement>(null);
  const { data: inReview } = useInReviewEditions();
  const inReviewCount = inReview.length;

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
      className="absolute border-r border-white/5 shadow-[4px_0_18px_rgba(0,0,0,0.35)]"
      style={{
        left: 0,
        top: 0,
        width: 276,
        height: 888,
        borderRadius: "0 0 22px 0",
        background: "linear-gradient(180deg, #151c31 0%, #101627 55%, #0c1222 100%)",
      }}
    >
      <span className="side-glow absolute rounded-full" style={{ left: 22, top: 26, width: 54, height: 48, background: "radial-gradient(circle, rgba(255,214,110,0.55), transparent 70%)" }} />
      <Image src="/ui/logo-moon.png" alt="" width={48} height={52} className="side-moon absolute" style={{ left: 26, top: 24 }} unoptimized />
      <div className="absolute text-[13px] leading-none text-[#dfe4ff]" style={{ left: 90, top: 33 }}>
        The Daily
      </div>
      <div className="absolute text-[24px] font-normal leading-none tracking-[0.1em] text-[#f2f4ff]" style={{ left: 90, top: 50 }}>
        NewsGarden
      </div>

      <div className="absolute text-[10px] font-medium uppercase tracking-[0.22em] text-[#8f97b8]" style={{ left: 30, top: 108 }}>
        Workspace
      </div>

      <nav className="absolute flex flex-col" style={{ left: 14, top: 132, width: 248, gap: 6 }}>
        {NAV.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            onMouseEnter={wiggle}
            className={`nav-item relative flex items-center rounded-2xl text-[15.5px] transition-colors ${
              active
                ? "bg-[#232c52] text-[#f2f4ff] shadow-[inset_0_0_0_1px_rgba(122,162,255,0.18)]"
                : "text-[#b8c0dc] hover:bg-white/5 hover:text-[#e8ecff]"
            }`}
            style={{ height: 48, paddingLeft: 18, paddingRight: 14, gap: 16 }}
          >
            <Icon size={22} fill={active || label === "Agents" || label === "Settings" ? "currentColor" : "none"} strokeWidth={active ? 1.5 : 1.8} />
            {label}
            {label === "Editions" && inReviewCount > 0 && (
              <span
                data-testid="sidebar-editions-badge"
                title={`${inReviewCount} edition${inReviewCount === 1 ? "" : "s"} waiting for approval`}
                className="absolute right-3 grid min-w-[24px] place-items-center rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[#1a1206]"
              >
                {inReviewCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="absolute" style={{ left: 24, right: 24, top: 668, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

      <Image src="/ui/sidebar-cat.png" alt="" width={88} height={47} className="side-cat absolute" style={{ left: 94, top: 692 }} unoptimized />
      <p className="absolute m-0 text-center text-[14px] leading-[19px] text-[#cfd5ee]" style={{ left: 24, right: 24, top: 748 }}>
        Good Ideas,<br />Better Tomorrows
      </p>
      <span className="absolute text-center text-[11px] text-[#8f97b8]" style={{ left: 24, right: 24, top: 848 }}>
        v0.1.0
      </span>
    </aside>
  );
}
