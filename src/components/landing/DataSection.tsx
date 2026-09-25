import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { SceneMapFigure, VelocityFieldFigure } from "@/components/scene/SceneFigures";
import { EDA } from "@/config";
import { StopLineChart } from "./StopLineChart";
import { FEEDS, SAMPLE_STATS } from "@/data/stats";
import { cn } from "@/lib/utils";

const LIGHTING_SWATCH: Record<string, string> = {
  noon: "#ffe9a8",
  evening: "#ff9d6e",
  dusk: "#6a7bd1",
  night: "#1d2a5c",
};

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
    <article className={cn("glass hover-lift flex h-full min-w-0 flex-col p-6", className)}>
      <h3 className="mono-label text-teal-mid">{title}</h3>
      <div className="mt-4 flex-1">{children}</div>
    </article>
  );
}

function CycleBar() {
  const { totalSec, flashingGreenSec, yellowSec } = EDA.signalCycle;
  const half = (totalSec - flashingGreenSec - yellowSec) / 2;
  const phases = [
    { label: "vehicle green", sec: half, color: "rgba(0,255,235,0.35)" },
    { label: "flashing green", sec: flashingGreenSec, color: "rgba(6,214,160,0.7)" },
    { label: "yellow", sec: yellowSec, color: "rgba(255,210,63,0.7)" },
    { label: "vehicle red", sec: half, color: "rgba(255,59,59,0.45)" },
  ];
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-full border border-border">
        {phases.map((p) => (
          <div
            key={p.label}
            className="h-full"
            style={{ width: `${(p.sec / totalSec) * 100}%`, background: p.color }}
            title={p.label}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
        <li>~{totalSec} s full cycle</li>
        <li>{flashingGreenSec} s flashing green</li>
        <li>{yellowSec} s yellow</li>
        <li>then vehicle red</li>
      </ul>
    </div>
  );
}

function Figure({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="flex h-full flex-col">
      <div className="overflow-hidden rounded-xl border border-border">{children}</div>
      <figcaption className="mt-3 text-sm text-[var(--body)]">{caption}</figcaption>
    </figure>
  );
}

export function DataSection() {
  const minutes = SAMPLE_STATS.totalMinutes;

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

      <div className="mt-14 grid gap-5 md:grid-flow-dense md:grid-cols-2 lg:grid-cols-3">
        <Reveal delay={0.04}>
          <Card title="THE FOOTAGE">
            <p className="text-2xl font-semibold text-foreground">{minutes} minutes</p>
            <p className="mt-2 text-sm text-[var(--body)]">
              {SAMPLE_STATS.feedCount} sample videos, {EDA.resolution} at {EDA.fps} fps, {EDA.codec}{" "}
              — CPU-only decoding.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card title="LIGHTING">
            <div className="grid grid-cols-4 gap-3">
              {FEEDS.map((f) => (
                <div key={f.id} className="min-w-0">
                  <div
                    className="h-14 w-full rounded-lg border border-border"
                    style={{ background: LIGHTING_SWATCH[f.lighting] ?? "#2a3b3b", opacity: 0.8 }}
                  />
                  <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {f.lighting}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.12} className="md:col-span-2 lg:col-span-1">
          <Card title="SIGNAL CYCLE">
            <CycleBar />
          </Card>
        </Reveal>

        <Reveal delay={0.04} className="md:col-span-2 lg:row-span-2">
          <Card title="SCENE MAP">
            <Figure caption="Our own drawing of the junction: lanes and their directions, the stop line, three crossings, the junction area and refuge islands — the zones every rule reasons about.">
              <SceneMapFigure />
            </Figure>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card title="STOP-LINE CROSSINGS PER MINUTE">
            <StopLineChart />
          </Card>
        </Reveal>

        <Reveal delay={0.12}>
          <Card title="CAMERA DRIFT">
            <p className="text-2xl font-semibold text-foreground">up to {EDA.cameraDriftPct}%</p>
            <p className="mt-2 text-sm text-[var(--body)]">
              The camera shifts up to {EDA.cameraDriftPct}% of frame width between recordings, so
              the scene map is re-aligned per video.
            </p>
          </Card>
        </Reveal>

        <Reveal delay={0.04} className="md:col-span-2 lg:col-span-3">
          <Card title="MEAN VELOCITY FIELD">
            <div className="grid items-center gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-border">
                <VelocityFieldFigure />
              </div>
              <div className="space-y-3 text-sm text-[var(--body)]">
                <p>
                  Averaging the velocity of every track per grid cell gives the direction traffic
                  actually takes in each lane. That is how the legal direction of every lane is
                  learned.
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Schematic drawing · arrows coloured by heading (see the wheel)
                </p>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}
