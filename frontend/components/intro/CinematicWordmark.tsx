"use client";

import React from "react";

export interface SparkPosition {
  x: number;
  y: number;
  visible: boolean;
}

export interface CinematicWordmarkProps {
  /** Current sequence phase */
  phase: "in" | "lit" | "out" | "gone";
  /** Currently active letter index during light-hop phase (-1 = none, 0..4 = T,R,A,C,E, 5 = all hopped) */
  activeLetter?: number;
  /** Realtime interpolated plasma spark position */
  sparkPos?: SparkPosition;
  /** Direct ref for 60fps transform manipulation */
  sparkRef?: React.RefObject<SVGGElement>;
  className?: string;
}

interface LetterData {
  id: string;
  d: string;
  cx: number;
  cy: number;
}

/**
 * Geometric, futuristic letterforms matching the official TRACE brand:
 * - T: Wide horizontal header bar with centered vertical stem
 * - R: Geometric loop and crisp angled leg
 * - A: Stylized caret (no horizontal bar) with central glowing emerald node
 * - C: Geometric square-curved arc
 * - E: Three floating parallel horizontal bars (no vertical backbone)
 */
export const WORDMARK_LETTERS: LetterData[] = [
  {
    id: "T",
    d: "M 60 40 H 210 V 66 H 148 V 180 H 122 V 66 H 60 Z",
    cx: 135,
    cy: 110,
  },
  {
    id: "R",
    d: "M 255 40 H 345 C 385 40, 385 110, 345 110 H 312 L 385 180 H 350 L 285 110 H 281 V 180 H 255 Z M 281 64 H 340 C 358 64, 358 84, 340 84 H 281 Z",
    cx: 320,
    cy: 110,
  },
  {
    id: "A",
    // Stylized chevron/caret with no horizontal crossbar
    d: "M 425 180 L 487 40 H 513 L 575 180 H 545 L 500 78 L 455 180 Z",
    cx: 500,
    cy: 110,
  },
  {
    id: "C",
    d: "M 745 40 H 660 C 615 40, 615 180, 660 180 H 745 V 154 H 665 C 641 154, 641 66, 665 66 H 745 Z",
    cx: 680,
    cy: 110,
  },
  {
    id: "E",
    // Three separate horizontal floating parallel bars
    d: "M 785 40 H 905 V 66 H 785 Z M 785 97 H 905 V 123 H 785 Z M 785 154 H 905 V 180 H 785 Z",
    cx: 845,
    cy: 110,
  },
];

/**
 * Pure continuous-vector cinematic wordmark for "TRACE".
 * Mathematically eliminates any internal overlapping seams or wireframe artifacts.
 * Uses emerald/cyan cyber neon tones matching the official TRACE brand logo.
 */
export function CinematicWordmark({
  phase,
  activeLetter = -1,
  sparkPos = { x: 60, y: 110, visible: false },
  sparkRef,
  className = "",
}: CinematicWordmarkProps) {
  const isLit = phase === "lit" || phase === "out" || phase === "gone";
  const aHopped = activeLetter >= 2 || activeLetter === 5 || isLit;

  return (
    <div className={`cinematic-wordmark-container ${isLit ? "is-lit" : ""} ${className}`.trim()}>
      <svg
        viewBox="0 0 965 220"
        className="cinematic-wordmark-svg"
        xmlns="http://www.w3.org/2000/svg"
        fillRule="evenodd"
        aria-label="TRACE"
        role="img"
      >
        <defs>
          {/* Cyber Neon Glow Filter */}
          <filter id="wm-emerald-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="28" result="blur3" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="48" result="blur4" />
            <feMerge>
              <feMergeNode in="blur4" />
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Electric Hop Beam Glow Filter */}
          <filter id="wm-ice-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur3" />
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Linear Gradients */}
          <linearGradient id="wm-lit-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0a1a15" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#08281d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#04120e" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="wm-lit-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff9d" />
            <stop offset="25%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="75%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#00ff9d" />
          </linearGradient>

          <linearGradient id="wm-ice-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#04231b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#02120e" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="wm-spark-tail" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#00ff9d" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#059669" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Underglow Layer when Lit */}
        <g id="wordmark-underglow" filter="url(#wm-emerald-glow)" opacity={isLit ? "0.85" : "0"} style={{ transition: "opacity 0.6s ease" }}>
          {WORDMARK_LETTERS.map((l) => (
            <path key={`glow-${l.id}`} d={l.d} fill="none" stroke="#00ff9d" strokeWidth="12" />
          ))}
          {/* Glowing dot under A */}
          <circle cx="500" cy="148" r="14" fill="#00ff9d" />
        </g>

        {/* Base Letter Elements */}
        {WORDMARK_LETTERS.map((l, idx) => {
          const isHopped = activeLetter >= idx || activeLetter === 5;
          const isCurrentActive = activeLetter === idx;

          let letterFill = "rgba(10, 18, 16, 0.75)";
          let letterStroke = "rgba(148, 163, 184, 0.4)";
          let strokeWidth = 2.2;
          let filterVal: string | undefined = undefined;

          if (isLit) {
            letterFill = "url(#wm-lit-fill)";
            letterStroke = "url(#wm-lit-stroke)";
            strokeWidth = 2.6;
            filterVal = "url(#wm-emerald-glow)";
          } else if (isCurrentActive) {
            letterFill = "rgba(0, 255, 157, 0.25)";
            letterStroke = "#ffffff";
            strokeWidth = 3.4;
            filterVal = "url(#wm-ice-glow)";
          } else if (isHopped) {
            letterFill = "url(#wm-ice-fill)";
            letterStroke = "rgba(0, 255, 157, 0.85)";
            strokeWidth = 2.4;
            filterVal = "url(#wm-ice-glow)";
          }

          return (
            <g key={l.id} className="letter-group" id={`letter-group-${l.id}`}>
              <path
                id={`letter-path-${l.id}`}
                className="letter-base-path"
                d={l.d}
                fill={letterFill}
                stroke={letterStroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={filterVal}
              />
            </g>
          );
        })}

        {/* Razor-sharp Core Stroke for Master Lit State */}
        <g id="wordmark-core" opacity={isLit ? "0.95" : "0"} pointerEvents="none" style={{ transition: "opacity 0.4s ease" }}>
          {WORDMARK_LETTERS.map((l) => (
            <path
              key={`core-${l.id}`}
              d={l.d}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.1"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* The Central Glowing Emerald Node inside Letter A (Λ) */}
        <g className="letter-a-node" id="letter-node-A" style={{ transformOrigin: "500px 148px" }}>
          {/* Subtle unlit dot */}
          {!aHopped && !isLit && (
            <circle cx="500" cy="148" r="8" fill="rgba(148, 163, 184, 0.3)" />
          )}

          {/* Energized / Lit Dot */}
          {(aHopped || isLit) && (
            <g>
              <circle
                cx="500"
                cy="148"
                r={isLit ? "12" : "9"}
                fill="#00ff9d"
                filter={isLit ? "url(#wm-emerald-glow)" : "url(#wm-ice-glow)"}
              />
              <circle cx="500" cy="148" r="5" fill="#ffffff" />
            </g>
          )}
        </g>

        {/* Dynamic Traversing Energy Spark (During Beam Hop) */}
        <g
          id="spark-head-group"
          ref={sparkRef}
          className="spark-head-group pointer-events-none"
          transform={`translate(${sparkPos.x}, ${sparkPos.y})`}
          style={{ opacity: !isLit && sparkPos.visible ? 1 : 0 }}
        >
          {/* Plasma trailing comet tail */}
          <path d="M 0 0 L -65 -6 L -100 0 L -65 6 Z" fill="url(#wm-spark-tail)" />

          {/* Spark Flare Rays */}
          <g filter="url(#wm-ice-glow)">
            <circle r="7" fill="#ffffff" />
            <line x1="-32" y1="0" x2="32" y2="0" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="0" y1="-32" x2="0" y2="32" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="-20" y1="-20" x2="20" y2="20" stroke="#00ff9d" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="-20" y1="20" x2="20" y2="-20" stroke="#00ff9d" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Hyper-white Diamond Core */}
          <polygon points="0,-12 12,0 0,12 -12,0" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
