"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's 3D-tilted graph illustration (Design.md #6: gentle float,
 * pointer-based 9-14deg tilt, pulse rings on the flagged transaction,
 * particles travelling along edges). Ported near-verbatim from the reference
 * preview's inline SVG + pointer-tilt script.
 */
export function HeroGraphIllustration() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const planeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current,
      plane = planeRef.current;
    if (!stage || !plane) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      raf = 0;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    const loop = () => {
      cx = lerp(cx, tx, 0.06);
      cy = lerp(cy, ty, 0.06);
      plane.style.transform = `rotateX(${(16 - cy * 9).toFixed(2)}deg) rotateY(${(-9 + cx * 14).toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="hero-console-deck anim" style={{ ["--d" as any]: ".4s" }} ref={stageRef}>
      {/* Console Top Telemetry Bar */}
      <div className="deck-topbar">
        <div className="deck-status">
          <span className="deck-radar-dot" />
          <span className="deck-status-txt">TRANSACTION NETWORK CLUSTER</span>
        </div>
        <div className="deck-meta">
          <span className="deck-chip case-chip">CASE-0007</span>
          <span className="deck-chip">DEPTH: 2-HOP</span>
          <span className="deck-chip live-chip">6 ENTITIES</span>
        </div>
      </div>

      {/* Main 3D Graph Canvas Viewport (100% Unobstructed Breathing Room) */}
      <div className="deck-graph-viewport">
        <div className="float">
          <div className="plane" ref={planeRef}>
            <svg
              className="net"
              viewBox="0 0 640 560"
              role="img"
              aria-label="Graph linking a customer, a card, small test charges, a flagged purchase, a new device, three other cards and two closed fraud cases"
            >
              <defs>
                <filter id="gl" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="floor" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#3e9bd0" stopOpacity=".16" />
                  <stop offset="1" stopColor="#3e9bd0" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="320" cy="285" rx="310" ry="260" fill="url(#floor)" />
              <ellipse className="ring" cx="320" cy="285" rx="130" ry="105" />
              <ellipse className="ring" cx="320" cy="285" rx="230" ry="190" />
              <ellipse className="ring" cx="320" cy="285" rx="310" ry="255" />
              <path className="e" d="M120 150 L296 270" />
              <path className="e" d="M320 285 L520 175" />
              <path className="e hot" d="M320 285 L150 330" />
              <path className="e hot" d="M320 285 L120 375" />
              <path className="e hot" d="M320 285 L175 405" />
              <path className="e hot" d="M520 175 L520 350" />
              <path className="e" d="M520 175 L600 110" />
              <path className="e" d="M520 175 L400 60" />
              <path className="e hot" d="M520 350 L610 285" />
              <path className="e hot" d="M520 350 L600 440" />
              <path className="e hot" d="M520 350 L470 460" />
              <path className="e" d="M340 485 L470 460" />
              <path className="e" d="M590 520 L600 440" />
              <text className="elab" x="196" y="200">OWNS</text>
              <text className="elab" x="420" y="222">MADE</text>
              <text className="elab" x="562" y="268">FROM_DEVICE</text>
              <text className="elab" x="588" y="352">USED_ON</text>
              <circle r="3.2" fill="#3e9bd0" filter="url(#gl)">
                <animateMotion dur="3.6s" repeatCount="indefinite" path="M120 150 L296 270" />
              </circle>
              <circle r="3.2" fill="#3e9bd0" filter="url(#gl)">
                <animateMotion dur="3.2s" begin=".4s" repeatCount="indefinite" path="M320 285 L520 175" />
              </circle>
              <circle r="3.2" fill="#ff9a52" filter="url(#gl)">
                <animateMotion dur="3s" begin="1.2s" repeatCount="indefinite" path="M520 175 L520 350" />
              </circle>
              <circle r="3.2" fill="#ff4b42" filter="url(#gl)">
                <animateMotion dur="2.6s" begin="2s" repeatCount="indefinite" path="M520 350 L600 440" />
              </circle>
              <circle r="3.2" fill="#ff4b42" filter="url(#gl)">
                <animateMotion dur="2.8s" begin="2.6s" repeatCount="indefinite" path="M520 350 L470 460" />
              </circle>
              <circle r="3" fill="#ff4b42" filter="url(#gl)">
                <animateMotion dur="3.4s" begin=".8s" repeatCount="indefinite" path="M320 285 L150 330" />
              </circle>
              <circle cx="120" cy="150" r="16" fill="#0d1218" stroke="#7d8792" strokeWidth="1.4" />
              <circle cx="120" cy="150" r="4" fill="#7d8792" />
              <text x="120" y="184">Customer</text>
              <circle cx="400" cy="60" r="9" fill="#0d1218" stroke="#3e9bd0" strokeWidth="1.4" />
              <text x="400" y="40">Email domain</text>
              <circle cx="600" cy="110" r="9" fill="#0d1218" stroke="#3e9bd0" strokeWidth="1.4" />
              <text x="596" y="90">Billing region</text>
              <rect x="272" y="263" width="96" height="44" rx="10" fill="#0d1218" stroke="#ec6408" strokeWidth="1.8" filter="url(#gl)" />
              <text x="320" y="255">CARD</text>
              <text x="320" y="290" style={{ fill: "#fff", fontSize: "12.5px", fontWeight: 600 }}>····4417</text>
              <circle cx="150" cy="330" r="6" fill="#ff4b42" filter="url(#gl)" />
              <circle cx="120" cy="375" r="6" fill="#ff4b42" filter="url(#gl)" />
              <circle cx="175" cy="405" r="6" fill="#ff4b42" filter="url(#gl)" />
              <text x="146" y="440">3 charges under $2</text>
              <circle className="pulse" cx="520" cy="175" r="16" />
              <circle className="pulse b" cx="520" cy="175" r="16" />
              <circle cx="520" cy="175" r="14" fill="#ec6408" filter="url(#gl)" />
              <text className="lbl-strong" x="520" y="212">$128.33</text>
              <text x="520" y="227">flagged</text>
              <polygon points="520,327 543,350 520,373 497,350" fill="#ff4b42" filter="url(#gl)" />
              <text x="520" y="396">New device</text>
              <g stroke="#ff4b42" strokeWidth="1.4" fill="#0d1218">
                <rect x="585" y="274" width="50" height="22" rx="6" />
                <rect x="575" y="429" width="50" height="22" rx="6" />
                <rect x="445" y="449" width="50" height="22" rx="6" />
              </g>
              <text x="610" y="289" style={{ fill: "#e6c1bf", fontSize: "9.5px" }}>····0921</text>
              <text x="600" y="444" style={{ fill: "#e6c1bf", fontSize: "9.5px" }}>····7754</text>
              <text x="470" y="464" style={{ fill: "#e6c1bf", fontSize: "9.5px" }}>····3308</text>
              <rect x="329" y="474" width="22" height="22" rx="3" fill="#ff4b42" filter="url(#gl)" />
              <text x="340" y="516">CC-0141</text>
              <rect x="579" y="509" width="22" height="22" rx="3" fill="#ff4b42" filter="url(#gl)" />
              <text x="590" y="551">CC-2671</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Structured Dual-Stream Telemetry Dock (Neatly Docked at Bottom without Overlapping) */}
      <div className="deck-telemetry-dock">
        {/* Stream 1: Live Agent Reasoning Activity */}
        <div className="deck-panel deck-agent-panel">
          <div className="ahead">
            <span className="adot" />
            <span className="ahead-txt">AGENT REASONING</span>
            <span className="ahead-case">LIVE</span>
          </div>
          <AgentStepsPreview />
        </div>

        {/* Stream 2: Score vs Probability Differential */}
        <div className="deck-panel deck-metric-panel">
          <div className="cl">EVIDENCE DIVERGENCE</div>
          <div className="mrow">
            <span>Risk score</span>
            <div className="mtrack">
              <i style={{ width: "87%", background: "#68737e" }} />
            </div>
            <output>0.87</output>
          </div>
          <div className="mrow">
            <span>Fraud prob.</span>
            <div className="mtrack">
              <i style={{ width: "82%", background: "var(--red)", opacity: 0.9 }} />
            </div>
            <output>0.82</output>
          </div>
          <p className="rnote">Score is one input. Probability comes from the evidence. Medium uncertainty.</p>
        </div>
      </div>
    </div>
  );
}

/** Small looping preview of AgentActivity, just for the hero card (real panel lives in the workbench). */
function AgentStepsPreview() {
  const steps = [
    "Looked back 41 min on the card",
    "Device seen on 3 other cards",
    "Matched CC-0141 and CC-2671",
    "Pattern: card-not-present, new device",
    "Policy R6 applied",
    "Next: block card, file report",
  ];
  const activeRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const el = listRef.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    let i = 0;
    const tick = () => {
      items.forEach((item, idx) => {
        item.classList.toggle("done", idx < i);
        item.classList.toggle("now", idx === i);
        const marker = item.firstElementChild;
        if (marker) marker.textContent = idx < i ? "✓" : "›";
      });
      i++;
      const delay = i > items.length ? 2600 : i === items.length ? 1400 : 1150;
      if (i > items.length) i = 0;
      timer = setTimeout(tick, delay);
    };
    let timer = setTimeout(tick, 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={listRef}>
      {steps.map((s) => (
        <div className="astep" key={s}>
          <i>›</i>
          {s}
        </div>
      ))}
    </div>
  );
}
