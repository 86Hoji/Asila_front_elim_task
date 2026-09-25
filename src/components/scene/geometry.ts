/**
 * Geometry of our stylised, top-down drawing of the junction. Everything is in
 * SVG user units inside a 1000 × 560 viewBox. This is our own drawing — no footage.
 *
 *  - A wide avenue runs across the view, split by a raised median.
 *    Far carriageway (top) flows right → left, near carriageway flows left → right.
 *  - A side street leaves the junction towards the bottom-left.
 *  - Zebra crossings: near carriageway (left of the junction), far carriageway
 *    (right of the junction) and across the side street.
 */

export const VIEW = { w: 1000, h: 560 };

export const FAR = { top: 90, bottom: 210 };
export const MEDIAN = { top: 210, bottom: 240 };
export const NEAR = { top: 240, bottom: 360 };
export const LANE_W = 40;

export const FAR_LANES = [110, 150, 190];
export const NEAR_LANES = [260, 300, 340];

/** Where the side street's centre line meets the near kerb. */
export const JUNCTION_X = 560;
/** Unit vector along the side street (outbound, towards bottom-left) and its normal. */
export const SIDE_DIR = { x: -0.8, y: 0.6 };
export const SIDE_NORMAL = { x: 0.6, y: 0.8 };
export const SIDE_HALF_W = 60;
/** Rotation (degrees) that maps local +y onto SIDE_DIR. */
export const SIDE_ROT = 53.13;

export const SIDE_STREET_POLY = "460,360 660,360 393,560 193,560";
export const MOUTH = { left: 460, right: 660 };
export const MEDIAN_GAP = { left: 470, right: 650 };
export const JUNCTION_RECT = { x: 460, y: MEDIAN.top, w: 200, h: NEAR.bottom - MEDIAN.top };

export const STOP_LINE_X = 372;
export const NEAR_CROSSING = { x: 388, w: 36 };
export const FAR_CROSSING = { x: 690, w: 36 };
/** Side-street crossing, in the street's local frame (x across, y along). */
export const SIDE_CROSSING = { y: 135, h: 36 };

export const REFUGE_ISLANDS = [
  "474,368 516,368 482,394",
  "548,368 578,368 563,392",
  "610,368 652,368 644,394",
];

export const SIGNALS = [
  { id: "near", x: STOP_LINE_X - 2, y: 380 },
  { id: "far", x: FAR_CROSSING.x + FAR_CROSSING.w / 2, y: MEDIAN.top + 15 },
];

/** Point on the side street, `s` units from the junction along it, `off` across it. */
export function sidePoint(s: number, off = 0) {
  return {
    x: JUNCTION_X + s * SIDE_DIR.x + off * SIDE_NORMAL.x,
    y: NEAR.bottom + s * SIDE_DIR.y + off * SIDE_NORMAL.y,
  };
}

export type Pt = { x: number; y: number };
type Seg = { kind: "L"; to: Pt } | { kind: "Q"; c: Pt; to: Pt };

/** A sampled polyline with cumulative length, for cheap point-at-distance lookups. */
export type Track = { xs: Float32Array; ys: Float32Array; cum: Float32Array; length: number };

export function buildTrack(start: Pt, segs: Seg[], step = 6): Track {
  const pts: Pt[] = [start];
  let cur = start;
  for (const seg of segs) {
    if (seg.kind === "L") {
      const d = Math.hypot(seg.to.x - cur.x, seg.to.y - cur.y);
      const n = Math.max(1, Math.ceil(d / step));
      for (let i = 1; i <= n; i++) {
        pts.push({
          x: cur.x + ((seg.to.x - cur.x) * i) / n,
          y: cur.y + ((seg.to.y - cur.y) * i) / n,
        });
      }
    } else {
      const n = 24;
      for (let i = 1; i <= n; i++) {
        const u = i / n;
        const a = (1 - u) * (1 - u);
        const b = 2 * (1 - u) * u;
        const c = u * u;
        pts.push({
          x: a * cur.x + b * seg.c.x + c * seg.to.x,
          y: a * cur.y + b * seg.c.y + c * seg.to.y,
        });
      }
    }
    cur = seg.to;
  }
  const xs = new Float32Array(pts.length);
  const ys = new Float32Array(pts.length);
  const cum = new Float32Array(pts.length);
  let len = 0;
  pts.forEach((p, i) => {
    if (i > 0) len += Math.hypot(p.x - pts[i - 1]!.x, p.y - pts[i - 1]!.y);
    xs[i] = p.x;
    ys[i] = p.y;
    cum[i] = len;
  });
  return { xs, ys, cum, length: len };
}

/** Position along a track at distance `d` (clamped). Writes into `out` to avoid allocation. */
export function pointAt(track: Track, d: number, out: Pt): Pt {
  const { xs, ys, cum } = track;
  if (d <= 0) {
    out.x = xs[0]!;
    out.y = ys[0]!;
    return out;
  }
  if (d >= track.length) {
    out.x = xs[xs.length - 1]!;
    out.y = ys[ys.length - 1]!;
    return out;
  }
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid]! < d) lo = mid;
    else hi = mid;
  }
  const span = cum[hi]! - cum[lo]! || 1;
  const u = (d - cum[lo]!) / span;
  out.x = xs[lo]! + (xs[hi]! - xs[lo]!) * u;
  out.y = ys[lo]! + (ys[hi]! - ys[lo]!) * u;
  return out;
}

const pS1 = sidePoint(70, 30);
const pS2 = sidePoint(360, 30);
const pL1 = sidePoint(70, -30);
const pL2 = sidePoint(360, -30);

/** Ambient traffic routes. Each follows the legal direction of its lane. */
export const ROUTES: Array<{ id: string; track: Track; weight: number }> = [
  ...FAR_LANES.map((y, i) => ({
    id: `far-${i}`,
    track: buildTrack({ x: 1040, y }, [{ kind: "L", to: { x: -40, y } }]),
    weight: i === 0 ? 1 : 2,
  })),
  ...NEAR_LANES.slice(0, 2).map((y, i) => ({
    id: `near-${i}`,
    track: buildTrack({ x: -40, y }, [{ kind: "L", to: { x: 1040, y } }]),
    weight: 2,
  })),
  {
    id: "near-2",
    track: buildTrack({ x: -40, y: 340 }, [{ kind: "L", to: { x: 1040, y: 340 } }]),
    weight: 1,
  },
  {
    id: "near-right-turn",
    track: buildTrack({ x: -40, y: 340 }, [
      { kind: "L", to: { x: 470, y: 340 } },
      { kind: "Q", c: { x: 560, y: 340 }, to: pS1 },
      { kind: "L", to: pS2 },
    ]),
    weight: 1,
  },
  {
    id: "far-left-turn",
    track: buildTrack({ x: 1040, y: 190 }, [
      { kind: "L", to: { x: 660, y: 190 } },
      { kind: "Q", c: { x: 560, y: 205 }, to: pL1 },
      { kind: "L", to: pL2 },
    ]),
    weight: 1,
  },
];

/** Pedestrian walks across the three crossings. */
export const WALKS: Track[] = [
  buildTrack({ x: NEAR_CROSSING.x + 12, y: NEAR.bottom + 8 }, [
    { kind: "L", to: { x: NEAR_CROSSING.x + 24, y: NEAR.top - 6 } },
  ]),
  buildTrack({ x: FAR_CROSSING.x + 24, y: FAR.top - 8 }, [
    { kind: "L", to: { x: FAR_CROSSING.x + 12, y: FAR.bottom + 6 } },
  ]),
  buildTrack(sidePoint(SIDE_CROSSING.y + 12, -SIDE_HALF_W - 10), [
    { kind: "L", to: sidePoint(SIDE_CROSSING.y + 24, SIDE_HALF_W + 10) },
  ]),
];

/** Small deterministic PRNG so the ambient scene is identical on every render. */
export function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const SCENE_COLORS = {
  bg: "#020e0e",
  road: "#051c1b",
  kerb: "rgba(0,194,188,0.45)",
  lane: "rgba(0,194,188,0.22)",
  solid: "rgba(0,255,235,0.55)",
  zebra: "rgba(194,211,210,0.32)",
  stop: "rgba(0,255,235,0.75)",
  arrow: "rgba(0,194,188,0.35)",
  island: "rgba(0,194,188,0.14)",
};

/** Hue for a heading in degrees (0 = east, 90 = south in screen coordinates). */
export function headingHue(deg: number) {
  return (((deg + 175) % 360) + 360) % 360;
}
