import { useMemo, useState } from "react";
import { LABELS } from "@/data/labels";
import { EVENT_CLASS_COLORS, formatTime } from "@/lib/event-classes";
import type { SampleVideo } from "@/types";
import { videoAccuracy } from "./accuracy";
import { buildModel } from "./analysis";
import { EventTable } from "./EventTable";
import { ClassMix } from "./Rails";
import { Timeline } from "./Timeline";

function AccuracyCard({ video, predicted }: { video: string; predicted: SampleVideo["events"] }) {
  const labels = LABELS[video];
  if (!labels?.length) return null;
  const acc = videoAccuracy(video, predicted, labels);
  return (
    <section className="glass-flat p-4 sm:p-5" aria-label="Accuracy on our labels">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="mono-label text-teal-mid">ACCURACY ON OUR LABELS</h3>
        <span className="font-mono text-[11px] text-muted-foreground">tIoU ≥ 0.5</span>
      </div>
      <p className="mt-2 text-sm text-foreground">
        {acc.found} of {acc.labelled} labelled events found, {acc.falsePositives} false positive
        {acc.falsePositives === 1 ? "" : "s"}
      </p>
      <div className="scrollbar-thin-teal mt-3 overflow-x-auto">
        <table className="w-full min-w-[320px] text-left">
          <thead>
            <tr className="mono-label border-b border-border">
              <th className="pb-2 font-normal">class</th>
              <th className="pb-2 text-right font-normal">TP</th>
              <th className="pb-2 text-right font-normal">FP</th>
              <th className="pb-2 text-right font-normal">FN</th>
              <th className="pb-2 text-right font-normal">F1</th>
            </tr>
          </thead>
          <tbody>
            {acc.rows.map((r) => (
              <tr key={r.cls} className="border-b border-border/60">
                <td
                  className="py-1.5 font-mono text-xs"
                  style={{ color: EVENT_CLASS_COLORS[r.cls] }}
                >
                  {r.cls}
                </td>
                <td className="py-1.5 text-right font-mono text-xs text-foreground">{r.tp}</td>
                <td className="py-1.5 text-right font-mono text-xs text-[var(--body)]">{r.fp}</td>
                <td className="py-1.5 text-right font-mono text-xs text-[var(--body)]">{r.fn}</td>
                <td className="py-1.5 text-right font-mono text-xs text-foreground">
                  {r.f1.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Measured against our own labels, not the hidden test set. Labels come from reviewing the
        candidates our rules proposed, so recall is an upper bound.
      </p>
    </section>
  );
}

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

      <AccuracyCard video={`${id}.mp4`} predicted={feed.events} />

      <Timeline model={model} selected={selected} onEventClick={setSelected} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-5">
        <EventTable model={model} defaultOpen highlight={selected} onRowClick={setSelected} />
        <ClassMix model={model} />
      </div>
    </div>
  );
}
