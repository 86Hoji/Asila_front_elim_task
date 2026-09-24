import { useMemo } from "react";
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
import { RISK_THRESHOLD, SAMPLE_ORDER } from "@/config";
import { samples } from "@/data/samples";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS } from "@/lib/event-classes";
import type { EventClass } from "@/types";

const tooltipStyle = {
  background: "#031818",
  border: "1px solid rgba(0,194,188,0.3)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
};

export function OperatorTab() {
  const agg = useMemo(() => {
    const all = SAMPLE_ORDER.map((n) => samples[n]!);
    const totalSeconds = all.reduce((a, s) => a + s.duration, 0);
    const events = all.flatMap((s) => s.events);

    const perClass = new Map<EventClass, number>();
    for (const e of events) perClass.set(e[2], (perClass.get(e[2]) ?? 0) + 1);

    let alarms = 0;
    for (const s of all) {
      let inside = false;
      for (const [, v] of s.risk) {
        if (v >= RISK_THRESHOLD && !inside) {
          alarms++;
          inside = true;
        } else if (v < RISK_THRESHOLD) inside = false;
      }
    }

    const minutes = Math.ceil(totalSeconds / 60);
    const histogram = Array.from({ length: minutes }, (_, i) => ({ minute: i + 1, count: 0 }));
    let offset = 0;
    const heat = new Map<EventClass, number[]>();
    for (const s of all) {
      for (const e of s.events) {
        const m = Math.floor((offset + e[0]) / 60);
        if (histogram[m]) histogram[m].count += 1;
        const row = heat.get(e[2]) ?? Array.from({ length: minutes }, () => 0);
        if (m < minutes) row[m] = (row[m] ?? 0) + 1;
        heat.set(e[2], row);
      }
      offset += s.duration;
    }

    const top = [...perClass.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      total: events.length,
      perMinute: events.length / (totalSeconds / 60),
      top: top ? EVENT_CLASS_LABELS[top[0]] : "—",
      alarms,
      perClass: [...perClass.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ label, count, name: EVENT_CLASS_LABELS[label] })),
      histogram,
      heat: [...heat.entries()],
      minutes,
    };
  }, []);

  const kpis = [
    { label: "total events", value: String(agg.total) },
    { label: "events / minute", value: agg.perMinute.toFixed(2) },
    { label: "most frequent class", value: agg.top },
    { label: "alarms raised", value: String(agg.alarms) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass hover-lift p-6">
            <p className="mono-label">{k.label}</p>
            <p className="mt-3 font-mono text-2xl text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass p-5">
          <h3 className="mono-label text-teal-mid">EVENTS PER CLASS</h3>
          <div className="mt-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.perClass} margin={{ top: 4, right: 8, bottom: 40, left: -20 }}>
                <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,194,188,0.08)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {agg.perClass.map((d) => (
                    <Cell key={d.label} fill={EVENT_CLASS_COLORS[d.label]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-5">
          <h3 className="mono-label text-teal-mid">EVENTS OVER TIME // PER MINUTE</h3>
          <div className="mt-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agg.histogram} margin={{ top: 4, right: 8, bottom: 20, left: -20 }}>
                <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
                <XAxis
                  dataKey="minute"
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,194,188,0.08)" }} />
                <Bar dataKey="count" fill="#00c2bc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-5">
        <h3 className="mono-label text-teal-mid">HEAT STRIP // EVENTS PER MINUTE PER CLASS</h3>
        <div className="scrollbar-thin-teal mt-5 overflow-x-auto">
          <div className="min-w-[620px] space-y-2">
            {agg.heat.map(([cls, row]) => (
              <div key={cls} className="flex items-center gap-3">
                <span className="w-[140px] shrink-0 truncate font-mono text-[11px] text-[var(--body)]">
                  {cls}
                </span>
                <div className="flex flex-1 gap-1">
                  {row.map((v, i) => (
                    <div
                      key={i}
                      title={`minute ${i + 1}: ${v}`}
                      className="h-5 flex-1 rounded-[3px] border border-border"
                      style={{
                        background:
                          v > 0
                            ? `color-mix(in oklab, ${EVENT_CLASS_COLORS[cls]} ${Math.min(90, 30 + v * 30)}%, transparent)`
                            : "rgba(0,194,188,0.05)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          aggregated across all {SAMPLE_ORDER.length} sample videos · {agg.minutes} minutes
        </p>
      </div>
    </div>
  );
}
