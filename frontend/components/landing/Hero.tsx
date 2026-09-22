"use client";

import { useEffect, useRef } from "react";
import { NeonText } from "@/components/neon/NeonText";
import type { Neon } from "@/components/neon/neon-engine";
import { HeroGraphIllustration } from "./HeroGraphIllustration";

export function Hero() {
  const heroNeonRef = useRef<Neon | null>(null);

  // Hero headline gets one slow glint every 12s (Design.md #4 "Replays").
  // Hero only mounts after the intro hands off, so "on mount" here is the
  // equivalent of the reference implementation's startHero().
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let interval: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(async () => {
      if (reduced) {
        heroNeonRef.current?.settle();
        return;
      }
      await heroNeonRef.current?.play({ reveal: true, speedMul: 1 });
      interval = setInterval(() => heroNeonRef.current?.play({ reveal: false, speedMul: 1.6 }), 12000);
    }, 450);
    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <header className="hero" id="top">
      <div>
        <div className="eyebrow anim" style={{ ["--d" as any]: ".1s" }}>
          <span className="edot" />
          AGENTIC AI ON A TRANSACTION GRAPH
        </div>
        <NeonText
          as="h1"
          className="hero-title neon-hero-title"
          fontSize={76}
          letterSpacing={-0.05}
          lineHeight={1.08}
          playOnView={false}
          ariaLabel="Follow the card, not the score."
          instanceRef={heroNeonRef}
          lines={[
            { text: "Follow the card,", tone: "ice" },
            { text: "not the score.", tone: "fire" },
          ]}
        />
        <p className="hero-desc anim" style={{ ["--d" as any]: ".5s" }}>
          TRACE opens a flagged transaction, looks back through the card&apos;s history, follows every shared device
          and reads what earlier cases found. Then it tells the analyst what to do: <b>block, close or escalate.</b>
        </p>
        <div className="actions anim" style={{ ["--d" as any]: ".7s" }}>
          <a className="btn" href="#how">
            Open a live case
          </a>
          <a className="btn ghost" href="#score">
            Why not just use the score?
          </a>
        </div>
        <div className="chainline anim" style={{ ["--d" as any]: ".9s" }}>
          <span>FLAG</span>
          <span>LOOK BACK</span>
          <span>EVIDENCE</span>
          <span>PROBABILITY</span>
          <span>ACTION</span>
        </div>
      </div>

      <HeroGraphIllustration />
      <div className="scrollcue anim" style={{ ["--d" as any]: "1.4s" }}>
        <i />
        SCROLL
      </div>
    </header>
  );
}
