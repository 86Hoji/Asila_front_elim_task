/**
 * Single source of truth for everything that changes between the mock demo
 * and the real backend / final submission.
 */

export const API_BASE: string = import.meta.env["VITE_API_BASE"] ?? "";

/** When true (or when API_BASE is empty), "Try your video" is fully simulated. */
export const USE_MOCK = true;

/** Sample footage is under NDA — keep false to render the scene schematic instead. */
export const SHOW_SAMPLE_VIDEOS = false;

export const HERO_METRICS = [
  { value: 9, suffix: "", label: "event classes" },
  { value: 1, suffix: "", label: "false alarm in 18 min" },
  { value: 4, suffix: "K", label: "· 29.97 fps input" },
  { value: 3, prefix: "< ", suffix: "×", label: "real-time budget" },
] as const;

export const LINKS = {
  github: "[TODO]",
  weights: "[TODO]",
  predictions: "[TODO]",
  report: "[TODO]",
};

export const TEAM = [
  {
    name: "Khojiakbar Khakimov",
    role: "Team captain · Frontend & product",
    initials: "KH",
    did: [
      "Product direction and judging narrative",
      "Landing page and operator dashboard",
      "Event timeline, risk chart and schematic renderer",
    ],
    previous: "[TODO: previous projects]",
    links: {
      github: "https://github.com/86Hoji",
      linkedin: "https://www.linkedin.com/in/hojiakbar-xakimov-7920b6382",
      portfolio: "",
    },
  },
  {
    name: "[TODO member 2]",
    role: "[TODO role]",
    initials: "T2",
    did: ["[TODO: contribution]", "[TODO: contribution]"],
    previous: "[TODO: previous projects]",
    links: { github: "", linkedin: "", portfolio: "" },
  },
  {
    name: "[TODO member 3]",
    role: "[TODO role]",
    initials: "T3",
    did: ["[TODO: contribution]", "[TODO: contribution]"],
    previous: "[TODO: previous projects]",
    links: { github: "", linkedin: "", portfolio: "" },
  },
];

export const SAMPLE_ORDER = ["C3896.mp4", "C3897.mp4", "C3902.mp4", "C3905.mp4"];

export const UPLOAD_LIMITS = {
  maxBytes: 200 * 1024 * 1024,
  maxSeconds: 120,
  accept: ".mp4",
};

export const RISK_THRESHOLD = 0.5;
