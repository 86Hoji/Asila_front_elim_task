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
  accident: "Two or more road users physically collide inside the camera view.",
  near_miss: "Trajectories would have collided; one party brakes or swerves within a second.",
  red_light: "A vehicle enters the intersection after the signal phase has turned red.",
  wrong_way: "A vehicle travels against the legal direction of its lane.",
  illegal_u_turn: "A vehicle reverses direction where the road markings forbid it.",
  stopped_vehicle: "A vehicle stays motionless in a live lane for longer than the dwell threshold.",
  jaywalking: "A pedestrian crosses outside the zebra or during the pedestrian red phase.",
  failure_to_yield: "A turning vehicle does not give way to a road user with priority.",
  illegal_turn: "A turn is taken from a lane or phase where that movement is not allowed.",
  solid_line_crossing: "A vehicle crosses a continuous lane divider.",
  stop_line: "A vehicle crosses or stops beyond the painted stop line during red.",
  congestion: "Queue length and mean speed cross the congestion threshold for the approach.",
  road_obstacle: "A static non-vehicle object blocks part of the carriageway.",
  fire_smoke: "Fire or smoke is visible in the scene.",
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
