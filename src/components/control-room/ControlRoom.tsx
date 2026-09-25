import { useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types";
import { buildModel } from "./analysis";
import { EventTable } from "./EventTable";
import { Monitor } from "./Monitor";
import { useAlarmEntries, useShortcuts } from "./navigation";
import { usePlayerStore } from "./player-store";
import { ClassMix, LiveFeed, RiskGauge } from "./Rails";
import { Timeline } from "./Timeline";

/**
 * The control-room layout. Key it by feed/clip so each one gets a fresh clock.
 *
 * ≥ 1280px: feeds rail | monitor + timeline + table | risk, live feed, class mix.
 * Below: one column — feeds, monitor + transport, gauge, live feed, timeline,
 * table, class mix. The rails use `display: contents` on small screens so their
 * cards can be reordered individually.
 */
export function ControlRoom({
  result,
  title,
  note,
  src,
  feeds,
}: {
  result: AnalysisResult;
  title: string;
  note?: string | undefined;
  src?: string | undefined;
  feeds?: ReactNode;
}) {
  const model = useMemo(() => buildModel(result), [result]);
  const store = usePlayerStore(model.duration);
  useShortcuts(store, model);
  const flash = useAlarmEntries(store, model);

  return (
    <div
      className={cn(
        "flex flex-col gap-4 xl:grid xl:items-start xl:gap-5",
        feeds ? "xl:grid-cols-[260px_minmax(0,1fr)_340px]" : "xl:grid-cols-[minmax(0,1fr)_340px]",
      )}
    >
      {feeds && <div className="order-1 min-w-0 xl:sticky xl:top-24 xl:order-none">{feeds}</div>}

      <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
        <div className="order-2 min-w-0">
          <Monitor store={store} model={model} title={title} note={note} src={src} />
        </div>
        <div className="order-5 min-w-0">
          <Timeline store={store} model={model} />
        </div>
        <div className="order-6 min-w-0">
          <EventTable store={store} model={model} />
        </div>
      </div>

      <div className="contents xl:sticky xl:top-24 xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
        <div className="order-3 min-w-0">
          <RiskGauge store={store} model={model} flash={flash} />
        </div>
        <div className="order-4 min-w-0">
          <LiveFeed store={store} model={model} flash={flash} />
        </div>
        <div className="order-7 min-w-0">
          <ClassMix model={model} />
        </div>
      </div>
    </div>
  );
}
