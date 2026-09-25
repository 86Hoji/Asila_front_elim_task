import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RISK_THRESHOLD } from "@/config";
import { EVENT_CLASS_COLORS, formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import type { DetectedEvent } from "@/types";
import { riskAt, riskPath, type Model } from "./analysis";
import { useTimeEffect, type PlayerStore } from "./player-store";

const LABEL_W = "w-[92px] sm:w-[120px]";
const RISK_H = 64;
const LANE_H = 24;

/* ------------------------------------------------------------------ */
/* View window (zoom) — a tiny store so panning never re-renders lanes */
/* ------------------------------------------------------------------ */

class ViewStore {
  start = 0;
  private listeners = new Set<() => void>();
  constructor(
    public span: number,
    public duration: number,
  ) {}
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  setStart(s: number) {
    const clamped = Math.min(Math.max(0, this.duration - this.span), Math.max(0, s));
    if (clamped === this.start) return;
    this.start = clamped;
    for (const fn of this.listeners) fn();
  }
  setSpan(span: number, center: number) {
    this.span = Math.min(this.duration, span);
    this.start = -1; // force emit
    this.setStart(center - this.span / 2);
  }
}

function tickStep(span: number) {
  const steps = [1, 2, 5, 10, 15, 30, 60, 120];
  return steps.find((s) => span / s <= 8) ?? 300;
}

/* ------------------------------------------------------------------ */
/* Static lanes (memoised; never re-render while playing)              */
/* ------------------------------------------------------------------ */

const RiskLane = memo(function RiskLane({ model }: { model: Model }) {
  const { line, area } = useMemo(() => riskPath(model.risk), [model.risk]);
  const d = model.duration || 1;
  return (
    <div className="relative" style={{ height: RISK_H }}>
      <svg
        viewBox={`0 0 ${d} 1`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {model.alarms.map((a, i) => (
          <rect
            key={i}
            x={a.start}
            y={0}
            width={Math.max(0.3, a.end - a.start)}
            height={1}
            fill="rgba(255,77,109,0.22)"
          />
        ))}
        <path d={area} fill="rgba(0,255,235,0.14)" />
        <path
          d={line}
          fill="none"
          stroke="#00ffeb"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          x2={d}
          y1={1 - RISK_THRESHOLD}
          y2={1 - RISK_THRESHOLD}
          stroke="#ff8c42"
          strokeWidth={1}
          strokeDasharray="5 5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {model.alarms.map((a, i) => (
        <span
          key={i}
          className="absolute top-0 h-[3px] rounded-full bg-[#ff4d6d]"
          style={{
            left: `${(a.start / d) * 100}%`,
            width: `max(3px, ${((a.end - a.start) / d) * 100}%)`,
          }}
          aria-hidden
        />
      ))}
    </div>
  );
});

const ClassLanes = memo(function ClassLanes({ model }: { model: Model }) {
  const d = model.duration || 1;
  return (
    <div>
      {model.classes.map((cls) => (
        <div key={cls} className="relative flex items-center" style={{ height: LANE_H }}>
          <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(0,194,188,0.1)]" aria-hidden />
          {model.events.map((e, i) =>
            e[2] !== cls ? null : (
              <span
                key={i}
                data-ev={i}
                className="absolute top-1/2 h-[14px] -translate-y-1/2 rounded-full transition-[filter] hover:brightness-125"
                style={{
                  left: `${(e[0] / d) * 100}%`,
                  width: `max(5px, ${((e[1] - e[0]) / d) * 100}%)`,
                  background: EVENT_CLASS_COLORS[cls],
                  boxShadow: `0 0 10px -2px ${EVENT_CLASS_COLORS[cls]}`,
                }}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
});

const Axis = memo(function Axis({ duration, span }: { duration: number; span: number }) {
  const step = tickStep(span);
  const ticks = [];
  for (let t = 0; t <= duration + 1e-6; t += step) ticks.push(t);
  return (
    <div className="relative h-5 border-t border-border">
      {ticks.map((t) => (
        <span
          key={t}
          className="absolute top-0 -translate-x-1/2 pt-1 font-mono text-[9px] text-muted-foreground first:translate-x-0"
          style={{ left: `${(t / duration) * 100}%` }}
        >
          {formatTime(t).replace(/\.0$/, "")}
        </span>
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Tooltip (own state, so hovering never re-renders the lanes)         */
/* ------------------------------------------------------------------ */

type TipApi = { show: (x: number, text: string) => void; hide: () => void };

function Tooltip({ apiRef }: { apiRef: React.MutableRefObject<TipApi | null> }) {
  const [tip, setTip] = useState<{ x: number; text: string } | null>(null);
  useEffect(() => {
    apiRef.current = {
      show: (x, text) => setTip({ x, text }),
      hide: () => setTip(null),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef]);
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute -top-2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border bg-[#031818] px-2.5 py-1.5 font-mono text-[10px] text-white shadow-xl"
      style={{ left: tip.x }}
    >
      {tip.text}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export const Timeline = memo(function Timeline({
  store,
  model,
}: {
  store: PlayerStore;
  model: Model;
}) {
  const duration = model.duration || 1;
  const [span, setSpanState] = useState(duration);
  const view = useMemo(() => new ViewStore(duration, duration), [duration]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const ovHeadRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<TipApi | null>(null);

  const applyView = useCallback(() => {
    const inner = innerRef.current;
    if (inner) {
      inner.style.width = `${(duration / view.span) * 100}%`;
      inner.style.transform = `translateX(${-(view.start / duration) * 100}%)`;
    }
    const w = windowRef.current;
    if (w) {
      w.style.left = `${(view.start / duration) * 100}%`;
      w.style.width = `${(view.span / duration) * 100}%`;
    }
  }, [duration, view]);

  useEffect(() => {
    applyView();
    return view.subscribe(applyView);
  }, [view, applyView]);

  const zoom = (next: number) => {
    const s = Math.min(duration, next);
    setSpanState(s);
    view.setSpan(s, store.getTime());
    applyView();
  };

  // Playheads + auto-follow: imperative, once per clock change.
  useTimeEffect(store, (t) => {
    const pct = `${(t / duration) * 100}%`;
    if (playheadRef.current) playheadRef.current.style.transform = `translateX(${pct})`;
    if (ovHeadRef.current) ovHeadRef.current.style.transform = `translateX(${pct})`;
    if (view.span < duration && (t < view.start || t > view.start + view.span * 0.92)) {
      view.setStart(t - view.span * 0.12);
    }
  });

  /* ---- pointer: click to seek, drag to scrub, hover tooltip ---- */
  const timeAtX = (clientX: number) => {
    const r = viewportRef.current!.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return view.start + u * view.span;
  };
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const eventAt = (target: EventTarget | null): DetectedEvent | null => {
    const el = (target as HTMLElement | null)?.closest?.("[data-ev]");
    if (!el) return null;
    return model.events[Number(el.getAttribute("data-ev"))] ?? null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    viewportRef.current?.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, moved: false };
    const ev = eventAt(e.target);
    store.seek(ev ? ev[0] : timeAtX(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const r = viewportRef.current!.getBoundingClientRect();
    const t = timeAtX(e.clientX);
    if (drag.current) {
      if (Math.abs(e.clientX - drag.current.x) > 3) drag.current.moved = true;
      if (drag.current.moved) store.seek(t);
    }
    const ev = drag.current ? null : eventAt(e.target);
    const text = ev
      ? `${ev[2]} · ${formatTime(ev[0])} → ${formatTime(ev[1])} · ${(ev[1] - ev[0]).toFixed(1)} s`
      : `${formatTime(t)} · risk ${riskAt(model.risk, t).toFixed(2)}`;
    tipRef.current?.show(e.clientX - r.left, text);
  };
  const endDrag = () => {
    drag.current = null;
  };

  /* ---- overview: drag the window, click to jump ---- */
  const ovDrag = useRef<{ x: number; start: number } | null>(null);
  const onOvDown = (e: React.PointerEvent) => {
    const el = overviewRef.current!;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * duration;
    if (t < view.start || t > view.start + view.span) view.setStart(t - view.span / 2);
    ovDrag.current = { x: e.clientX, start: view.start };
  };
  const onOvMove = (e: React.PointerEvent) => {
    if (!ovDrag.current) return;
    const r = overviewRef.current!.getBoundingClientRect();
    view.setStart(ovDrag.current.start + ((e.clientX - ovDrag.current.x) / r.width) * duration);
  };

  const { area: ovArea } = useMemo(() => riskPath(model.risk, 400), [model.risk]);
  const zoomOptions = [
    { label: "Fit", value: duration },
    { label: "60 s", value: 60 },
    { label: "20 s", value: 20 },
  ].filter((z, i) => i === 0 || z.value < duration);

  const lanesHeight = RISK_H + model.classes.length * LANE_H;

  return (
    <section className="glass-flat min-w-0 p-4 sm:p-5" aria-label="Event timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="mono-label text-teal-mid">TIMELINE</h3>
        <div
          className="flex items-center gap-1 rounded-full border border-border p-0.5"
          role="group"
          aria-label="Zoom"
        >
          {zoomOptions.map((z) => (
            <button
              key={z.label}
              type="button"
              onClick={() => zoom(z.value)}
              aria-pressed={Math.abs(span - Math.min(duration, z.value)) < 0.01}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors",
                Math.abs(span - Math.min(duration, z.value)) < 0.01
                  ? "bg-accent text-teal"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex">
        {/* Row labels */}
        <div className={cn("shrink-0 pr-2", LABEL_W)}>
          <div className="flex flex-col justify-center" style={{ height: RISK_H }}>
            <span className="font-mono text-[10px] text-teal">risk</span>
            <span className="font-mono text-[9px] text-[#ff8c42]">– – alarm {RISK_THRESHOLD}</span>
          </div>
          {model.classes.map((c) => (
            <div key={c} className="flex items-center gap-1.5" style={{ height: LANE_H }}>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: EVENT_CLASS_COLORS[c] }}
                aria-hidden
              />
              <span className="truncate font-mono text-[10px] text-[var(--body)]">{c}</span>
            </div>
          ))}
        </div>

        {/* Lanes on one shared time axis */}
        <div className="relative min-w-0 flex-1">
          <Tooltip apiRef={tipRef} />
          <div
            ref={viewportRef}
            className="relative cursor-crosshair touch-pan-y overflow-hidden rounded-lg bg-[rgba(0,194,188,0.03)]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => tipRef.current?.hide()}
            role="slider"
            aria-label="Timeline: click to seek, drag to scrub"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            tabIndex={-1}
          >
            <div
              ref={innerRef}
              className="relative will-change-transform"
              style={{ width: "100%" }}
            >
              <RiskLane model={model} />
              <ClassLanes model={model} />
              <Axis duration={duration} span={span} />
              <div
                ref={playheadRef}
                className="pointer-events-none absolute left-0 top-0 w-full will-change-transform"
                style={{ height: lanesHeight }}
                aria-hidden
              >
                <div className="h-full w-px bg-teal shadow-[0_0_8px_rgba(0,255,235,0.8)]" />
                <div className="absolute -left-[4px] -top-[2px] h-[9px] w-[9px] rotate-45 bg-teal" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview strip: the whole video, with a draggable zoom window */}
      <div className="mt-3 flex items-center gap-2">
        <span className={cn("shrink-0 pr-2 font-mono text-[9px] text-muted-foreground", LABEL_W)}>
          overview
        </span>
        <div
          ref={overviewRef}
          className="relative h-9 min-w-0 flex-1 cursor-pointer touch-none overflow-hidden rounded-md border border-border bg-[rgba(0,194,188,0.04)]"
          onPointerDown={onOvDown}
          onPointerMove={onOvMove}
          onPointerUp={() => (ovDrag.current = null)}
          onPointerCancel={() => (ovDrag.current = null)}
          aria-label="Overview of the whole video; drag the window to pan"
        >
          <svg
            viewBox={`0 0 ${duration} 1`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <path d={ovArea} fill="rgba(0,255,235,0.18)" />
          </svg>
          {model.events.map((e, i) => (
            <span
              key={i}
              className="absolute bottom-0 h-2 w-[2px] rounded-full"
              style={{ left: `${(e[0] / duration) * 100}%`, background: EVENT_CLASS_COLORS[e[2]] }}
              aria-hidden
            />
          ))}
          <div ref={ovHeadRef} className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="h-full w-px bg-teal" />
          </div>
          <div
            ref={windowRef}
            className={cn(
              "absolute inset-y-0 cursor-grab rounded-md border border-teal-mid bg-[rgba(0,255,235,0.08)] active:cursor-grabbing",
              span >= duration && "border-transparent bg-transparent",
            )}
          />
        </div>
      </div>
    </section>
  );
});
