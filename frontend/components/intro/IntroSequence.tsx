"use client";

import { useEffect, useRef, useState } from "react";
import { NeonText } from "@/components/neon/NeonText";
import type { Neon } from "@/components/neon/neon-engine";

export interface IntroSequenceProps {
  /** Called once the intro has fully handed off (site should render/enter now). */
  onDone: () => void;
}

/**
 * First-load cinematic intro (Design.md section 5):
 * 1. Wordmark outline fades in unlit (~1.2s)
 * 2. Cool light hops T-R-A-C-E, fill reveals
 * 3. Ignite: border turns warm neon, glow + flare sweep, fast second pass
 * 4. Tagline fades in
 * 5. Outro: wordmark pushes toward camera, overlay dissolves, site rises in
 * Total ~8s. Skippable via button or Escape at any time. Respects
 * prefers-reduced-motion (skips straight to final state).
 */
export function IntroSequence({ onDone }: IntroSequenceProps) {
  const [phase, setPhase] = useState<"in" | "lit" | "out" | "gone">("in");
  const neonRef = useRef<Neon | null>(null);
  const skippedRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finish();
      return;
    }

    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        const check = setInterval(() => {
          if (skippedRef.current || cancelled) {
            clearTimeout(t);
            clearInterval(check);
            resolve();
          }
          if (cancelled) clearInterval(check);
        }, 40);
      });

    async function run() {
      // Ensure web fonts are ready before starting the cinematic sequence
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((r) => setTimeout(r, 1200))
        ]);
      }
      neonRef.current?.layout();

      await sleep(250);
      if (cancelled) return;
      // Phase 1: Titanium wordmark outline and deep carbon body fade in unlit
      await sleep(800);
      if (!skippedRef.current && neonRef.current) {
        // Phase 2: Electric light beam hops letter by letter: T - R - A - C - E
        await neonRef.current.play({ reveal: true, speedMul: 0.55 });
      }
      if (cancelled) return;
      if (!skippedRef.current && neonRef.current) {
        // Phase 3: Ignite: border turns warm amber/gold neon, horizontal lens flares sweep
        setPhase("lit");
        neonRef.current.lit();
        await neonRef.current.play({ reveal: false, speedMul: 1.5 });
      }
      if (cancelled) return;
      if (!skippedRef.current) {
        await sleep(1400); // Tagline reveal hold
      }
      // Phase 4: Camera pushes into the wordmark into the live intelligence console
      setPhase("out");
      await sleep(skippedRef.current ? 250 : 850);
      finish();
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase("gone");
    setTimeout(onDone, 250);
  }

  function skip() {
    if (skippedRef.current) return;
    skippedRef.current = true;
    neonRef.current?.abort();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const cls = ["intro", phase === "in" ? "in" : "", phase === "lit" ? "in lit" : "", phase === "out" ? "in out" : "", phase === "gone" ? "in gone" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="presentation">
      <div className="i-glow" />
      <div className="i-glow warm" />
      <div className="i-bloom" />
      <div className={"i-flare" + (phase === "lit" || phase === "out" ? " on" : "")} />
      <div className={"i-flare2" + (phase === "lit" || phase === "out" ? " on" : "")} />
      <div className="i-mark">
        <NeonText
          as="div"
          lines={[{ text: "TRACE", tone: "ice" }]}
          fontSize={196}
          letterSpacing={0.14}
          lineHeight={1.05}
          fluid
          fillRest={[16, 23, 34]}
          fillHi={[150, 205, 245]}
          fillGlow={0.7}
          playOnView={false}
          ariaLabel="TRACE"
          instanceRef={neonRef}
        />
      </div>
      <p className={"i-tag" + (phase === "lit" || phase === "out" ? " on" : "")}>AGENTIC FRAUD INVESTIGATION</p>
      <button className="i-skip" type="button" onClick={skip}>
        Skip intro
      </button>
    </div>
  );
}
