import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Reveal } from "@/components/site/Reveal";

const crossings = [
  { phase: "0–4 s (red)", count: 3.8 },
  { phase: "50–66 s (green)", count: 21.4 },
];

const objects = Array.from({ length: 18 }, (_, i) => ({
  minute: i + 1,
  vehicles: 120 + Math.round(Math.sin(i / 2.4) * 28 + (i % 3) * 7),
  pedestrians: 24 + Math.round(Math.cos(i / 3.1) * 9 + (i % 4) * 2),
}));

const axis = {
  stroke: "rgba(146,165,164,0.5)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  background: "#031818",
  border: "1px solid rgba(0,194,188,0.3)",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  color: "#fff",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="glass hover-lift flex h-full flex-col p-6">
      <h3 className="mono-label text-teal-mid">{title}</h3>
      <div className="mt-4 h-[220px] flex-1">{children}</div>
    </article>
  );
}

export default function EdaCharts() {
  return (
    <>
      <Reveal delay={0.04}>
        <Card title="STOP-LINE CROSSINGS PER MINUTE">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={crossings} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
              <XAxis dataKey="phase" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,194,188,0.08)" }} />
              <Bar dataKey="count" fill="#00c2bc" radius={[6, 6, 0, 0]} maxBarSize={72} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Reveal>

      <Reveal delay={0.08}>
        <Card title="OBJECTS OVER TIME">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={objects} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="rgba(0,194,188,0.1)" vertical={false} />
              <XAxis dataKey="minute" tick={axis} tickLine={false} axisLine={false} />
              <YAxis tick={axis} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="vehicles"
                stroke="#00ffeb"
                strokeWidth={2}
                dot={false}
                name="vehicles / min"
              />
              <Line
                type="monotone"
                dataKey="pedestrians"
                stroke="#c77dff"
                strokeWidth={2}
                dot={false}
                name="pedestrians / min"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Reveal>
    </>
  );
}
