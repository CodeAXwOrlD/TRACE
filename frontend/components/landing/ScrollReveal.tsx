"use client";

import { useEffect } from "react";

/**
 * Global `.rv` (fade+rise, once) and `.crow` (score bars fill, once) scroll
 * reveals — Design.md #6 "Scroll reveals: fade and rise 26px, one time only."
 * Mount once per page.
 */
export function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.querySelectorAll(".rv, .crow").forEach((el) => el.classList.add("in"));
      return;
    }

    const rvo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            rvo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
    );
    const rvEls = Array.from(document.querySelectorAll<HTMLElement>(".rv"));
    rvEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 0.08}s`;
      rvo.observe(el);
    });

    const bo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            bo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(".crow").forEach((el) => bo.observe(el));

    // Cursor spotlight on outcome cards (Design.md #7 "cards and panels").
    const spotlightHandler = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const ocEls = Array.from(document.querySelectorAll<HTMLElement>(".oc"));
    ocEls.forEach((el) => el.addEventListener("pointermove", spotlightHandler));

    return () => {
      rvo.disconnect();
      bo.disconnect();
      ocEls.forEach((el) => el.removeEventListener("pointermove", spotlightHandler));
    };
  }, []);

  return null;
}
