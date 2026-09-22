"use client";

import { useEffect, useRef } from "react";
import { Neon, type NeonTone } from "./neon-engine";

export interface NeonLineSpec {
  text: string;
  tone: NeonTone;
}

export interface NeonTextProps {
  as?: "h1" | "h2" | "div";
  lines: NeonLineSpec[];
  /** Full plain-text label for screen readers, defaults to the joined line text. */
  ariaLabel?: string;
  fontSize: number;
  letterSpacing?: number;
  lineHeight?: number;
  align?: "left" | "center";
  fluid?: boolean;
  className?: string;
  /** Plays once when scrolled into view (Design.md: "section headings play once when scrolled into view"). */
  playOnView?: boolean;
  /** Imperative handle so a parent (e.g. IntroSequence) can drive play()/lit() directly. */
  instanceRef?: React.MutableRefObject<Neon | null>;
}

/**
 * React wrapper around the vanilla `Neon` engine (Design.md section 4).
 * Renders one hidden `.line` span per line for the engine to read text/tone
 * from, then hands the host element to `Neon`, which replaces the content
 * with the animated SVG. The host keeps an aria-label with the real text.
 */
export function NeonText({
  as = "h2",
  lines,
  ariaLabel,
  fontSize,
  letterSpacing = -0.045,
  lineHeight = 1.1,
  align = "left",
  fluid = false,
  className,
  playOnView = true,
  instanceRef,
}: NeonTextProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const neonRef = useRef<Neon | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const neon = new Neon(host, { fs: fontSize, ls: letterSpacing, lh: lineHeight, align, fluid });
    neonRef.current = neon;
    if (instanceRef) instanceRef.current = neon;
    neon.layout();

    if (reduced) {
      neon.settle();
      return;
    }

    if (!playOnView) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            neon.play({ reveal: true, speedMul: 1 });
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(host);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Tag = as as any;
  return (
    <Tag
      ref={hostRef}
      className={className}
      data-aria={ariaLabel ?? lines.map((l) => l.text).join(" ")}
    >
      {lines.map((l, i) => (
        <span key={i} className="line" data-text={l.text} data-tone={l.tone} />
      ))}
    </Tag>
  );
}
