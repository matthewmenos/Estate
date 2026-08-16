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
  turnDir: 1 | -1; // which way this mansion turns on hover, for visual variety
};

const INK = "#17233D";
const RUST = "#9C3F24";
const GOLD = "#B4880B";

// Spread across the full hero width, back-to-front so nearer mansions move
// more under parallax — a real depth cue, not just decoration.
const FULL_SCENE: HouseSpec[] = [
  { variant: 2, color: INK, top: "56%", left: "3%", size: 92, depth: 0.25, floatDelay: 0, turnDir: 1 },
  { variant: 1, color: RUST, top: "44%", left: "15%", size: 130, depth: 0.5, floatDelay: 0.8, turnDir: -1 },
  { variant: 3, color: INK, top: "58%", left: "30%", size: 84, depth: 0.2, floatDelay: 1.6, turnDir: 1 },
  { variant: 1, color: GOLD, top: "34%", left: "44%", size: 156, depth: 0.75, floatDelay: 0.4, turnDir: -1 },
  { variant: 2, color: INK, top: "56%", left: "60%", size: 96, depth: 0.3, floatDelay: 2.1, turnDir: 1 },
  { variant: 3, color: RUST, top: "40%", left: "72%", size: 136, depth: 0.6, floatDelay: 1.1, turnDir: -1 },
  { variant: 2, color: INK, top: "56%", left: "88%", size: 88, depth: 0.25, floatDelay: 0.2, turnDir: 1 },
];

const ACCENT_SCENE: HouseSpec[] = [
  { variant: 1, color: GOLD, top: "8%", left: "74%", size: 128, depth: 0.6, floatDelay: 0, turnDir: -1 },
  { variant: 2, color: INK, top: "66%", left: "4%", size: 100, depth: 0.35, floatDelay: 1.2, turnDir: 1 },
];

// Three "mansion-grade" facades — symmetric, columned, more ornate than a
// simple gable house — while staying simple enough to read at small sizes.
// Landscape 130×100 viewBox for a grand, low-and-wide proportion.
function HouseShape({ variant, color }: { variant: HouseVariant; color: string }) {
  if (variant === 1) {
    // Colonial: pediment roof, colonnade, symmetric windows.
    return (
      <svg viewBox="0 0 130 100" width="100%" height="100%">
        <path d="M8 44 L65 12 L122 44" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="44" x2="118" y2="44" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <rect x="12" y="44" width="106" height="46" fill="none" stroke={color} strokeWidth="4" />
        {[22, 42, 88, 108].map((x) => (
          <line key={x} x1={x} y1="48" x2={x} y2="90" stroke={color} strokeWidth="3" strokeLinecap="round" />
        ))}
        <rect x="57" y="66" width="16" height="24" fill={color} />
        {[28, 65, 102].map((x) => (
          <rect key={x} x={x - 7} y="52" width="14" height="10" fill={color} fillOpacity="0.55" />
        ))}
      </svg>
    );
  }
  if (variant === 2) {
    // Manor: central cupola/dome, hip roof, flanking wings.
    return (
      <svg viewBox="0 0 130 100" width="100%" height="100%">
        <circle cx="65" cy="16" r="6" fill="none" stroke={color} strokeWidth="3.5" />
        <line x1="65" y1="22" x2="65" y2="32" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M20 46 L65 24 L110 46" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="46" width="62" height="44" fill="none" stroke={color} strokeWidth="4" />
        <path d="M4 62 L20 50 L20 90 L4 90 Z" fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M126 62 L110 50 L110 90 L126 90 Z" fill="none" stroke={color} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="58" y="68" width="14" height="22" fill={color} />
        {[44, 86].map((x) => (
          <rect key={x} x={x - 6} y="54" width="12" height="10" fill={color} fillOpacity="0.55" />
        ))}
      </svg>
    );
  }
  // Villa: flat balustrade roofline, arched entrance, wide symmetric windows.
  return (
    <svg viewBox="0 0 130 100" width="100%" height="100%">
      <line x1="10" y1="30" x2="120" y2="30" stroke={color} strokeWidth="4" strokeLinecap="round" />
      {[16, 30, 44, 58, 72, 86, 100, 114].map((x) => (
        <line key={x} x1={x} y1="22" x2={x} y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" />
      ))}
      <rect x="10" y="30" width="110" height="60" fill="none" stroke={color} strokeWidth="4" />
      <path d="M56 90 L56 68 A9 9 0 0 1 74 68 L74 90" fill="none" stroke={color} strokeWidth="3.5" />
      {[24, 96].map((x) => (
        <rect key={x} x={x - 9} y="40" width="18" height="14" fill={color} fillOpacity="0.55" />
      ))}
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
  const [hovered, setHovered] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    setReduceMotion(reduce);
    // Skip the scene-wide cursor-tilt listener for reduced-motion or touch —
    // per-house hover-turn still works on both, since it's a direct response
    // to a deliberate hover, not ambient background motion.
    if (reduce || noHover) return;

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
      className={`absolute inset-0 overflow-hidden [perspective:1400px] ${className}`}
    >
      <div
        className="relative w-full h-full pointer-events-none transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform: `rotateY(${tilt.rx}deg) rotateX(${tilt.ry}deg)` }}
      >
        {houses.map((h, i) => {
          const isHovered = hovered === i;
          const baseTranslate = `translateZ(${h.depth * 70}px) translate(${
            tilt.rx * h.depth * 1.6
          }px, ${tilt.ry * h.depth * 1.3}px)`;
          // The per-house "turn" on hover: a deliberate, larger rotation in
          // the direction assigned to that house, plus a scale-up and lift —
          // distinct from (and layered on top of) the ambient scene tilt.
          const hoverTurn = isHovered && !reduceMotion
            ? ` rotateY(${22 * h.turnDir}deg) rotateX(-12deg) scale(1.22) translateZ(90px)`
            : isHovered
            ? " scale(1.1)" // reduced-motion: pop without rotation
            : "";

          return (
            <div
              key={i}
              className="absolute pointer-events-auto animate-house-float cursor-default"
              style={{
                top: h.top,
                left: h.left,
                width: h.size,
                height: h.size * 0.8,
                opacity: isHovered ? 1 : 0.32 + h.depth * 0.55,
                zIndex: isHovered ? 9 : Math.round(h.depth * 8),
                animationDelay: `${h.floatDelay}s`,
                animationPlayState: isHovered ? "paused" : "running",
                transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
                transform: baseTranslate + hoverTurn,
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <HouseShape variant={h.variant} color={h.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
