import { useState } from "react";
import { ControlRoom } from "@/components/control-room/ControlRoom";
import { FeedRail } from "@/components/control-room/FeedRail";
import { hashString } from "@/components/scene/geometry";
import { SHOW_SAMPLE_VIDEOS } from "@/config";
import { FEEDS } from "@/data/stats";

export function SampleVideosTab() {
  const [selected, setSelected] = useState(FEEDS[0]!.name);
  const feed = FEEDS.find((f) => f.name === selected) ?? FEEDS[0]!;
  const video = SHOW_SAMPLE_VIDEOS ? feed.annotated_video_url : undefined;

  return (
    <ControlRoom
      key={feed.name}
      result={feed}
      title={`CAM · ${feed.id} · ${feed.lighting}`}
      note={video ? undefined : "NDA: footage hidden, events shown on our scene drawing"}
      src={video}
      seed={hashString(feed.id)}
      feeds={<FeedRail feeds={FEEDS} selected={feed.name} onSelect={setSelected} />}
    />
  );
}
