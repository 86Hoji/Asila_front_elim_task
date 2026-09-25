import { memo, useRef } from "react";
import {
  HelpCircle,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PillLayer, SceneView } from "@/components/scene/SceneView";
import { formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import type { Model } from "./analysis";
import { nextEventStart, prevEventStart } from "./navigation";
import { usePlayerControls, usePlayerTime, useTimeEffect, type PlayerStore } from "./player-store";

const SPEEDS = [0.5, 1, 2, 4];

function Clock({ store, duration }: { store: PlayerStore; duration: number }) {
  const t = usePlayerTime(store);
  return (
    <span className="font-mono text-[11px] tabular-nums text-foreground sm:text-xs">
      {formatTime(t)} <span className="text-muted-foreground">/ {formatTime(duration)}</span>
    </span>
  );
}

/** Slim progress bar under the picture: tap or drag to scrub. Imperative fill. */
function Scrubber({ store, duration }: { store: PlayerStore; duration: number }) {
  const fillRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const down = useRef(false);
  useTimeEffect(store, (t) => {
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${duration ? t / duration : 0})`;
  });
  const seekAt = (x: number) => {
    const r = barRef.current!.getBoundingClientRect();
    store.seek(((x - r.left) / r.width) * duration);
  };
  return (
    <div
      ref={barRef}
      className="group relative h-3 cursor-pointer touch-none"
      onPointerDown={(e) => {
        barRef.current!.setPointerCapture(e.pointerId);
        down.current = true;
        seekAt(e.clientX);
      }}
      onPointerMove={(e) => down.current && seekAt(e.clientX)}
      onPointerUp={() => (down.current = false)}
      onPointerCancel={() => (down.current = false)}
      aria-hidden
    >
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[rgba(0,194,188,0.18)] transition-[height] group-hover:h-[5px]">
        <div
          ref={fillRef}
          className="h-full w-full origin-left bg-teal will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
    </div>
  );
}

const SHORTCUTS: Array<[string, string]> = [
  ["Space", "play / pause"],
  ["← / →", "back / forward 5 s"],
  ["J / K", "previous / next event"],
];

export const Transport = memo(function Transport({
  store,
  model,
}: {
  store: PlayerStore;
  model: Model;
}) {
  const { playing, speed, loop } = usePlayerControls(store);
  const btn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-teal-mid hover:text-foreground";
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:gap-2.5 sm:px-4">
      <button
        type="button"
        onClick={() => {
          const s = prevEventStart(model, store.getTime());
          store.seek(s ?? 0);
        }}
        aria-label="Previous event (J)"
        title="Previous event (J)"
        className={btn}
      >
        <SkipBack className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => store.skip(-5)}
        aria-label="Back 5 seconds"
        title="Back 5 s (←)"
        className={btn}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={store.toggle}
        aria-label={playing ? "Pause" : "Play"}
        title="Play / pause (Space)"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={() => store.skip(5)}
        aria-label="Forward 5 seconds"
        title="Forward 5 s (→)"
        className={btn}
      >
        <RotateCw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const s = nextEventStart(model, store.getTime());
          if (s !== undefined) store.seek(s);
        }}
        aria-label="Next event (K)"
        title="Next event (K)"
        className={btn}
      >
        <SkipForward className="h-4 w-4" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="flex items-center rounded-full border border-border p-0.5"
          role="group"
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => store.setSpeed(s)}
              aria-pressed={speed === s}
              className={cn(
                "rounded-full px-2 py-1 font-mono text-[10px] transition-colors sm:px-2.5 sm:text-[11px]",
                speed === s ? "bg-accent text-teal" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={store.toggleLoop}
          aria-pressed={loop}
          aria-label="Loop"
          title="Loop"
          className={cn(btn, "h-8 w-8", loop && "border-teal-mid text-teal")}
        >
          <Repeat className="h-3.5 w-3.5" />
        </button>
        <Popover>
          <PopoverTrigger
            aria-label="Keyboard shortcuts"
            className={cn(btn, "hidden h-8 w-8 sm:flex")}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-60 border-border bg-[#031818] p-3 text-foreground">
            <p className="mono-label text-teal-mid">KEYBOARD</p>
            <dl className="mt-2 space-y-1.5">
              {SHORTCUTS.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 text-xs">
                  <dt>
                    <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
                      {k}
                    </kbd>
                  </dt>
                  <dd className="text-[var(--body)]">{v}</dd>
                </div>
              ))}
            </dl>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
});

/** The video element, driven by the shared clock. */
function VideoSurface({ store, src }: { store: PlayerStore; src: string }) {
  return (
    <video
      ref={store.attachMedia}
      src={src}
      className="h-full w-full bg-black object-contain"
      playsInline
      muted
      preload="metadata"
      onLoadedMetadata={(e) => store.setDuration(e.currentTarget.duration)}
      onEnded={store.handleMediaEnded}
      onClick={store.toggle}
    />
  );
}

export const Monitor = memo(function Monitor({
  store,
  model,
  title,
  note,
  src,
  seed,
}: {
  store: PlayerStore;
  model: Model;
  title: string;
  note?: string | undefined;
  src?: string | undefined;
  seed: number;
}) {
  const { playing } = usePlayerControls(store);
  return (
    <div className="glass-flat overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2 sm:px-4">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              playing ? "bg-[#ff4d6d]" : "bg-muted-foreground",
            )}
            style={playing ? { animation: "pulse-dot 1.4s ease-in-out infinite" } : undefined}
          />
        </span>
        <span className="truncate font-mono text-[11px] tracking-wider text-foreground sm:text-xs">
          {title}
        </span>
        <span className="mono-label hidden shrink-0 text-[10px] md:inline">
          {playing ? "PLAYING" : "PAUSED"}
        </span>
        {note && (
          <span className="hidden min-w-0 truncate font-mono text-[10px] text-muted-foreground lg:inline">
            · {note}
          </span>
        )}
        <span className="ml-auto">
          <Clock store={store} duration={model.duration} />
        </span>
      </div>

      <div className="relative aspect-[1000/560] w-full bg-[#020e0e]">
        {src ? (
          <>
            <VideoSurface store={store} src={src} />
            <PillLayer store={store} events={model.events} anchored={false} />
          </>
        ) : (
          <SceneView store={store} events={model.events} seed={seed} />
        )}
        {note && (
          <div className="pointer-events-none absolute bottom-2 right-2 max-w-[70%] lg:hidden truncate rounded-full border border-border bg-background/80 px-2.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground backdrop-blur sm:text-[10px]">
            {note}
          </div>
        )}
      </div>

      <div className="border-t border-border px-3 pt-1 sm:px-4">
        <Scrubber store={store} duration={model.duration} />
      </div>
      <Transport store={store} model={model} />
    </div>
  );
});
