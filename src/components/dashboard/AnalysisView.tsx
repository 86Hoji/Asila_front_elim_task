import { ClassStats } from "./ClassStats";
import { EventList } from "./EventList";
import { EventTimeline } from "./EventTimeline";
import { MediaPanel } from "./MediaPanel";
import { RiskChart } from "./RiskChart";
import { usePlayer } from "./usePlayer";
import type { AnalysisResult } from "@/types";

export function AnalysisView({
  result,
  mode,
  src,
  note,
}: {
  result: AnalysisResult;
  mode: "video" | "schematic";
  src?: string;
  note?: string;
}) {
  const player = usePlayer(result.duration, mode === "schematic");

  return (
    <div className="space-y-5">
      <MediaPanel mode={mode} src={src} events={result.events} player={player} note={note} />
      <EventTimeline
        events={result.events}
        duration={result.duration}
        currentTime={player.currentTime}
        onSeek={player.seek}
      />
      <RiskChart risk={result.risk} currentTime={player.currentTime} onSeek={player.seek} />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <EventList events={result.events} currentTime={player.currentTime} onSeek={player.seek} />
        <ClassStats events={result.events} />
      </div>
    </div>
  );
}
