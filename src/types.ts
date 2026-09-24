export type EventClass =
  | "accident"
  | "near_miss"
  | "red_light"
  | "wrong_way"
  | "illegal_u_turn"
  | "stopped_vehicle"
  | "jaywalking"
  | "failure_to_yield"
  | "illegal_turn"
  | "solid_line_crossing"
  | "stop_line"
  | "congestion"
  | "road_obstacle"
  | "fire_smoke";

/** [start_sec, end_sec, label] */
export type DetectedEvent = [number, number, EventClass];

/** [t_sec, score] */
export type RiskPoint = [number, number];

export type AnalysisResult = {
  duration: number;
  fps: number;
  events: DetectedEvent[];
  risk: RiskPoint[];
  annotated_video_url?: string;
};

export type SampleVideo = AnalysisResult & {
  lighting: string;
};

export type SamplesFile = Record<string, SampleVideo>;

export type JobStatus = "queued" | "running" | "done" | "error";

export type JobState = {
  status: JobStatus;
  progress: number;
  error?: string;
};
