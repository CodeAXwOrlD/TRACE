"use client";

import { useEffect, useState } from "react";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { StarDefs } from "@/components/neon/StarDefs";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { ScoreSection } from "@/components/landing/ScoreSection";
import { HowSection } from "@/components/landing/HowSection";
import { OutcomesSection } from "@/components/landing/OutcomesSection";
import { PatternsSection } from "@/components/landing/PatternsSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export default function LandingPage() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.classList.toggle("introing", !introDone && !reduced);
    document.body.classList.toggle("go", introDone || reduced);
    if (reduced) setIntroDone(true);
  }, [introDone]);

  return (
    <>
      <StarDefs />
      {!introDone && <IntroSequence onDone={() => setIntroDone(true)} />}
      <Nav />
      <Hero active={introDone} />
      <ScoreSection />
      <HowSection />
      <OutcomesSection />
      <PatternsSection />
      <FinalCTA />
      <ScrollReveal />
    </>
  );
}
