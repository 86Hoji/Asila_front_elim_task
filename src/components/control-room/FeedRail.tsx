import { memo, useMemo } from "react";
import { Moon, Sun, Sunset } from "lucide-react";
import { RISK_THRESHOLD } from "@/config";
import type { Feed } from "@/data/stats";
import { EVENT_CLASS_COLORS, formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import { sparkPath } from "./analysis";

function LightingIcon({ lighting }: { lighting: string }) {
  const cls = "h-3.5 w-3.5";
  if (lighting === "noon") return <Sun className={cn(cls, "text-[#ffe9a8]")} aria-label="noon" />;
  if (lighting === "evening")
    return <Sunset className={cn(cls, "text-[#ff9d6e]")} aria-label="evening" />;
  return <Moon className={cn(cls, "text-[#8b9bff]")} aria-label={lighting} />;
}

const FeedCard = memo(function FeedCard({
  feed,
  active,
  onSelect,
}: {
  feed: Feed;
  active: boolean;
  onSelect: () => void;
}) {
  const spark = useMemo(() => sparkPath(feed.risk, feed.duration), [feed]);
  const thresholdY = 23 - RISK_THRESHOLD * 22;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "glass-flat w-[210px] shrink-0 p-3 text-left transition-[border-color,box-shadow] xl:w-full",
        active
          ? "border-teal shadow-[0_0_0_1px_var(--teal),0_0_28px_-6px_rgba(0,255,235,0.55)]"
          : "hover:border-teal-mid",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wider text-foreground">
          CAM · {feed.id}
        </span>
        <LightingIcon lighting={feed.lighting} />
      </div>
      <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
        <span>{formatTime(feed.duration).replace(/\.\d$/, "")}</span>
        <span>·</span>
        <span>{feed.lighting}</span>
        <span>·</span>
        <span className="text-[var(--body)]">{feed.events.length} events</span>
      </div>

      {/* Event density: one tick per event on a thin line */}
      <div className="relative mt-2.5 h-2.5" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(0,194,188,0.2)]" />
        {feed.events.map((e, i) => (
          <span
            key={i}
            className="absolute top-0 h-full w-[2px] rounded-full"
            style={{
              left: `${(e[0] / feed.duration) * 100}%`,
              background: EVENT_CLASS_COLORS[e[2]],
            }}
          />
        ))}
      </div>

      {/* Risk sparkline */}
      <svg
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        className="mt-1.5 h-6 w-full"
        aria-hidden
      >
        <line
          x1={0}
          x2={100}
          y1={thresholdY}
          y2={thresholdY}
          stroke="#ff8c42"
          strokeWidth={0.6}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={spark}
          fill="none"
          stroke={active ? "#00ffeb" : "#00c2bc"}
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </button>
  );
});

export const FeedRail = memo(function FeedRail({
  feeds,
  selected,
  onSelect,
}: {
  feeds: Feed[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <nav aria-label="Camera feeds" className="min-w-0">
      <p className="mono-label mb-2 hidden text-teal-mid xl:block">FEEDS</p>
      <div className="scrollbar-thin-teal -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
        {feeds.map((f) => (
          <FeedCard
            key={f.name}
            feed={f}
            active={f.name === selected}
            onSelect={() => onSelect(f.name)}
          />
        ))}
      </div>
    </nav>
  );
});
