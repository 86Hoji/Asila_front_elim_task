import { useState } from "react";
import { AnalysisView } from "./AnalysisView";
import { SAMPLE_ORDER, SHOW_SAMPLE_VIDEOS } from "@/config";
import { samples } from "@/data/samples";
import { cn } from "@/lib/utils";

export function SampleVideosTab() {
  const [selected, setSelected] = useState(SAMPLE_ORDER[0]!);
  const sample = samples[selected]!;

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
        {SAMPLE_ORDER.map((name) => {
          const s = samples[name]!;
          const active = name === selected;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setSelected(name)}
              aria-pressed={active}
              className={cn(
                "glass hover-lift w-[220px] shrink-0 p-4 text-left lg:w-full",
                active && "border-teal-mid shadow-[var(--shadow-card)]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-foreground">{name.replace(".mp4", "")}</span>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    active ? "bg-teal" : "bg-[var(--teal-dim)]",
                  )}
                  aria-hidden
                />
              </div>
              <dl className="mt-3 space-y-1 font-mono text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <dt>duration</dt>
                  <dd>{(s.duration / 60).toFixed(1)} min</dd>
                </div>
                <div className="flex justify-between">
                  <dt>lighting</dt>
                  <dd>{s.lighting}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>events</dt>
                  <dd>{s.events.length}</dd>
                </div>
              </dl>
            </button>
          );
        })}
      </aside>

      <div className="min-w-0">
        <AnalysisView
          key={selected}
          result={sample}
          mode={SHOW_SAMPLE_VIDEOS && sample.annotated_video_url ? "video" : "schematic"}
          src={sample.annotated_video_url}
          note={
            SHOW_SAMPLE_VIDEOS && sample.annotated_video_url
              ? undefined
              : "Footage hidden under NDA — events shown on scene schematic"
          }
        />
      </div>
    </div>
  );
}
