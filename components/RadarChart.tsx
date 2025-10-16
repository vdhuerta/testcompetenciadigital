import React from 'react';

interface RadarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
  maxScore?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  width = 450,
  height = 350,
  maxScore = 5,
}) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const numSides = data.length;
  const angleSlice = (Math.PI * 2) / numSides;

  // Function to calculate point coordinates
  const getPoint = (value: number, index: number) => {
    const angle = angleSlice * index - Math.PI / 2; // Start from top
    const r = (value / maxScore) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    return `${x},${y}`;
  };

  // Data polygon points
  const dataPoints = data.map((d, i) => getPoint(d.value, i)).join(' ');

  // Grid levels (e.g., 4 levels for 25%, 50%, 75%, 100%)
  const gridLevels = 4;
  const gridPolygons = Array.from({ length: gridLevels }, (_, i) => {
    const level = (maxScore / gridLevels) * (i + 1);
    return data.map((_, j) => getPoint(level, j)).join(' ');
  });

  // Axes lines from center to edge
  const axes = data.map((_, i) => getPoint(maxScore, i));

  // Labels for each axis
  const labels = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const labelRadius = radius * 1.25; // Push labels further out
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { x, y, label: d.label };
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g>
        {/* Grid Polygons */}
        {gridPolygons.reverse().map((points, i) => (
          <polygon
            key={i}
            points={points}
            className="fill-slate-100 stroke-slate-200"
            strokeWidth="1"
          />
        ))}

        {/* Axes Lines */}
        {axes.map((point, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={Number(point.split(',')[0])}
            y2={Number(point.split(',')[1])}
            className="stroke-slate-200"
            strokeWidth="1"
          />
        ))}

        {/* Data Polygon */}
        <polygon
          points={dataPoints}
          className="fill-sky-500/30 stroke-sky-600"
          strokeWidth="2"
        />

        {/* Labels */}
        {labels.map((l, i) => {
            const parts = l.label.split(' ');
            return (
                <text
                    key={i}
                    x={l.x}
                    y={l.y}
                    textAnchor="middle"
                    className="font-semibold fill-slate-600"
                    style={{ fontSize: '11px' }}
                >
                    <tspan x={l.x} dy={parts.length > 1 ? "-0.5em" : "0.3em"}>{parts[0]}</tspan>
                    {parts[1] && <tspan x={l.x} dy="1.2em">{parts[1]}</tspan>}
                </text>
            );
        })}
      </g>
    </svg>
  );
};