import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EDA } from "@/config";
import { RESULTS } from "@/content/results";
import { cn } from "@/lib/utils";

type Kind = "LEARNED" | "RULE-BASED" | "INPUT" | "OUTPUT";

type Node = {
  id: string;
  title: string;
  kind: Kind;
  note: string;
  detail: string;
};

const [faBefore0, faBefore1] = RESULTS.falseAlarms.before;
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

const MAIN: Node[] = [
  {
    id: "video",
    title: "Video",
    kind: "INPUT",
    note: `${EDA.resolution} · H.264 · ${EDA.fps} fps`,
    detail: `${EDA.resolution} H.264, 10-bit 4:2:2, ${EDA.fps} fps. Decoded on the CPU with multi-threaded PyAV, skipping B-frames and downscaling to ${RESULTS.decode.widthPx} px wide.`,
  },
  {
    id: "sampling",
    title: "Frame sampling",
    kind: "RULE-BASED",
    note: `every ${ordinal(RESULTS.stride.gpu)} / ${ordinal(RESULTS.stride.cpu)} frame`,
    detail: `The stride is fixed per device, every ${ordinal(RESULTS.stride.gpu)} frame on a GPU and every ${ordinal(RESULTS.stride.cpu)} on a CPU, so two runs give identical results. Safety fuses only trigger if a video is about to exceed the time budget.`,
  },
  {
    id: "detect",
    title: "YOLO11s detection",
    kind: "LEARNED",
    note: "vehicles · pedestrians",
    detail:
      "Open-weights YOLO11s pretrained on COCO, used as released (no fine-tuning). Without a GPU it falls back to YOLO11n.",
  },
  {
    id: "track",
    title: "ByteTrack tracking",
    kind: "RULE-BASED",
    note: "persistent tracks",
    detail:
      "Links detections into persistent tracks, so every rule reasons about trajectories, not single frames. Tracks are cached, so re-runs are near-instant.",
  },
  {
    id: "scene",
    title: "Scene alignment",
    kind: "RULE-BASED",
    note: "lanes · stop line · crossings",
    detail: `Lanes with their legal directions, the stop line, zebra crossings and the junction area are mapped once and re-aligned to every video, because the camera drifts up to ${EDA.cameraDriftPct}% of the frame width between recordings. All geometry is computed on the road plane in metres.`,
  },
  {
    id: "phase",
    title: "Traffic-light phase reader",
    kind: "RULE-BASED",
    note: "signal state from pixels",
    detail:
      "Reads the signal from the pixels of the signal heads, with no training. The pedestrian section is the main signal; the vehicle section confirms it. Works in noon sun and at dusk.",
  },
  {
    id: "rules",
    title: "Rule engine",
    kind: "RULE-BASED",
    note: "9 classes",
    detail:
      "Nine classes come from rules over trajectories, scene geometry and signal phase: stopped_vehicle, congestion, wrong_way, jaywalking, red_light, stop_line, failure_to_yield, accident, near_miss. Five classes are deliberately not predicted: under macro F1 a predicted class that is absent from the test set scores zero.",
  },
  {
    id: "events",
    title: "Event segments",
    kind: "OUTPUT",
    note: "[start, end, label]",
    detail:
      "Post-processing merges fragments and drops sub-second blips; boundaries follow the start/end convention of each class.",
  },
];

const BRANCH: Node[] = [
  {
    id: "plane",
    title: "Road-plane projection",
    kind: "RULE-BASED",
    note: "homography",
    detail:
      "A homography maps image coordinates onto the road plane, so speeds and distances are comparable across the frame.",
  },
  {
    id: "ttc",
    title: "Time-to-collision",
    kind: "RULE-BASED",
    note: "pairwise",
    detail:
      "For every pair of nearby road users, time-to-collision is computed from their positions and velocities on the road plane.",
  },
  {
    id: "risk",
    title: "Causal risk score",
    kind: "RULE-BASED",
    note: "Part B · past frames only",
    detail: `Risk rises as the minimum time-to-collision drops, using only frames already seen. Tuning cut false alarms from ${faBefore0}-${faBefore1} to ${RESULTS.falseAlarms.after} across ${RESULTS.falseAlarms.minutes} minutes of footage.`,
  },
];

const BADGE_STYLE: Record<Kind, { color: string; background: string }> = {
  LEARNED: { color: "var(--teal)", background: "rgba(0,194,188,0.12)" },
  "RULE-BASED": { color: "var(--lavender)", background: "rgba(199,125,255,0.12)" },
  INPUT: { color: "#c2d3d2", background: "rgba(194,211,210,0.1)" },
  OUTPUT: { color: "#c2d3d2", background: "rgba(194,211,210,0.1)" },
};

function Badge({ kind }: { kind: Kind }) {
  return (
    <span
      className="mono-label inline-block rounded-full px-2 py-0.5 text-[10px]"
      style={BADGE_STYLE[kind]}
    >
      {kind}
    </span>
  );
}

function NodeCard({ node, index, onClick }: { node: Node; index: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass hover-lift group relative flex h-full w-full min-w-0 flex-col p-5 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge kind={node.kind} />
        <span className="font-mono text-[10px] text-muted-foreground">
          {String(index).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold leading-snug">{node.title}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{node.note}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs text-teal-mid transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
        Details <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

/** Animated connector line. `dir` is where the flow goes. */
function Flow({ dir, className }: { dir: "right" | "left" | "down"; className?: string }) {
  const vertical = dir === "down";
  const len = 40;
  const x2 = vertical ? 1 : len;
  const y2 = vertical ? len : 1;
  return (
    <svg
      width={vertical ? 2 : len}
      height={vertical ? len : 2}
      className={cn("overflow-visible", className)}
      style={dir === "left" ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <line x1="1" y1="1" x2={x2} y2={y2} stroke="rgba(0,194,188,0.3)" strokeWidth="1" />
      <line
        x1="1"
        y1="1"
        x2={x2}
        y2={y2}
        stroke="var(--teal)"
        strokeWidth="1.5"
        strokeDasharray="8 32"
        style={{ animation: "flow-dash 3s linear infinite" }}
      />
    </svg>
  );
}

/**
 * Desktop: a 4-column snake. Row 1 runs left to right, the flow drops down on the
 * right, row 2 runs right to left. Grid positions are explicit so DOM order stays
 * the logical pipeline order for screen readers.
 */
const SNAKE_POS = [
  "lg:col-start-1 lg:row-start-1",
  "lg:col-start-2 lg:row-start-1",
  "lg:col-start-3 lg:row-start-1",
  "lg:col-start-4 lg:row-start-1",
  "lg:col-start-4 lg:row-start-2",
  "lg:col-start-3 lg:row-start-2",
  "lg:col-start-2 lg:row-start-2",
  "lg:col-start-1 lg:row-start-2",
];

function DesktopSnake({ onOpen }: { onOpen: (n: Node) => void }) {
  return (
    <div className="hidden lg:grid lg:grid-cols-4 lg:gap-x-10 lg:gap-y-10">
      {MAIN.map((node, i) => (
        <div key={node.id} className={cn("relative", SNAKE_POS[i])}>
          <NodeCard node={node} index={i + 1} onClick={() => onOpen(node)} />
          {i < 3 && <Flow dir="right" className="absolute -right-10 top-1/2" />}
          {i === 3 && <Flow dir="down" className="absolute -bottom-10 left-1/2" />}
          {i >= 4 && i < 7 && <Flow dir="left" className="absolute -left-10 top-1/2" />}
        </div>
      ))}
    </div>
  );
}

function MobileStepper({ nodes, onOpen }: { nodes: Node[]; onOpen: (n: Node) => void }) {
  return (
    <ol className="relative space-y-3 pl-7 lg:hidden">
      <span
        className="absolute bottom-6 left-[9px] top-6 w-px bg-[rgba(0,194,188,0.3)]"
        aria-hidden
      />
      {nodes.map((node, i) => (
        <li key={node.id} className="relative">
          <span
            className="absolute -left-7 top-6 flex h-[19px] w-[19px] items-center justify-center rounded-full border border-teal-mid bg-background"
            aria-hidden
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          </span>
          <NodeCard node={node} index={i + 1} onClick={() => onOpen(node)} />
        </li>
      ))}
    </ol>
  );
}

export function Pipeline() {
  const [active, setActive] = useState<Node | null>(null);

  return (
    <Section id="approach">
      <Reveal>
        <Eyebrow>PIPELINE // FROM PIXELS TO EVENTS</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-5xl">
          One pass over the frames, two answers out.
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Badge kind="LEARNED" /> trained model
          </span>
          <span className="inline-flex items-center gap-2">
            <Badge kind="RULE-BASED" /> geometry and rules, no training
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.12}>
        <div className="mt-12">
          <DesktopSnake onOpen={setActive} />
          <MobileStepper nodes={MAIN} onOpen={setActive} />
        </div>
      </Reveal>

      <Reveal delay={0.16}>
        <div className="mt-14">
          <p className="mono-label">BRANCH FROM TRACKING // ACCIDENT ANTICIPATION</p>
          <div className="mt-4 hidden lg:grid lg:grid-cols-4 lg:gap-x-10">
            {BRANCH.map((node, i) => (
              <div key={node.id} className="relative">
                <NodeCard node={node} index={i + 1} onClick={() => setActive(node)} />
                {i < BRANCH.length - 1 && (
                  <Flow dir="right" className="absolute -right-10 top-1/2" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <MobileStepper nodes={BRANCH} onOpen={setActive} />
          </div>
        </div>
      </Reveal>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="border-border bg-[#031818] text-foreground">
          <SheetHeader>
            <div>{active && <Badge kind={active.kind} />}</div>
            <SheetTitle className="text-foreground">{active?.title}</SheetTitle>
            <SheetDescription className="font-mono text-xs text-teal-mid">
              {active?.note}
            </SheetDescription>
          </SheetHeader>
          <p className="px-4 text-sm leading-relaxed text-[var(--body)]">{active?.detail}</p>
        </SheetContent>
      </Sheet>
    </Section>
  );
}
