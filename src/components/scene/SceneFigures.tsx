import { memo } from "react";
import {
  FAR,
  FAR_CROSSING,
  JUNCTION_RECT,
  MEDIAN,
  MEDIAN_GAP,
  MOUTH,
  NEAR,
  NEAR_CROSSING,
  SIDE_DIR,
  SIDE_HALF_W,
  SIDE_NORMAL,
  SIGNALS,
  STOP_LINE_X,
  JUNCTION_X,
  VIEW,
  sidePoint,
  SCENE_COLORS,
  headingHue,
} from "./geometry";
import { SceneBase } from "./SceneBase";

/** `m` is where the numbered marker sits on phones, where the pills are too small to read. */
type Label = {
  text: string;
  x: number;
  y: number;
  m: { x: number; y: number };
  to?: { x: number; y: number };
};

const sideLabel = sidePoint(300, 0);

const LABELS: Label[] = [
  { text: "FAR CARRIAGEWAY  ←", x: 120, y: 58, m: { x: 120, y: 150 } },
  { text: "NEAR CARRIAGEWAY  →", x: 110, y: 392, m: { x: 120, y: 300 } },
  {
    text: "RAISED MEDIAN · SOLID LINE",
    x: 250,
    y: (MEDIAN.top + MEDIAN.bottom) / 2,
    m: { x: 250, y: 225 },
  },
  {
    text: "CROSSING",
    x: FAR_CROSSING.x + FAR_CROSSING.w / 2,
    y: 58,
    m: { x: FAR_CROSSING.x + 18, y: 150 },
    to: { x: FAR_CROSSING.x + 18, y: FAR.top },
  },
  {
    text: "SIGNAL",
    x: 820,
    y: (MEDIAN.top + MEDIAN.bottom) / 2,
    m: { x: 780, y: 225 },
    to: { x: SIGNALS[1]!.x + 8, y: SIGNALS[1]!.y },
  },
  {
    text: "SIGNAL",
    x: 262,
    y: 424,
    m: { x: 318, y: 404 },
    to: { x: SIGNALS[0]!.x - 7, y: SIGNALS[0]!.y },
  },
  {
    text: "STOP LINE",
    x: 250,
    y: 458,
    m: { x: 332, y: 300 },
    to: { x: STOP_LINE_X, y: NEAR.bottom - 4 },
  },
  {
    text: "CROSSING",
    x: 244,
    y: 492,
    m: { x: 406, y: 300 },
    to: { x: NEAR_CROSSING.x + 18, y: NEAR.bottom - 4 },
  },
  { text: "JUNCTION", x: JUNCTION_X, y: NEAR.top + 30, m: { x: JUNCTION_X, y: 290 } },
  { text: "REFUGE ISLANDS", x: 760, y: 410, m: { x: 650, y: 420 }, to: { x: 646, y: 384 } },
  { text: "CROSSING", x: 590, y: 520, m: sidePoint(152, 0), to: sidePoint(152, SIDE_HALF_W - 6) },
  { text: "SIDE STREET · EXIT", x: sideLabel.x, y: sideLabel.y, m: sidePoint(300, 0) },
];

function Marker({ label, n }: { label: Label; n: number }) {
  return (
    <g className="sm:hidden">
      <circle
        cx={label.m.x}
        cy={label.m.y}
        r={27}
        fill="rgba(1,9,9,0.92)"
        stroke="#00ffeb"
        strokeWidth={2}
      />
      <text
        x={label.m.x}
        y={label.m.y + 10}
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="var(--font-mono)"
        fontSize={28}
        fontWeight={700}
      >
        {n}
      </text>
    </g>
  );
}

function Pill({ label }: { label: Label }) {
  const w = label.text.length * 7.4 + 18;
  return (
    <g className="hidden sm:inline">
      {label.to && (
        <g>
          <line
            x1={label.x}
            y1={label.y}
            x2={label.to.x}
            y2={label.to.y}
            stroke="rgba(0,255,235,0.55)"
            strokeWidth={1}
          />
          <circle cx={label.to.x} cy={label.to.y} r={3} fill="#00ffeb" />
        </g>
      )}
      <rect
        x={label.x - w / 2}
        y={label.y - 11}
        width={w}
        height={22}
        rx={11}
        fill="rgba(1,9,9,0.9)"
        stroke="rgba(0,194,188,0.55)"
      />
      <text
        x={label.x}
        y={label.y + 4}
        textAnchor="middle"
        fill="#c2d3d2"
        fontFamily="var(--font-mono)"
        fontSize={11}
        letterSpacing="0.06em"
      >
        {label.text}
      </text>
    </g>
  );
}

/** Static, labelled scene map for the EDA section. Our own drawing, no footage. */
export const SceneMapFigure = memo(function SceneMapFigure() {
  return (
    <>
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        className="block h-auto w-full"
        role="img"
        aria-label="Scene map: a wide avenue with a raised median, far carriageway flowing left and near carriageway flowing right, a side street leaving to the bottom-left, three zebra crossings, a stop line, refuge islands, two signal heads and the junction area."
      >
        <SceneBase idPrefix="map" />
        <rect
          x={JUNCTION_RECT.x}
          y={JUNCTION_RECT.y}
          width={JUNCTION_RECT.w}
          height={JUNCTION_RECT.h}
          fill="rgba(0,255,235,0.05)"
          stroke="rgba(0,255,235,0.5)"
          strokeDasharray="6 6"
          rx={6}
        />
        {LABELS.map((l, i) => (
          <Pill key={i} label={l} />
        ))}
        {LABELS.map((l, i) => (
          <Marker key={i} label={l} n={i + 1} />
        ))}
      </svg>
      <ol className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border p-3 font-mono text-[10px] text-[var(--body)] sm:hidden">
        {LABELS.map((l, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-teal">{i + 1}</span>
            <span className="min-w-0">{l.text.replace(/s+/g, " ").toLowerCase()}</span>
          </li>
        ))}
      </ol>
    </>
  );
});

/* ------------------------------------------------------------------ */
/* Mean velocity field (schematic)                                     */
/* ------------------------------------------------------------------ */

const DEG = 180 / Math.PI;
/** Rounds for SVG output, so server and browser render identical markup. */
const f2 = (n: number) => Math.round(n * 100) / 100;

const SIDE_HEADING = f2(Math.atan2(SIDE_DIR.y, SIDE_DIR.x) * DEG);

function inSideStreet(x: number, y: number) {
  const dx = x - JUNCTION_X;
  const dy = y - NEAR.bottom;
  const along = dx * SIDE_DIR.x + dy * SIDE_DIR.y;
  const across = dx * SIDE_NORMAL.x + dy * SIDE_NORMAL.y;
  return along > 0 && Math.abs(across) < SIDE_HALF_W - 6;
}

/** Legal heading of the traffic flow at a point, or null off the carriageway. */
function headingAt(x: number, y: number): number | null {
  if (y > FAR.top + 6 && y < FAR.bottom - 4) {
    // Far traffic turning left through the median gap bends towards the side street.
    if (x > MEDIAN_GAP.left && x < MOUTH.right && y > FAR.bottom - 40) return 180 - 35;
    return 180;
  }
  if (y >= MEDIAN.top && y <= MEDIAN.bottom) {
    if (x > MEDIAN_GAP.left + 10 && x < MEDIAN_GAP.right - 10) return 180 - 60;
    return null;
  }
  if (y > NEAR.top + 4 && y < NEAR.bottom - 4) {
    if (x > MOUTH.left + 20 && x < MOUTH.right && y > NEAR.bottom - 40) return 110;
    return 0;
  }
  if (y >= NEAR.bottom && inSideStreet(x, y)) return SIDE_HEADING;
  return null;
}

const STEP = 26;
const FIELD = (() => {
  const cells: Array<{ x: number; y: number; h: number }> = [];
  for (let y = STEP / 2 + 64; y < VIEW.h; y += STEP) {
    for (let x = STEP / 2; x < VIEW.w; x += STEP) {
      const h = headingAt(x, y);
      if (h !== null) cells.push({ x, y, h });
    }
  }
  return cells;
})();

function ColorWheel({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const wedges = [];
  for (let a = 0; a < 360; a += 10) {
    const a0 = (a - 5) / DEG;
    const a1 = (a + 5.5) / DEG;
    wedges.push(
      <path
        key={a}
        d={`M${cx} ${cy} L${f2(cx + r * Math.cos(a0))} ${f2(cy + r * Math.sin(a0))} A${r} ${r} 0 0 1 ${f2(cx + r * Math.cos(a1))} ${f2(cy + r * Math.sin(a1))} Z`}
        fill={`hsl(${headingHue(a)} 90% 62%)`}
      />,
    );
  }
  return (
    <g>
      {wedges}
      <circle cx={cx} cy={cy} r={r * 0.45} fill={SCENE_COLORS.bg} />
      <text
        x={cx}
        y={cy - r - 8}
        textAnchor="middle"
        fill="#92a5a4"
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        HEADING
      </text>
      <text x={cx + r + 6} y={cy + 4} fill="#92a5a4" fontSize={10} fontFamily="var(--font-mono)">
        E
      </text>
      <text x={cx - r - 14} y={cy + 4} fill="#92a5a4" fontSize={10} fontFamily="var(--font-mono)">
        W
      </text>
    </g>
  );
}

/** Arrows along each lane's legal direction, coloured by heading. Schematic, no footage. */
export const VelocityFieldFigure = memo(function VelocityFieldFigure() {
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Schematic mean velocity field: small arrows follow each lane's direction, leftwards on the far carriageway, rightwards on the near carriageway and towards the bottom-left on the side street, coloured by heading."
    >
      <rect width={VIEW.w} height={VIEW.h} fill={SCENE_COLORS.bg} />
      <g stroke="rgba(0,194,188,0.18)" fill="none" strokeWidth={1}>
        <path
          d={`M0 ${FAR.top} H${VIEW.w} M0 ${NEAR.bottom} H${MOUTH.left} M${MOUTH.right} ${NEAR.bottom} H${VIEW.w}`}
        />
        <path
          d={`M${MOUTH.left} ${NEAR.bottom} L193 560 M${MOUTH.right} ${NEAR.bottom} L393 560`}
        />
        <path
          d={`M0 ${MEDIAN.top} H${MEDIAN_GAP.left} M${MEDIAN_GAP.right} ${MEDIAN.top} H${VIEW.w}`}
        />
        <path
          d={`M0 ${MEDIAN.bottom} H${MEDIAN_GAP.left} M${MEDIAN_GAP.right} ${MEDIAN.bottom} H${VIEW.w}`}
        />
      </g>
      {FIELD.map((c) => {
        const r = c.h / DEG;
        const len = 9;
        const x2 = f2(c.x + Math.cos(r) * len);
        const y2 = f2(c.y + Math.sin(r) * len);
        const x1 = f2(c.x - Math.cos(r) * len);
        const y1 = f2(c.y - Math.sin(r) * len);
        const color = `hsl(${headingHue(c.h)} 90% 62%)`;
        return (
          <g key={`${c.x}-${c.y}`} stroke={color} strokeWidth={1.6} strokeLinecap="round">
            <line x1={x1} y1={y1} x2={x2} y2={y2} />
            <path
              d={`M${x2} ${y2} L${f2(x2 - Math.cos(r - 0.5) * 5)} ${f2(y2 - Math.sin(r - 0.5) * 5)} M${x2} ${y2} L${f2(x2 - Math.cos(r + 0.5) * 5)} ${f2(y2 - Math.sin(r + 0.5) * 5)}`}
              fill="none"
            />
          </g>
        );
      })}
      <ColorWheel cx={920} cy={470} r={34} />
    </svg>
  );
});
