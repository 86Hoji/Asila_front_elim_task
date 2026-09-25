import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS, formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import type { EventClass } from "@/types";
import { activeKey, type Model } from "./analysis";
import { STILL_STORE, useTimeSelector, type PlayerStore } from "./player-store";

type SortKey = "start" | "duration" | "class";

export const EventTable = memo(function EventTable({
  store,
  model,
  defaultOpen = false,
  highlight = null,
  onRowClick,
}: {
  store?: PlayerStore | undefined;
  model: Model;
  defaultOpen?: boolean;
  /** Row to mark as selected (report mode). */
  highlight?: number | null;
  onRowClick?: ((index: number) => void) | undefined;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLElement>(null);
  const pick = (i: number, t: number) => {
    store?.seek(t);
    onRowClick?.(i);
  };

  // Bring the selected row into view (only the visible layout: cards or table).
  useEffect(() => {
    if (highlight === null) return;
    setOpen(true);
    const el = [...(rootRef.current?.querySelectorAll(`[data-row="${highlight}"]`) ?? [])].find(
      (n) => (n as HTMLElement).offsetParent !== null,
    );
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "start", dir: 1 });
  const [filter, setFilter] = useState<EventClass | "all">("all");

  const rows = useMemo(() => {
    const list = model.events
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => filter === "all" || e[2] === filter);
    const cmp = {
      start: (a: (typeof list)[number], b: (typeof list)[number]) => a.e[0] - b.e[0],
      duration: (a: (typeof list)[number], b: (typeof list)[number]) =>
        a.e[1] - a.e[0] - (b.e[1] - b.e[0]),
      class: (a: (typeof list)[number], b: (typeof list)[number]) =>
        a.e[2].localeCompare(b.e[2]) || a.e[0] - b.e[0],
    }[sort.key];
    return list.sort((a, b) => cmp(a, b) * sort.dir);
  }, [model.events, filter, sort]);

  const select = useCallback((t: number) => activeKey(model.events, t), [model.events]);
  const activeStr = useTimeSelector(store ?? STILL_STORE, select);
  const active = new Set(activeStr ? activeStr.split(",").map(Number) : []);

  const header = (key: SortKey, label: string) => (
    <th className="pb-2 font-normal">
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : 1 }))}
        className={cn(
          "inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground",
          sort.key === key && "text-teal",
        )}
        aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      >
        {label}
        {sort.key === key &&
          (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <section ref={rootRef} className="glass-flat min-w-0 p-4 sm:p-5" aria-label="All events">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="mono-label text-teal-mid">ALL EVENTS ({model.events.length})</span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...model.classes] as const).map((c) => {
              const on = filter === c;
              const color = c === "all" ? "var(--teal)" : EVENT_CLASS_COLORS[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  aria-pressed={on}
                  className="rounded-full border px-2.5 py-1 font-mono text-[10px] transition-colors"
                  style={{
                    borderColor: on ? color : "var(--border)",
                    color: on ? color : "var(--muted-foreground)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Phones: cards */}
          <ul className="mt-4 space-y-2 md:hidden">
            {rows.map(({ e, i }) => (
              <li key={i} data-row={i}>
                <button
                  type="button"
                  onClick={() => pick(i, e[0])}
                  className={cn(
                    "glass-raised flex w-full items-center gap-3 p-3 text-left",
                    (active.has(i) || highlight === i) && "border-teal-mid",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: EVENT_CLASS_COLORS[e[2]] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs" style={{ color: EVENT_CLASS_COLORS[e[2]] }}>
                      {EVENT_CLASS_LABELS[e[2]]}
                    </span>
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {formatTime(e[0])} → {formatTime(e[1])} · {(e[1] - e[0]).toFixed(1)} s
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <table className="mt-4 hidden w-full text-left md:table">
            <thead>
              <tr className="mono-label border-b border-border">
                {header("class", "class")}
                {header("start", "start")}
                <th className="pb-2 font-normal uppercase">end</th>
                {header("duration", "duration")}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ e, i }) => (
                <tr
                  key={i}
                  data-row={i}
                  aria-selected={highlight === i}
                  tabIndex={0}
                  onClick={() => pick(i, e[0])}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") pick(i, e[0]);
                  }}
                  className={cn(
                    "cursor-pointer border-b border-border/60 transition-colors hover:bg-accent",
                    (active.has(i) || highlight === i) && "bg-accent",
                  )}
                >
                  <td className="py-2">
                    <span
                      className="inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 font-mono text-[11px]"
                      style={{
                        color: EVENT_CLASS_COLORS[e[2]],
                        background: `color-mix(in oklab, ${EVENT_CLASS_COLORS[e[2]]} 14%, transparent)`,
                      }}
                    >
                      {EVENT_CLASS_LABELS[e[2]]}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-[var(--body)]">{formatTime(e[0])}</td>
                  <td className="py-2 font-mono text-xs text-[var(--body)]">{formatTime(e[1])}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">
                    {(e[1] - e[0]).toFixed(1)} s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});
