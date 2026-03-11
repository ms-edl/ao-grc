import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Context for synchronizing chart tooltips across multiple charts
 * 
 * When one chart is hovered, all charts in the same context will
 * display tooltips at the same timestamp.
 */

interface SyncedChartContextValue {
  /**
   * The currently synced timestamp (ISO string) or null if no sync active
   */
  syncedTimestamp: string | null;
  
  /**
   * Update the synced timestamp across all charts
   */
  setSyncedTimestamp: (timestamp: string | null) => void;
  
  /**
   * Whether sync is currently enabled
   */
  syncEnabled: boolean;
}

const SyncedChartContext = createContext<SyncedChartContextValue | undefined>(undefined);

interface SyncedChartProviderProps {
  children: ReactNode;
  /**
   * Whether to enable tooltip synchronization
   * @default true
   */
  syncEnabled?: boolean;
}

/**
 * Provider component for synced chart tooltips
 * 
 * Wrap multiple charts with this provider to enable tooltip synchronization
 * 
 * @example
 * ```tsx
 * <SyncedChartProvider>
 *   <MultiDeviceLatencyChart enableSync />
 *   <WanLatencyChart enableSync />
 * </SyncedChartProvider>
 * ```
 */
export function SyncedChartProvider({ 
  children, 
  syncEnabled = true 
}: SyncedChartProviderProps) {
  const [syncedTimestamp, setSyncedTimestampState] = useState<string | null>(null);

  // Wrap setter to only update if sync is enabled.
  // Keep updates immediate for cursor responsiveness, but skip duplicate writes.
  const setSyncedTimestamp = useCallback((timestamp: string | null) => {
    if (!syncEnabled) return;
    setSyncedTimestampState((prev) => (prev === timestamp ? prev : timestamp));
  }, [syncEnabled]);

  const value: SyncedChartContextValue = {
    syncedTimestamp,
    setSyncedTimestamp,
    syncEnabled,
  };

  return (
    <SyncedChartContext.Provider value={value}>
      {children}
    </SyncedChartContext.Provider>
  );
}

/**
 * Hook to access the synced chart context
 * 
 * @returns The synced chart context value, or undefined if not within a provider
 */
export function useSyncedChart(): SyncedChartContextValue | undefined {
  return useContext(SyncedChartContext);
}

/**
 * Utility function to find the closest data point index for a given timestamp
 * 
 * @param data - Array of data points with 'x' field containing ISO timestamp
 * @param targetTimestamp - ISO timestamp string to find
 * @returns Index of the closest data point, or -1 if not found
 */
export function findClosestTimestampIndex(
  data: Array<{ x: string; [key: string]: any }>,
  targetTimestamp: string | null
): number {
  if (!targetTimestamp || !data || data.length === 0) {
    return -1;
  }

  const targetTime = new Date(targetTimestamp).getTime();
  if (isNaN(targetTime)) {
    return -1;
  }

  let closestIndex = -1;
  let minDiff = Infinity;

  for (let i = 0; i < data.length; i++) {
    const pointTime = new Date(data[i].x).getTime();
    if (isNaN(pointTime)) continue;

    const diff = Math.abs(pointTime - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
}

