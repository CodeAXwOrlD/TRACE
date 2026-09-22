// ============================================================================
// Neon border-light text engine — ported from
// reference/trace-cinematic-v2.html (class `Neon`), per Design.md section 4.
//
// This file is intentionally vanilla DOM/SVG (no React) because the original
// reference implementation is imperative frame-by-frame canvas + SVG work;
// re-deriving it in React state would be slower and easy to desync from the
// approved preview. NeonText.tsx is the thin React wrapper that mounts this
// against a host element ref.
//
// Do not "clean up" the math here without testing against the reference
// preview side by side — the timing constants (0.12 easing, 3.6x fs/s, tail
// length, etc.) are what make the light hop feel like a film title reveal
// rather than a website hover effect (Rules.md / Design.md #4).
// ============================================================================

const NS = "http://www.w3.org/2000/svg";

function mk<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs?: Record<string, string | number> | null,
  parent?: Element | null
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, name) as SVGElementTagNameMap[K];
  if (attrs) for (const k in attrs) el.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(el);
  return el;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => {
  t = clamp(t);
  return t * t * (3 - 2 * t);
};

export type NeonTone = "ice" | "fire";

const TONES: Record<NeonTone, { fill: [number, number, number]; hi: [number, number, number]; hot: string; mid: string; star: string }> = {
  ice: { fill: [233, 238, 243], hi: [255, 255, 255], hot: "#f4fcff", mid: "#4fb8ff", star: "#starC" },
  fire: { fill: [236, 100, 8], hi: [255, 214, 160], hot: "#fff2de", mid: "#ff8a2a", star: "#starW" },
};

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;
function canvasCtx(): CanvasRenderingContext2D {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCtx = sharedCanvas.getContext("2d", { willReadFrequently: true });
  }
  if (!sharedCtx) {
    throw new Error("Canvas 2D context unavailable");
  }
  return sharedCtx;
}

interface Contour {
  x0: number;
  x1: number;
  cx: number;
  top: (x: number) => number;
  bot: (x: number) => number;
  rev: number;
  glow: number;
  span?: SVGTSpanElement;
}

/** Traces the top/bottom outline of one glyph from an offscreen canvas render, so stars ride the real letterform. */
function contour(ch: string, fs: number, font: string, ext: { x: number; width: number }, baseY: number): Contour | null {
  const cctx = canvasCtx();
  const cvs = sharedCanvas!;
  const pad = Math.ceil(fs * 0.35);
  const w = Math.ceil(Math.max(ext.width, fs * 0.5)) + pad * 2;
  const h = Math.ceil(fs * 1.6);
  const base = Math.round(fs * 1.15);
  cvs.width = w;
  cvs.height = h;
  cctx.font = font;
  cctx.textBaseline = "alphabetic";
  cctx.fillStyle = "#fff";
  cctx.fillText(ch, pad, base);
  const d = cctx.getImageData(0, 0, w, h).data;
  const top = new Float32Array(w);
  const bot = new Float32Array(w);
  let a = -1,
    b = -1;
  for (let x = 0; x < w; x++) {
    let t = -1,
      bt = -1;
    for (let y = 0; y < h; y++) {
      if (d[(y * w + x) * 4 + 3]! > 110) {
        if (t < 0) t = y;
        bt = y;
      }
    }
    top[x] = t;
    bot[x] = bt;
    if (t >= 0) {
      if (a < 0) a = x;
      b = x;
    }
  }
  if (a < 0) {
    const wEst = ext.width > 0 ? ext.width : fs * 0.55;
    return {
      x0: ext.x,
      x1: ext.x + wEst,
      cx: ext.x + wEst / 2,
      top: () => baseY - fs * 0.75,
      bot: () => baseY + fs * 0.15,
      rev: 0,
      glow: 0,
    };
  }
  let lt = top[a]!,
    lb = bot[a]!;
  for (let x = a; x <= b; x++) {
    if (top[x]! < 0) {
      top[x] = lt;
      bot[x] = lb;
    } else {
      lt = top[x]!;
      lb = bot[x]!;
    }
  }
  const ox = ext.x - pad,
    oy = baseY - base;
  const idx = (X: number) => clamp(Math.round(X - ox), a, b);
  return {
    x0: ox + a,
    x1: ox + b + 1,
    cx: ox + (a + b + 1) / 2,
    top: (X: number) => oy + top[idx(X)]!,
    bot: (X: number) => oy + bot[idx(X)]! + 1,
    rev: 0,
    glow: 0,
  };
}

export interface NeonLineInput {
  text: string;
  tone?: NeonTone;
}

export interface NeonOptions {
  fs: number;
  ls?: number;
  lh?: number;
  align?: "left" | "center";
  fluid?: boolean;
  fillRest?: [number, number, number] | null;
  fillHi?: [number, number, number] | null;
  fillGlow?: number;
  lines?: NeonLineInput[];
}

interface NeonLine {
  text: string;
  tone: (typeof TONES)[NeonTone];
  y: number;
  grad: SVGLinearGradientElement;
  stops: SVGStopElement[];
  tFill: SVGTextElement;
  tBase: SVGTextElement;
  tGlow: SVGTextElement;
  tCore: SVGTextElement;
  spans: SVGTSpanElement[];
  stars: SVGUseElement[];
  sparks: { u: SVGUseElement; age: number; life: number; x: number; y: number; s: number }[];
  ink: Contour[];
  w: number;
  startX: number;
  endX: number;
}

interface Segment {
  ts: number;
  te: number;
  x0: number;
  x1: number;
  type: "t" | "d";
}
interface Timeline {
  segs: Segment[];
  total: number;
  k: number;
  start: number;
}

let NID = 0;

/** One instance per heading. `lines` come from opts.lines or `<span class="line">` children. */
export class Neon {
  o: Required<Omit<NeonOptions, "lines">> & { lines?: NeonLineInput[] };
  id: number;
  host: HTMLElement;
  svg: SVGSVGElement;
  lines: NeonLine[];
  W = 0;
  H = 0;
  private abortFlag = false;

  constructor(host: HTMLElement, opts: NeonOptions) {
    const defaults: Required<Omit<NeonOptions, "lines">> = {
      fs: 64,
      ls: -0.045,
      lh: 1.1,
      align: "left",
      fluid: false,
      fillRest: null,
      fillHi: null,
      fillGlow: 0.85,
    };
    this.o = { ...defaults, ...opts };
    const fs = this.o.fs;
    this.id = ++NID;
    this.host = host;

    let src: { text: string; tone: (typeof TONES)[NeonTone] }[] = [];
    if (opts.lines && opts.lines.length > 0) {
      src = opts.lines.map((l) => ({
        text: l.text,
        tone: TONES[l.tone || "ice"],
      }));
    } else {
      const lineEls = Array.from(host.querySelectorAll<HTMLElement>(".line"));
      src = lineEls.map((s) => ({
        text: s.dataset.text ?? "",
        tone: TONES[(s.dataset.tone as NeonTone) || "ice"],
      }));
    }

    host.setAttribute("aria-label", host.dataset.aria || src.map((s) => s.text).join(" "));

    // Clean up any previously injected SVG to support clean React re-renders
    const existingSvgs = Array.from(host.querySelectorAll("svg.neon"));
    existingSvgs.forEach((s) => s.remove());

    const svg = (this.svg = mk("svg", { "aria-hidden": "true" }, host));
    svg.setAttribute("class", "neon");
    svg.style.cssText = `font-size:${fs}px;letter-spacing:${this.o.ls}em;--sw:${fs * 0.012}px;--swl:${fs * 0.03}px`;
    const defs = mk("defs", null, svg);
    const filt = mk("filter", { id: "nf" + this.id, x: "-20%", y: "-50%", width: "140%", height: "200%" }, defs);
    mk("feGaussianBlur", { in: "SourceGraphic", stdDeviation: fs * 0.028, result: "a" }, filt);
    mk("feGaussianBlur", { in: "SourceGraphic", stdDeviation: fs * 0.09, result: "b" }, filt);
    const merge = mk("feMerge", null, filt);
    ["b", "a", "SourceGraphic"].forEach((n) => mk("feMergeNode", { in: n }, merge));

    this.lines = src.map((s, li): NeonLine => {
      const y = fs * 0.84 + li * fs * this.o.lh;
      const gid = `ng${this.id}_${li}`;
      const grad = mk("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 100, y2: 0 }, defs);
      const stops = [0, 1, 2, 3, 4].map(() => mk("stop", { offset: 0, "stop-opacity": 0 }, grad));

      const text = (parent: Element, cls: string, extra?: Record<string, string | number>): SVGTextElement => {
        const t = mk("text", { x: 0, y, class: cls, ...(extra || {}) }, parent);
        Array.from(s.text).forEach((ch) => {
          const ts = mk("tspan", null, t);
          ts.textContent = ch === " " ? "\u00a0" : ch;
        });
        return t;
      };

      const tFill = text(svg, "nfill");
      const tBase = text(mk("g", { filter: `url(#nf${this.id})` }, svg), "nb");
      const tGlow = text(mk("g", { filter: `url(#nf${this.id})` }, svg), "ng", {
        stroke: `url(#${gid})`,
        "stroke-width": fs * 0.028,
      });
      const tCore = text(svg, "nc", { stroke: `url(#${gid})`, "stroke-width": fs * 0.011 });
      const spans = Array.from(tFill.children) as SVGTSpanElement[];
      const stars = [0, 1].map(() => mk("use", { opacity: 0 }, svg));
      const sparks = Array.from({ length: 9 }, () => ({
        u: mk("use", { opacity: 0 }, svg),
        age: 9,
        life: 1,
        x: 0,
        y: 0,
        s: 0,
      }));

      return { text: s.text, tone: s.tone, y, grad, stops, tFill, tBase, tGlow, tCore, spans, stars, sparks, ink: [], w: 0, startX: 0, endX: 0 };
    });
  }

  layout() {
    const o = this.o,
      fs = o.fs,
      font = `800 ${fs}px "Syne", "Plus Jakarta Sans", system-ui, sans-serif`;
    let maxW = 0;
    this.lines.forEach((L) => {
      try {
        L.w = L.tFill.getBBox().width;
      } catch {
        L.w = 0;
      }
      if (!L.w || L.w === 0) {
        L.w = Math.max(1, L.text.length) * fs * 0.62;
      }
      maxW = Math.max(maxW, L.w);
    });
    const pad = fs * 0.14;
    this.W = Math.ceil(maxW + pad * 2);
    this.H = Math.ceil(fs * o.lh * Math.max(1, this.lines.length) + fs * 0.3);
    this.svg.setAttribute("viewBox", `0 0 ${this.W} ${this.H}`);
    if (!o.fluid) this.svg.style.width = `${this.W}px`;

    this.lines.forEach((L) => {
      const x = o.align === "center" ? (this.W - L.w) / 2 : pad;
      [L.tFill, L.tBase, L.tGlow, L.tCore].forEach((t) => t.setAttribute("x", String(x)));
      L.grad.setAttribute("x2", String(this.W));
      L.ink = [];
      Array.from(L.text).forEach((ch, i) => {
        if (ch === " ") return;
        let ext = { x: x + i * (fs * 0.6), width: fs * 0.6 };
        try {
          const charExt = L.tFill.getExtentOfChar(i);
          if (charExt && charExt.width > 0) ext = charExt;
        } catch {
          // fallback
        }
        const c = contour(ch, fs, font, ext, L.y);
        if (c) {
          c.span = L.spans[i];
          L.ink.push(c);
        }
      });
      if (L.ink.length) {
        L.startX = L.ink[0]!.x0;
        L.endX = L.ink[L.ink.length - 1]!.x1;
      } else {
        L.startX = x;
        L.endX = x + L.w;
      }
    });
    this.applyTone();
    this.hideAll();
    this.svg.style.visibility = "visible";
  }

  private applyTone() {
    this.lines.forEach((L) => {
      const t = L.tone;
      const cols = [t.mid, t.mid, t.mid, t.hot, t.hot];
      L.stops.forEach((s, i) => s.setAttribute("stop-color", cols[i]!));
      L.stars.forEach((u) => u.setAttribute("href", t.star));
      L.sparks.forEach((p) => p.u.setAttribute("href", t.star));
    });
  }

  private fillRest(L: NeonLine) {
    return this.o.fillRest || L.tone.fill;
  }

  private paintFill(L: NeonLine, c: Contour, k: number, alpha: number) {
    if (!c.span) return;
    const fr = this.fillRest(L),
      fh = this.o.fillHi || L.tone.hi;
    c.span.style.fill = `rgb(${lerp(fr[0], fh[0], k) | 0},${lerp(fr[1], fh[1], k) | 0},${lerp(fr[2], fh[2], k) | 0})`;
    // If fillRest is explicitly set, guarantee baseline opacity so physical letterform is visible
    const baseOpacity = this.o.fillRest ? 0.75 : 0;
    c.span.style.fillOpacity = Math.max(alpha, baseOpacity).toFixed(3);
  }

  private hideAll() {
    this.lines.forEach((L) => {
      L.stops.forEach((s) => s.setAttribute("stop-opacity", "0"));
      L.stars.forEach((u) => u.setAttribute("opacity", "0"));
      L.sparks.forEach((p) => {
        p.u.setAttribute("opacity", "0");
        p.age = 9;
      });
      L.ink.forEach((c) => {
        c.rev = 0;
        c.glow = 0;
        this.paintFill(L, c, 0, 0);
      });
    });
  }

  private resetReveal() {
    this.lines.forEach((L) =>
      L.ink.forEach((c) => {
        c.rev = 0;
        c.glow = 0;
        this.paintFill(L, c, 0, 0);
      })
    );
  }

  settle() {
    this.lines.forEach((L) => {
      L.stops.forEach((s) => s.setAttribute("stop-opacity", "0"));
      L.stars.forEach((u) => u.setAttribute("opacity", "0"));
      L.sparks.forEach((p) => {
        p.u.setAttribute("opacity", "0");
        p.age = 9;
      });
      L.ink.forEach((c) => {
        c.rev = 1;
        c.glow = 0;
        this.paintFill(L, c, 0, 1);
      });
    });
  }

  /** Ignite: switches to the warm "fire" tone (Design.md intro step 3). */
  lit() {
    this.svg.classList.add("lit");
    this.lines.forEach((L) => (L.tone = TONES.fire));
    this.applyTone();
  }

  abort() {
    this.abortFlag = true;
  }

  private yAt(L: NeonLine, x: number, which: "top" | "bot"): number {
    const cs = L.ink,
      n = cs.length;
    if (!n) return 0;
    if (x <= cs[0]!.x0) return cs[0]![which](cs[0]!.x0);
    for (let k = 0; k < n; k++) {
      const c = cs[k]!;
      if (x >= c.x0 && x <= c.x1) return c[which](x);
      const nx = cs[k + 1];
      if (nx && x > c.x1 && x < nx.x0) return lerp(c[which](c.x1), nx[which](nx.x0), (x - c.x1) / (nx.x0 - c.x1));
    }
    return cs[n - 1]![which](cs[n - 1]!.x1);
  }

  private inInk(L: NeonLine, x: number) {
    return L.ink.some((c) => x >= c.x0 && x <= c.x1);
  }

  private star(u: SVGUseElement, x: number, y: number, s: number, a: number) {
    u.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${Math.max(s, 0.01).toFixed(2)})`);
    u.setAttribute("opacity", a.toFixed(2));
  }

  private timeline(L: NeonLine, spd: number): Timeline {
    const fs = this.o.fs,
      vIn = fs * 3.6 * spd,
      vOut = fs * 16;
    const segs: Segment[] = [];
    let tt = 0,
      px = L.startX - fs * 0.5;
    L.ink.forEach((c) => {
      const d1 = Math.max(0.02, Math.abs(c.x0 - px) / vOut);
      segs.push({ ts: tt, te: tt + d1, x0: px, x1: c.x0, type: "t" });
      tt += d1;
      const d2 = Math.max(0.09, (c.x1 - c.x0) / vIn);
      segs.push({ ts: tt, te: tt + d2, x0: c.x0, x1: c.x1, type: "d" });
      tt += d2;
      px = c.x1;
    });
    return { segs, total: tt, k: 0, start: 0 };
  }

  private frame(L: NeonLine, lt: number, tl: Timeline, reveal: boolean, dt: number) {
    if (lt < 0) return;
    const fs = this.o.fs,
      W = this.W,
      total = tl.total,
      tail = fs * 1.7,
      head = fs * 0.16;
    let x: number,
      seg: Segment | null = null,
      u = 0,
      a = 1;
    if (lt >= total) {
      x = L.endX + fs * 0.4 + (lt - total) * fs * 7;
      a = clamp(1 - (lt - total) * 3.5);
    } else {
      while (tl.k < tl.segs.length - 1 && lt > tl.segs[tl.k]!.te) tl.k++;
      seg = tl.segs[tl.k]!;
      u = clamp((lt - seg.ts) / (seg.te - seg.ts));
      x = seg.type === "d" ? lerp(seg.x0, seg.x1, (1 - Math.cos(Math.PI * u)) / 2) : lerp(seg.x0, seg.x1, u);
    }
    const env = clamp(lt / 0.12);
    const cN = x / W,
      tn = tail / W,
      hn = head / W;
    const P: [number, number][] = [
      [cN - tn, 0],
      [cN - tn * 0.5, 0.32],
      [cN - tn * 0.12, 0.8],
      [cN, 1],
      [cN + hn, 0],
    ];
    L.stops.forEach((s, i) => {
      s.setAttribute("offset", clamp(P[i]![0]).toFixed(4));
      s.setAttribute("stop-opacity", (P[i]![1] * env).toFixed(3));
    });

    const dec = Math.pow(0.12, dt / 1000),
      sg = fs * 0.5;
    L.ink.forEach((c) => {
      const d = (c.cx - x) / sg,
        g = Math.exp(-d * d) * env;
      c.glow = Math.max(g, c.glow * dec);
      if (reveal) c.rev = Math.max(c.rev, smooth((x - (c.x0 - fs * 0.05)) / (c.x1 - c.x0 + fs * 0.1)));
      this.paintFill(L, c, c.glow * this.o.fillGlow, reveal ? c.rev : 1);
    });

    const pulse = seg ? (seg.type === "d" ? 0.6 + 0.55 * Math.sin(Math.PI * u) : 0.42) : 0.01;
    const bx = x - fs * 0.7;
    if (L.stars[0]) this.star(L.stars[0], x, this.yAt(L, x, "top"), fs * 0.34 * pulse, a * env);
    if (L.stars[1]) this.star(L.stars[1], bx, this.yAt(L, bx, "bot"), fs * 0.26 * pulse, a * env * 0.9);

    L.sparks.forEach((p) => {
      if (p.age < p.life) {
        p.age += dt / 1000;
        this.star(p.u, p.x, p.y, p.s * Math.sin(Math.PI * clamp(p.age / p.life)), 1);
      } else if (p.u.getAttribute("opacity") !== "0") p.u.setAttribute("opacity", "0");
    });
    if (seg && Math.random() < 0.16 * (dt / 16.7)) {
      const p = L.sparks.find((q) => q.age >= q.life);
      const sx = x - Math.random() * tail * 0.85;
      if (p && this.inInk(L, sx)) {
        p.x = sx;
        p.y = this.yAt(L, sx, Math.random() < 0.5 ? "top" : "bot");
        p.age = 0;
        p.life = 0.45 + Math.random() * 0.4;
        p.s = fs * (0.1 + Math.random() * 0.14);
      }
    }
  }

  play({ reveal = true, delay = 0, speedMul = 1 }: { reveal?: boolean; delay?: number; speedMul?: number } = {}): Promise<void> {
    this.abortFlag = false;
    return new Promise((resolve) => {
      const spd = speedMul;
      const tls: Timeline[] = [];
      let off = 0;
      this.lines.forEach((L) => {
        const tl = this.timeline(L, spd);
        tl.start = off;
        off += tl.total * 0.55;
        tls.push(tl);
      });
      const endT = Math.max(...tls.map((t) => t.start + t.total)) + 0.9;
      if (reveal) this.resetReveal();
      const t0 = performance.now() + delay;
      let last = t0;
      const tick = (now: number) => {
        if (this.abortFlag) {
          this.settle();
          return resolve();
        }
        if (now < t0) return void requestAnimationFrame(tick);
        const t = (now - t0) / 1000,
          dt = Math.max(1, Math.min(60, now - last));
        last = now;
        this.lines.forEach((L, i) => this.frame(L, t - tls[i]!.start, tls[i]!, reveal, dt));
        if (t < endT) return void requestAnimationFrame(tick);
        this.settle();
        resolve();
      };
      requestAnimationFrame(tick);
    });
  }
}
