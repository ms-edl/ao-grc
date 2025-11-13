import React from 'react';

interface ChartDotProps {
  cx: number;
  cy: number;
  value: any;
  index: number;
  color: string;
  opacity: number;
  chartData: any[];
  dataKey: string;
  /** Whether to show boundary markers for segment start/end */
  showBoundaryMarkers?: boolean;
}

export function ChartDot({
  cx,
  cy,
  value,
  index,
  color,
  opacity,
  chartData,
  dataKey,
  showBoundaryMarkers = true,
}: ChartDotProps) {
  if (value == null || Number.isNaN(value)) return <g />;

  if (!showBoundaryMarkers) {
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={1.5} 
        fill={color}
        opacity={opacity}
      />
    );
  }

  // Check if this is a boundary point
  const prevRow = chartData[index - 1] as any | undefined;
  const nextRow = chartData[index + 1] as any | undefined;
  
  const hasPrev = prevRow && typeof prevRow[dataKey] === "number" && !Number.isNaN(prevRow[dataKey]);
  const hasNext = nextRow && typeof nextRow[dataKey] === "number" && !Number.isNaN(nextRow[dataKey]);
  
  // Boundary markers for:
  // 1. First point of the series (index === 0)
  // 2. Last point of the series (index === chartData.length - 1)
  // 3. Start of a segment (gap before this point)
  // 4. End of a segment (gap after this point)
  // 5. Single isolated point
  const isFirstPoint = index === 0;
  const isLastPoint = index === chartData.length - 1;
  const isStart = !hasPrev && index > 0;
  const isEnd = !hasNext && index < chartData.length - 1;
  const isSinglePoint = !hasPrev && !hasNext;
  const isBoundary = isFirstPoint || isLastPoint || isStart || isEnd || isSinglePoint;
  
  return (
    <g>
      {/* Regular data point dot */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={1.5} 
        fill={color}
        opacity={opacity}
      />
      {/* Boundary marker if needed */}
      {isBoundary && (
        <g style={{ opacity }}>
          <circle cx={cx} cy={cy} r={3} fill="rgb(var(--surface-tile))" stroke={color} strokeWidth={1.5} />
          {!isSinglePoint && <line x1={cx} y1={cy - 4.5} x2={cx} y2={cy + 4.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />}
          {isSinglePoint && <circle cx={cx} cy={cy} r={1.5} fill={color} />}
        </g>
      )}
    </g>
  );
}

// Factory function to create dot renderer for Recharts
export function createDotRenderer(
  color: string,
  isHighlighted: boolean,
  chartData: any[],
  showBoundaryMarkers: boolean = true
) {
  return (props: any) => {
    const { cx, cy, value, index, dataKey } = props;
    const opacity = isHighlighted ? 1 : 0.1;
    
    return (
      <ChartDot
        cx={cx}
        cy={cy}
        value={value}
        index={index}
        color={color}
        opacity={opacity}
        chartData={chartData}
        dataKey={dataKey}
        showBoundaryMarkers={showBoundaryMarkers}
      />
    );
  };
}

