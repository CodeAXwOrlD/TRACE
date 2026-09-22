import React from "react";
import "@testing-library/jest-dom";

// Polyfill global React for testing environment
(globalThis as unknown as { React: typeof React }).React = React;

// Polyfill window.matchMedia for JSDOM test runner
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
