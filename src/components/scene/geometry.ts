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
