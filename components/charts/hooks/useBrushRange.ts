import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChartVariant } from '../types/ChartTypes';

interface UseBrushRangeConfig {
  /** Data array to slice */
  data: any[];
  /** Chart variant (default or drawer) */
  variant: ChartVariant;
  /** Shared range from parent (for drawer variant) */
  sharedRange?: { startIndex: number; endIndex: number };
  /** Initial range size (in data points) */
  initialRangeSize?: number;
  /** Callback when range changes (for default variant) */
  onRangeChange?: (range: { startIndex: number; endIndex: number }) => void;
}

export interface BrushRangeState {
  /** Current range indices */
  range: { left: number; right: number };
  /** Set new range */
  setRange: (range: { left: number; right: number }) => void;
  /** Effective range (considers shared range in drawer mode) */
  effectiveRange: { left: number; right: number };
  /** Sliced data based on effective range */
  slicedData: any[];
  /** Handler for brush onChange event */
  handleBrushChange: (newRange: { startIndex: number; endIndex: number }) => void;
}

/**
 * useBrushRange - Manages brush range state and data slicing
 * 
 * Handles:
 * - Internal range state for default variant
 * - Shared range for drawer variant
 * - Data slicing based on effective range
 * - Range change callbacks
 */
export function useBrushRange({
  data,
  variant,
  sharedRange,
  initialRangeSize = 24 * 7, // 7 days by default
  onRangeChange,
}: UseBrushRangeConfig): BrushRangeState {
  const dataLength = data.length;
  
  // Internal range state (used in default variant)
  const [range, setRange] = useState<{ left: number; right: number }>({
    left: 0,
    right: Math.max(0, Math.min(initialRangeSize - 1, dataLength - 1)),
  });
  
  // Update range when data length changes
  useEffect(() => {
    if (!dataLength) return;
    setRange((prev) => ({
      left: 0,
      right: Math.max(prev.right, Math.min(initialRangeSize - 1, dataLength - 1)),
    }));
  }, [dataLength, initialRangeSize]);
  
  // Determine effective range based on variant
  const effectiveRange = useMemo(() => {
    if (variant === 'drawer' && sharedRange) {
      return { left: sharedRange.startIndex, right: sharedRange.endIndex };
    }
    return range;
  }, [variant, sharedRange, range]);
  
  // Slice data based on effective range
  const slicedData = useMemo(() => {
    return data.slice(effectiveRange.left, effectiveRange.right + 1);
  }, [data, effectiveRange]);
  
  // Handle brush change (for default variant)
  const handleBrushChange = useCallback(
    (newRange: { startIndex: number; endIndex: number }) => {
      const updatedRange = { left: newRange.startIndex, right: newRange.endIndex };
      setRange(updatedRange);
      
      if (onRangeChange) {
        onRangeChange(newRange);
      }
    },
    [onRangeChange]
  );
  
  return {
    range,
    setRange,
    effectiveRange,
    slicedData,
    handleBrushChange,
  };
}

