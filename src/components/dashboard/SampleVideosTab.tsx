import { useState } from "react";
import { FeedReport } from "@/components/control-room/FeedReport";
import { FeedRail } from "@/components/control-room/FeedRail";
import { FEEDS } from "@/data/stats";

export function SampleVideosTab() {
  const [selected, setSelected] = useState(FEEDS[0]!.name);
  const feed = FEEDS.find((f) => f.name === selected) ?? FEEDS[0]!;

  return (
    <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start xl:gap-5">
      <div className="min-w-0 xl:sticky xl:top-24">
        <FeedRail feeds={FEEDS} selected={feed.name} onSelect={setSelected} />
      </div>
      <FeedReport key={feed.name} feed={feed} id={feed.id} />
    </div>
  );
}
