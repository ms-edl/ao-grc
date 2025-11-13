import { useState, useCallback, useRef, useEffect } from 'react';

interface UseChartLegendHoverConfig {
  /** Show the isolate/focus tooltip after delay */
  showIsolateTooltip?: boolean;
  /** Delay in ms before showing tooltip */
  tooltipDelay?: number;
}

export function useChartLegendHover(config: UseChartLegendHoverConfig = {}) {
  const { showIsolateTooltip = false, tooltipDelay = 2000 } = config;
  
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredLegendTimer, setHoveredLegendTimer] = useState<NodeJS.Timeout | null>(null);
  const [showTooltipForItem, setShowTooltipForItem] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoveredLegendTimer) {
        clearTimeout(hoveredLegendTimer);
      }
    };
  }, [hoveredLegendTimer]);

  const handleMouseEnter = useCallback((itemId: string, isHidden: boolean = false) => {
    if (!isHidden) {
      setHoveredItem(itemId);
    }
    
    if (showIsolateTooltip && !isHidden) {
      const timer = setTimeout(() => {
        setShowTooltipForItem(itemId);
      }, tooltipDelay);
      setHoveredLegendTimer(timer);
    }
  }, [showIsolateTooltip, tooltipDelay]);

  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null);
    
    if (hoveredLegendTimer) {
      clearTimeout(hoveredLegendTimer);
      setHoveredLegendTimer(null);
    }
    setShowTooltipForItem(null);
  }, [hoveredLegendTimer]);

  const cleanup = useCallback(() => {
    if (hoveredLegendTimer) {
      clearTimeout(hoveredLegendTimer);
      setHoveredLegendTimer(null);
    }
    setShowTooltipForItem(null);
  }, [hoveredLegendTimer]);

  return {
    hoveredItem,
    showTooltipForItem,
    handleMouseEnter,
    handleMouseLeave,
    cleanup,
  };
}

