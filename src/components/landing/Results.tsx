import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eyebrow } from "@/components/site/Eyebrow";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import {
  EVENT_CLASS_COLORS,
  EVENT_CLASS_DEFINITIONS,
  EVENT_CLASS_LABELS,
} from "@/lib/event-classes";
import type { EventClass } from "@/types";

const COUNTS: Array<{ label: EventClass; count: number }> = [
  { label: "failure_to_yield", count: 10 },
  { label: "stop_line", count: 5 },
  { label: "jaywalking", count: 3 },
  { label: "red_light", count: 2 },
  { label: "stopped_vehicle", count: 1 },
  { label: "wrong_way", count: 1 },
];

const FAILURES = [
  {
    title: "[TODO] Occlusion at the far approach",
    body: "[TODO: describe the failure, how often it happened and what it costs us in F1.]",
  },
  {
    title: "[TODO] Dusk colour shift",
    body: "[TODO: describe the failure, how often it happened and what it costs us in F1.]",
  },
  {
    title: "[TODO] Segment boundary drift",
    body: "[TODO: describe the failure, how often it happened and what it costs us in F1.]",
  },
];

export function Results() {
  const chartData = COUNTS.map((c) => ({
    ...c,
    name: EVENT_CLASS_LABELS[c.label],
  }));

  return (
    <Section id="results">
      <Reveal>
        <Eyebrow>RESULTS ON SAMPLE VIDEOS</Eyebrow>
      </Reveal>
      <Reveal delay={0.06}>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold md:text-5xl">
          22 events across 18 minutes of footage.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass mt-12 p-6 md:p-8">
          <h3 className="mono-label text-teal-mid">DETECTED EVENTS PER CLASS</h3>
          <div className="mt-6 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 40, left: -18 }}>
                <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,194,188,0.08)" }}
                  contentStyle={{
                    background: "#031818",
                    border: "1px solid rgba(0,194,188,0.3)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                  {chartData.map((d) => (
                    <Cell key={d.label} fill={EVENT_CLASS_COLORS[d.label]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COUNTS.map((c, i) => (
          <Reveal key={c.label} delay={0.04 * i}>
            <article className="glass hover-lift h-full p-6">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: EVENT_CLASS_COLORS[c.label] }}
                  aria-hidden
                />
                <span className="font-mono text-xs tracking-wider" style={{ color: EVENT_CLASS_COLORS[c.label] }}>
                  {c.label}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{EVENT_CLASS_LABELS[c.label]}</h3>
              <p className="mt-2 text-sm text-[var(--body)]">{EVENT_CLASS_DEFINITIONS[c.label]}</p>
              <div
                className="mt-5 flex h-24 items-center justify-center rounded-xl border border-border"
                style={{
                  background:
                    "repeating-linear-gradient(135deg, rgba(0,194,188,0.05) 0 12px, transparent 12px 24px)",
                }}
              >
                <span className="font-mono text-[11px] text-muted-foreground">[TODO: example clip]</span>
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                {c.count} detected in 18 min
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.08}>
        <h3 className="mt-20 text-2xl font-bold md:text-3xl">Failure cases</h3>
        <p className="mt-3 max-w-2xl text-[var(--body)]">
          Where the system is still wrong, and why. We would rather show this than hide it.
        </p>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {FAILURES.map((f, i) => (
          <Reveal key={i} delay={0.04 * i}>
            <article className="glass hover-lift h-full border-l-2 p-6" style={{ borderLeftColor: "#ff8c42" }}>
              <h4 className="text-base font-semibold">{f.title}</h4>
              <p className="mt-3 text-sm text-[var(--body)]">{f.body}</p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Link
          to="/dashboard"
          className="mt-12 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
        >
          Explore every sample on the dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </Section>
  );
}
