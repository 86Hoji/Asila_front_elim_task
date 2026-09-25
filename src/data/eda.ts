import raw from "./eda_stats.json";
import type { EventClass } from "@/types";

/**
 * Measured statistics from our tracks on the 4 sample videos (eda_stats.json).
 * Coordinates are normalised [0, 1] in the scene-map view (/eda/scene_map_dark.jpg).
 * Video keys are normalised to the lower-case ".mp4" used by samples.json.
 */

type Raw = {
  per_minute: Record<string, Array<{ minute: number; vehicles: number; pedestrians: number }>>;
  density: { grid: { cols: number; rows: number }; vehicles: number[][]; pedestrians: number[][] };
  trajectories: Record<
    string,
    Array<{
      video: string;
      start_sec: number;
      end_sec: number;
      polylines: Array<{ t: number[]; xy: Array<[number, number]> }>;
    }>
  >;
};

const data = raw as unknown as Raw;

export const normaliseVideo = (name: string) => name.replace(/\.mp4$/i, ".mp4");
const videoId = (name: string) => name.replace(/\.mp4$/i, "");

export const PER_MINUTE = Object.entries(data.per_minute).map(([name, rows]) => ({
  name: normaliseVideo(name),
  id: videoId(name),
  rows: rows.map((r) => ({ ...r, label: `${r.minute + 1}` })),
}));

export const DENSITY = data.density;

export type Trajectory = {
  video: string;
  id: string;
  start: number;
  end: number;
  polylines: Array<Array<[number, number]>>;
};

export const TRAJECTORIES: Partial<Record<EventClass, Trajectory[]>> = Object.fromEntries(
  Object.entries(data.trajectories).map(([cls, list]) => [
    cls,
    list.map((e) => ({
      video: normaliseVideo(e.video),
      id: videoId(e.video),
      start: e.start_sec,
      end: e.end_sec,
      polylines: e.polylines.map((p) => p.xy),
    })),
  ]),
);
