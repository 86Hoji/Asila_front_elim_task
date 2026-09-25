import { memo, useCallback, useMemo, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import {
  useTimeEffect,
  useTimeSelector,
  type PlayerStore,
} from "@/components/control-room/player-store";
import { EVENT_CLASS_COLORS } from "@/lib/event-classes";
import type { DetectedEvent } from "@/types";
import {
  NEAR,
  ROUTES,
  SIGNALS,
  STOP_LINE_X,
  VIEW,
  WALKS,
  mulberry32,
  pointAt,
  type Pt,
} from "./geometry";
import { activeKey, overlayFor, type OverlaySpec } from "./overlays";
import { SceneBase } from "./SceneBase";

function parseKey(key: string) {
  return key ? key.split(",").map(Number) : [];
}

const f1 = (n: number) => Math.round(n * 10) / 10;

/* ------------------------------------------------------------------ */
/* Ambient traffic: seeded, deterministic in video time, no re-renders */
/* ------------------------------------------------------------------ */

type Mover = { route: number; speed: number; phase: number; cycle: number; ped: boolean };

function buildMovers(seed: number): Mover[] {
  const rnd = mulberry32(seed);
  const movers: Mover[] = [];
  ROUTES.forEach((r, ri) => {
    const speed = 55 + rnd() * 45;
    const count = r.weight * 2;
    const cycle = r.track.length + 300 + rnd() * 400;
    for (let i = 0; i < count; i++) {
      movers.push({
        route: ri,
        speed,
        cycle,
        phase: (i / count) * cycle + rnd() * 60,
        ped: false,
      });
    }
  });
  WALKS.forEach((_w, wi) => {
    for (let i = 0; i < 2; i++) {
      const cycle = 32 + rnd() * 20; // seconds between walkers
      movers.push({ route: wi, speed: 11 + rnd() * 4, cycle, phase: rnd() * cycle, ped: true });
    }
  });
  return movers;
}

const AmbientLayer = memo(function AmbientLayer({
  store,
  seed,
}: {
  store: PlayerStore;
  seed: number;
}) {
  const movers = useMemo(() => buildMovers(seed), [seed]);
  const refs = useRef<Array<SVGGElement | null>>([]);
  const pt = useRef<Pt>({ x: 0, y: 0 });

  useTimeEffect(store, (t) => {
    const out = pt.current;
    movers.forEach((m, i) => {
      const el = refs.current[i];
      if (!el) return;
      let visible: boolean;
      if (m.ped) {
        const track = WALKS[m.route]!;
        const d = (((t + m.phase) % m.cycle) + m.cycle) % m.cycle;
        const dist = d * m.speed;
        visible = dist <= track.length;
        if (visible) pointAt(track, dist, out);
      } else {
        const track = ROUTES[m.route]!.track;
        const d = (t * m.speed + m.phase) % m.cycle;
        visible = d <= track.length;
        if (visible) pointAt(track, d, out);
      }
      if (visible) {
        el.setAttribute("transform", `translate(${f1(out.x)} ${f1(out.y)})`);
        el.style.opacity = "1";
      } else {
        el.style.opacity = "0";
      }
    });
  });

  return (
    <g className="motion-reduce:hidden" aria-hidden>
      {movers.map((m, i) => (
        <g
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{ opacity: 0 }}
        >
          {m.ped ? (
            <>
              <circle r={8} fill="#ffffff" opacity={0.12} />
              <circle r={3.8} fill="#e8f7f6" opacity={0.85} />
            </>
          ) : (
            <>
              <circle r={11} fill="#00ffeb" opacity={0.1} />
              <circle r={5.5} fill="#00c2bc" opacity={0.75} />
            </>
          )}
        </g>
      ))}
    </g>
  );
});

/* ------------------------------------------------------------------ */
/* Event overlays                                                      */
/* ------------------------------------------------------------------ */

function ActorShape({ kind, color }: { kind: string; color: string }) {
  if (kind === "ped") {
    return (
      <>
        <circle r={11} fill="#ffffff" opacity={0.2} />
        <circle r={5} fill="#ffffff" />
      </>
    );
  }
  if (kind === "obj") {
    return (
      <rect x={-7} y={-7} width={14} height={14} rx={2} fill="#adb5bd" transform="rotate(20)" />
    );
  }
  return (
    <>
      <circle r={15} fill={color} opacity={0.25} />
      <circle r={7.5} fill={color} stroke="#010909" strokeWidth={1.5} />
    </>
  );
}

const EventOverlay = memo(function EventOverlay({
  store,
  event,
}: {
  store: PlayerStore;
  event: DetectedEvent;
}) {
  const [start, end, label] = event;
  const color = EVENT_CLASS_COLORS[label];
  const spec: OverlaySpec = useMemo(() => overlayFor(label, start), [label, start]);
  const pts = useRef<Pt[]>(spec.actors.map(() => ({ x: 0, y: 0 })));
  const actorRefs = useRef<Array<SVGGElement | null>>([]);
  const burstRef = useRef<SVGCircleElement>(null);
  const timerRef = useRef<SVGCircleElement>(null);
  const chevRef = useRef<SVGGElement>(null);
  const smokeRef = useRef<SVGGElement>(null);
  const TIMER_C = 2 * Math.PI * 20;

  useTimeEffect(store, (t) => {
    const p = end > start ? Math.min(1, Math.max(0, (t - start) / (end - start))) : 1;
    spec.place(p, pts.current);
    pts.current.forEach((pt, i) => {
      actorRefs.current[i]?.setAttribute("transform", `translate(${f1(pt.x)} ${f1(pt.y)})`);
    });
    const a = pts.current[0]!;
    if (timerRef.current) {
      timerRef.current.setAttribute("transform", `translate(${f1(a.x)} ${f1(a.y)}) rotate(-90)`);
      timerRef.current.style.strokeDashoffset = String(TIMER_C * (1 - p));
    }
    if (chevRef.current)
      chevRef.current.setAttribute("transform", `translate(${f1(a.x)} ${f1(a.y)})`);
    if (burstRef.current) {
      const u = Math.min(1, Math.max(0, (p - 0.4) / 0.4));
      burstRef.current.setAttribute("r", String(f1(10 + u * 55)));
      burstRef.current.style.opacity = String(p < 0.4 ? 0 : 1 - u * 0.8);
    }
    if (smokeRef.current) {
      const kids = smokeRef.current.children;
      for (let i = 0; i < kids.length; i++) {
        const k = ((t * 18 + i * 22) % 66) / 66;
        (kids[i] as SVGCircleElement).setAttribute("cy", String(f1(-10 - k * 60)));
        (kids[i] as SVGCircleElement).style.opacity = String(f1((1 - k) * 0.6));
      }
    }
  });

  return (
    <g>
      {spec.decor.map((d, i) => {
        switch (d.kind) {
          case "ring":
            return (
              <circle
                key={i}
                cx={d.at.x}
                cy={d.at.y}
                r={30}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                className="scene-pulse"
              />
            );
          case "stopline":
            return (
              <line
                key={i}
                x1={STOP_LINE_X}
                x2={STOP_LINE_X}
                y1={NEAR.top + 2}
                y2={NEAR.bottom - 2}
                stroke={d.color}
                strokeWidth={7}
                className="scene-blink"
              />
            );
          case "zone":
            return (
              <rect
                key={i}
                x={d.x}
                y={d.y}
                width={d.w}
                height={d.h}
                rx={10}
                fill={color}
                fillOpacity={0.08}
                stroke={color}
                strokeDasharray="8 6"
              />
            );
          case "burst":
            return (
              <circle
                key={i}
                ref={burstRef}
                cx={d.at.x}
                cy={d.at.y}
                r={10}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeDasharray={d.contact ? undefined : "6 6"}
                style={{ opacity: 0 }}
              />
            );
          case "timer":
            return (
              <circle
                key={i}
                ref={timerRef}
                r={20}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeDasharray={TIMER_C}
                strokeLinecap="round"
              />
            );
          case "chevrons":
            return (
              <g key={i} ref={chevRef} fill="none" stroke="#ff3b3b" strokeWidth={3}>
                {[24, 42, 60].map((dx, j) => (
                  <path
                    key={dx}
                    d={`M${dx + 7} -8 L${dx} 0 L${dx + 7} 8`}
                    opacity={1 - j * 0.28}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            );
          case "smoke":
            return (
              <g key={i} ref={smokeRef} transform={`translate(820 ${NEAR.top + 60})`}>
                {[0, 1, 2].map((j) => (
                  <circle key={j} cx={(j - 1) * 8} cy={-10} r={10 + j * 3} fill="#92a5a4" />
                ))}
              </g>
            );
          default:
            return null;
        }
      })}
      {spec.actors.map((kind, i) => (
        <g
          key={i}
          ref={(el) => {
            actorRefs.current[i] = el;
          }}
        >
          <ActorShape kind={kind} color={color} />
        </g>
      ))}
    </g>
  );
});

function useActive(store: PlayerStore, events: DetectedEvent[]) {
  const select = useCallback((t: number) => activeKey(events, t), [events]);
  return parseKey(useTimeSelector(store, select));
}

const OverlayLayer = memo(function OverlayLayer({
  store,
  events,
}: {
  store: PlayerStore;
  events: DetectedEvent[];
}) {
  const active = useActive(store, events);
  const red = active.some((i) => overlayFor(events[i]![2], events[i]![0]).red);
  const near = SIGNALS[0]!;
  return (
    <g>
      {/* Near signal head: lit red while a red-phase event is active, dark otherwise. */}
      {red && (
        <g transform={`translate(${near.x} ${near.y})`}>
          <circle cy={-9} r={7} fill="#ff3b3b" opacity={0.35} />
          <circle cy={-9} r={3.5} fill="#ff3b3b" />
        </g>
      )}
      {active.map((i) => (
        <EventOverlay key={`${i}`} store={store} event={events[i]!} />
      ))}
    </g>
  );
});

/* ------------------------------------------------------------------ */
/* HTML label pills (stay readable at any size)                        */
/* ------------------------------------------------------------------ */

const Pill = memo(function Pill({
  store,
  event,
  stack,
  anchor,
}: {
  store: PlayerStore;
  event: DetectedEvent;
  stack: number;
  anchor?: Pt;
}) {
  const [start, end, label] = event;
  const color = EVENT_CLASS_COLORS[label];
  const textRef = useRef<HTMLSpanElement>(null);
  const total = end - start;
  useTimeEffect(store, (t) => {
    if (textRef.current) {
      textRef.current.textContent = `${Math.min(total, Math.max(0, t - start)).toFixed(1)}/${total.toFixed(1)} s`;
    }
  });
  const style = anchor
    ? {
        left: `${(anchor.x / VIEW.w) * 100}%`,
        top: `${(anchor.y / VIEW.h) * 100}%`,
        transform: `translate(-50%, calc(-50% - ${stack * 26}px))`,
      }
    : { left: "12px", bottom: `${12 + stack * 30}px` };
  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-[rgba(1,9,9,0.88)] px-2.5 py-1 font-mono text-[10px] text-white shadow-lg backdrop-blur sm:text-[11px]"
      style={{ ...style, borderColor: color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
      <span style={{ color }}>{label}</span>
      <span className="text-muted-foreground">·</span>
      <span ref={textRef} />
    </div>
  );
});

/** Label pills for active events. Anchored on the scene, or stacked bottom-left over a video. */
export const PillLayer = memo(function PillLayer({
  store,
  events,
  anchored,
}: {
  store: PlayerStore;
  events: DetectedEvent[];
  anchored: boolean;
}) {
  const active = useActive(store, events);
  const seen = new Map<string, number>();
  return (
    <>
      {active.map((i) => {
        const e = events[i]!;
        const anchor = anchored ? overlayFor(e[2], e[0]).anchor : undefined;
        const k = anchor ? `${anchor.x},${anchor.y}` : "video";
        const stack = seen.get(k) ?? 0;
        seen.set(k, stack + 1);
        return (
          <Pill key={i} store={store} event={e} stack={stack} {...(anchor ? { anchor } : {})} />
        );
      })}
    </>
  );
});

/* ------------------------------------------------------------------ */

function Legend({ onClose }: { onClose: () => void }) {
  const rows = [
    {
      swatch: <span className="h-2.5 w-2.5 rounded-full bg-teal-mid" />,
      text: "vehicle (ambient)",
    },
    { swatch: <span className="h-2 w-2 rounded-full bg-white" />, text: "pedestrian" },
    {
      swatch: <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: "#f72585" }} />,
      text: "event, coloured by class",
    },
    { swatch: <span className="h-3 w-1 rounded-sm bg-teal" />, text: "stop line" },
    {
      swatch: (
        <span className="flex h-3 w-3 flex-col justify-between">
          <span className="h-px bg-[var(--body)]" />
          <span className="h-px bg-[var(--body)]" />
          <span className="h-px bg-[var(--body)]" />
        </span>
      ),
      text: "zebra crossing",
    },
    { swatch: <span className="text-[10px] text-teal-mid">→</span>, text: "legal direction" },
  ];
  return (
    <div className="absolute right-2 top-10 z-20 w-52 rounded-xl border border-border bg-[rgba(1,9,9,0.92)] p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="mono-label text-teal-mid">LEGEND</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close legend"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-[var(--body)]">
        {rows.map((r) => (
          <li key={r.text} className="flex items-center gap-2">
            <span className="flex w-4 justify-center">{r.swatch}</span>
            {r.text}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
        Our own drawing, not footage. Event positions are illustrative.
      </p>
    </div>
  );
}

/** Animated top-down scene: the junction drawing, ambient traffic and event overlays. */
export const SceneView = memo(function SceneView({
  store,
  events,
  seed,
}: {
  store: PlayerStore;
  events: DetectedEvent[];
  seed: number;
}) {
  const [legend, setLegend] = useState(false);
  return (
    <div className="relative h-full w-full">
      {/* Static drawing and moving layer are separate SVGs, so only the dots repaint. */}
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="absolute inset-0 block h-full w-full"
        role="img"
        aria-label="Top-down drawing of the junction with detected events acted out at the playhead"
      >
        <SceneBase idPrefix={`sv${seed}`} />
      </svg>
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="absolute inset-0 block h-full w-full will-change-transform"
        aria-hidden
      >
        <AmbientLayer store={store} seed={seed} />
        <OverlayLayer store={store} events={events} />
      </svg>
      <PillLayer store={store} events={events} anchored />
      <button
        type="button"
        onClick={() => setLegend((v) => !v)}
        aria-expanded={legend}
        className="absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full border border-border bg-[rgba(1,9,9,0.8)] px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <Info className="h-3 w-3" /> legend
      </button>
      {legend && <Legend onClose={() => setLegend(false)} />}
    </div>
  );
});
