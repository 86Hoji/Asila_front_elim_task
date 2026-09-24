import { useMemo, useState } from "react";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS, formatTime } from "@/lib/event-classes";
import type { DetectedEvent, EventClass } from "@/types";

export function EventTimeline({
  events,
  duration,
  currentTime,
  onSeek,
}: {
  events: DetectedEvent[];
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const [hover, setHover] = useState<DetectedEvent | null>(null);

  const rows = useMemo(() => {
    const map = new Map<EventClass, DetectedEvent[]>();
    for (const e of events) {
      const list = map.get(e[2]) ?? [];
      list.push(e);
      map.set(e[2], list);
    }
    return [...map.entries()];
  }, [events]);

  const playhead = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-teal-mid">EVENT TIMELINE</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {formatTime(currentTime)}
        </span>
      </div>

      <div className="scrollbar-thin-teal mt-5 overflow-x-auto">
        <div className="relative min-w-[560px]">
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-teal"
            style={{ left: `calc(140px + (100% - 140px) * ${playhead / 100})` }}
            aria-hidden
          />

          {rows.map(([cls, list]) => (
            <div key={cls} className="flex items-center gap-3 py-1.5">
              <div className="flex w-[140px] shrink-0 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: EVENT_CLASS_COLORS[cls] }}
                  aria-hidden
                />
                <span className="truncate font-mono text-[11px] text-[var(--body)]">{cls}</span>
              </div>
              <div className="relative h-6 flex-1 rounded-full bg-[rgba(0,194,188,0.07)]">
                {list.map((e, i) => {
                  const left = (e[0] / duration) * 100;
                  const width = Math.max(0.6, ((e[1] - e[0]) / duration) * 100);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onSeek(e[0])}
                      onMouseEnter={() => setHover(e)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(e)}
                      onBlur={() => setHover(null)}
                      aria-label={`${EVENT_CLASS_LABELS[cls]} from ${formatTime(e[0])} to ${formatTime(e[1])}`}
                      className="absolute inset-y-1 rounded-full transition-transform hover:scale-y-125"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background: EVENT_CLASS_COLORS[cls],
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          <div className="ml-[140px] mt-3 flex justify-between border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
            <span>00:00.0</span>
            <span>{formatTime(duration / 2)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-5 font-mono text-[11px] text-teal">
        {hover
          ? `${hover[2]} · ${formatTime(hover[0])} → ${formatTime(hover[1])} · ${(hover[1] - hover[0]).toFixed(1)}s`
          : ""}
      </div>
    </div>
  );
}
