import { useState, useCallback, useEffect } from 'react';
import { useChartLegendHover } from '../../hooks/useChartLegendHover';
import { MetricType } from '../types/ChartTypes';

interface UseBaseChartStateConfig {
  /** Initial metric selection */
  initialMetric?: MetricType;
  /** Enable legend hover tooltips for focus mode */
  enableLegendHover?: boolean;
  /** Delay before showing isolate tooltip */
  tooltipDelay?: number;
}

export interface BaseChartState<TItemKey extends string> {
  // Metric state
  selectedMetric: MetricType;
  setSelectedMetric: (metric: MetricType) => void;
  
  // Item visibility state
  hoveredItem: TItemKey | null;
  setHoveredItem: (item: TItemKey | null) => void;
  hiddenItems: Set<TItemKey>;
  setHiddenItems: (items: Set<TItemKey>) => void;
  
  // Focus mode state
  focusedItem: TItemKey | null;
  preFocusHiddenItems: Set<TItemKey>;
  
  // Handlers
  handleToggleItem: (id: TItemKey) => void;
  handleFocusItem: (id: TItemKey) => void;
  handleExitFocus: () => void;
  handleShowAll: () => void;
  
  // Legend hover integration
  legendHover: {
    hoveredItem: string | null;
    showTooltipForItem: string | null;
    handleMouseEnter: (itemId: string, isHidden?: boolean) => void;
    handleMouseLeave: () => void;
    cleanup: () => void;
  };
}

/**
 * useBaseChartState - Manages common chart state and interactions
 * 
 * Generic hook that handles:
 * - Metric selection (min/avg/max)
 * - Item visibility toggling
 * - Hover state
 * - Focus mode
 * - Legend hover with tooltip
 * 
 * @template TItemKey - The type of item identifiers (device IDs, metric keys, etc.)
 */
export function useBaseChartState<TItemKey extends string>({
  initialMetric = 'avg',
  enableLegendHover = true,
  tooltipDelay = 2000,
}: UseBaseChartStateConfig = {}): BaseChartState<TItemKey> {
  // Metric state
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(initialMetric);
  
  // Item state
  const [hoveredItem, setHoveredItem] = useState<TItemKey | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<TItemKey>>(new Set());
  
  // Focus mode state
  const [focusedItem, setFocusedItem] = useState<TItemKey | null>(null);
  const [preFocusHiddenItems, setPreFocusHiddenItems] = useState<Set<TItemKey>>(new Set());
  
  // Legend hover state
  const legendHover = useChartLegendHover({
    showIsolateTooltip: enableLegendHover,
    tooltipDelay,
  });
  
  // Toggle item visibility
  const handleToggleItem = useCallback((id: TItemKey) => {
    setHoveredItem(null);
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Enter focus mode for a single item
  const handleFocusItem = useCallback((id: TItemKey) => {
    setPreFocusHiddenItems(hiddenItems);
    setFocusedItem(id);
    legendHover.cleanup();
  }, [hiddenItems, legendHover]);
  
  // Exit focus mode
  const handleExitFocus = useCallback(() => {
    setFocusedItem(null);
    setHiddenItems(preFocusHiddenItems);
    setHoveredItem(null);
  }, [preFocusHiddenItems]);
  
  // Show all hidden items
  const handleShowAll = useCallback(() => {
    setHoveredItem(null);
    setHiddenItems(new Set());
  }, []);
  
  return {
    selectedMetric,
    setSelectedMetric,
    hoveredItem,
    setHoveredItem,
    hiddenItems,
    setHiddenItems,
    focusedItem,
    preFocusHiddenItems,
    handleToggleItem,
    handleFocusItem,
    handleExitFocus,
    handleShowAll,
    legendHover,
  };
}

