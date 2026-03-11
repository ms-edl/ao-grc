import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  XAxis,
  ResponsiveContainer,
} from 'recharts';
import { useTimeAxis } from '../TimeAxis';
import { useSharedAxisWidths } from './context/SharedAxisWidthContext';
import { useSyncedChart, findClosestTimestampIndex } from '../SyncedChartContext';

interface SharedTimeAxisProps {
  data: any[];
  xKey: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Global time axis rendered below the brush in the drawer footer.
 * Uses a minimal Recharts LineChart with only an XAxis to guarantee
 * pixel-perfect alignment with the chart plot areas above.
 *
 * Reads sharedLeftAxisWidth / sharedRightAxisWidth from context
 * and applies them as left/right margins so tick positions match
 * the charts' plot area boundaries.
 */
export function SharedTimeAxis({ data, xKey, startIndex, endIndex }: SharedTimeAxisProps) {
  const { sharedLeftAxisWidth, sharedRightAxisWidth } = useSharedAxisWidths();
  const syncContext = useSyncedChart();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const axisVerticalPadding = 16; // Matches .drawer-footer-axis vertical padding

  const slicedData = useMemo(
    () => data.slice(startIndex, endIndex + 1),
    [data, startIndex, endIndex],
  );

  const { ticks: xTicks, renderTick } = useTimeAxis({
    data: slicedData,
    xKey,
    startIndex: 0,
    endIndex: slicedData.length - 1,
  });

  const hoveredIndex = useMemo(() => {
    const syncedTimestamp = syncContext?.syncedTimestamp ?? null;
    if (!syncedTimestamp || !slicedData.length) return null;

    const closestIndex = findClosestTimestampIndex(slicedData as Array<{ x: string }>, syncedTimestamp);
    if (closestIndex < 0) return null;

    return closestIndex;
  }, [syncContext?.syncedTimestamp, slicedData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;

    const updateWidth = () => setContainerWidth(el.clientWidth);
    updateWidth();

    const RO = (window as any).ResizeObserver;
    if (RO) {
      const resizeObserver = new RO(() => updateWidth());
      resizeObserver.observe(el);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const markerLeftPx = useMemo(() => {
    if (hoveredIndex == null || slicedData.length <= 1 || containerWidth <= 0) return null;

    const plotWidth = containerWidth - sharedLeftAxisWidth - sharedRightAxisWidth;
    if (plotWidth <= 0) return null;

    const ratio = hoveredIndex / (slicedData.length - 1);
    return sharedLeftAxisWidth + ratio * plotWidth;
  }, [hoveredIndex, slicedData.length, containerWidth, sharedLeftAxisWidth, sharedRightAxisWidth]);

  const handleAxisMouseMove = useCallback((state: any) => {
    if (!syncContext || !slicedData.length) return;
    if (state && state.activeTooltipIndex !== undefined && slicedData[state.activeTooltipIndex]) {
      const timestamp = (slicedData[state.activeTooltipIndex] as any)?.[xKey];
      if (timestamp != null) {
        syncContext.setSyncedTimestamp(String(timestamp));
      }
    }
  }, [syncContext, slicedData, xKey]);

  const handleMouseLeave = useCallback(() => {
    syncContext?.setSyncedTimestamp(null);
  }, [syncContext]);

  if (!slicedData.length) return null;

  return (
    <div
      ref={containerRef}
      onMouseLeave={handleMouseLeave}
      style={{ width: '100%', height: 10, overflow: 'visible', position: 'relative' }}
    >
      {markerLeftPx != null && (
        <div
          style={{
            position: 'absolute',
            top: -axisVerticalPadding,
            bottom: -axisVerticalPadding,
            left: markerLeftPx,
            width: 1,
            background: 'rgb(var(--surface-accent-purple))',
            transform: 'translateX(-0.5px)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={slicedData}
          margin={{ top: 0, right: sharedRightAxisWidth, left: sharedLeftAxisWidth, bottom: 0 }}
          syncId="tooltipSync"
          syncMethod="index"
          onMouseMove={handleAxisMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <XAxis
            dataKey={xKey}
            tickMargin={8}
            axisLine={false}
            tickLine={false}
            interval={0}
            ticks={xTicks as any}
            tick={renderTick as any}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
