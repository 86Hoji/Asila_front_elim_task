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
  formatTime,
} from "@/lib/event-classes";
import { RESULTS } from "@/content/results";
import { TRAJECTORIES, type Trajectory } from "@/data/eda";
import { FEEDS, SAMPLE_STATS } from "@/data/stats";
import type { EventClass } from "@/types";

/** First occurrence of a class across the sample feeds, e.g. "C3896 · 00:22.4-00:25.1 (2.7 s)". */
const fmtSpan = (id: string, start: number, end: number) =>
  `${id} · ${formatTime(start)}-${formatTime(end)} (${(end - start).toFixed(1)} s)`;

/** First real example: a tracked event from eda_stats.json, else the first event in samples.json. */
function exampleFor(label: EventClass) {
  const traj = TRAJECTORIES[label]?.[0];
  if (traj) return { text: fmtSpan(traj.id, traj.start, traj.end), traj };
  for (const f of FEEDS) {
    const e = f.events.find((ev) => ev[2] === label);
    if (e) return { text: fmtSpan(f.id, e[0], e[1]), traj: null };
  }
  return null;
}

/** The event's trajectory drawn on the scene map: start dot, end arrow, class colour. */
function TrajectoryThumb({ traj, cls }: { traj: Trajectory; cls: EventClass }) {
  const color = EVENT_CLASS_COLORS[cls];
  const W = 1280;
  const H = 720;
  const marker = `arrow-${cls}`;
  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-border">
      <img
        src="/eda/scene_map_dark.jpg"
        alt=""
        className="block h-auto w-full opacity-50"
        aria-hidden
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={`Trajectory of the ${cls} example on the scene map`}
      >
        <defs>
          <marker id={marker} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={color} />
          </marker>
        </defs>
        {traj.polylines.map((line, i) => {
          if (line.length < 2) return null;
          const pts = line.map(([x, y]) => `${Math.round(x * W)},${Math.round(y * H)}`).join(" ");
          const [x0, y0] = line[0]!;
          return (
            <g key={i}>
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd={`url(#${marker})`}
              />
              <circle cx={Math.round(x0 * W)} cy={Math.round(y0 * H)} r={13} fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const COUNTS = SAMPLE_STATS.perClass.map(([label, count]) => ({
  label,
  count,
  example: exampleFor(label),
}));

const { jaywalking: jw, scoreA, falseAlarms } = RESULTS;

const LIMITATIONS = [
  {
    title: "Pedestrians cutting corners",
    wrong: "People shortcutting across the corner were confused with jaywalking.",
    did: `We now require at least ${jw.minMetres} m and ${jw.minSeconds} s on the asphalt.`,
    result: `Jaywalking F1 went from ${jw.f1Before.toFixed(2)} to ${jw.f1After.toFixed(2)}; it is still our weakest class.`,
  },
  {
    title: "Queues and signals",
    wrong:
      "Cars stuck in a queue past the stop line were flagged as stop_line, and failure_to_yield fired while pedestrians had a red light.",
    did: "Both rules now check the queue and the pedestrian signal.",
    result: `Score A went from ${scoreA[0]!.value.toFixed(3)} to ${scoreA[1]!.value.toFixed(3)}.`,
  },
  {
    title: "No real crash in the samples",
    wrong: "The sample videos contain no real accident.",
    did: `accident, near_miss and the risk score are verified only for not raising false alarms (${falseAlarms.after} false alarm in ${falseAlarms.minutes} minutes).`,
    result: "Whether they fire on a real crash is untested.",
  },
];

function HowWeMeasured() {
  const { labels, devVideos, heldOutVideos, scoreA, heldOutScore } = RESULTS;
  const dev = scoreA[scoreA.length - 1]!.value;
  return (
    <div className="glass mt-12 p-6 md:p-8">
      <h3 className="mono-label text-teal-mid">HOW WE MEASURED</h3>
      <ul className="mt-4 space-y-2 text-sm text-[var(--body)]">
        <li>
          Labels: {labels.events} events across the {labels.videos} sample videos, following the
          organisers&apos; start/end conventions.
        </li>
        <li>
          Thresholds were tuned on {devVideos.join(" and ")}; {heldOutVideos.join(" and ")} were
          held out.
        </li>
      </ul>

      <div
        role="note"
        className="mt-5 rounded-xl border border-[#ffd23f]/60 bg-[rgba(255,210,63,0.08)] p-4 text-sm leading-relaxed text-foreground"
      >
        <p className="mono-label text-[#ffd23f]">READ THIS BEFORE THE NUMBERS</p>
        <p className="mt-2">{RESULTS.recallCaveat}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="glass-raised p-5">
          <p className="mono-label">Score A on dev videos ({devVideos.join(" + ")})</p>
          <ol className="mt-4 space-y-3">
            {scoreA.map((s, i) => (
              <li key={s.step} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5">
                <span className="text-xs text-[var(--body)]">
                  <span className="mr-2 font-mono text-muted-foreground">{i + 1}</span>
                  {s.step}
                </span>
                <span className="font-mono text-sm text-foreground">{s.value.toFixed(3)}</span>
                <span className="col-span-2 h-2 overflow-hidden rounded-full bg-[rgba(0,194,188,0.08)]">
                  <span
                    className="block h-full rounded-full bg-teal"
                    style={{
                      width: `${s.value * 100}%`,
                      opacity: 0.45 + (i / scoreA.length) * 0.55,
                    }}
                  />
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="glass-raised flex flex-col p-5">
          <p className="mono-label">Held-out videos ({heldOutVideos.join(" + ")})</p>
          <p className="mt-4 font-mono text-3xl text-foreground">
            {heldOutScore === null ? "being measured" : heldOutScore.toFixed(3)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            Score A · dev {dev.toFixed(3)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--body)]">
            Why higher than dev: {RESULTS.heldOutHigherBecause}
          </p>
        </div>
      </div>
      <p className="mt-4 font-mono text-[11px] text-muted-foreground">
        Scores on our own labels, not the hidden test set.
      </p>
    </div>
  );
}

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
          {SAMPLE_STATS.eventCount} events across {SAMPLE_STATS.totalMinutes} minutes of footage.
        </h2>
      </Reveal>

      <Reveal delay={0.08}>
        <HowWeMeasured />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass mt-8 p-6 md:p-8">
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
                <span
                  className="font-mono text-xs tracking-wider"
                  style={{ color: EVENT_CLASS_COLORS[c.label] }}
                >
                  {c.label}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">{EVENT_CLASS_LABELS[c.label]}</h3>
              <p className="mt-2 text-sm text-[var(--body)]">{EVENT_CLASS_DEFINITIONS[c.label]}</p>
              {c.example?.traj && <TrajectoryThumb traj={c.example.traj} cls={c.label} />}
              {c.example && (
                <p className="mt-3 rounded-xl border border-border px-3 py-2 font-mono text-[11px] text-[var(--body)]">
                  Example: {c.example.text}
                </p>
              )}
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                {c.count} detected in {SAMPLE_STATS.totalMinutes} min
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.08}>
        <h3 className="mt-20 text-2xl font-bold md:text-3xl">Known limitations</h3>
        <p className="mt-3 max-w-2xl text-[var(--body)]">
          Where the system is still wrong, and why. We would rather show this than hide it.
        </p>
      </Reveal>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {LIMITATIONS.map((f, i) => (
          <Reveal key={i} delay={0.04 * i}>
            <article
              className="glass hover-lift h-full border-l-2 p-6"
              style={{ borderLeftColor: "#ff8c42" }}
            >
              <h4 className="text-base font-semibold">{f.title}</h4>
              <dl className="mt-3 space-y-2 text-sm text-[var(--body)]">
                {(
                  [
                    ["What went wrong", f.wrong],
                    ["What we did", f.did],
                    ["Result", f.result],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono-label text-[10px]">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
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
