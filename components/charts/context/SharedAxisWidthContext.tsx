import React, { createContext, useContext, useState, useCallback, useMemo, useLayoutEffect } from 'react';

interface AxisWidths {
  left: number;
  right: number;
}

interface SharedAxisWidthContextValue {
  reportWidths: (chartId: string, left: number, right: number) => void;
  unregister: (chartId: string) => void;
  sharedLeftAxisWidth: number;
  sharedRightAxisWidth: number;
}

const SharedAxisWidthContext = createContext<SharedAxisWidthContextValue | null>(null);

const LEFT_FLOOR = 50;
const RIGHT_FLOOR = 0;

export function SharedAxisWidthProvider({ children }: { children: React.ReactNode }) {
  const [widthMap, setWidthMap] = useState<Record<string, AxisWidths>>({});

  const reportWidths = useCallback((chartId: string, left: number, right: number) => {
    setWidthMap(prev => {
      const existing = prev[chartId];
      if (existing && existing.left === left && existing.right === right) {
        return prev;
      }
      return { ...prev, [chartId]: { left, right } };
    });
  }, []);

  const unregister = useCallback((chartId: string) => {
    setWidthMap(prev => {
      if (!(chartId in prev)) return prev;
      const { [chartId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const sharedLeftAxisWidth = useMemo(() => {
    const entries = Object.values(widthMap);
    if (entries.length === 0) return LEFT_FLOOR;
    return Math.max(LEFT_FLOOR, ...entries.map(e => e.left));
  }, [widthMap]);

  const sharedRightAxisWidth = useMemo(() => {
    const entries = Object.values(widthMap);
    if (entries.length === 0) return RIGHT_FLOOR;
    return Math.max(RIGHT_FLOOR, ...entries.map(e => e.right));
  }, [widthMap]);

  const value = useMemo<SharedAxisWidthContextValue>(() => ({
    reportWidths,
    unregister,
    sharedLeftAxisWidth,
    sharedRightAxisWidth,
  }), [reportWidths, unregister, sharedLeftAxisWidth, sharedRightAxisWidth]);

  return (
    <SharedAxisWidthContext.Provider value={value}>
      {children}
    </SharedAxisWidthContext.Provider>
  );
}

/**
 * Hook for chart components to report their measured axis widths
 * and receive the shared (max) widths for alignment.
 *
 * Safe to call outside of a SharedAxisWidthProvider — falls back
 * to the measured widths passed in.
 * Automatically unregisters when the component unmounts.
 */
/**
 * Read-only hook to get the shared axis widths without reporting.
 * Used by components (like SharedTimeAxis) that need alignment info
 * but don't contribute their own axis measurements.
 */
export function useSharedAxisWidths() {
  const ctx = useContext(SharedAxisWidthContext);
  return {
    sharedLeftAxisWidth: ctx?.sharedLeftAxisWidth ?? LEFT_FLOOR,
    sharedRightAxisWidth: ctx?.sharedRightAxisWidth ?? RIGHT_FLOOR,
  };
}

export function useSharedAxisWidth(chartId: string, leftWidth: number, rightWidth: number) {
  const ctx = useContext(SharedAxisWidthContext);
  const reportWidths = ctx?.reportWidths;
  const unregister = ctx?.unregister;

  useLayoutEffect(() => {
    reportWidths?.(chartId, leftWidth, rightWidth);
  }, [reportWidths, chartId, leftWidth, rightWidth]);

  useLayoutEffect(() => {
    return () => { unregister?.(chartId); };
  }, [unregister, chartId]);

  return {
    sharedLeftAxisWidth: ctx?.sharedLeftAxisWidth ?? leftWidth,
    sharedRightAxisWidth: ctx?.sharedRightAxisWidth ?? rightWidth,
  };
}
