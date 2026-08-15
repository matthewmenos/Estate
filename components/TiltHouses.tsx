"use client";

import { useEffect, useRef, useState } from "react";

type HouseVariant = 1 | 2 | 3;

type HouseSpec = {
  variant: HouseVariant;
  color: string;
  top: string;
  left: string;
  size: number;
  depth: number; // 0 (far) → 1 (near) — drives parallax distance and translateZ
  floatDelay: number;
};

const INK = "#17233D";
const RUST = "#9C3F24";
const GOLD = "#B4880B";

// Spread across the full hero width, back-to-front so nearer houses move
// more under parallax — a real depth cue, not just decoration.
const FULL_SCENE: HouseSpec[] = [
  { variant: 1, color: INK, top: "58%", left: "4%", size: 64, depth: 0.25, floatDelay: 0 },
  { variant: 2, color: RUST, top: "48%", left: "14%", size: 86, depth: 0.5, floatDelay: 0.8 },
  { variant: 3, color: INK, top: "62%", left: "26%", size: 58, depth: 0.2, floatDelay: 1.6 },
  { variant: 1, color: GOLD, top: "40%", left: "38%", size: 104, depth: 0.75, floatDelay: 0.4 },
  { variant: 2, color: INK, top: "60%", left: "52%", size: 68, depth: 0.3, floatDelay: 2.1 },
  { variant: 3, color: RUST, top: "45%", left: "64%", size: 92, depth: 0.6, floatDelay: 1.1 },
  { variant: 1, color: INK, top: "58%", left: "78%", size: 60, depth: 0.25, floatDelay: 0.2 },
  { variant: 2, color: RUST, top: "50%", left: "88%", size: 78, depth: 0.45, floatDelay: 1.8 },
];

const ACCENT_SCENE: HouseSpec[] = [
  { variant: 1, color: GOLD, top: "12%", left: "78%", size: 90, depth: 0.6, floatDelay: 0 },
  { variant: 2, color: INK, top: "68%", left: "6%", size: 70, depth: 0.35, floatDelay: 1.2 },
];

function HouseShape({ variant, color }: { variant: HouseVariant; color: string }) {
  // All three variants share the roofline language from the site's logo/seal.
  if (variant === 1) {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path d="M18 62 L18 40 L50 20 L82 40 L82 62" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="62" x2="82" y2="62" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <rect x="44" y="48" width="12" height="14" fill={color} />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path d="M14 66 L14 44 L50 18 L86 44 L86 66" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="66" x2="86" y2="66" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <line x1="70" y1="30" x2="70" y2="12" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <rect x="30" y="50" width="14" height="16" fill={color} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path d="M10 60 L36 60 L36 34 L64 34 L64 60 L90 60" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="60" x2="90" y2="60" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <rect x="46" y="44" width="10" height="16" fill={color} />
    </svg>
  );
}

export default function TiltHouses({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "accent";
  className?: string;
}) {
  const houses = variant === "full" ? FULL_SCENE : ACCENT_SCENE;
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    // Skip the cursor-tilt listener entirely for reduced-motion or touch —
    // houses still render, just static aside from the gentle CSS float.
    if (reduceMotion || noHover) return;

    let raf = 0;
    function handleMove(e: MouseEvent) {
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTilt({ rx: px * 10, ry: -py * 8 }));
    }
    function handleLeave() {
      setTilt({ rx: 0, ry: 0 });
    }

    const node = containerRef.current;
    node?.addEventListener("mousemove", handleMove);
    node?.addEventListener("mouseleave", handleLeave);
    return () => {
      node?.removeEventListener("mousemove", handleMove);
      node?.removeEventListener("mouseleave", handleLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none [perspective:1200px] ${className}`}
    >
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${tilt.rx}deg) rotateX(${tilt.ry}deg)` }}
      >
        {houses.map((h, i) => (
          <div
            key={i}
            className="absolute animate-house-float"
            style={{
              top: h.top,
              left: h.left,
              width: h.size,
              height: h.size,
              opacity: 0.3 + h.depth * 0.55,
              animationDelay: `${h.floatDelay}s`,
              transform: `translateZ(${h.depth * 70}px) translate(${tilt.rx * h.depth * 1.6}px, ${tilt.ry * h.depth * 1.3}px)`,
            }}
          >
            <HouseShape variant={h.variant} color={h.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
