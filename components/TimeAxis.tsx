import { useCallback, useMemo } from 'react';
import { useSharedTimeDomain, TimeDomain } from './charts/context/SharedTimeDomainContext';

// Utility to convert various formats to Date
export const toDate = (v: any): Date | null => {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
};

interface TimeAxisConfig {
  data: any[];
  xKey: string;
  startIndex?: number;
  endIndex?: number;
}

interface TimeAxisResult {
  ticks: string[];
  dayTicks: Set<string>;
  renderTick: (props: any) => JSX.Element | null;
}

/**
 * useTimeAxis - Shared hook for time-based X-axis with smart tick generation
 * 
 * Generates intelligent tick marks based on the time range:
 * - Day labels (bold) at appropriate intervals
 * - Hour labels (regular) between days
 * - Adaptive density based on visible time range
 */
export function useTimeAxis({ data, xKey, startIndex = 0, endIndex }: TimeAxisConfig): TimeAxisResult {
  const sharedDomain = useSharedTimeDomain();

  const slicedData = useMemo(() => {
    const end = endIndex !== undefined ? endIndex : data.length - 1;
    return data.slice(startIndex, end + 1);
  }, [data, startIndex, endIndex]);

  const generateSmartTicks = useCallback((rows: any[], xKey: string, domainOverride?: TimeDomain) => {
    if (!rows.length) return { ticks: [] as string[], dayTicks: new Set<string>() };

    const firstDate = domainOverride?.start ?? toDate((rows[0] as any)[xKey]);
    const lastDate = domainOverride?.end ?? toDate((rows[rows.length - 1] as any)[xKey]);
    if (!firstDate || !lastDate) return { ticks: [] as string[], dayTicks: new Set<string>() };

    const hoursDiff = Math.abs((+lastDate - +firstDate) / (1000 * 60 * 60));
    const daysDiff = hoursDiff / 24;

    const ticks = new Set<string>();
    const dayTicks = new Set<string>();

    const findClosestPoint = (targetTime: number) => {
      let closest = rows[0];
      let minDiff = Math.abs(new Date((closest as any)[xKey] as any).getTime() - targetTime);
      for (const pt of rows) {
        const diff = Math.abs(new Date((pt as any)[xKey] as any).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      }
      return closest;
    };

    const addDayTick = (date: Date) => {
      const closest = findClosestPoint(date.getTime());
      const value = String((closest as any)[xKey]);
      ticks.add(value);
      dayTicks.add(value);
    };

    const addCleanTimeTick = (date: Date) => {
      const closest = findClosestPoint(date.getTime());
      const value = String((closest as any)[xKey]);
      ticks.add(value);
    };

    const getTimeIntervals = (d: number) => {
      // Show hourly ticks for windows up to ~6.5 hours
      if (d <= 0.27) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      if (d <= 0.5) return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
      if (d <= 1) return [3, 6, 9, 12, 15, 18, 21];
      if (d <= 3) return [0, 4, 8, 12, 16, 20];
      if (d <= 5) return [6, 12, 18];
      if (d <= 7) return [12];
      if (d <= 16) return [];
      return [];
    };

    const getDayStep = (d: number) => {
      if (d <= 16) return 1;
      if (d <= 30) return 2;
      if (d <= 60) return 3;
      if (d <= 90) return 5;
      return Math.max(1, Math.floor(d / 10));
    };

    const dayStep = getDayStep(daysDiff);
    let current = new Date(firstDate);
    current.setUTCHours(0, 0, 0, 0);
    if (current < firstDate) current.setUTCDate(current.getUTCDate() + 1);
    while (current <= lastDate) {
      addDayTick(current);
      current.setUTCDate(current.getUTCDate() + dayStep);
    }

    // Decouple hour tick visibility from day step so hour labels don't
    // disappear just because the day label density changes while panning.
    const intervals = getTimeIntervals(daysDiff);
    if (intervals.length) {
      current = new Date(firstDate);
      current.setUTCHours(0, 0, 0, 0);
      // Do NOT skip the first day even if midnight is before firstDate.
      // Instead, include hour ticks only when their exact timestamp is within the visible window.
      while (current <= lastDate) {
        for (const h of intervals) {
          const t = new Date(current);
          t.setUTCHours(h, 0, 0, 0);
          if (t >= firstDate && t <= lastDate && h !== 0) addCleanTimeTick(t);
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    return { ticks: Array.from(ticks), dayTicks };
  }, []);

  const { ticks: xTicks, dayTicks } = useMemo(
    () => generateSmartTicks(slicedData, xKey, sharedDomain ?? undefined),
    [slicedData, xKey, generateSmartTicks, sharedDomain]
  );

  const renderTick = useCallback((props: any) => {
    const { x, y, payload } = props;
    const date = toDate(payload.value);
    if (!date) return null;
    
    const isDay = dayTicks.has(String(payload.value)) || date.getUTCHours() === 0;
    const label = isDay
      ? date.toLocaleDateString(undefined, { timeZone: "UTC", day: "2-digit", month: "short" })
      : `${date.toLocaleTimeString(undefined, { timeZone: "UTC", hour: "2-digit", hour12: false }).split(":")[0]}:00`;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          dy={16} 
          textAnchor="middle" 
          style={{ fontSize: 10, userSelect: "none" }} 
          fill={isDay ? "rgb(var(--content-primary))" : "rgb(var(--content-tertiary))"} 
          fontWeight={isDay ? "600" : "400"}
        >
          {label}
        </text>
      </g>
    );
  }, [dayTicks]);

  return {
    ticks: xTicks,
    dayTicks,
    renderTick,
  };
}

/**
 * formatTooltipTimestamp - Format a timestamp for tooltip display
 */
export function formatTooltipTimestamp(timestamp: string): string {
  const d = toDate(timestamp);
  return d
    ? d.toLocaleString(undefined, {
        timeZone: "UTC",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : String(timestamp);
}

