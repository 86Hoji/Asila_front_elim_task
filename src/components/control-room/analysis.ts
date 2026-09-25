import { RISK_THRESHOLD } from "@/config";
import { alarmSpans, countByClass, type AlarmSpan } from "@/data/stats";
import type { AnalysisResult, DetectedEvent, EventClass, RiskPoint } from "@/types";

/** Canonical display order for class lanes and legends. */
export const CLASS_ORDER: EventClass[] = [
  "accident",
  "near_miss",
  "red_light",
  "stop_line",
  "failure_to_yield",
  "jaywalking",
  "wrong_way",
  "stopped_vehicle",
  "congestion",
  "illegal_u_turn",
  "illegal_turn",
  "solid_line_crossing",
  "road_obstacle",
  "fire_smoke",
];

export type Model = {
  duration: number;
  events: DetectedEvent[];
  risk: RiskPoint[];
  classes: EventClass[];
  counts: Array<[EventClass, number]>;
  alarms: AlarmSpan[];
  starts: number[];
};

/** Everything the control room derives from one analysis result, computed once. */
export function buildModel(result: AnalysisResult): Model {
  const events = [...result.events].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const present = new Set(events.map((e) => e[2]));
  return {
    duration: result.duration,
    events,
    risk: result.risk,
    classes: CLASS_ORDER.filter((c) => present.has(c)),
    counts: countByClass(events),
    alarms: alarmSpans(result.risk),
    starts: events.map((e) => e[0]),
  };
}

/** Risk at time t (step lookup by binary search; works for any sampling rate). */
export function riskAt(risk: RiskPoint[], t: number) {
  if (!risk.length) return 0;
  let lo = 0;
  let hi = risk.length - 1;
  if (t <= risk[0]![0]) return risk[0]![1];
  if (t >= risk[hi]![0]) return risk[hi]![1];
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (risk[mid]![0] <= t) lo = mid;
    else hi = mid;
  }
  return risk[lo]![1];
}

export type RiskState = "CALM" | "ELEVATED" | "ALARM";

export function riskState(v: number): RiskState {
  if (v >= RISK_THRESHOLD) return "ALARM";
  if (v >= 0.2) return "ELEVATED";
  return "CALM";
}

export const RISK_STATE_COLOR: Record<RiskState, string> = {
  CALM: "#00ffeb",
  ELEVATED: "#ffd23f",
  ALARM: "#ff4d6d",
};

/** Number of events that have started at or before t (events sorted by start). */
export function startedCount(starts: number[], t: number) {
  let lo = 0;
  let hi = starts.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid]! <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Downsampled risk polyline as an SVG path in a (duration × 1) box, y flipped. */
export function riskPath(risk: RiskPoint[], maxPoints = 2000) {
  if (!risk.length) return { line: "", area: "" };
  const step = Math.max(1, Math.ceil(risk.length / maxPoints));
  let line = "";
  let prevT = 0;
  for (let i = 0; i < risk.length; i += step) {
    // keep peaks: take the max inside each bucket
    let v = 0;
    let t = risk[i]![0];
    for (let j = i; j < Math.min(risk.length, i + step); j++) {
      if (risk[j]![1] >= v) {
        v = risk[j]![1];
        t = risk[j]![0];
      }
    }
    line += `${line ? "L" : "M"}${t.toFixed(2)} ${(1 - v).toFixed(3)}`;
    prevT = t;
  }
  const first = risk[0]![0].toFixed(2);
  const area = `${line}L${prevT.toFixed(2)} 1L${first} 1Z`;
  return { line, area };
}

/** Max-per-bucket sparkline path in a 100 × 24 box. */
export function sparkPath(risk: RiskPoint[], duration: number, buckets = 80) {
  if (!risk.length || !duration) return "";
  const vals = new Array<number>(buckets).fill(0);
  for (const [t, v] of risk) {
    const b = Math.min(buckets - 1, Math.floor((t / duration) * buckets));
    if (v > vals[b]!) vals[b] = v;
  }
  return vals
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (buckets - 1)) * 100).toFixed(1)} ${(23 - v * 22).toFixed(1)}`,
    )
    .join("");
}

/** Indices of the events active at time t, as a stable string key. */
export function activeKey(events: DetectedEvent[], t: number) {
  let key = "";
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    if (t >= e[0] && t <= e[1]) key += key ? `,${i}` : `${i}`;
  }
  return key;
}
