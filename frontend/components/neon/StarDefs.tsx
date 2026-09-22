// Shared SVG star/halo symbols referenced by every Neon instance via
// href="#starC" / "#starW". Mount once near the root (see app/layout.tsx or
// the landing page) — Design.md #4 "4-point star" + halo glow.
export function StarDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="haloC">
          <stop offset="0" stopColor="#eefaff" stopOpacity=".95" />
          <stop offset=".28" stopColor="#7fd0ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#3e9bd0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="haloW">
          <stop offset="0" stopColor="#fff4e2" stopOpacity=".95" />
          <stop offset=".28" stopColor="#ffab5c" stopOpacity=".55" />
          <stop offset="1" stopColor="#ec6408" stopOpacity="0" />
        </radialGradient>
        <g id="starC">
          <circle r="1.7" fill="url(#haloC)" />
          <path d="M0 -.6 L.08 -.08 L1 0 L.08 .08 L0 .6 L-.08 .08 L-1 0 L-.08 -.08Z" fill="#f6fdff" />
        </g>
        <g id="starW">
          <circle r="1.7" fill="url(#haloW)" />
          <path d="M0 -.6 L.08 -.08 L1 0 L.08 .08 L0 .6 L-.08 .08 L-1 0 L-.08 -.08Z" fill="#fff6e8" />
        </g>
      </defs>
    </svg>
  );
}
