import type { AnalysisResult, DetectedEvent, EventClass, RiskPoint } from "@/types";

const POOL: EventClass[] = [
  "failure_to_yield",
  "stop_line",
  "jaywalking",
  "red_light",
  "stopped_vehicle",
  "wrong_way",
];

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Builds a plausible AnalysisResult for a locally uploaded clip. */
export function buildMockResult(duration: number, seed = 42): AnalysisResult {
  const rnd = mulberry(Math.round(duration * 1000) + seed);
  const count = Math.max(2, Math.round(duration / 22));
  const events: DetectedEvent[] = [];

  for (let i = 0; i < count; i++) {
    const slot = (duration / count) * i;
    const start = +(slot + rnd() * (duration / count) * 0.6 + 2).toFixed(1);
    const label = POOL[Math.floor(rnd() * POOL.length)]!;
    const len = label === "stopped_vehicle" ? 12 + rnd() * 14 : 1.6 + rnd() * 2.4;
    const end = +Math.min(duration - 0.2, start + len).toFixed(1);
    if (end > start) events.push([start, end, label]);
  }

  const bumps = events
    .filter((_, i) => i % 2 === 0)
    .slice(0, 2)
    .map((e) => [e[0], 0.45 + rnd() * 0.35] as const);

  const risk: RiskPoint[] = [];
  let base = 0.04;
  const n = Math.round(duration * 10);
  for (let i = 0; i <= n; i++) {
    const t = +(i / 10).toFixed(1);
    base += (rnd() - 0.5) * 0.006;
    base = Math.min(0.09, Math.max(0.015, base));
    let v = base + Math.sin(t / 7) * 0.008;
    for (const [center, peak] of bumps) {
      const d = t - center;
      v += peak * Math.exp(-(d * d) / (2 * 1.6 * 1.6));
    }
    risk.push([t, +Math.min(0.98, Math.max(0, v)).toFixed(3)]);
  }

  return { duration: +duration.toFixed(2), fps: 29.97, events, risk };
}
