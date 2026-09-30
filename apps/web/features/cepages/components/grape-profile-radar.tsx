import type { GrapeRadarValues } from "../lib/grape-radar";
import { radarAxesForChart } from "../lib/grape-radar";

const MAX = 8;
const AXIS_COUNT = 5;

type GrapeProfileRadarProps = {
  values: GrapeRadarValues;
  labels: {
    acidity: string;
    body: string;
    aromaticIntensity: string;
    tannins: string;
    alcoholPotential: string;
  };
  title: string;
};

function polar(cx: number, cy: number, radius: number, index: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXIS_COUNT;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  scales: number[],
): string {
  return scales
    .map((scale, i) => {
      const p = polar(cx, cy, radius * scale, i);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

/** Free 5-axis radar for Profil du cépage (scale 0–8). */
export function GrapeProfileRadar({
  values,
  labels,
  title,
}: GrapeProfileRadarProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const chartR = 88;
  const labelR = 118;
  const axisLabels = [
    labels.acidity,
    labels.body,
    labels.aromaticIntensity,
    labels.tannins,
    labels.alcoholPotential,
  ];
  const data = radarAxesForChart(values);
  const dataScales = data.map((v) => v / MAX);
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 md:p-5"
      aria-label={title}
    >
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-3 flex justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full max-w-[20rem]"
          role="img"
          aria-label={title}
        >
          {rings.map((ring) => (
            <polygon
              key={ring}
              points={polygonPoints(
                cx,
                cy,
                chartR,
                Array.from({ length: AXIS_COUNT }, () => ring),
              )}
              fill="none"
              className="stroke-border"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: AXIS_COUNT }, (_, i) => {
            const tip = polar(cx, cy, chartR, i);
            return (
              <line
                key={`axis-${i}`}
                x1={cx}
                y1={cy}
                x2={tip.x}
                y2={tip.y}
                className="stroke-border"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={polygonPoints(cx, cy, chartR, dataScales)}
            className="fill-wine/20 stroke-wine"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {dataScales.map((scale, i) => {
            const p = polar(cx, cy, chartR * scale, i);
            return (
              <circle
                key={`dot-${i}`}
                cx={p.x}
                cy={p.y}
                r={3.5}
                className="fill-wine"
              />
            );
          })}
          {axisLabels.map((label, i) => {
            const p = polar(cx, cy, labelR, i);
            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[11px]"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
      <ul className="sr-only">
        {axisLabels.map((label, i) => (
          <li key={label}>
            {label}: {data[i]} / {MAX}
          </li>
        ))}
      </ul>
    </section>
  );
}
