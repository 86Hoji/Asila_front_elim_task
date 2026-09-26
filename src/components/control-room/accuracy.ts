import type { DetectedEvent, EventClass } from "@/types";

export type ClassAccuracy = { cls: EventClass; tp: number; fp: number; fn: number; f1: number };
export type VideoAccuracy = {
  rows: ClassAccuracy[];
  labelled: number;
  found: number;
  falsePositives: number;
};

/** Temporal IoU of two [start, end] segments. */
export function tIoU(a: DetectedEvent, b: DetectedEvent) {
  const inter = Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
  const union = a[1] - a[0] + (b[1] - b[0]) - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Per-class TP / FP / FN / F1, matched the way evaluate.py does it: tIoU for every
 * prediction–label pair of the same class, pairs sorted by tIoU descending, greedy
 * one-to-one matching, and a pair counts only if tIoU >= threshold.
 */
export function scoreVideo(
  predicted: DetectedEvent[],
  labelled: DetectedEvent[],
  threshold = 0.5,
): VideoAccuracy {
  const classes = [...new Set([...predicted, ...labelled].map((e) => e[2]))].sort();
  const rows = classes.map((cls) => {
    const P = predicted.filter((e) => e[2] === cls);
    const G = labelled.filter((e) => e[2] === cls);
    const pairs: Array<[number, number, number]> = [];
    P.forEach((p, i) => G.forEach((g, j) => pairs.push([tIoU(p, g), i, j])));
    pairs.sort((a, b) => b[0] - a[0]);
    const usedP = new Set<number>();
    const usedG = new Set<number>();
    let tp = 0;
    for (const [iou, i, j] of pairs) {
      if (iou < threshold) break;
      if (usedP.has(i) || usedG.has(j)) continue;
      usedP.add(i);
      usedG.add(j);
      tp++;
    }
    const fp = P.length - tp;
    const fn = G.length - tp;
    return { cls, tp, fp, fn, f1: (2 * tp) / (2 * tp + fp + fn) };
  });
  return {
    rows,
    labelled: labelled.length,
    found: rows.reduce((a, r) => a + r.tp, 0),
    falsePositives: rows.reduce((a, r) => a + r.fp, 0),
  };
}

const cache = new Map<string, VideoAccuracy>();

/** Memoised per video (inputs are static data). */
export function videoAccuracy(
  video: string,
  predicted: DetectedEvent[],
  labelled: DetectedEvent[],
): VideoAccuracy {
  let hit = cache.get(video);
  if (!hit) {
    hit = scoreVideo(predicted, labelled);
    cache.set(video, hit);
  }
  return hit;
}
