import { EDA } from "@/config";

const { red, green } = EDA.stopLineCrossingsPerMin;
const AXIS_MAX = 70;
const TICKS = [0, 20, 40, 60];

const ROWS = [
  { phase: "Red phase", range: red, color: "#ff4d6d" },
  { phase: "Green phase", range: green, color: "#00ffeb" },
];

/** Range bars: each bar spans the observed min → max crossings per minute. */
export function StopLineChart() {
  return (
    <div className="flex h-full flex-col">
      <div
        role="img"
        aria-label={`Stop-line crossings per minute: red phase ${red[0]} to ${red[1]}, green phase ${green[0]} to ${green[1]}.`}
        className="space-y-6"
      >
        {ROWS.map((r) => {
          const left = (r.range[0] / AXIS_MAX) * 100;
          const width = Math.max(1.5, ((r.range[1] - r.range[0]) / AXIS_MAX) * 100);
          return (
            <div key={r.phase}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-foreground">{r.phase}</span>
                <span className="font-mono text-sm" style={{ color: r.color }}>
                  {r.range[0]}–{r.range[1]} / min
                </span>
              </div>
              <div className="relative mt-2 h-7 rounded-full bg-[rgba(0,194,188,0.07)]">
                {TICKS.map((t) => (
                  <span
                    key={t}
                    className="absolute inset-y-0 w-px bg-[rgba(0,194,188,0.15)]"
                    style={{ left: `${(t / AXIS_MAX) * 100}%` }}
                    aria-hidden
                  />
                ))}
                <span
                  className="absolute inset-y-1 rounded-full border"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: `color-mix(in oklab, ${r.color} 45%, transparent)`,
                    borderColor: r.color,
                  }}
                />
              </div>
            </div>
          );
        })}
        <div className="relative h-4 font-mono text-[10px] text-muted-foreground" aria-hidden>
          {TICKS.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 first:translate-x-0"
              style={{ left: `${(t / AXIS_MAX) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--body)]">
        Vehicles crossing the stop line per minute, min to max. On red the rate drops to a handful,
        so a crossing on red stands out clearly.
      </p>
    </div>
  );
}
