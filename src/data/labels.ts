import raw from "./my_labels.json";
import type { DetectedEvent } from "@/types";

/** Our manual labels (43 events), keyed by the lower-case ".mp4" video names used in samples.json. */
export const LABELS: Record<string, DetectedEvent[]> = Object.fromEntries(
  Object.entries(raw as unknown as Record<string, { events: DetectedEvent[] }>).map(([name, v]) => [
    name.replace(/\.mp4$/i, ".mp4"),
    v.events,
  ]),
);
