import { useMemo } from 'react';

interface YAxisConfig {
  data: any[];
  dataKeys: string[];
  /** Fixed domain [min, max] or 'auto' */
  fixedDomain?: [number, number | 'auto'] | 'auto';
  /** Padding percentage (0-1) to add above max value */
  paddingTop?: number;
  /** Round up to nearest multiple of this value */
  roundTo?: number;
}

export function useChartYAxis({
  data,
  dataKeys,
  fixedDomain = 'auto',
  paddingTop = 0.1,
  roundTo = 5,
}: YAxisConfig) {
  
  const domain = useMemo(() => {
    if (fixedDomain !== 'auto') {
      return fixedDomain;
    }

    // Find max value across all dataKeys
    let max = 0;
    for (const row of data) {
      for (const key of dataKeys) {
        const val = (row as any)[key];
        if (typeof val === 'number' && !Number.isNaN(val)) {
          max = Math.max(max, val);
        }
      }
    }

    // Add padding
    max = max * (1 + paddingTop);

    // Round up to nearest roundTo
    if (roundTo > 0) {
      max = Math.ceil(max / roundTo) * roundTo;
    }

    return [0, Math.max(10, max)] as [number, number];
  }, [data, dataKeys, fixedDomain, paddingTop, roundTo]);

  return { domain };
}

