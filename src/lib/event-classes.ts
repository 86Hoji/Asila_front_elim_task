import type { EventClass } from "@/types";

export const EVENT_CLASS_COLORS: Record<EventClass, string> = {
  accident: "#ff4d6d",
  near_miss: "#ff8c42",
  red_light: "#ff3b3b",
  wrong_way: "#ffd23f",
  illegal_u_turn: "#c77dff",
  stopped_vehicle: "#4cc9f0",
  jaywalking: "#06d6a0",
  failure_to_yield: "#f72585",
  illegal_turn: "#9d4edd",
  solid_line_crossing: "#ffb703",
  stop_line: "#fb8500",
  congestion: "#8ecae6",
  road_obstacle: "#adb5bd",
  fire_smoke: "#e63946",
};

export const EVENT_CLASS_LABELS: Record<EventClass, string> = {
  accident: "Accident",
  near_miss: "Near miss",
  red_light: "Red light",
  wrong_way: "Wrong way",
  illegal_u_turn: "Illegal U-turn",
  stopped_vehicle: "Stopped vehicle",
  jaywalking: "Jaywalking",
  failure_to_yield: "Failure to yield",
  illegal_turn: "Illegal turn",
  solid_line_crossing: "Solid line crossing",
  stop_line: "Stop line",
  congestion: "Congestion",
  road_obstacle: "Road obstacle",
  fire_smoke: "Fire / smoke",
};

export const EVENT_CLASS_DEFINITIONS: Record<EventClass, string> = {
  accident: "Two or more road users, or a road user and a fixed object, make physical contact.",
  near_miss: "Sharp braking or swerving to avoid a collision, with no contact.",
  red_light: "A vehicle crosses the stop line while its signal is red.",
  wrong_way:
    "A vehicle moves against the traffic direction of its lane, including driving in the oncoming lane.",
  illegal_u_turn: "A U-turn where road markings or signs prohibit it.",
  stopped_vehicle:
    "A vehicle stands still on the carriageway for 10 s or more, and not as part of a queue at a signal.",
  jaywalking: "A pedestrian is on the carriageway outside a crossing.",
  failure_to_yield:
    "A vehicle drives through a crossing while a pedestrian is on it or stepping onto it.",
  illegal_turn: "A turn from the wrong lane or in a prohibited direction.",
  solid_line_crossing: "A lane change or manoeuvre across a solid marking.",
  stop_line: "A vehicle stops past the stop line on red without entering the intersection.",
  congestion: "Traffic at a standstill or crawling across all lanes of one direction.",
  road_obstacle: "Debris, an animal or a fallen object on the carriageway.",
  fire_smoke: "Visible fire or smoke from a vehicle or on the road.",
};

/** Formats seconds as mm:ss.d */
export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe - m * 60;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

export function formatDuration(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}
