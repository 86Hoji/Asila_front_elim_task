import type { EventClass } from "@/types";

/**
 * Every figure from the model team's reports (25 Sep 2026, final numbers 26 Sep), in one place.
 * Update the numbers here; the landing page reads them from this file.
 */
export type Counts = { tp: number; fp: number; fn: number };
export type PerClassRow = {
  cls: EventClass;
  f1: [number, number, number];
  mean: number;
  counts: [Counts, Counts, Counts];
};

export const RESULTS = {
  /** Processing time as a multiple of video length. */
  runtime: { min: 1.4, max: 1.9, limit: 3 },
  decode: { widthPx: 1280 },
  /** Frame stride per device: every Nth frame is processed. */
  stride: { gpu: 3, cpu: 6 },

  /** Our final labels across the sample videos. */
  labels: { videos: 4, events: 43 },
  devVideos: ["C3896", "C3905"],
  heldOutVideos: ["C3897", "C3902"],
  /** Score A on the dev videos, per rule revision (last step: final rules on final labels). */
  scoreA: [
    { step: "Initial rules", value: 0.444 },
    { step: "Pedestrian-signal and queue fixes", value: 0.556 },
    { step: "Stricter jaywalking rule", value: 0.631 },
    { step: "Final rules, final labels", value: 0.881 },
  ],
  heldOutScore: 0.901 as number | null,
  /** Shown prominently in "How we measured". */
  recallCaveat:
    "Labels were collected by reviewing the candidates our rules proposed (only C3905 was watched end to end). Events that every version of the rules missed never enter the metric, so recall is an upper bound. On C3905, watching in full revealed 1-2 missed events out of ~10, which puts the honest held-out score closer to 0.8 than to 0.9.",
  heldOutHigherBecause:
    "On the held-out videos three of six classes have only 1-2 events each and score 1.0, while the dev average is pulled down by jaywalking boundaries.",

  jaywalking: { minMetres: 3, minSeconds: 1, f1Before: 0.29, f1After: 0.49 },
  /** after = excursions of the final risk curves above 0.5 across all sample videos. */
  falseAlarms: { before: [66, 113] as [number, number], after: 4, minutes: 18 },
  /** Per-class F1 at tIoU 0.3 / 0.5 / 0.7 and TP/FP/FN at each threshold, on our labels. */
  perClass: {
    tIoU: [0.3, 0.5, 0.7],
    dev: {
      title: "Dev · C3896 + C3905",
      scoreA: 0.881,
      labelled: 20,
      predicted: 21,
      rows: [
        {
          cls: "failure_to_yield",
          f1: [0.909, 0.909, 0.909],
          mean: 0.909,
          counts: [
            { tp: 5, fp: 0, fn: 1 },
            { tp: 5, fp: 0, fn: 1 },
            { tp: 5, fp: 0, fn: 1 },
          ],
        },
        {
          cls: "illegal_turn",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 3, fp: 0, fn: 0 },
            { tp: 3, fp: 0, fn: 0 },
            { tp: 3, fp: 0, fn: 0 },
          ],
        },
        {
          cls: "jaywalking",
          f1: [0.8, 0.667, 0.667],
          mean: 0.711,
          counts: [
            { tp: 6, fp: 3, fn: 0 },
            { tp: 5, fp: 4, fn: 1 },
            { tp: 5, fp: 4, fn: 1 },
          ],
        },
        {
          cls: "red_light",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
          ],
        },
        {
          cls: "solid_line_crossing",
          f1: [0.667, 0.667, 0.667],
          mean: 0.667,
          counts: [
            { tp: 1, fp: 0, fn: 1 },
            { tp: 1, fp: 0, fn: 1 },
            { tp: 1, fp: 0, fn: 1 },
          ],
        },
        {
          cls: "stop_line",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 2, fp: 0, fn: 0 },
            { tp: 2, fp: 0, fn: 0 },
            { tp: 2, fp: 0, fn: 0 },
          ],
        },
      ] as PerClassRow[],
    },
    heldOut: {
      title: "Held-out · C3897 + C3902",
      scoreA: 0.901,
      labelled: 23,
      predicted: 30,
      rows: [
        {
          cls: "failure_to_yield",
          f1: [0.889, 0.889, 0.889],
          mean: 0.889,
          counts: [
            { tp: 4, fp: 1, fn: 0 },
            { tp: 4, fp: 1, fn: 0 },
            { tp: 4, fp: 1, fn: 0 },
          ],
        },
        {
          cls: "illegal_turn",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 2, fp: 0, fn: 0 },
            { tp: 2, fp: 0, fn: 0 },
            { tp: 2, fp: 0, fn: 0 },
          ],
        },
        {
          cls: "jaywalking",
          f1: [0.848, 0.848, 0.848],
          mean: 0.848,
          counts: [
            { tp: 14, fp: 5, fn: 0 },
            { tp: 14, fp: 5, fn: 0 },
            { tp: 14, fp: 5, fn: 0 },
          ],
        },
        {
          cls: "stop_line",
          f1: [0.667, 0.667, 0.667],
          mean: 0.667,
          counts: [
            { tp: 1, fp: 1, fn: 0 },
            { tp: 1, fp: 1, fn: 0 },
            { tp: 1, fp: 1, fn: 0 },
          ],
        },
        {
          cls: "stopped_vehicle",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
          ],
        },
        {
          cls: "wrong_way",
          f1: [1.0, 1.0, 1.0],
          mean: 1.0,
          counts: [
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
            { tp: 1, fp: 0, fn: 0 },
          ],
        },
      ] as PerClassRow[],
    },
  },
  notScored:
    "accident, near_miss and congestion do not occur in the samples and are not predicted, so they do not enter these scores.",
};
