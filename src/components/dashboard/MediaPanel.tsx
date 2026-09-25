import { useEffect, useRef } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { SceneSchematic } from "./SceneSchematic";
import { formatTime } from "@/lib/event-classes";
import type { Player } from "./usePlayer";
import type { DetectedEvent } from "@/types";

const SPEEDS = [0.5, 1, 1.5, 2];

export function MediaPanel({
  mode,
  src,
  events,
  player,
  note,
}: {
  mode: "video" | "schematic";
  src?: string | undefined;
  events: DetectedEvent[];
  player: Player;
  note?: string | undefined;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (mode !== "video" || !v) return;
    if (player.playing) void v.play().catch(() => undefined);
    else v.pause();
  }, [mode, player.playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (mode !== "video" || !v) return;
    v.playbackRate = player.speed;
  }, [mode, player.speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (mode !== "video" || !v) return;
    if (Math.abs(v.currentTime - player.currentTime) > 0.4) {
      v.currentTime = player.currentTime;
    }
  }, [mode, player.currentTime]);

  const pct = player.duration ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <div className="glass overflow-hidden">
      <div className="relative aspect-video w-full bg-[#020e0e]">
        {mode === "video" && src ? (
          <video
            ref={videoRef}
            src={src}
            className="h-full w-full object-contain"
            playsInline
            onTimeUpdate={(e) => player.reportTime(e.currentTarget.currentTime)}
            onEnded={() => player.pause()}
          />
        ) : (
          <SceneSchematic events={events} currentTime={player.currentTime} />
        )}

        {note && (
          <div className="absolute left-3 top-3 rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] tracking-wider text-muted-foreground backdrop-blur">
            {note}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.playing ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
        >
          {player.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => player.seek(0)}
          aria-label="Restart"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <div className="order-last flex w-full items-center gap-3 sm:order-none sm:w-auto sm:flex-1">
          <input
            type="range"
            min={0}
            max={player.duration}
            step={0.1}
            value={player.currentTime}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label="Seek"
            className="h-1 w-full cursor-pointer appearance-none rounded-full outline-none"
            style={{
              background: `linear-gradient(90deg, var(--teal) ${pct}%, rgba(0,194,188,0.2) ${pct}%)`,
            }}
          />
        </div>

        <span className="font-mono text-xs text-muted-foreground">
          {formatTime(player.currentTime)} / {formatTime(player.duration)}
        </span>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => player.setSpeed(s)}
              className={`rounded-full px-2 py-1 font-mono text-[11px] transition-colors ${
                player.speed === s
                  ? "bg-accent text-teal"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
