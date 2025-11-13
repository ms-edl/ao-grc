/**
 * Shared utility for calculating rolling window statistics
 * Used by both WAN and Client latency charts to compute min/max/avg values
 */

/**
 * Calculate min, max, and avg for an array of numbers
 * Matches the implementation in MultiDeviceLatencyChart
 */
export function calculateMetrics(values: number[]): { avg: number; min: number; max: number } | null {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Apply rolling window statistics to a dataset
 * 
 * @param data - Array of data rows
 * @param dataKey - Key in the row to compute statistics for
 * @param windowSize - Window size (default: 3, matches client chart)
 * @returns Array of computed metrics for each row
 * 
 * Example usage:
 * ```typescript
 * const latencyStats = applyRollingWindow(data, 'latency_ms', 3);
 * // Returns: [{ avg: 12.5, min: 11.0, max: 14.0 }, ...]
 * ```
 */
export function applyRollingWindow(
  data: any[],
  dataKey: string,
  windowSize: number = 3
): Array<{ avg: number; min: number; max: number } | null> {
  return data.map((_row, idx) => {
    const windowValues: number[] = [];
    
    // Sliding window: from (idx - windowSize + 1) to (idx + windowSize - 1)
    // This creates a window centered around the current point
    for (let i = Math.max(0, idx - windowSize + 1); i <= Math.min(data.length - 1, idx + windowSize - 1); i++) {
      const windowRow = data[i];
      const windowVal = windowRow[dataKey];
      if (typeof windowVal === 'number' && !Number.isNaN(windowVal)) {
        windowValues.push(windowVal);
      }
    }
    
    return calculateMetrics(windowValues);
  });
}

/**
 * Apply rolling window statistics to multiple data keys
 * 
 * @param data - Array of data rows
 * @param dataKeys - Array of keys to compute statistics for
 * @param windowSize - Window size (default: 3)
 * @returns Augmented data with _min, _avg, _max keys for each dataKey
 * 
 * Example usage:
 * ```typescript
 * const augmented = applyRollingWindowToDataset(
 *   data, 
 *   ['latency_ms', 'jitter_ms', 'packet_loss_percent'],
 *   3
 * );
 * // Each row now has: latency_ms_avg, latency_ms_min, latency_ms_max, etc.
 * ```
 */
export function applyRollingWindowToDataset<T extends Record<string, any>>(
  data: T[],
  dataKeys: string[],
  windowSize: number = 3
): Array<T & Record<string, number | null>> {
  return data.map((row, idx) => {
    const out: any = { ...row };
    
    for (const key of dataKeys) {
      const windowValues: number[] = [];
      
      // Sliding window calculation (matches client chart logic)
      for (let i = Math.max(0, idx - windowSize + 1); i <= Math.min(data.length - 1, idx + windowSize - 1); i++) {
        const windowRow = data[i];
        const windowVal = windowRow[key];
        if (typeof windowVal === 'number' && !Number.isNaN(windowVal)) {
          windowValues.push(windowVal);
        }
      }
      
      const metrics = calculateMetrics(windowValues);
      if (metrics) {
        out[`${key}_avg`] = metrics.avg;
        out[`${key}_min`] = metrics.min;
        out[`${key}_max`] = metrics.max;
      } else {
        out[`${key}_avg`] = null;
        out[`${key}_min`] = null;
        out[`${key}_max`] = null;
      }
    }
    
    return out;
  });
}

