/**
 * Every figure from the model team's reports (25 Sep 2026, final numbers 26 Sep), in one place.
 * Update the numbers here; the landing page reads them from this file.
 */
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

  jaywalking: { minMetres: 3, minSeconds: 1, f1Before: 0.29, f1After: 0.49 },
  /** after = excursions of the final risk curves above 0.5 across all sample videos. */
  falseAlarms: { before: [66, 113] as [number, number], after: 4, minutes: 18 },
};
