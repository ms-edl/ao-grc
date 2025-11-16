import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useTimeAxis, toDate } from './TimeAxis';

interface SharedStickyXAxisProps {
  data: any[];
  xKey: string;
  startIndex: number;
  endIndex: number;
  marginLeft: number;   // Y-axis width from left
  marginRight: number;  // Label spacing from right
}

/**
 * SharedStickyXAxis - A sticky x-axis component that stays visible at the bottom
 * of the drawer while scrolling through multiple charts.
 * 
 * Uses the same time formatting and tick generation as individual charts
 * for consistency. Respects margins to align with chart plot areas.
 */
export const SharedStickyXAxis: React.FC<SharedStickyXAxisProps> = ({
  data,
  xKey,
  startIndex,
  endIndex,
  marginLeft,
  marginRight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Use the same time axis hook as charts
  const { ticks, dayTicks } = useTimeAxis({
    data,
    xKey,
    startIndex,
    endIndex,
  });

  // Track container width for responsive positioning
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate tick positions
  const tickPositions = useMemo(() => {
    if (!data.length || !containerWidth) return [];

    const slicedData = data.slice(startIndex, endIndex + 1);
    const plotWidth = containerWidth - marginLeft - marginRight;

    return ticks.map(tickValue => {
      // Find the index of this tick in the sliced data
      const tickIndex = slicedData.findIndex((row: any) => String(row[xKey]) === tickValue);
      if (tickIndex === -1) return null;

      // Calculate x position within the plot area
      const ratio = slicedData.length > 1 ? tickIndex / (slicedData.length - 1) : 0;
      const x = marginLeft + ratio * plotWidth;

      const date = toDate(tickValue);
      const isDay = dayTicks.has(tickValue) || (date && date.getUTCHours() === 0);
      const label = date
        ? isDay
          ? date.toLocaleDateString(undefined, { timeZone: "UTC", day: "2-digit", month: "short" })
          : `${date.toLocaleTimeString(undefined, { timeZone: "UTC", hour: "2-digit", hour12: false }).split(":")[0]}:00`
        : String(tickValue);

      return { x, label, isDay };
    }).filter(Boolean) as Array<{ x: number; label: string; isDay: boolean }>;
  }, [data, ticks, dayTicks, xKey, startIndex, endIndex, containerWidth, marginLeft, marginRight]);

  if (!data.length) return null;

  return (
    <div 
      ref={containerRef}
      className="w-full"
      style={{ 
        height: '40px',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        {/* Horizontal axis line */}
        <line
          x1={marginLeft}
          y1={0}
          x2={containerWidth - marginRight}
          y2={0}
          stroke="rgb(var(--border-border-flat))"
          strokeWidth={1}
        />

        {/* Tick marks and labels */}
        {tickPositions.map((tick, i) => (
          <g key={i}>
            {/* Tick mark */}
            <line
              x1={tick.x}
              y1={0}
              x2={tick.x}
              y2={4}
              stroke="rgb(var(--border-border-flat))"
              strokeWidth={1}
            />
            
            {/* Tick label */}
            <text
              x={tick.x}
              y={20}
              textAnchor="middle"
              style={{ 
                fontSize: 10,
                userSelect: 'none',
              }}
              fill={tick.isDay ? "rgb(var(--content-primary))" : "rgb(var(--content-tertiary))"}
              fontWeight={tick.isDay ? "600" : "400"}
            >
              {tick.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

