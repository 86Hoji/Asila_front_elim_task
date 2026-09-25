import { memo } from "react";
import {
  FAR,
  FAR_CROSSING,
  FAR_LANES,
  MEDIAN,
  MEDIAN_GAP,
  MOUTH,
  NEAR,
  NEAR_CROSSING,
  NEAR_LANES,
  REFUGE_ISLANDS,
  SIDE_CROSSING,
  SIDE_HALF_W,
  SIDE_ROT,
  SIDE_STREET_POLY,
  SIGNALS,
  STOP_LINE_X,
  JUNCTION_X,
  VIEW,
  SCENE_COLORS,
} from "./geometry";

const ARROW = "M-12,-3 L3,-3 L3,-8 L13,0 L3,8 L3,3 L-12,3 Z";

function Arrow({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <path d={ARROW} transform={`translate(${x} ${y}) rotate(${rot})`} fill={SCENE_COLORS.arrow} />
  );
}

function Zebra({ x, y0, y1, w }: { x: number; y0: number; y1: number; w: number }) {
  const bars = [];
  for (let y = y0 + 4; y < y1 - 6; y += 14) {
    bars.push(<rect key={y} x={x} y={y} width={w} height={7} rx={1} />);
  }
  return <g fill={SCENE_COLORS.zebra}>{bars}</g>;
}

/** A signal head: a small housing with three lamps. Lamps are driven by the overlay layer. */
export function SignalHousing({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-6}
        y={-16}
        width={12}
        height={32}
        rx={4}
        fill="#010909"
        stroke={SCENE_COLORS.kerb}
      />
      {[-9, 0, 9].map((cy) => (
        <circle key={cy} cx={0} cy={cy} r={3} fill="rgba(146,165,164,0.25)" />
      ))}
    </g>
  );
}

/** The static road drawing. Memoised: it never changes after the first render. */
export const SceneBase = memo(function SceneBase({ idPrefix = "scene" }: { idPrefix?: string }) {
  const gridId = `${idPrefix}-grid`;
  const avenueBottom = NEAR.bottom;

  return (
    <g>
      <defs>
        <pattern id={gridId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 H0 V40" fill="none" stroke="rgba(0,194,188,0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={VIEW.w} height={VIEW.h} fill={SCENE_COLORS.bg} />
      <rect width={VIEW.w} height={VIEW.h} fill={`url(#${gridId})`} />

      {/* Carriageways */}
      <polygon points={SIDE_STREET_POLY} fill={SCENE_COLORS.road} />
      <rect
        x={0}
        y={FAR.top}
        width={VIEW.w}
        height={avenueBottom - FAR.top}
        fill={SCENE_COLORS.road}
      />

      {/* Kerbs */}
      <g stroke={SCENE_COLORS.kerb} strokeWidth={1.5} fill="none">
        <path d={`M0 ${FAR.top} H${VIEW.w}`} />
        <path d={`M0 ${avenueBottom} H${MOUTH.left} M${MOUTH.right} ${avenueBottom} H${VIEW.w}`} />
        <path
          d={`M${MOUTH.left} ${avenueBottom} L193 560 M${MOUTH.right} ${avenueBottom} L393 560`}
        />
      </g>

      {/* Raised median with a solid centre line, opened at the junction */}
      <g>
        {[
          [0, MEDIAN_GAP.left],
          [MEDIAN_GAP.right, VIEW.w],
        ].map(([a, b]) => (
          <g key={a}>
            <rect
              x={a! - (a === 0 ? 20 : 0)}
              y={MEDIAN.top + 3}
              width={b! - a! + (a === 0 || b === VIEW.w ? 20 : 0)}
              height={MEDIAN.bottom - MEDIAN.top - 6}
              rx={12}
              fill={SCENE_COLORS.island}
              stroke={SCENE_COLORS.kerb}
            />
            <path
              d={`M${a! + (a === 0 ? 0 : 12)} ${(MEDIAN.top + MEDIAN.bottom) / 2} H${b! - (b === VIEW.w ? 0 : 12)}`}
              stroke={SCENE_COLORS.solid}
              strokeWidth={1.5}
            />
          </g>
        ))}
      </g>

      {/* Lane dividers (dashed) */}
      <g stroke={SCENE_COLORS.lane} strokeWidth={1.2} strokeDasharray="14 12" fill="none">
        {[FAR_LANES[0]! + 20, FAR_LANES[1]! + 20].map((y) => (
          <path
            key={y}
            d={`M0 ${y} H${MOUTH.left - 10} M${FAR_CROSSING.x + FAR_CROSSING.w + 8} ${y} H${VIEW.w}`}
          />
        ))}
        {[NEAR_LANES[0]! + 20, NEAR_LANES[1]! + 20].map((y) => (
          <path key={y} d={`M0 ${y} H${STOP_LINE_X - 30} M${MOUTH.right + 10} ${y} H${VIEW.w}`} />
        ))}
        {/* Near approach: solid lane lines before the stop line */}
      </g>
      <g stroke={SCENE_COLORS.lane} strokeWidth={1.2} fill="none">
        {[NEAR_LANES[0]! + 20, NEAR_LANES[1]! + 20].map((y) => (
          <path key={y} d={`M${STOP_LINE_X - 30} ${y} H${STOP_LINE_X}`} />
        ))}
      </g>

      {/* Side street: lane divider, crossing and arrows in its own frame */}
      <g transform={`translate(${JUNCTION_X} ${NEAR.bottom}) rotate(${SIDE_ROT})`}>
        <path
          d={`M0 ${SIDE_CROSSING.y + SIDE_CROSSING.h + 10} V420`}
          stroke={SCENE_COLORS.lane}
          strokeWidth={1.2}
          strokeDasharray="14 12"
        />
        <g fill={SCENE_COLORS.zebra}>
          {Array.from({ length: 8 }, (_, i) => -SIDE_HALF_W + 4 + i * 15).map((x) => (
            <rect key={x} x={x} y={SIDE_CROSSING.y} width={7} height={SIDE_CROSSING.h} rx={1} />
          ))}
        </g>
        <Arrow x={-30} y={240} rot={90} />
        <Arrow x={30} y={240} rot={90} />
      </g>

      {/* Zebra crossings on the avenue */}
      <Zebra x={NEAR_CROSSING.x} y0={NEAR.top} y1={NEAR.bottom} w={NEAR_CROSSING.w} />
      <Zebra x={FAR_CROSSING.x} y0={FAR.top} y1={FAR.bottom} w={FAR_CROSSING.w} />

      {/* Stop line on the near approach */}
      <path
        d={`M${STOP_LINE_X} ${NEAR.top + 2} V${NEAR.bottom - 2}`}
        stroke={SCENE_COLORS.stop}
        strokeWidth={4}
      />

      {/* Refuge islands at the junction mouth */}
      <g fill={SCENE_COLORS.island} stroke={SCENE_COLORS.kerb}>
        {REFUGE_ISLANDS.map((p) => (
          <polygon key={p} points={p} strokeLinejoin="round" />
        ))}
      </g>

      {/* Lane arrows */}
      {FAR_LANES.map((y) => (
        <g key={y}>
          <Arrow x={880} y={y} rot={180} />
          <Arrow x={220} y={y} rot={180} />
        </g>
      ))}
      {NEAR_LANES.map((y) => (
        <g key={y}>
          <Arrow x={140} y={y} rot={0} />
          <Arrow x={860} y={y} rot={0} />
        </g>
      ))}

      {SIGNALS.map((s) => (
        <SignalHousing key={s.id} x={s.x} y={s.y} />
      ))}
    </g>
  );
});
