import { memo, useCallback, useEffect, useState } from "react";
import { CornerDownRight } from "lucide-react";
import { RISK_THRESHOLD } from "@/config";
import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS, formatTime } from "@/lib/event-classes";
import { cn } from "@/lib/utils";
import {
  RISK_STATE_COLOR,
  riskAt,
  riskState,
  startedCount,
  type Model,
  activeKey,
} from "./analysis";
import { usePlayerTime, useTimeSelector, type PlayerStore } from "./player-store";

/** Red flash overlay, re-mounted (and so replayed) every time risk enters ALARM. */
function Flash({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span
      key={n}
      className="alarm-flash pointer-events-none absolute inset-0 rounded-[inherit]"
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */

const R = 62;
const SWEEP = 240;
const START = 90 + (360 - SWEEP) / 2; // degrees, measured clockwise from +x

function arc(from: number, to: number) {
  const a0 = ((START + from * SWEEP) * Math.PI) / 180;
  const a1 = ((START + to * SWEEP) * Math.PI) / 180;
  const large = (to - from) * SWEEP > 180 ? 1 : 0;
  const p = (a: number) =>
    `${(80 + R * Math.cos(a)).toFixed(2)} ${(80 + R * Math.sin(a)).toFixed(2)}`;
  return `M${p(a0)} A${R} ${R} 0 ${large} 1 ${p(a1)}`;
}

export function RiskGauge({
  store,
  model,
  flash,
}: {
  store: PlayerStore;
  model: Model;
  flash: number;
}) {
  const t = usePlayerTime(store);
  const v = riskAt(model.risk, t);
  const state = riskState(v);
  const color = RISK_STATE_COLOR[state];
  return (
    <section className="glass-flat relative p-4 sm:p-5" aria-label="Risk now">
      <Flash n={flash} />
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-teal-mid">RISK NOW</h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          alarm ≥ {RISK_THRESHOLD}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4">
        <svg viewBox="0 0 160 140" className="h-[128px] w-[146px] shrink-0" aria-hidden>
          <path
            d={arc(0, 1)}
            fill="none"
            stroke="rgba(0,194,188,0.12)"
            strokeWidth={12}
            strokeLinecap="round"
          />
          <path d={arc(0, 0.2)} fill="none" stroke="rgba(0,255,235,0.25)" strokeWidth={3} />
          <path d={arc(0.2, 0.5)} fill="none" stroke="rgba(255,210,63,0.35)" strokeWidth={3} />
          <path d={arc(0.5, 1)} fill="none" stroke="rgba(255,77,109,0.45)" strokeWidth={3} />
          {v > 0.002 && (
            <>
              <path
                d={arc(0, Math.min(1, v))}
                fill="none"
                stroke={color}
                strokeOpacity={0.2}
                strokeWidth={20}
                strokeLinecap="round"
              />
              <path
                d={arc(0, Math.min(1, v))}
                fill="none"
                stroke={color}
                strokeWidth={12}
                strokeLinecap="round"
              />
            </>
          )}
          <text
            x={80}
            y={86}
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="var(--font-mono)"
            fontSize={28}
          >
            {v.toFixed(2)}
          </text>
          <text
            x={80}
            y={106}
            textAnchor="middle"
            fill={color}
            fontFamily="var(--font-mono)"
            fontSize={11}
            letterSpacing="0.18em"
          >
            {state}
          </text>
        </svg>
        <dl className="min-w-0 space-y-2 font-mono text-[11px]">
          {(["CALM", "ELEVATED", "ALARM"] as const).map((s) => (
            <div
              key={s}
              className={cn(
                "flex items-center gap-2 transition-opacity",
                s === state ? "opacity-100" : "opacity-40",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: RISK_STATE_COLOR[s] }} />
              <dt className="text-foreground">{s.toLowerCase()}</dt>
              <dd className="text-muted-foreground">
                {s === "CALM" ? "< 0.2" : s === "ELEVATED" ? "0.2–0.5" : "≥ 0.5"}
              </dd>
            </div>
          ))}
          <p className="pt-1 text-[10px] leading-snug text-muted-foreground">
            causal: uses past frames only
          </p>
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export const LiveFeed = memo(function LiveFeed({
  store,
  model,
  flash,
}: {
  store: PlayerStore;
  model: Model;
  flash: number;
}) {
  const select = useCallback(
    (t: number) => {
      const started = startedCount(model.starts, t);
      const next = model.starts[started];
      const nextIn = next === undefined ? -1 : Math.ceil(next - t);
      return `${started}|${activeKey(model.events, t)}|${nextIn}`;
    },
    [model],
  );
  const key = useTimeSelector(store, select);
  const [startedStr, activeStr, nextStr] = key.split("|");
  const started = Number(startedStr);
  const active = new Set(activeStr ? activeStr.split(",").map(Number) : []);
  const nextIn = Number(nextStr);
  const items = model.events
    .slice(0, started)
    .map((e, i) => ({ e, i }))
    .reverse();

  return (
    <section
      className="glass-flat relative flex min-h-0 flex-col p-4 sm:p-5"
      aria-label="Live event feed"
    >
      <Flash n={flash} />
      <div className="flex items-center justify-between gap-2">
        <h3 className="mono-label flex items-center gap-2 text-teal-mid">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#ff4d6d]"
            style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }}
            aria-hidden
          />
          LIVE EVENT FEED
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground" aria-live="polite">
          {nextIn >= 0 ? `next event in ${nextIn}s` : "no more events"}
        </span>
      </div>

      <ol className="scrollbar-thin-teal mt-3 max-h-[300px] min-h-[120px] space-y-2 overflow-y-auto pr-1 xl:max-h-[340px]">
        {items.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-4 text-center font-mono text-[11px] text-muted-foreground">
            No events yet. Press play or jump to the next event (K).
          </li>
        )}
        {items.map(({ e, i }) => {
          const color = EVENT_CLASS_COLORS[e[2]];
          const on = active.has(i);
          return (
            <li
              key={i}
              className={cn(
                "feed-in flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                on ? "bg-[rgba(0,194,188,0.08)]" : "border-border",
              )}
              style={on ? { borderColor: color } : undefined}
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                {on && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ background: color, animation: "pulse-dot 1.1s ease-in-out infinite" }}
                  />
                )}
                <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium" style={{ color }}>
                  {EVENT_CLASS_LABELS[e[2]]}
                  {on && <span className="ml-2 font-mono text-[9px] text-foreground">ACTIVE</span>}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {formatTime(e[0])} · {(e[1] - e[0]).toFixed(1)} s
                </p>
              </div>
              <button
                type="button"
                onClick={() => store.seek(e[0])}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-teal-mid hover:text-foreground"
                aria-label={`Jump to ${EVENT_CLASS_LABELS[e[2]]} at ${formatTime(e[0])}`}
              >
                <CornerDownRight className="h-3 w-3" /> jump
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
});

/* ------------------------------------------------------------------ */

export const ClassMix = memo(function ClassMix({ model }: { model: Model }) {
  const max = Math.max(1, ...model.counts.map((c) => c[1]));
  return (
    <section className="glass-flat p-4 sm:p-5" aria-label="Class mix">
      <div className="flex items-center justify-between">
        <h3 className="mono-label text-teal-mid">CLASS MIX</h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {model.events.length} events
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {model.counts.length === 0 && (
          <li className="font-mono text-[11px] text-muted-foreground">no events detected</li>
        )}
        {model.counts.map(([cls, n]) => (
          <li key={cls} className="grid grid-cols-[104px_1fr_24px] items-center gap-2">
            <span className="truncate font-mono text-[10px] text-[var(--body)]">{cls}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[rgba(0,194,188,0.08)]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(n / max) * 100}%`, background: EVENT_CLASS_COLORS[cls] }}
              />
            </span>
            <span className="text-right font-mono text-[11px] text-foreground">{n}</span>
          </li>
        ))}
      </ul>
    </section>
  );
});
