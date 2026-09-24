import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RISK_THRESHOLD } from "@/config";
import { formatTime } from "@/lib/event-classes";
import type { RiskPoint } from "@/types";

export function RiskChart({
  risk,
  currentTime,
  onSeek,
}: {
  risk: RiskPoint[];
  currentTime: number;
  onSeek: (t: number) => void;
}) {
  const data = useMemo(() => {
    const step = Math.max(1, Math.floor(risk.length / 900));
    return risk
      .filter((_, i) => i % step === 0)
      .map(([t, v]) => ({ t, v, alarm: v >= RISK_THRESHOLD ? v : null }));
  }, [risk]);

  const alarms = useMemo(() => {
    let count = 0;
    let inside = false;
    for (const [, v] of risk) {
      if (v >= RISK_THRESHOLD && !inside) {
        count++;
        inside = true;
      } else if (v < RISK_THRESHOLD) inside = false;
    }
    return count;
  }, [risk]);

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="mono-label text-teal-mid">ACCIDENT RISK // PART B</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          threshold {RISK_THRESHOLD} · {alarms} alarm{alarms === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-5 h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 6, right: 8, bottom: 0, left: -22 }}
            onClick={(state) => {
              const t = (state?.activePayload?.[0]?.payload as { t: number } | undefined)?.t;
              if (typeof t === "number") onSeek(t);
            }}
          >
            <defs>
              <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ffeb" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00ffeb" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="alarmFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff4d6d" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#ff4d6d" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatTime(v)}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fill: "rgba(146,165,164,0.9)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#031818",
                border: "1px solid rgba(0,194,188,0.3)",
                borderRadius: 12,
                fontSize: 12,
                color: "#fff",
              }}
              labelFormatter={(v: number) => formatTime(v)}
              formatter={(v: number) => [v.toFixed(2), "risk"]}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="#00ffeb"
              strokeWidth={1.5}
              fill="url(#riskFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="alarm"
              stroke="#ff4d6d"
              strokeWidth={1.5}
              fill="url(#alarmFill)"
              connectNulls={false}
              isAnimationActive={false}
            />
            <ReferenceLine
              y={RISK_THRESHOLD}
              stroke="#ff8c42"
              strokeDasharray="6 6"
              label={{ value: "alarm", fill: "#ff8c42", fontSize: 10, position: "insideTopRight" }}
            />
            <ReferenceLine x={currentTime} stroke="#00ffeb" strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
