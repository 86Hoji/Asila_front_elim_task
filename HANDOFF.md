# HANDOFF — ASILA site (for Zafar)

Repo: `C:\Users\hp\Projects\asila-site` · branch `main` · TanStack Start app generated with Lovable.

## A. What the site is

Public site of team ASILA (WIUT Hackathon 2026, CV track): violations as time segments
`[start_sec, end_sec, label]` and a causal accident-risk score (0..1, alarm at >= 0.5).

**Stack:** TanStack Start (React 19, file routes), Tailwind v4 (tokens in `src/styles.css`),
shadcn/ui, recharts, framer-motion, react-three-fiber (hero only). Nitro builds the server:
Cloudflare by default (Lovable), plain Node with `NITRO_PRESET=node-server`.

**Run locally**

```sh
npm install          # bun.lock is the lockfile; never commit package-lock.json
npm run dev          # http://localhost:8080
npx tsc --noEmit && npx eslint . && npm run build
```

On Windows, stop `npm run dev` before `npm run build` (the build rewrites `.output/` and
crashes the dev server's file watcher).

**Routes**

| Route        | File                                            |
| ------------ | ----------------------------------------------- |
| `/`          | `src/routes/index.tsx` (landing sections in `src/components/landing/`) |
| `/dashboard` | `src/routes/dashboard.tsx` — tabs: Sample videos, Try your video, Operator view |

Do not edit `src/routeTree.gen.ts`; keep `<Outlet />` in `src/routes/__root.tsx`;
do not touch `vite.config.ts`.

**Key code and data**

| What | Where |
| --- | --- |
| Flags, hero metrics, EDA facts, TEAM, deliverable LINKS | `src/config.ts` |
| Every number from the model team's report (runtime, Score A, jaywalking F1, false alarms, labels) | `src/content/results.ts` |
| Per-video events + 10 Hz risk (drives Results, Sample videos, Operator view) | `src/data/samples.json` (+ aggregates in `src/data/stats.ts`) |
| Measured EDA: objects/min, density grids, example trajectories | `src/data/eda_stats.json` (typed in `src/data/eda.ts`) |
| EDA figures | `public/eda/scene_map_dark.jpg`, `public/eda/velocity_field_dark.jpg` (SVG fallback in `src/components/scene/`) |
| Predictions → site data converter | `scripts/convert-predictions.mjs`, `scripts/samples-meta.json`, `npm run data:convert` |
| Dashboard (report, timeline, upload control room) | `src/components/control-room/`, `src/components/dashboard/` |
| Mock analysis for uploads | `src/lib/mock-analysis.ts` |
| Docker (node server, port 3000) | `Dockerfile`, `.dockerignore` |

**Real vs mock**

- Real: EDA images, `eda_stats.json` (objects/min, heatmap, Results trajectories), all figures in
  `src/content/results.ts`, TEAM.
- Placeholder: `src/data/samples.json` — events are ours, but the **risk curves are synthetic**
  (one excursion >= 0.5 in C3902). Replace via `data:convert` (B1).
- Mock: "Try your video" while `VITE_USE_MOCK` is not `"false"` (result is simulated in the browser).

## B. MUST DO before submission

1. **Final predictions.** Put the final `predictions_samples.json` somewhere local (do not commit
   footage), check `scripts/samples-meta.json` (duration, fps, lighting per video), then
   `npm run data:convert -- path/to/predictions_samples.json`. It validates labels, max-pools risk
   into 0.1 s bins, prints a per-video summary and writes `src/data/samples.json` (nothing is
   written on errors). Commit.
2. **Final numbers.** Update `src/content/results.ts` and `HERO_METRICS` in `src/config.ts`
   (e.g. "11 event classes", "1 false alarm in 18 min"). Then re-read and fix any text that is no
   longer true:
   - number of event classes: now 11 (incl. `illegal_turn`, `solid_line_crossing`); keep the hero
     metric and the Rule engine node/drawer in sync with the final CLASSES list;
   - the Rule engine drawer in `src/components/landing/Pipeline.tsx` ("Eleven classes …", "Three classes
     are deliberately not predicted …");
   - Known limitations (`src/components/landing/Results.tsx`), Report (`src/components/landing/Report.tsx`),
     the other pipeline drawer texts, the "How we measured" block (held-out score: set
     `RESULTS.heldOutScore`).
3. **Deliverable links** in `LINKS` (`src/config.ts`, currently `"[TODO]"`): model repo URL,
   weights, `predictions_samples.json`, report (use the site's `#report`, i.e.
   `https://<domain>/#report`).
4. **Your links in TEAM** (`src/config.ts`): check your GitHub and LinkedIn URLs.
5. **Model repo README** must contain:
   - Team and who did what, with exactly the same roles as TEAM on the site:
     - Khojiakbar Khakimov — "Team captain · Frontend, product & analytics"
     - Zafar Ubaydullaev — "Backend & infrastructure"
     - Khamid Bustanov — "AI engineer · Models & testing"
   - A section on the edge-map reference file: what it is, why it is needed (scene alignment against
     camera drift), that the original frame is **not** included, and that its use was agreed with
     the organisers in a direct message on 25 Sep.
   - Submit a **fresh public repo with one clean commit**. Before submitting, this must print nothing:
     `git log --all --name-only | grep -Ei '\.(jpg|jpeg|png|mp4)$'` (no frames or videos from the samples).
6. **Deploy** (Yandex Cloud VM, Docker):
   ```sh
   docker build -t asila-site --build-arg VITE_USE_MOCK=false --build-arg VITE_API_BASE= .
   docker run -d --restart unless-stopped -p 127.0.0.1:3000:3000 asila-site
   ```
   Reverse proxy (nginx/Caddy) on one domain with HTTPS: `/api/` → demo backend, everything else →
   `127.0.0.1:3000`. Same origin, so `VITE_API_BASE` stays empty and no CORS is needed. Allow
   uploads of 300 MB and long polls. The site and the demo must stay online through the whole
   judging period.
7. **Real demo test** with the real backend (`VITE_USE_MOCK=false`), on desktop and on a phone:
   - clip up to 3 min → progress → result with timeline and risk curve;
   - clip from a different camera → `scene_matched: false` → "Camera not recognised" notice;
   - clip over 3 min → rejected with a message;
   - backend error → readable message and "Try again";
8. **Git.** `origin` is the Lovable-connected repo; `public` is
   `https://github.com/86Hoji/Asila_front_elim_task.git`. Push to both
   (`git push origin main`, `git push public main`). Never force-push, rebase or amend pushed commits.

## C. OPTIONAL

`data/my_labels.json` (our labels) → a per-video accuracy block in the Sample videos report:
TP/FP/FN per class at tIoU 0.5. Suggested place: `src/components/control-room/FeedReport.tsx`,
a card between the KPI row and the timeline; compute matches in a helper next to
`src/components/control-room/analysis.ts`, and load the labels like `src/data/samples.ts`.
Label it "on our own labels, not the hidden test set".

## D. Demo API contract (as implemented in `src/components/dashboard/TryYourVideoTab.tsx`)

Base: `${VITE_API_BASE}` (default `""` = same origin).

| Call | Request | Response |
| --- | --- | --- |
| `POST /api/analyze` | `multipart/form-data`, field `video` (the .mp4) | `{"job_id": string}` |
| `GET /api/jobs/{job_id}` | polled every 2 s, gives up after 10 min | `{"status": "queued" \| "running" \| "done" \| "error", "progress": 0..1, "error"?: string}` |
| `GET /api/jobs/{job_id}/result` | after `status: "done"` | result below |

Result:

```json
{
  "duration": 118.4,
  "fps": 29.97,
  "events": [[12.3, 15.0, "failure_to_yield"]],
  "risk": [[0.0, 0.03], [0.1, 0.03]],
  "annotated_video_url": "optional; if absent the user's own file is played",
  "scene_matched": true
}
```

- `events`: `[start_sec, end_sec, label]`, labels from the 14 classes in `src/types.ts`.
- `risk`: `[t_sec, score]`, any rate (the UI looks values up by time); alarm at `>= 0.5`.
- `scene_matched: false` shows "Camera not recognised: rules tied to this junction … were disabled".
- Any non-2xx response → the UI shows the status code; `status: "error"` shows `error`.
- The progress stepper (Decode, Detect, Track, Rules, Risk) is driven by `progress` only.
- Upload limits (checked in the browser before upload; enforce them on the server too):
  `.mp4` only, <= 300 MB, <= 180 s (`UPLOAD_LIMITS` in `src/config.ts`).
- Mock vs real: build-time env `VITE_USE_MOCK` (`"true"` default → simulated, `"false"` → real API).

## E. Rules

- Organisers' NDA: **no sample footage or frames anywhere on the site or in the repo** — no
  screenshots, crops, thumbnails or videos. Every visual must be our own drawing, chart or
  derived data (scene maps, vector fields, heatmaps).
- All numbers on the site come from `src/config.ts`, `src/content/results.ts` or the data files.
  Don't invent numbers.
- Never commit `package-lock.json`; never force-push.
