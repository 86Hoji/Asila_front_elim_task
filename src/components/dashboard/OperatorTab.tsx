import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CLASS_ORDER } from "@/components/control-room/analysis";
import { RISK_THRESHOLD } from "@/config";
import { FEEDS, SAMPLE_STATS, countByClass } from "@/data/stats";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS, formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import type { EventClass } from "@/types";

const tooltipStyle = {
  background: "#031818",
  border: "1px solid rgba(0,194,188,0.3)",
  borderRadius: 12,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "#fff",
};
const axisTick = { fill: "rgba(146,165,164,0.9)", fontSize: 10, fontFamily: "var(--font-mono)" };

type MinuteRow = { minute: number; total: number; peak: number } & Partial<
  Record<EventClass, number>
>;

/** Shift aggregates: all feeds laid back to back on one shift clock. */
function useShift() {
  return useMemo(() => {
    const minutes = Math.ceil(SAMPLE_STATS.totalSeconds / 60);
    const classes = CLASS_ORDER.filter((c) => SAMPLE_STATS.perClass.some(([k]) => k === c));
    const perMinute = Array.from({ length: minutes }, (_, i) => {
      const row: MinuteRow = { minute: i + 1, total: 0, peak: 0 };
      for (const c of classes) row[c] = 0;
      return row;
    });
    let offset = 0;
    for (const f of FEEDS) {
      for (const e of f.events) {
        const m = Math.min(minutes - 1, Math.floor((offset + e[0]) / 60));
        perMinute[m]![e[2]] = (perMinute[m]![e[2]] ?? 0) + 1;
        perMinute[m]!.total += 1;
      }
      for (const [t, v] of f.risk) {
        const m = Math.min(minutes - 1, Math.floor((offset + t) / 60));
        if (v > perMinute[m]!.peak) perMinute[m]!.peak = v;
      }
      offset += f.duration;
    }

    const feeds = FEEDS.map((f) => {
      const alarms = SAMPLE_STATS.alarms.filter((a) => a.feed === f.id);
      const peak = f.risk.reduce((a, [, v]) => Math.max(a, v), 0);
      const top = countByClass(f.events)[0];
      return {
        id: f.id,
        lighting: f.lighting,
        duration: f.duration,
        events: f.events.length,
        perMin: f.events.length / (f.duration / 60),
        alarms: alarms.length,
        peak,
        top: top ? top[0] : null,
      };
    });

    return { minutes, classes, perMinute, feeds };
  }, []);
}

function Spark({
  values,
  color = "#00ffeb",
  max,
}: {
  values: number[];
  color?: string | undefined;
  max?: number;
}) {
  const hi = max ?? Math.max(1e-6, ...values);
  const d = values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / Math.max(1, values.length - 1)) * 100).toFixed(1)} ${(22 - (v / hi) * 20).toFixed(1)}`,
    )
    .join("");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <path d={`${d}L100 24L0 24Z`} fill={color} fillOpacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Card({
  title,
  right,
  children,
  className,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("glass min-w-0 p-4 sm:p-5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="mono-label text-teal-mid">{title}</h3>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function OperatorTab() {
  const s = useShift();
  const totals = s.perMinute.map((r) => r.total);
  const cumulative = totals.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);
  const peaks = s.perMinute.map((r) => r.peak);
  const top = SAMPLE_STATS.perClass[0];
  const topSeries = top ? s.perMinute.map((r) => r[top[0]] ?? 0) : [];
  const perMin = SAMPLE_STATS.eventCount / (SAMPLE_STATS.totalSeconds / 60);
  const maxClass = Math.max(1, ...SAMPLE_STATS.perClass.map((c) => c[1]));

  const kpis = [
    {
      label: "total events",
      value: String(SAMPLE_STATS.eventCount),
      spark: <Spark values={totals} />,
    },
    { label: "events / minute", value: perMin.toFixed(2), spark: <Spark values={cumulative} /> },
    {
      label: "alarms raised",
      value: String(SAMPLE_STATS.alarms.length),
      spark: <Spark values={peaks} color="#ff4d6d" max={1} />,
    },
    {
      label: "most frequent class",
      value: top ? EVENT_CLASS_LABELS[top[0]] : "—",
      spark: <Spark values={topSeries} color={top ? EVENT_CLASS_COLORS[top[0]] : undefined} />,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mono-label text-teal-mid">
            SHIFT SUMMARY · {SAMPLE_STATS.feedCount} feeds · {SAMPLE_STATS.totalMinutes} min
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Everything the sample feeds raised
          </h2>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          feeds laid back to back on one shift clock
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass hover-lift flex flex-col p-5">
            <p className="mono-label">{k.label}</p>
            <p className="mt-2 truncate font-mono text-2xl text-foreground">{k.value}</p>
            <div className="mt-3">{k.spark}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card title="EVENTS PER CLASS">
          <ul className="space-y-2.5">
            {SAMPLE_STATS.perClass.map(([cls, n]) => (
              <li key={cls} className="grid grid-cols-[128px_1fr_28px] items-center gap-2">
                <span className="truncate text-xs text-[var(--body)]">
                  {EVENT_CLASS_LABELS[cls]}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-[rgba(0,194,188,0.08)]">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(n / maxClass) * 100}%`,
                      background: EVENT_CLASS_COLORS[cls],
                    }}
                  />
                </span>
                <span className="text-right font-mono text-xs text-foreground">{n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="EVENTS PER MINUTE · STACKED BY CLASS">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.perMinute} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
                <XAxis dataKey="minute" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(0,194,188,0.08)" }}
                  labelFormatter={(m: number) => `minute ${m}`}
                  formatter={(v: number, name: string) => (v ? [v, name] : [null, null])}
                />
                {s.classes.map((c, i) => (
                  <Bar
                    key={c}
                    dataKey={c}
                    stackId="a"
                    fill={EVENT_CLASS_COLORS[c]}
                    radius={i === s.classes.length - 1 ? [3, 3, 0, 0] : 0}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card
          title="ALARM LOG"
          right={
            <span className="font-mono text-[10px] text-muted-foreground">
              risk ≥ {RISK_THRESHOLD}
            </span>
          }
        >
          {SAMPLE_STATS.alarms.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground">No alarms in this shift.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="mono-label border-b border-border">
                  <th className="pb-2 font-normal">feed</th>
                  <th className="pb-2 font-normal">time</th>
                  <th className="pb-2 text-right font-normal">peak</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_STATS.alarms.map((a, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-2 font-mono text-xs text-foreground">{a.feed}</td>
                    <td className="py-2 font-mono text-xs text-[var(--body)]">
                      {formatTime(a.start)}
                    </td>
                    <td className="py-2 text-right font-mono text-xs text-[#ff4d6d]">
                      {a.peak.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="PER-FEED COMPARISON">
          <div className="scrollbar-thin-teal overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="mono-label border-b border-border">
                  <th className="pb-2 font-normal">feed</th>
                  <th className="pb-2 font-normal">lighting</th>
                  <th className="pb-2 font-normal">duration</th>
                  <th className="pb-2 text-right font-normal">events</th>
                  <th className="pb-2 text-right font-normal">/ min</th>
                  <th className="pb-2 text-right font-normal">alarms</th>
                  <th className="pb-2 text-right font-normal">peak risk</th>
                  <th className="pb-2 pl-4 font-normal">top class</th>
                </tr>
              </thead>
              <tbody>
                {s.feeds.map((f) => (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="py-2.5 font-mono text-xs text-foreground">CAM · {f.id}</td>
                    <td className="py-2.5 font-mono text-xs text-[var(--body)]">{f.lighting}</td>
                    <td className="py-2.5 font-mono text-xs text-[var(--body)]">
                      {formatTime(f.duration)}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-foreground">
                      {f.events}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-[var(--body)]">
                      {f.perMin.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right font-mono text-xs",
                        f.alarms ? "text-[#ff4d6d]" : "text-muted-foreground",
                      )}
                    >
                      {f.alarms}
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs text-[var(--body)]">
                      {f.peak.toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-4 text-xs">
                      {f.top ? (
                        <span style={{ color: EVENT_CLASS_COLORS[f.top] }}>
                          {EVENT_CLASS_LABELS[f.top]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
