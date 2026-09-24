import { EVENT_CLASS_COLORS, EVENT_CLASS_LABELS } from "@/lib/event-classes";
import type { DetectedEvent, EventClass } from "@/types";

/** Fixed positions on the schematic where each class is visualised. */
const CLASS_POSITION: Record<EventClass, { x: number; y: number }> = {
  accident: { x: 400, y: 225 },
  near_miss: { x: 430, y: 200 },
  red_light: { x: 400, y: 150 },
  wrong_way: { x: 250, y: 260 },
  illegal_u_turn: { x: 470, y: 260 },
  stopped_vehicle: { x: 170, y: 195 },
  jaywalking: { x: 400, y: 330 },
  failure_to_yield: { x: 340, y: 205 },
  illegal_turn: { x: 470, y: 180 },
  solid_line_crossing: { x: 600, y: 195 },
  stop_line: { x: 400, y: 300 },
  congestion: { x: 640, y: 255 },
  road_obstacle: { x: 200, y: 265 },
  fire_smoke: { x: 620, y: 130 },
};

const LINE = "rgba(0,194,188,0.45)";
const DIM = "rgba(0,194,188,0.18)";

export function SceneSchematic({
  events,
  currentTime,
}: {
  events: DetectedEvent[];
  currentTime: number;
}) {
  const active = events.filter(([s, e]) => currentTime >= s && currentTime <= e);

  return (
    <svg
      viewBox="0 0 800 450"
      className="h-full w-full"
      role="img"
      aria-label="Schematic of the intersection with active events marked"
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={LINE} />
        </marker>
      </defs>

      <rect width="800" height="450" fill="#020e0e" />

      {/* Carriageway edges */}
      <g stroke={LINE} strokeWidth="1.5" fill="none">
        <path d="M0 150 H300 M500 150 H800" />
        <path d="M0 300 H300 M500 300 H800" />
        <path d="M300 0 V150 M300 300 V450" />
        <path d="M500 0 V150 M500 300 V450" />
      </g>

      {/* Lane dividers */}
      <g stroke={DIM} strokeWidth="1" strokeDasharray="10 10" fill="none">
        <path d="M0 187 H300 M500 187 H800" />
        <path d="M0 263 H300 M500 263 H800" />
        <path d="M337 0 V150 M337 300 V450" />
        <path d="M463 0 V150 M463 300 V450" />
      </g>

      {/* Centre lines */}
      <g stroke="rgba(0,194,188,0.6)" strokeWidth="1.5" fill="none">
        <path d="M0 225 H295 M505 225 H800" />
        <path d="M400 0 V145 M400 305 V450" />
      </g>

      {/* Stop lines */}
      <g stroke="rgba(0,255,235,0.7)" strokeWidth="3" fill="none">
        <path d="M290 152 V223" />
        <path d="M510 227 V298" />
        <path d="M302 290 H398" />
        <path d="M402 160 H498" />
      </g>

      {/* Zebra crossings */}
      <g stroke="rgba(194,211,210,0.35)" strokeWidth="4">
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <line x1={262 - i * 0} y1={0} x2={0} y2={0} opacity="0" />
            <line x1={250 - i * 0} y1={0} x2={0} y2={0} opacity="0" />
            <line x1={262} y1={158 + i * 18} x2={286} y2={158 + i * 18} />
            <line x1={514} y1={158 + i * 18} x2={538} y2={158 + i * 18} />
            <line x1={308 + i * 12} y1={116} x2={308 + i * 12} y2={140} />
            <line x1={308 + i * 12} y1={312} x2={308 + i * 12} y2={336} />
          </g>
        ))}
      </g>

      {/* Direction arrows */}
      <g stroke={LINE} strokeWidth="1.5" markerEnd="url(#arrow)" fill="none">
        <path d="M60 187 H120" />
        <path d="M740 263 H680" />
        <path d="M337 400 V340" />
        <path d="M463 50 V110" />
      </g>

      {/* Active event markers */}
      {active.map(([s, e, label], i) => {
        const pos = CLASS_POSITION[label];
        const color = EVENT_CLASS_COLORS[label];
        return (
          <g key={`${label}-${s}-${i}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="22"
              fill={color}
              opacity="0.18"
              style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }}
            />
            <circle cx={pos.x} cy={pos.y} r="7" fill={color} />
            <rect
              x={pos.x + 14}
              y={pos.y - 24}
              width={Math.max(96, EVENT_CLASS_LABELS[label].length * 8 + 18)}
              height="20"
              rx="4"
              fill="rgba(1,9,9,0.85)"
              stroke={color}
              strokeOpacity="0.5"
            />
            <text
              x={pos.x + 22}
              y={pos.y - 10}
              fill={color}
              fontFamily="var(--font-mono)"
              fontSize="11"
            >
              {label} · {(e - s).toFixed(1)}s
            </text>
          </g>
        );
      })}
    </svg>
  );
}
