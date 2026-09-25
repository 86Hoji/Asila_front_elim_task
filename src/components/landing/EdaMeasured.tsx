import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DENSITY, PER_MINUTE } from "@/data/eda";
import { cn } from "@/lib/utils";

const axis = { fill: "rgba(146,165,164,0.9)", fontSize: 10, fontFamily: "var(--font-mono)" };
const tooltipStyle = {
  background: "#031818",
  border: "1px solid rgba(0,194,188,0.3)",
  borderRadius: 12,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "#fff",
};

function Toggle<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-1 rounded-full border border-border p-0.5"
      role="group"
      aria-label={label}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={cn(
            "rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors",
            value === o.id ? "bg-accent text-teal" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Vehicles and pedestrians per minute, one video at a time. */
export function ObjectsPerMinute() {
  const [video, setVideo] = useState(PER_MINUTE[0]!.id);
  const series = PER_MINUTE.find((v) => v.id === video) ?? PER_MINUTE[0]!;
  return (
    <div className="flex h-full flex-col">
      <Toggle
        label="Video"
        value={video}
        onChange={setVideo}
        options={PER_MINUTE.map((v) => ({ id: v.id, label: v.id }))}
      />
      <div className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series.rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} />
            <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(m: string) => `minute ${m}`} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
            <Line
              type="monotone"
              dataKey="vehicles"
              name="vehicles / min"
              stroke="#00ffeb"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="pedestrians"
              name="pedestrians / min"
              stroke="#c77dff"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-[var(--body)]">
        Measured from our tracks on all 4 sample videos. The last minute of each video is partial.
      </p>
    </div>
  );
}

type Kind = "vehicles" | "pedestrians";
const RAMP: Record<Kind, [number, number]> = { vehicles: [176, 60], pedestrians: [285, 330] };

/** Track-point density on a log colour scale, over the scene map. */
export function WhereTrafficGoes() {
  const [kind, setKind] = useState<Kind>("vehicles");
  const { cols, rows } = DENSITY.grid;
  const cells = useMemo(() => {
    const grid = DENSITY[kind];
    const max = Math.max(1, ...grid.flat());
    const lmax = Math.log1p(max);
    const out: Array<{ x: number; y: number; u: number; v: number }> = [];
    grid.forEach((row, y) =>
      row.forEach((v, x) => {
        if (v > 0) out.push({ x, y, u: Math.log1p(v) / lmax, v });
      }),
    );
    return { out, max };
  }, [kind]);
  const [h0, h1] = RAMP[kind];

  return (
    <div className="flex h-full flex-col">
      <Toggle
        label="Road users"
        value={kind}
        onChange={setKind}
        options={[
          { id: "vehicles", label: "Vehicles" },
          { id: "pedestrians", label: "Pedestrians" },
        ]}
      />
      <div className="relative mt-4 overflow-hidden rounded-xl border border-border">
        <img
          src="/eda/scene_map_dark.jpg"
          alt=""
          className="block h-auto w-full opacity-45"
          aria-hidden
        />
        <svg
          viewBox={`0 0 ${cols} ${rows}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Heatmap of ${kind} track points over the scene map, log colour scale`}
        >
          {cells.out.map((c) => (
            <rect
              key={`${c.x}-${c.y}`}
              x={c.x}
              y={c.y}
              width={1}
              height={1}
              fill={`hsl(${Math.round(h0 + (h1 - h0) * c.u)} 95% ${Math.round(38 + c.u * 30)}%)`}
              fillOpacity={0.25 + c.u * 0.65}
            >
              <title>{`${c.v.toLocaleString("en-US")} track points`}</title>
            </rect>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
        <span>1</span>
        <span
          className="h-2 flex-1 rounded-full"
          style={{
            background: `linear-gradient(90deg, hsl(${h0} 95% 38% / 0.3), hsl(${h1} 95% 68%))`,
          }}
          aria-hidden
        />
        <span>{cells.max.toLocaleString("en-US")} points / cell (log scale)</span>
      </div>
      <p className="mt-3 text-sm text-[var(--body)]">
        Where road users actually move: track points per cell on a {cols}×{rows} grid, measured from
        our tracks on all 4 sample videos.
      </p>
    </div>
  );
}
