import { useMemo } from 'react';
import {
  LineChart,
  XAxis,
  ResponsiveContainer,
} from 'recharts';
import { useTimeAxis } from '../TimeAxis';
import { useSharedAxisWidths } from './context/SharedAxisWidthContext';

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

  if (!slicedData.length) return null;

  return (
    <div style={{
      width: '100%',
      height: 36,
      paddingBottom: 8,
      background: 'rgb(var(--surface-tile))',
      borderTop: '1px solid rgb(var(--border-border-flat))',
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={slicedData}
          margin={{ top: 0, right: sharedRightAxisWidth, left: sharedLeftAxisWidth, bottom: 0 }}
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
