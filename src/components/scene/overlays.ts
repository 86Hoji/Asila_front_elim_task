import type { DetectedEvent, EventClass } from "@/types";
import {
  FAR_CROSSING,
  FAR_LANES,
  JUNCTION_X,
  NEAR,
  NEAR_CROSSING,
  NEAR_LANES,
  SIDE_CROSSING,
  STOP_LINE_X,
  buildTrack,
  hashString,
  pointAt,
  sidePoint,
  type Pt,
  type Track,
} from "./geometry";

/**
 * How each event class is acted out on the scene drawing. Pure geometry: given
 * the event's progress p in [0, 1], `place` writes the positions of its actors.
 */
export type Actor = "veh" | "ped" | "obj";

export type Decor =
  | { kind: "ring"; at: Pt }
  | { kind: "stopline"; color: string }
  | { kind: "chevrons" }
  | { kind: "burst"; at: Pt; contact: boolean }
  | { kind: "timer" }
  | { kind: "zone"; x: number; y: number; w: number; h: number }
  | { kind: "smoke" };

export type OverlaySpec = {
  /** Where the label pill is pinned (in scene units). */
  anchor: Pt;
  actors: Actor[];
  place: (p: number, out: Pt[]) => void;
  decor: Decor[];
  /** True when the near signal head should show red during this event. */
  red?: boolean;
};

const lerp = (a: number, b: number, u: number) => a + (b - a) * Math.min(1, Math.max(0, u));
const set = (o: Pt, x: number, y: number) => {
  o.x = x;
  o.y = y;
};
const along = (track: Track, p: number, o: Pt) => pointAt(track, p * track.length, o);

const UTURN = buildTrack({ x: 380, y: NEAR_LANES[0]! }, [
  { kind: "L", to: { x: 540, y: NEAR_LANES[0]! } },
  { kind: "Q", c: { x: 600, y: 225 }, to: { x: 540, y: FAR_LANES[2]! } },
  { kind: "L", to: { x: 380, y: FAR_LANES[2]! } },
]);

const WRONG_TURN = buildTrack({ x: 280, y: NEAR_LANES[0]! }, [
  { kind: "L", to: { x: 480, y: NEAR_LANES[0]! } },
  { kind: "Q", c: { x: 545, y: NEAR_LANES[0]! + 4 }, to: sidePoint(80, -30) },
  { kind: "L", to: sidePoint(260, -30) },
]);

/** Deterministic variant for an event, so the same event always plays out in the same place. */
function variant(seed: string, n: number) {
  return hashString(seed) % n;
}

function failureToYield(v: number): OverlaySpec {
  if (v === 0) {
    const cx = NEAR_CROSSING.x + NEAR_CROSSING.w / 2;
    const y = NEAR_LANES[1]!;
    return {
      anchor: { x: cx, y: NEAR.top - 14 },
      actors: ["veh", "ped"],
      place: (p, o) => {
        set(o[0]!, lerp(290, 520, p), y);
        set(o[1]!, cx + 6, lerp(NEAR.bottom + 6, NEAR.top + 30, p));
      },
      decor: [{ kind: "ring", at: { x: cx, y } }],
    };
  }
  if (v === 1) {
    const cx = FAR_CROSSING.x + FAR_CROSSING.w / 2;
    const y = FAR_LANES[1]!;
    return {
      anchor: { x: cx, y: 76 },
      actors: ["veh", "ped"],
      place: (p, o) => {
        set(o[0]!, lerp(840, 600, p), y);
        set(o[1]!, cx - 6, lerp(84, 200, p));
      },
      decor: [{ kind: "ring", at: { x: cx, y } }],
    };
  }
  const c = sidePoint(SIDE_CROSSING.y + SIDE_CROSSING.h / 2, 0);
  return {
    anchor: { x: c.x + 90, y: c.y - 10 },
    actors: ["veh", "ped"],
    place: (p, o) => {
      const a = sidePoint(lerp(20, 260, p), 30);
      set(o[0]!, a.x, a.y);
      const b = sidePoint(SIDE_CROSSING.y + SIDE_CROSSING.h / 2, lerp(-72, 40, p));
      set(o[1]!, b.x, b.y);
    },
    decor: [{ kind: "ring", at: c }],
  };
}

export function overlayFor(label: EventClass, start: number): OverlaySpec {
  const seed = `${label}:${start}`;
  switch (label) {
    case "failure_to_yield":
      return failureToYield(variant(seed, 3));

    case "stop_line": {
      const y = NEAR_LANES[variant(seed, 3)]!;
      return {
        anchor: { x: STOP_LINE_X, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (p, o) =>
          set(o[0]!, p < 0.35 ? lerp(290, STOP_LINE_X + 18, p / 0.35) : STOP_LINE_X + 18, y),
        decor: [{ kind: "stopline", color: "#fb8500" }],
        red: true,
      };
    }

    case "red_light": {
      const y = NEAR_LANES[variant(seed, 3)]!;
      return {
        anchor: { x: STOP_LINE_X + 40, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (p, o) => set(o[0]!, lerp(300, 640, p), y),
        decor: [{ kind: "stopline", color: "#ff3b3b" }],
        red: true,
      };
    }

    case "jaywalking": {
      const near = variant(seed, 2) === 0;
      const x = near ? 230 : 870;
      const [y0, y1] = near ? [NEAR.bottom + 8, NEAR.top + 6] : [84, 204];
      return {
        anchor: { x, y: near ? NEAR.bottom + 44 : 64 },
        actors: ["ped"],
        place: (p, o) => set(o[0]!, x + Math.sin(p * 6) * 4, lerp(y0, y1, p)),
        decor: [],
      };
    }

    case "stopped_vehicle": {
      const near = variant(seed, 2) === 0;
      const pos = near ? { x: 190, y: NEAR_LANES[2]! } : { x: 860, y: FAR_LANES[0]! };
      return {
        anchor: { x: pos.x, y: pos.y - 26 },
        actors: ["veh"],
        place: (_p, o) => set(o[0]!, pos.x, pos.y),
        decor: [{ kind: "timer" }],
      };
    }

    case "wrong_way": {
      const y = NEAR_LANES[variant(seed, 2)]!;
      return {
        anchor: { x: 500, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (p, o) => set(o[0]!, lerp(920, 100, p), y),
        decor: [{ kind: "chevrons" }],
      };
    }

    case "congestion": {
      const r = hashString(seed);
      const cars: Pt[] = [];
      for (let i = 0; i < 12; i++) {
        cars.push({ x: 640 + ((r >> i) % 7) * 44 + (i % 3) * 9, y: FAR_LANES[i % 3]! });
      }
      return {
        anchor: { x: 800, y: 76 },
        actors: cars.map(() => "veh"),
        place: (p, o) => cars.forEach((c, i) => set(o[i]!, c.x - p * 18, c.y)),
        decor: [{ kind: "zone", x: 610, y: 94, w: 380, h: 112 }],
      };
    }

    case "accident":
    case "near_miss": {
      const contact = label === "accident";
      const hit = { x: JUNCTION_X - 10, y: NEAR_LANES[0]! + 6 };
      return {
        anchor: { x: hit.x, y: hit.y - 44 },
        actors: ["veh", "veh"],
        place: (p, o) => {
          const u = Math.min(1, p / 0.45);
          const gap = contact ? 0 : 20;
          if (p < 0.45 || contact) {
            set(o[0]!, lerp(420, hit.x - 8 - gap, u), lerp(NEAR_LANES[0]!, hit.y, u));
            set(o[1]!, lerp(640, hit.x + 8 + gap, u), lerp(FAR_LANES[2]!, hit.y - 4, u));
          } else {
            const w = (p - 0.45) / 0.55;
            set(o[0]!, lerp(hit.x - 8 - gap, 700, w), lerp(hit.y, NEAR_LANES[0]!, w));
            set(o[1]!, lerp(hit.x + 8 + gap, hit.x - 20, w), lerp(hit.y - 4, hit.y + 70, w));
          }
        },
        decor: [{ kind: "burst", at: hit, contact }],
      };
    }

    case "illegal_u_turn":
      return {
        anchor: { x: 560, y: 76 },
        actors: ["veh"],
        place: (p, o) => along(UTURN, p, o[0]!),
        decor: [],
      };

    case "illegal_turn":
      return {
        anchor: { x: 470, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (p, o) => along(WRONG_TURN, p, o[0]!),
        decor: [],
      };

    case "solid_line_crossing": {
      const y0 = NEAR_LANES[1]!;
      const y1 = NEAR_LANES[0]!;
      return {
        anchor: { x: STOP_LINE_X - 20, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (p, o) => {
          const x = lerp(240, 440, p);
          set(o[0]!, x, lerp(y0, y1, (x - STOP_LINE_X + 40) / 40));
        },
        decor: [],
      };
    }

    case "road_obstacle":
      return {
        anchor: { x: 400, y: 76 },
        actors: ["obj"],
        place: (_p, o) => set(o[0]!, 400, FAR_LANES[1]!),
        decor: [{ kind: "ring", at: { x: 400, y: FAR_LANES[1]! } }],
      };

    case "fire_smoke":
      return {
        anchor: { x: 820, y: NEAR.top - 14 },
        actors: ["veh"],
        place: (_p, o) => set(o[0]!, 820, NEAR_LANES[1]!),
        decor: [{ kind: "smoke" }],
      };
  }
}

/** Indices of the events active at time t, as a stable string key. */
export function activeKey(events: DetectedEvent[], t: number) {
  let key = "";
  for (let i = 0; i < events.length; i++) {
    const e = events[i]!;
    if (t >= e[0] && t <= e[1]) key += key ? `,${i}` : `${i}`;
  }
  return key;
}
