import React from 'react';
import { ChartDot } from '../ChartDots';

export interface LineStyleConfig {
  /** Whether this line is currently highlighted (hovered or no hover) */
  isHighlighted: boolean;
  /** Color of the line */
  color: string;
  /** Chart data array for boundary marker detection */
  chartData: any[];
  /** Data key for this line */
  dataKey: string;
  /** Whether to show boundary markers (default: true) */
  showBoundaryMarkers?: boolean;
  /** Opacity when highlighted (default: 0.6 - dimmed to highlight datapoints) */
  highlightedLineOpacity?: number;
  /** Opacity when dimmed (default: 0.1) */
  dimmedLineOpacity?: number;
  /** Opacity for dots when highlighted (default: 1.0) */
  highlightedDotOpacity?: number;
  /** Opacity for dots when dimmed (default: 0.1) */
  dimmedDotOpacity?: number;
}

export interface LineStyleResult {
  /** Whether this line is currently highlighted */
  isHighlighted: boolean;
  /** Stroke opacity for the line */
  strokeOpacity: number;
  /** Dot renderer function for Recharts */
  dot: (props: any) => React.ReactElement;
  /** Active dot configuration */
  activeDot: {
    stroke: string;
    strokeWidth: number;
    r: number;
    opacity: number;
    style: Record<string, any>;
  };
}

/**
 * Calculate line styling based on hover state
 * Handles:
 * - Line vs single datapoint opacity
 * - First and last datapoint markers (boundary markers)
 * - Line opacity on legend hover
 * 
 * Note: This is a regular function (not a hook) so it can be called inside loops/maps
 */
export function useChartLineStyle(config: LineStyleConfig): LineStyleResult {
  const {
    isHighlighted,
    color,
    chartData,
    dataKey,
    showBoundaryMarkers = true,
    // highlightedLineOpacity is intentionally ignored - we always use 0.6 for highlighted lines
    // to ensure consistent dimmed appearance across all charts
    dimmedLineOpacity = 0.1,
    highlightedDotOpacity = 1.0,
    dimmedDotOpacity = 0.1,
  } = config;

  // Calculate opacities
  // When highlighted, ALWAYS use 0.6 for lines (dimmed to highlight datapoints)
  // When dimmed, use 0.1 to fade out non-hovered items
  // This ensures consistent behavior across all charts - lines are always dimmed to make datapoints stand out
  const strokeOpacity = isHighlighted ? 0.6 : dimmedLineOpacity;
  const dotOpacity = isHighlighted ? highlightedDotOpacity : dimmedDotOpacity;

  // Create a custom dot renderer that uses the calculated opacity
  const dot = (props: any) => {
    const { cx, cy, value, index } = props;
    
    const result = React.createElement(ChartDot, {
      cx,
      cy,
      value,
      index,
      color,
      opacity: dotOpacity,
      chartData,
      dataKey,
      showBoundaryMarkers,
    });
    
    // Recharts expects a non-null return, so return empty group if null
    return result || React.createElement('g');
  };

  const activeDot = {
    stroke: "rgb(var(--surface-tile))",
    strokeWidth: 2,
    r: 3,
    opacity: dotOpacity,
    style: {}
  };

  return {
    isHighlighted,
    strokeOpacity,
    dot,
    activeDot,
  };
}

/**
 * Helper to determine if an item is highlighted based on hover state
 * @param hoveredItem - The currently hovered item ID (null if nothing hovered)
 * @param currentItemId - The ID of the current item being rendered
 * @returns true if this item should be highlighted (either no hover or this specific item is hovered)
 */
export function isItemHighlighted<T extends string | null>(
  hoveredItem: T | null,
  currentItemId: T
): boolean {
  return hoveredItem === null || hoveredItem === currentItemId;
}

