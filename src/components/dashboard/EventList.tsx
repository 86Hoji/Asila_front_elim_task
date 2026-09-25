import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS, formatTime } from "@/lib/event-classes";
import type { DetectedEvent, EventClass } from "@/types";

type SortKey = "start" | "duration" | "class";

export function EventList({
  events,
  currentTime,
  onSeek,
}: {
  events: DetectedEvent[];
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const [sort, setSort] = useState<SortKey>("start");
  const [filter, setFilter] = useState<EventClass | "all">("all");

  const classes = useMemo(() => [...new Set(events.map((e) => e[2]))] as EventClass[], [events]);

  const rows = useMemo(() => {
    const list = events.filter((e) => filter === "all" || e[2] === filter);
    return [...list].sort((a, b) => {
      if (sort === "start") return a[0] - b[0];
      if (sort === "duration") return b[1] - b[0] - (a[1] - a[0]);
      return a[2].localeCompare(b[2]);
    });
  }, [events, filter, sort]);

  const cycle = () =>
    setSort((s) => (s === "start" ? "duration" : s === "duration" ? "class" : "start"));

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="mono-label text-teal-mid">EVENT LIST // {rows.length}</h3>
        <button
          type="button"
          onClick={cycle}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpDown className="h-3 w-3" /> sort: {sort}
        </button>
      </div>

      <div className="scrollbar-thin-teal mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
            filter === "all" ? "border-teal text-teal" : "border-border text-muted-foreground"
          }`}
        >
          all
        </button>
        {classes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className="shrink-0 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors"
            style={{
              borderColor: filter === c ? EVENT_CLASS_COLORS[c] : "var(--border)",
              color: filter === c ? EVENT_CLASS_COLORS[c] : "var(--muted-foreground)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2 md:hidden">
        {rows.map((e, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSeek(e[0])}
            className="glass-raised w-full p-3 text-left"
          >
            <span className="font-mono text-[11px]" style={{ color: EVENT_CLASS_COLORS[e[2]] }}>
              {e[2]}
            </span>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {formatTime(e[0])} → {formatTime(e[1])} · {(e[1] - e[0]).toFixed(1)}s
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="mono-label border-b border-border">
              <th className="pb-2 font-normal">class</th>
              <th className="pb-2 font-normal">start</th>
              <th className="pb-2 font-normal">end</th>
              <th className="pb-2 font-normal">duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => {
              const active = currentTime >= e[0] && currentTime <= e[1];
              return (
                <tr
                  key={i}
                  tabIndex={0}
                  role="button"
                  onClick={() => onSeek(e[0])}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSeek(e[0]);
                    }
                  }}
                  className={`cursor-pointer border-b border-border/60 transition-colors hover:bg-accent ${
                    active ? "bg-accent" : ""
                  }`}
                >
                  <td className="py-2.5">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-mono text-[11px]"
                      style={{
                        color: EVENT_CLASS_COLORS[e[2]],
                        background: `color-mix(in oklab, ${EVENT_CLASS_COLORS[e[2]]} 14%, transparent)`,
                      }}
                    >
                      {EVENT_CLASS_LABELS[e[2]]}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-[var(--body)]">
                    {formatTime(e[0])}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-[var(--body)]">
                    {formatTime(e[1])}
                  </td>
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">
                    {(e[1] - e[0]).toFixed(1)}s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
