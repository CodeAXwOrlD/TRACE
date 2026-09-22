"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CinematicWordmark } from "./CinematicWordmark";

export interface IntroSequenceProps {
  /** Called once the intro has fully handed off (site should render/enter now). */
  onDone: () => void;
}

/**
 * Real-time cinematic intro sequence:
 * 1. 0.0s - 0.25s: Wordmark & emblem outline emerge
 * 2. 0.25s - 1.55s: Electric plasma spark sweeps smoothly across T -> R -> A -> C -> E (direct 60fps DOM manipulation)
 * 3. 1.55s - 2.45s: Master Ignition! All letters ignite into warm amber and emerald neon, lens flares burst, cyber tagline reveals
 * 4. 2.45s - 2.95s: Camera push & dissolve into landing page
 * 5. 2.95s: Completed cleanly with zero glitches or blue flashes.
 */
export function IntroSequence({ onDone }: IntroSequenceProps) {
  const [phase, setPhase] = useState<"in" | "lit" | "out" | "gone">("in");
  const [activeLetter, setActiveLetter] = useState(-1);
  const sparkRef = useRef<SVGGElement | null>(null);
  const doneRef = useRef(false);
  const skippedRef = useRef(false);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("out");
    setTimeout(() => {
      setPhase("gone");
      onDone();
    }, 500);
  }

  function skip() {
    if (skippedRef.current) return;
    skippedRef.current = true;
    finish();
  }

  useEffect(() => {
    let rafId: number;
    let startTime: number | null = null;
    let lastActive = -1;

    const SPARK_START_X = 70;
    const SPARK_END_X = 880;
    const HOP_START = 260; // ms
    const HOP_DURATION = 1300; // ms
    const IGNITE_TIME = HOP_START + HOP_DURATION; // 1560ms
    const OUTRO_TIME = IGNITE_TIME + 900; // 2460ms
    const FINISH_TIME = OUTRO_TIME + 500; // 2960ms

    function tick(now: number) {
      if (doneRef.current || skippedRef.current) return;

      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < HOP_START) {
        // Emergence
        if (sparkRef.current) {
          sparkRef.current.style.opacity = "0";
          sparkRef.current.setAttribute("transform", `translate(${SPARK_START_X}, 100)`);
        }
      } else if (elapsed < IGNITE_TIME) {
        // Continuous 60fps/120fps direct DOM spark traversal
        const p = Math.min(1, Math.max(0, (elapsed - HOP_START) / HOP_DURATION));
        // Smooth sine-like ease
        const easeP = 0.5 - 0.5 * Math.cos(p * Math.PI);
        const curX = SPARK_START_X + (SPARK_END_X - SPARK_START_X) * easeP;

        if (sparkRef.current) {
          sparkRef.current.style.opacity = "1";
          sparkRef.current.setAttribute("transform", `translate(${curX.toFixed(1)}, 100)`);
        }

        // Discrete letter activation
        let curActive = -1;
        if (curX >= 130) curActive = 0; // T
        if (curX >= 310) curActive = 1; // R
        if (curX >= 495) curActive = 2; // A
        if (curX >= 675) curActive = 3; // C
        if (curX >= 845) curActive = 4; // E
        if (p >= 0.98) curActive = 5;

        if (curActive !== lastActive) {
          lastActive = curActive;
          setActiveLetter(curActive);
        }
      } else if (elapsed < OUTRO_TIME) {
        // Master Ignition
        if (sparkRef.current) {
          sparkRef.current.style.opacity = "0";
        }
        if (lastActive !== 5) {
          lastActive = 5;
          setActiveLetter(5);
        }
        setPhase("lit");
      } else if (elapsed < FINISH_TIME) {
        // Outro dissolve
        setPhase("out");
      } else {
        // Clean handoff
        finish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    // Hard fallback timer ensures intro ALWAYS transitions even if RAF is throttled
    const safetyTimer = setTimeout(() => {
      if (!doneRef.current) {
        finish();
      }
    }, 3600);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);

  const isLit = phase === "lit" || phase === "out" || phase === "gone";
  const isOut = phase === "out" || phase === "gone";

  return (
    <div
      className={`intro ${phase === "in" ? "in" : ""} ${isLit ? "in lit" : ""} ${isOut ? "in out" : ""}`.trim()}
      role="presentation"
    >
      <div className="i-glow" />
      <div className="i-glow warm" />
      <div className="i-bloom" />

      <div className="i-mark">
        <div className={`i-flare ${isLit ? "on" : ""}`} />
        <div className={`i-flare2 ${isLit ? "on" : ""}`} />

        {/* Brand 3D Metallic T Emblem */}
        <div
          className={`intro-emblem mb-5 relative rounded-2xl overflow-hidden transition-all duration-700 ${
            isLit
              ? "opacity-100 scale-100 shadow-[0_0_60px_rgba(0,255,157,0.4)]"
              : "opacity-80 scale-95"
          }`}
          style={{ width: "min(130px, 24vw)", height: "min(130px, 24vw)" }}
        >
          <Image
            src="/logo-squircle.png"
            alt="TRACE Emblem"
            width={160}
            height={160}
            className="w-full h-full object-cover"
            priority
          />
          <div
            className={`absolute inset-0 rounded-2xl border border-emerald-400/50 pointer-events-none transition-opacity duration-500 ${
              isLit ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <CinematicWordmark
          phase={phase}
          activeLetter={activeLetter}
          sparkRef={sparkRef}
          sparkPos={{ x: 70, y: 100, visible: true }}
        />
      </div>

      <div className={`i-tag-wrap ${isLit ? "on" : ""}`}>
        <span className="i-tag-dot" />
        <p className="i-tag">SEE THE CONNECTIONS • STOP THE FRAUD</p>
        <span className="i-tag-dot" />
      </div>

      <button className="i-skip" type="button" onClick={skip}>
        Skip intro
      </button>
    </div>
  );
}
