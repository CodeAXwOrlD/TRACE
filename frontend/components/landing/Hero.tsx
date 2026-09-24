"use client";

import { HeroGraphIllustration } from "./HeroGraphIllustration";

export function Hero({ active = true }: { active?: boolean }) {

  return (
    <header className="hero" id="top">
      <div>
        <div className="eyebrow anim" style={{ ["--d" as any]: ".1s" }}>
          <span className="edot" />
          AGENTIC AI ON A TRANSACTION GRAPH
        </div>
        <h1 className="hero-title anim" style={{ ["--d" as any]: ".3s" }}>
          <span className="hero-line-ice">Follow the card,</span>
          <span className="hero-line-fire">not the score.</span>
        </h1>
        <p className="hero-desc anim" style={{ ["--d" as any]: ".5s" }}>
          TRACE opens a flagged transaction, looks back through the card&apos;s history, follows every shared device
          and reads what earlier cases found. Then it tells the analyst what to do: <b>block, close or escalate.</b>
        </p>
        <div className="actions anim" style={{ ["--d" as any]: ".7s" }}>
          <a className="btn" href="/investigations">
            Open a live case →
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
