"use client";

import { memo, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { motionOK } from "@/lib/motion";
import type { AgentStatus } from "@/types/agent";
import type { BubbleSpec } from "@/types/campus";

const INK = "#3b2d3c";

export default memo(function AgentBubble({
  spec,
  text,
  status,
  title,
}: {
  spec: BubbleSpec;
  text: string;
  status?: AgentStatus;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  // Gentle idle float, desynced per bubble.
  useEffect(() => {
    if (!float.current || !motionOK()) return;
    const t = gsap.to(float.current, { y: -2, duration: 1.3 + Math.random() * 0.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: Math.random() });
    return () => {
      t.kill();
    };
  }, []);

  // Pop when the real agent state changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (ref.current && motionOK())
      gsap.fromTo(ref.current, { scale: 0.85, y: 3 }, { scale: 1, y: 0, duration: 0.35, ease: "back.out(2)" });
  }, [text]);

  const bg = status === "error" ? "#ffd9d9" : "#fbf6e6";

  return (
    <div
      ref={float}
      style={{
        position: "absolute",
        left: spec.left + spec.width / 2,
        top: spec.top,
        width: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        ref={ref}
        title={title}
        style={{
          position: "relative",
          flex: "none",
          minWidth: spec.width,
          height: spec.height,
          padding: "0 8px",
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
          whiteSpace: "nowrap",
          background: bg,
          border: `2px solid ${INK}`,
          borderRadius: 7,
          color: "#2b2233",
          fontFamily: "var(--font-pixel)",
          fontSize: 14,
          transformOrigin: `${spec.tailX}px 100%`,
        }}
      >
        {text}
        <span
          style={{
            position: "absolute",
            left: spec.tailX - 4,
            bottom: -6,
            width: 9,
            height: 9,
            background: bg,
            borderRight: `2px solid ${INK}`,
            borderBottom: `2px solid ${INK}`,
            transform: "rotate(45deg)",
          }}
        />
      </div>
    </div>
  );
});
