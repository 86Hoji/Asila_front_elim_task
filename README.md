# ASILA — traffic events, detected; accidents, anticipated

Public website of team **ASILA** for the WIUT Hackathon 2026, Computer Vision track.

The system watches a fixed traffic CCTV camera and

- detects traffic violations as time segments `[start_sec, end_sec, label]`, and
- predicts accidents as a causal risk score (0..1 per frame, alarm at `>= 0.5`).

The site has two routes:

| Route        | What it is                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| `/`          | Landing page: problem, pipeline, exploratory analysis, results, report and team.                          |
| `/dashboard` | Control-room demo: replay the sample feeds, upload your own clip, and an operator summary over all feeds. |

The organizers' sample footage is under NDA. The site never shows it: every
visual is our own drawing, chart or data.

Stack: TanStack Start (React 19), Tailwind v4, shadcn/ui, recharts, framer-motion,
react-three-fiber. The project is connected to [Lovable](https://lovable.dev).

## Run it

```sh
bun install        # or: npm install
bun run dev        # or: npm run dev   → http://localhost:8080
```

Checks before committing:

```sh
npx tsc --noEmit
npx eslint .
npm run build
```

## Config flags

Everything that changes between the demo and the final submission lives in
[`src/config.ts`](src/config.ts).

| Flag                 | Meaning                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE`      | Env var: base URL of the analysis server. Empty means mock mode.                                                                            |
| `USE_MOCK`           | `true` simulates "Try your video" entirely in the browser (the clip is never uploaded).                                                     |
| `SHOW_SAMPLE_VIDEOS` | Keep `false`. The sample footage is under NDA, so the dashboard shows our scene drawing instead.                                           |
| `HERO_METRICS`, `EDA`| Figures shown on the landing page. Every number on the site comes from here or is computed from `src/data/samples.json`.                    |
| `RISK_THRESHOLD`     | Alarm threshold for the risk score (0.5).                                                                                                  |

## Plug in real data

### Sample feeds

`src/data/samples.json` holds, per sample video: `duration`, `fps`, `lighting`,
`events` (`[start, end, label]`) and `risk` (`[t, score]` at 10 Hz). All counts on
the landing page and dashboard are computed from this file.

Convert the model's output into this format with:

```sh
npm run data:convert -- path/to/predictions_samples.json
```

- Input: `predictions_samples.json` with the shape
  `{"team": string, "videos": {"<file>.mp4": {"events": [[s, e, label]], "risk": [[t, score], ...]}}}`
  plus `scripts/samples-meta.json` with `{"<file>.mp4": {"duration", "fps", "lighting"}}`.
- Risk is downsampled to 10 Hz by taking the **maximum** in each 0.1 s bin, so short
  alarm peaks survive.
- Events are sorted, and labels are validated against the 14 event classes.
- Output: `src/data/samples.json`, plus a per-video summary in the terminal.

### Live analysis ("Try your video")

With `VITE_API_BASE` set and `USE_MOCK = false`, the upload tab talks to the server:

| Call                            | Response                                                          |
| ------------------------------- | ----------------------------------------------------------------- |
| `POST /api/analyze` (form field `video`) | `{"job_id": string}`                                     |
| `GET /api/jobs/{id}`            | `{"status": "queued" \| "running" \| "done" \| "error", "progress": 0..1, "error"?: string}` |
| `GET /api/jobs/{id}/result`     | `{"duration", "fps", "events", "risk", "annotated_video_url"?}`   |

## Project layout

```
src/
  config.ts                 flags and landing-page figures
  data/samples.json         sample-feed results (events + risk)
  data/stats.ts             aggregates computed from samples.json
  components/landing/       landing page sections
  components/control-room/  /dashboard: player store, monitor, timeline, rails
  components/scene/         our top-down junction drawing (static + animated)
  routes/                   TanStack file routes (do not edit routeTree.gen.ts)
scripts/convert-predictions.mjs
```
