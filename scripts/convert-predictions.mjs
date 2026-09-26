#!/usr/bin/env node
/**
 * Converts our model's predictions into the site's sample data.
 *
 *   npm run data:convert -- path/to/predictions_samples.json [--meta scripts/samples-meta.json] [--out src/data/samples.json]
 *
 * Input:  {"team": string, "videos": {"<file>.mp4" (or .MP4): {"events": [[s, e, label]], "risk": [[t, score], ...]}}}
 * Meta:   {"<file>.mp4": {"duration": number, "fps": number, "lighting": string}}
 * Output: {"<file>.mp4": {"duration", "fps", "lighting", "events", "risk"}} with risk at 10 Hz.
 *
 * Risk is downsampled by taking the MAX in each 0.1 s bin, so short alarm peaks survive.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const CLASSES = new Set([
  "accident",
  "near_miss",
  "red_light",
  "wrong_way",
  "illegal_u_turn",
  "stopped_vehicle",
  "jaywalking",
  "failure_to_yield",
  "illegal_turn",
  "solid_line_crossing",
  "stop_line",
  "congestion",
  "road_obstacle",
  "fire_smoke",
]);
const HZ = 10;
const THRESHOLD = 0.5;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const input = process.argv
  .slice(2)
  .find((a, i, all) => !a.startsWith("--") && !all[i - 1]?.startsWith("--"));
if (!input) {
  console.error(
    "Usage: npm run data:convert -- <predictions_samples.json> [--meta file] [--out file]",
  );
  process.exit(1);
}
const metaPath = arg("--meta", "scripts/samples-meta.json");
const outPath = arg("--out", "src/data/samples.json");

const read = (p) => JSON.parse(readFileSync(resolve(p), "utf8"));
const preds = read(input);
const meta = read(metaPath);

if (!preds || typeof preds.videos !== "object") {
  console.error(`${input}: expected {"team", "videos": {...}}`);
  process.exit(1);
}

// Video keys may come as ".MP4"; the site uses lower-case ".mp4".
const normalise = (name) => name.replace(/.mp4$/i, ".mp4");
const videos = Object.fromEntries(
  Object.entries(preds.videos).map(([name, v]) => [normalise(name), v]),
);

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const errors = [];
const out = {};

for (const [name, video] of Object.entries(videos)) {
  const m = meta[name];
  if (!m) {
    errors.push(`${name}: missing from ${metaPath}`);
    continue;
  }
  const { duration, fps, lighting } = m;

  // Events: validate, clamp, sort.
  const events = [];
  for (const [i, ev] of (video.events ?? []).entries()) {
    const [s, e, label] = ev;
    if (!CLASSES.has(label)) {
      errors.push(`${name}: event ${i} has unknown label "${label}"`);
      continue;
    }
    if (!(Number.isFinite(s) && Number.isFinite(e)) || e < s) {
      errors.push(`${name}: event ${i} has invalid times [${s}, ${e}]`);
      continue;
    }
    events.push([round(Math.max(0, s), 2), round(Math.min(duration, e), 2), label]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  // Risk: max per 0.1 s bin; empty bins carry the previous value.
  const bins = Math.floor(duration * HZ) + 1;
  const risk = new Array(bins).fill(null);
  for (const [t, v] of video.risk ?? []) {
    if (!Number.isFinite(t) || !Number.isFinite(v) || t < 0 || t > duration + 1e-6) continue;
    const b = Math.min(bins - 1, Math.round(t * HZ));
    risk[b] = risk[b] === null ? v : Math.max(risk[b], v);
  }
  let last = 0;
  const series = risk.map((v, i) => {
    if (v !== null) last = v;
    return [round(i / HZ, 1), round(Math.min(1, Math.max(0, last)), 3)];
  });

  out[name] = { duration, fps, lighting, events, risk: series };

  // Summary
  const counts = {};
  for (const [, , l] of events) counts[l] = (counts[l] ?? 0) + 1;
  let alarms = 0;
  let inside = false;
  for (const [, v] of series) {
    if (v >= THRESHOLD && !inside) alarms++;
    inside = v >= THRESHOLD;
  }
  const peak = series.reduce((a, [, v]) => Math.max(a, v), 0);
  console.log(
    `${name.padEnd(12)} ${String(duration).padStart(6)} s  ${String(events.length).padStart(3)} events  ` +
      `${String(alarms).padStart(2)} alarm(s)  peak ${peak.toFixed(2)}  ` +
      Object.entries(counts)
        .map(([k, n]) => `${k}:${n}`)
        .join(" "),
  );
}

for (const name of Object.keys(meta)) {
  if (!videos[name]) errors.push(`${name}: in ${metaPath} but has no predictions`);
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error("\nNothing written.");
  process.exit(1);
}

writeFileSync(resolve(outPath), `${JSON.stringify(out)}\n`);
console.log(`\nWrote ${outPath} (${Object.keys(out).length} videos).`);
