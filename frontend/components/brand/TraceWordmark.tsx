"use client";

import React from "react";

interface TraceWordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  showSubtitle?: boolean;
}

/**
 * Geometric, cyber-styled TRACE wordmark matching the official brand identity:
 * - T: Wide horizontal header bar with centered vertical stem
 * - R: Geometric loop and crisp angled leg
 * - A: Stylized caret (no horizontal bar) with central glowing emerald node
 * - C: Geometric square-curved arc
 * - E: Three floating parallel horizontal bars (no vertical backbone)
 */
export function TraceWordmark({
  className = "",
  size = "md",
  glow = true,
  showSubtitle = false,
}: TraceWordmarkProps) {
  const sizeStyles = {
    sm: { height: 18, subtitleSize: 8 },
    md: { height: 24, subtitleSize: 9 },
    lg: { height: 38, subtitleSize: 11 },
    xl: { height: 56, subtitleSize: 13 },
  }[size];

  const filterId = React.useId().replace(/:/g, "_");

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 960 210"
        style={{ height: sizeStyles.height, width: "auto" }}
        className="overflow-visible select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="TRACE"
        role="img"
      >
        <defs>
          <filter id={`tw-glow-${filterId}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id={`tw-metal-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <linearGradient id={`tw-neon-${filterId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff9d" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#00ff9d" />
          </linearGradient>
        </defs>

        {/* Ambient neon backdrop glow */}
        {glow && (
          <g filter={`url(#tw-glow-${filterId})`} opacity="0.45">
            {/* T */}
            <path d="M 60 38 H 220 V 66 H 153 V 182 H 127 V 66 H 60 Z" fill="none" stroke="#00ff9d" strokeWidth="8" />
            {/* R */}
            <path
              d="M 255 38 H 345 C 385 38, 385 110, 345 110 H 312 L 385 182 H 350 L 285 110 H 281 V 182 H 255 Z M 281 64 H 340 C 358 64, 358 84, 340 84 H 281 Z"
              fill="none"
              stroke="#00ff9d"
              strokeWidth="8"
            />
            {/* A (Caret) */}
            <path
              d="M 425 182 L 487 38 H 513 L 575 182 H 545 L 500 78 L 455 182 Z"
              fill="none"
              stroke="#00ff9d"
              strokeWidth="8"
            />
            <circle cx="500" cy="148" r="14" fill="#00ff9d" />
            {/* C */}
            <path
              d="M 745 38 H 660 C 615 38, 615 182, 660 182 H 745 V 156 H 665 C 641 156, 641 64, 665 64 H 745 Z"
              fill="none"
              stroke="#00ff9d"
              strokeWidth="8"
            />
            {/* E (Three horizontal bars) */}
            <path
              d="M 785 38 H 905 V 66 H 785 Z M 785 96 H 905 V 124 H 785 Z M 785 154 H 905 V 182 H 785 Z"
              fill="none"
              stroke="#00ff9d"
              strokeWidth="8"
            />
          </g>
        )}

        {/* Primary Crisp Vector Letters */}
        <g fill={`url(#tw-metal-${filterId})`}>
          {/* T */}
          <path d="M 60 38 H 220 V 66 H 153 V 182 H 127 V 66 H 60 Z" />

          {/* R */}
          <path d="M 255 38 H 345 C 385 38, 385 110, 345 110 H 312 L 385 182 H 350 L 285 110 H 281 V 182 H 255 Z M 281 64 H 340 C 358 64, 358 84, 340 84 H 281 Z" />

          {/* A (Futuristic chevron without crossbar) */}
          <path d="M 425 182 L 487 38 H 513 L 575 182 H 545 L 500 78 L 455 182 Z" />

          {/* Glowing emerald dot inside A */}
          <circle
            cx="500"
            cy="148"
            r="10"
            fill="#00ff9d"
            filter={`url(#tw-glow-${filterId})`}
          />
          <circle cx="500" cy="148" r="6" fill="#ffffff" />

          {/* C */}
          <path d="M 745 38 H 660 C 615 38, 615 182, 660 182 H 745 V 156 H 665 C 641 156, 641 64, 665 64 H 745 Z" />

          {/* E (Three separate parallel bars) */}
          <rect x="785" y="38" width="120" height="28" rx="2" />
          <rect x="785" y="96" width="120" height="28" rx="2" />
          <rect x="785" y="154" width="120" height="28" rx="2" />
        </g>
      </svg>

      {showSubtitle && (
        <div className="mt-1 flex flex-col items-center select-none tracking-[0.28em] text-[8px] sm:text-[9px] uppercase text-slate-300 font-semibold font-mono opacity-90">
          <span>SEE THE CONNECTIONS</span>
          <span className="text-[7px] text-emerald-400 tracking-[0.24em] font-normal">STOP THE FRAUD</span>
        </div>
      )}
    </div>
  );
}
