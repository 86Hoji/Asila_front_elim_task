import { lazy, Suspense } from "react";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";

const EdaCharts = lazy(() => import("./EdaCharts"));

const LIGHTING = [
  { label: "noon", color: "#ffe9a8" },
  { label: "noon", color: "#ffdf8f" },
  { label: "evening", color: "#ff9d6e" },
  { label: "dusk", color: "#6a7bd1" },
];

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`glass hover-lift flex h-full flex-col p-6 ${className ?? ""}`}>
      <h3 className="mono-label text-teal-mid">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
    </article>
  );
}

function CycleBar() {
  const phases = [
    { label: "pedestrian red", width: 46, color: "rgba(255,59,59,0.45)" },
    { label: "flashing green", width: 4, color: "rgba(6,214,160,0.55)" },
    { label: "yellow", width: 4, color: "rgba(255,210,63,0.6)" },
    { label: "green", width: 46, color: "rgba(0,255,235,0.35)" },
  ];
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-full border border-border">
        {phases.map((p, i) => (
          <div
            key={i}
            className="relative h-full"
            style={{ width: `${p.width}%`, background: p.color }}
            title={p.label}
          />
        ))}
      </div>
      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-[var(--teal-dim)]">
        <div
          className="absolute inset-y-0 w-1/5 rounded-full bg-teal"
          style={{ animation: "flow-dash 0s", animationName: "none" }}
        />
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <li>~75 s full cycle</li>
        <li>3 s flashing green</li>
        <li>3 s yellow</li>
        <li>then vehicle red</li>
      </ul>
    </div>
  );
}

function FigurePlaceholder({ caption }: { caption: string }) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="relative flex min-h-[200px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-border"
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(0,194,188,0.05) 0 12px, transparent 12px 24px), rgba(0,45,42,0.35)",
        }}
      >
        <span className="font-mono text-xs tracking-widest text-muted-foreground">
          [TODO: figure]
        </span>
      </div>
      <p className="mt-3 text-sm text-[var(--body)]">{caption}</p>
    </div>
  );
}

export function DataSection() {
  return (
    <Section id="data">
      <Reveal>
        <Eyebrow>EXPLORATORY ANALYSIS</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-5xl">
          What the camera actually gives us.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Reveal delay={0.04}>
          <Card title="THE FOOTAGE">
            <p className="text-2xl font-semibold text-foreground">18 minutes</p>
            <p className="mt-2 text-sm text-[var(--body)]">
              4 sample videos, 4K at 29.97 fps, H.264 10-bit 4:2:2 — CPU-only decoding.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card title="LIGHTING">
            <div className="grid grid-cols-4 gap-3">
              {LIGHTING.map((l, i) => (
                <div key={i}>
                  <div
                    className="h-14 w-full rounded-lg border border-border"
                    style={{ background: l.color, opacity: 0.8 }}
                  />
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {l.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card title="CAMERA DRIFT">
            <p className="text-2xl font-semibold text-foreground">up to 3%</p>
            <p className="mt-2 text-sm text-[var(--body)]">
              The camera shifts up to 3% of frame width between recordings, so the scene map is
              re-aligned per video.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.04} className="lg:col-span-2">
          <Card title="SIGNAL CYCLE">
            <CycleBar />
          </Card>
        </Reveal>

        <Suspense
          fallback={
            <div className="glass min-h-[260px] animate-pulse" aria-hidden />
          }
        >
          <EdaCharts />
        </Suspense>

        <Reveal delay={0.08}>
          <Card title="SCENE MAP">
            <FigurePlaceholder caption="Lanes, stop line and crossing polygons registered onto the camera view." />
          </Card>
        </Reveal>
        <Reveal delay={0.12} className="lg:col-span-2">
          <Card title="MEAN VELOCITY FIELD">
            <FigurePlaceholder caption="Average track velocity per cell, used to learn the legal direction of every lane." />
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
