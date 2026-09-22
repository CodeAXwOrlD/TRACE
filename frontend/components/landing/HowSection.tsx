"use client";

import { useEffect, useRef, useState } from "react";

interface StepData {
  title: string;
  desc: string;
  tag?: string;
  p: number;
  u: "High" | "Medium" | "Low";
  ev: [string, string];
  acts?: string[];
}

const STEPS: StepData[] = [
  {
    title: "Reading the flagged transaction",
    desc: "A $128.33 card-not-present purchase on card ····4417 scores 0.87. That score alone decides nothing.",
    p: 0.55,
    u: "High",
    ev: ["Risk score 0.87 (input only)", "var(--muted)"],
  },
  {
    title: "Looking back on the card",
    desc: "The agent walks backward through this card's recent history before trusting the flagged transaction as the start of the story.",
    tag: "Flagged transaction is not necessarily the origin",
    p: 0.68,
    u: "High",
    ev: ["3 tiny charges 41 minutes earlier", "var(--red)"],
  },
  {
    title: "Following the device",
    desc: "The device behind this purchase turns out to be shared with several other cards — a strong connective signal.",
    p: 0.76,
    u: "High",
    ev: ["Device on 3 other cards", "var(--red)"],
  },
  {
    title: "Reading prior cases",
    desc: "Two of those connected cards already have confirmed fraud cases on record.",
    p: 0.81,
    u: "Medium",
    ev: ["2 confirmed cases: CC-0141, CC-2671", "var(--red)"],
  },
  {
    title: "Comparing with card history",
    desc: "This amount, channel and region are unusual for what this specific card normally does.",
    p: 0.83,
    u: "Medium",
    ev: ["Unusual for this card and region", "var(--red)"],
  },
  {
    title: "Matching a pattern",
    desc: "The evidence fits a known shape: card-not-present activity paired with a new device.",
    p: 0.82,
    u: "Medium",
    ev: ["Card-not-present with a new device", "var(--amber)"],
  },
  {
    title: "Settling probability",
    desc: "Evidence features combine into a calibrated probability — separate from, and more meaningful than, the raw risk score.",
    p: 0.82,
    u: "Medium",
    ev: ["Probability 0.82, medium uncertainty", "var(--blue)"],
  },
  {
    title: "Applying policy R6",
    desc: "Policy R6 (shared device with confirmed cases) fires, producing a concrete next action rather than a bare verdict.",
    p: 0.82,
    u: "Medium",
    ev: ["Policy R6 matched", "var(--blue)"],
    acts: ["BLOCK_CARD", "FILE_REPORT", "MONITOR_CONNECTED_CARDS"],
  },
];

/** "Evidence to Decision chain": scroll-driven timeline that tweens a live estimate as the reader scrolls (Design.md #7). */
export function HowSection() {
  const listRef = useRef<HTMLDivElement | null>(null);
  const railFillRef = useRef<HTMLElement | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [displayed, setDisplayed] = useState(0.5);
  const [uncertainty, setUncertainty] = useState<StepData["u"]>("High");
  const tweenRef = useRef(0);

  useEffect(() => {
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

    function tweenTo(target: number) {
      const from = displayedRef.current;
      const t0 = performance.now();
      const id = ++tweenRef.current;
      const step = (now: number) => {
        if (id !== tweenRef.current) return;
        const t = clamp((now - t0) / 700);
        const val = from + (target - from) * (1 - Math.pow(1 - t, 3));
        displayedRef.current = val;
        setDisplayed(val);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function onScroll() {
      const list = listRef.current;
      if (!list) return;
      const focus = window.innerHeight * 0.58;
      const r = list.getBoundingClientRect();
      const fillScale = clamp((focus - r.top) / r.height);
      if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${fillScale.toFixed(3)})`;

      let activeIdx = -1;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const on = el.getBoundingClientRect().top + 24 < focus;
        el.classList.toggle("on", on);
        if (on) activeIdx = i;
      });
      if (activeIdx !== activeRef.current) {
        activeRef.current = activeIdx;
        setActive(activeIdx);
        const d = STEPS[activeIdx];
        tweenTo(d ? d.p : 0.5);
        setUncertainty(d ? d.u : "High");
      }
    }

    const activeRef = { current: -1 };
    const displayedRef = { current: 0.5 };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const shownSteps = active >= 0 ? STEPS.slice(0, active + 1) : [];
  const currentActs = active >= 0 ? STEPS[active]?.acts : undefined;

  return (
    <section className="sec" id="how">
      <div className="wrap">
        <p className="label rv">HOW A CASE RUNS</p>
        <h2 className="sec-title rv">
          <span>The evidence </span>
          <span className="highlight">builds the decision.</span>
        </h2>
        <p className="lead rv">
          Scroll through one investigation. Each step adds evidence, and the estimate on the right moves with it. The
          flagged transaction is only where the agent starts looking.
        </p>

        <div className="how">
          <div className="tl" ref={listRef}>
            <div className="rail">
              <i ref={railFillRef} />
            </div>
            {STEPS.map((s, i) => (
              <div className="tstep" key={s.title} ref={(el) => { stepRefs.current[i] = el; }}>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {s.tag && <span className="tag">{s.tag}</span>}
              </div>
            ))}
          </div>

          <aside className="live">
            <div className="lhead">{active >= 0 ? STEPS[active]?.title : "Waiting for a flagged transaction"}</div>
            <div className="est">
              <span>{displayed.toFixed(2)}</span>
              <small>FRAUD PROBABILITY</small>
            </div>
            <div className="ebar">
              <i style={{ width: `${displayed * 100}%` }} />
            </div>
            <div className="urow">
              Uncertainty <b>{uncertainty}</b>
            </div>
            <ul className="evl">
              {shownSteps.map((s) => (
                <li key={s.title} style={{ ["--c" as any]: s.ev[1] }}>
                  <i />
                  {s.ev[0]}
                </li>
              ))}
            </ul>
            <div className="acts">{currentActs?.map((a) => <span className="act" key={a}>{a}</span>)}</div>
          </aside>
        </div>
      </div>
    </section>
  );
}
