"use client";

import React from "react";
import Image from "next/image";
import { TraceWordmark } from "./TraceWordmark";

interface TraceLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  showSubtitle?: boolean;
  glow?: boolean;
}

export function TraceLogo({
  className = "",
  size = "md",
  showWordmark = true,
  showSubtitle = false,
  glow = true,
}: TraceLogoProps) {
  const iconDimensions = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 52, height: 52 },
    xl: { width: 72, height: 72 },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Squircle T emblem with circuit lines */}
      <div
        className="relative rounded-[7px] overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{
          width: iconDimensions.width,
          height: iconDimensions.height,
          boxShadow: glow ? "0 0 16px rgba(0, 255, 157, 0.25), 0 0 4px rgba(0, 255, 157, 0.4)" : "none",
        }}
      >
        <Image
          src="/logo-squircle.png"
          alt="TRACE Logo"
          width={iconDimensions.width}
          height={iconDimensions.height}
          className="w-full h-full object-cover"
          priority
        />
        {/* Subtle glass gloss highlight overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />
      </div>

      {/* Styled TRACE wordmark */}
      {showWordmark && (
        <TraceWordmark
          size={size}
          glow={glow}
          showSubtitle={showSubtitle}
          className="transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );
}
