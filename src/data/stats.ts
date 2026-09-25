import { RISK_THRESHOLD, SAMPLE_ORDER } from "@/config";
import { samples } from "./samples";
import type { DetectedEvent, EventClass, RiskPoint, SampleVideo } from "@/types";

export type AlarmSpan = { start: number; end: number; peak: number };

/** Contiguous runs where risk >= threshold. */
export function alarmSpans(risk: RiskPoint[], threshold = RISK_THRESHOLD): AlarmSpan[] {
  const spans: AlarmSpan[] = [];
  let cur: AlarmSpan | null = null;
  for (const [t, v] of risk) {
    if (v >= threshold) {
      if (!cur) cur = { start: t, end: t, peak: v };
      cur.end = t;
      cur.peak = Math.max(cur.peak, v);
    } else if (cur) {
      spans.push(cur);
      cur = null;
    }
  }
  if (cur) spans.push(cur);
  return spans;
}

export function countByClass(events: DetectedEvent[]): Array<[EventClass, number]> {
  const map = new Map<EventClass, number>();
  for (const e of events) map.set(e[2], (map.get(e[2]) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export type Feed = SampleVideo & { name: string; id: string };

export const FEEDS: Feed[] = SAMPLE_ORDER.filter((n) => samples[n]).map((name) => ({
  ...samples[name]!,
  name,
  id: name.replace(/\.mp4$/i, ""),
}));

const totalSeconds = FEEDS.reduce((a, f) => a + f.duration, 0);
const allEvents = FEEDS.flatMap((f) => f.events);

/** Aggregates over all sample feeds, computed once from samples.json. */
export const SAMPLE_STATS = {
  feedCount: FEEDS.length,
  totalSeconds,
  totalMinutes: Math.round(totalSeconds / 60),
  eventCount: allEvents.length,
  perClass: countByClass(allEvents),
  alarms: FEEDS.flatMap((f) => alarmSpans(f.risk).map((a) => ({ ...a, feed: f.id }))),
};
