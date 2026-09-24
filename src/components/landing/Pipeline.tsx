import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Node = {
  id: string;
  title: string;
  kind: "LEARNED" | "RULE-BASED";
  note: string;
  detail: string;
};

const MAIN: Node[] = [
  { id: "video", title: "Video", kind: "RULE-BASED", note: "4K · H.264", detail: "[TODO] Describe the input footage handling: 10-bit 4:2:2 decoding on CPU, colour conversion and the frame cache we keep in memory." },
  { id: "sampling", title: "Frame sampling", kind: "RULE-BASED", note: "adaptive stride", detail: "[TODO] Explain the sampling stride, how we keep it within the 3× real-time budget, and how skipped frames are interpolated for tracking." },
  { id: "detect", title: "YOLO11s detection", kind: "LEARNED", note: "vehicles · people", detail: "[TODO] Describe the detector, its training data and the confidence thresholds used per class." },
  { id: "track", title: "ByteTrack tracking", kind: "RULE-BASED", note: "stable IDs", detail: "[TODO] Describe association, ID persistence through occlusion, and how short tracks are discarded." },
  { id: "scene", title: "Scene alignment", kind: "RULE-BASED", note: "lanes · stop line · crossings", detail: "[TODO] Explain the per-video scene map: how lanes, the stop line and zebra crossings are registered and re-aligned against camera drift." },
  { id: "phase", title: "Traffic-light phase reader", kind: "LEARNED", note: "red · green · yellow", detail: "[TODO] Explain how the signal head is cropped and classified per frame, and how the phase timeline is smoothed." },
  { id: "rules", title: "Rule engine", kind: "RULE-BASED", note: "9 classes", detail: "[TODO] Explain how geometry, phase and track state combine into event segments, and how overlapping detections are merged." },
  { id: "events", title: "Event segments", kind: "RULE-BASED", note: "[start, end, label]", detail: "[TODO] Describe the output format, the post-processing that merges adjacent segments and the confidence filter." },
];

const BRANCH: Node[] = [
  { id: "plane", title: "Road-plane projection", kind: "RULE-BASED", note: "homography", detail: "[TODO] Explain the homography that maps image pixels to metric road coordinates." },
  { id: "ttc", title: "Time-to-collision", kind: "RULE-BASED", note: "pairwise", detail: "[TODO] Explain how pairwise TTC is computed from projected velocities and how close calls are ranked." },
  { id: "risk", title: "Causal risk score", kind: "LEARNED", note: "Part B", detail: "[TODO] Explain the causal scoring head: inputs, window length and why it never looks at future frames." },
];

function Badge({ kind }: { kind: Node["kind"] }) {
  const learned = kind === "LEARNED";
  return (
    <span
      className="mono-label rounded-full px-2 py-0.5 text-[10px]"
      style={{
        color: learned ? "var(--teal)" : "var(--lavender)",
        background: learned ? "rgba(0,194,188,0.12)" : "rgba(199,125,255,0.12)",
      }}
    >
      {kind}
    </span>
  );
}

function NodeCard({ node, onClick }: { node: Node; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass hover-lift group w-full min-w-[190px] max-w-[240px] shrink-0 p-5 text-left"
    >
      <Badge kind={node.kind} />
      <h3 className="mt-3 text-base font-semibold leading-snug">{node.title}</h3>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{node.note}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs text-teal-mid opacity-0 transition-opacity group-hover:opacity-100">
        Details <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function Connector() {
  return (
    <div className="hidden h-px w-10 shrink-0 self-center lg:block" aria-hidden>
      <svg width="40" height="2" className="overflow-visible">
        <line x1="0" y1="1" x2="40" y2="1" stroke="rgba(0,194,188,0.3)" strokeWidth="1" />
        <line
          x1="0"
          y1="1"
          x2="40"
          y2="1"
          stroke="var(--teal)"
          strokeWidth="1.5"
          strokeDasharray="8 32"
          style={{ animation: "flow-dash 3s linear infinite" }}
        />
      </svg>
    </div>
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

      <Reveal delay={0.12}>
        <div className="scrollbar-thin-teal mt-14 overflow-x-auto pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {MAIN.map((node, i) => (
              <div key={node.id} className="flex flex-col lg:flex-row">
                <NodeCard node={node} onClick={() => setActive(node)} />
                {i < MAIN.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.16}>
        <div className="mt-10">
          <p className="mono-label">BRANCH FROM TRACKING // ACCIDENT ANTICIPATION</p>
          <div className="scrollbar-thin-teal mt-4 overflow-x-auto pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:gap-0">
              {BRANCH.map((node, i) => (
                <div key={node.id} className="flex flex-col lg:flex-row">
                  <NodeCard node={node} onClick={() => setActive(node)} />
                  {i < BRANCH.length - 1 && <Connector />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="border-border bg-[#031818] text-foreground">
          <SheetHeader>
            <SheetTitle className="text-foreground">{active?.title}</SheetTitle>
            <SheetDescription className="font-mono text-xs text-teal-mid">
              {active?.kind} · {active?.note}
            </SheetDescription>
          </SheetHeader>
          <p className="px-4 text-sm leading-relaxed text-[var(--body)]">{active?.detail}</p>
        </SheetContent>
      </Sheet>
    </Section>
  );
}
