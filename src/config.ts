/**
 * Single source of truth for everything that changes between the mock demo
 * and the real backend / final submission.
 */

/** Base URL of the demo API. "" means same origin (the site and /api behind one domain). */
export const API_BASE: string = import.meta.env["VITE_API_BASE"] ?? "";

/** "Try your video" is simulated in the browser unless VITE_USE_MOCK is "false". */
export const USE_MOCK: boolean = import.meta.env["VITE_USE_MOCK"] !== "false";

/** Sample footage is under NDA — keep false to render the scene schematic instead. */
export const SHOW_SAMPLE_VIDEOS = false;

import { RESULTS } from "@/content/results";

export const HERO_METRICS = [
  { value: 11, suffix: "", label: "event classes" },
  {
    value: RESULTS.falseAlarms.after,
    suffix: "",
    label: `false alarms in ${RESULTS.falseAlarms.minutes} min`,
  },
  { value: 4, suffix: "K", label: "· 29.97 fps input" },
  {
    value: RESULTS.runtime.max,
    text: `${RESULTS.runtime.min}-${RESULTS.runtime.max}×`,
    suffix: "×",
    label: `processing time vs. video length (limit ${RESULTS.runtime.limit}×)`,
  },
] as const;

export const LINKS = {
  github: "https://github.com/ubaydullayevzafar1308-ops/WIUT-CV",
  weights: "https://github.com/ubaydullayevzafar1308-ops/WIUT-CV/tree/main/weights",
  predictions:
    "https://github.com/ubaydullayevzafar1308-ops/WIUT-CV/blob/main/predictions_samples.json",
  /** Same-site anchor. */
  report: "/#report",
};

export const TEAM = [
  {
    name: "Khojiakbar Khakimov",
    role: "Team captain · Frontend, product & analytics",
    initials: "KK",
    did: [
      "Analysed the task and the judging criteria and set the product direction",
      "Designed and built the website, the dashboard and the demo UI",
      "Coordinated the team and the submission",
    ],
    previous:
      "Real Holat, a civic-tech platform for checking how public money is spent on infrastructure (3rd place and a 40M UZS investment grant, Real Holat Hackathon 2026); 2nd place, Uzum AdTech Hackathon 2026; 3rd place, National Transport Hackathon 2026 (Safe Layer, a road-quality map for micromobility).",
    links: {
      github: "https://github.com/86Hoji",
      linkedin: "https://www.linkedin.com/in/hojiakbar-xakimov-7920b6382",
      portfolio: "",
    },
  },
  {
    name: "Zafar Ubaydullaev",
    role: "Backend & infrastructure",
    initials: "ZU",
    did: [
      "The offline inference package and repository",
      "Video decoding and the runtime budget; deterministic runs",
      "The demo API and deployment",
    ],
    previous: "Yoshlar Radar, a GovTech youth-employment platform (NEXUS30 hackathon).",
    links: {
      github: "https://github.com/ubaydullayevzafar1308-ops",
      linkedin: "https://www.linkedin.com/in/zafar-ubaydullayev-741190360/",
      portfolio: "",
    },
  },
  {
    name: "Khamid Bustanov",
    role: "AI engineer · Models & testing",
    initials: "KB",
    did: [
      "Model experiments",
      "Testing and evaluation of the pipeline on our labelled sample videos",
    ],
    previous:
      "JobLedger (jobledger.uz); a computer-vision clustering model for football analytics (Abstract IT).",
    links: {
      github: "https://github.com/tiredjon",
      linkedin: "https://www.linkedin.com/in/khamidbustanov",
      portfolio: "https://jobledger.uz",
    },
  },
];

export const SAMPLE_ORDER = ["C3896.mp4", "C3897.mp4", "C3902.mp4", "C3905.mp4"];

export const UPLOAD_LIMITS = {
  maxBytes: 200 * 1024 * 1024,
  maxSeconds: 120,
  accept: ".mp4",
};

export const RISK_THRESHOLD = 0.5;

/** Facts from our exploratory analysis of the sample footage (shown on the landing page). */
export const EDA = {
  videoCount: 4,
  resolution: "4K",
  fps: 29.97,
  codec: "H.264 10-bit 4:2:2",
  cameraDriftPct: 3,
  signalCycle: {
    totalSec: 75,
    flashingGreenSec: 3,
    yellowSec: 3,
  },
  /** Vehicles crossing the stop line per minute, by signal phase: [min, max]. */
  stopLineCrossingsPerMin: {
    red: [0, 4] as [number, number],
    green: [50, 66] as [number, number],
  },
};
