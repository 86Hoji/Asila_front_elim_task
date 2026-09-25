import { useMemo, useState } from "react";
import { formatTime } from "@/lib/event-classes";
import type { SampleVideo } from "@/types";
import { buildModel } from "./analysis";
import { EventTable } from "./EventTable";
import { ClassMix } from "./Rails";
import { Timeline } from "./Timeline";

/** Per-video report: KPIs, the unified timeline (no playhead), class mix and all events. */
export function FeedReport({ feed, id }: { feed: SampleVideo; id: string }) {
  const model = useMemo(() => buildModel(feed), [feed]);
  const [selected, setSelected] = useState<number | null>(null);
  const peak = model.risk.reduce((a, [, v]) => Math.max(a, v), 0);

  const kpis = [
    { label: "total events", value: String(model.events.length) },
    { label: "events / minute", value: (model.events.length / (model.duration / 60)).toFixed(2) },
    { label: "alarms (risk ≥ 0.5)", value: String(model.alarms.length) },
    { label: "peak risk", value: peak.toFixed(2) },
  ];

  return (
    <div className="min-w-0 space-y-4 xl:space-y-5">
      <header className="glass-flat flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-mono text-sm tracking-wider text-foreground sm:text-base">
            CAM · {id}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {formatTime(model.duration)} · {feed.lighting}
          </p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 font-mono text-[10px] text-muted-foreground">
          Footage not shown: organisers&apos; NDA
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="glass-flat p-4">
            <p className="mono-label">{k.label}</p>
            <p className="mt-2 font-mono text-2xl text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      <Timeline model={model} selected={selected} onEventClick={setSelected} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-5">
        <EventTable model={model} defaultOpen highlight={selected} onRowClick={setSelected} />
        <ClassMix model={model} />
      </div>
    </div>
  );
}
