import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS } from "@/lib/event-classes";
import type { DetectedEvent, EventClass } from "@/types";

export function ClassStats({ events }: { events: DetectedEvent[] }) {
  const counts = new Map<EventClass, number>();
  for (const e of events) counts.set(e[2], (counts.get(e[2]) ?? 0) + 1);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass p-5">
      <h3 className="mono-label text-teal-mid">CLASS BREAKDOWN</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {entries.length === 0 && (
          <span className="font-mono text-xs text-muted-foreground">no events detected</span>
        )}
        {entries.map(([cls, n]) => (
          <span
            key={cls}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
            style={{
              borderColor: `color-mix(in oklab, ${EVENT_CLASS_COLORS[cls]} 45%, transparent)`,
              color: EVENT_CLASS_COLORS[cls],
              background: `color-mix(in oklab, ${EVENT_CLASS_COLORS[cls]} 10%, transparent)`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: EVENT_CLASS_COLORS[cls] }}
              aria-hidden
            />
            {EVENT_CLASS_LABELS[cls]}
            <span className="font-mono">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
