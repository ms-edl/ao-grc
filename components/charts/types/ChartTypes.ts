/**
 * Common chart types and interfaces
 */

export type ChartVariant = 'default' | 'drawer';

export type MetricType = 'min' | 'avg' | 'max';

export interface ChartMargin {
  top?: number;
  right?: number;
  left?: number;
  bottom?: number;
}

export interface YAxisConfig {
  id: string;
  orientation?: 'left' | 'right';
  domain: [number, number];
  ticks?: number[];
  tickFormatter?: (value: any) => string;
  label?: string;
  width?: number;
}

export interface BaseChartProps {
  /**
   * Variant for different display contexts:
   * - 'default': Fixed width (864px), shows maximize button and brush
   * - 'drawer': Full width, shows filters, drag handle, and resize handle
   */
  variant?: ChartVariant;
  
  /**
   * If true, hides the internal drawer (useful when chart is already inside a drawer)
   */
  hideDrawer?: boolean;
  
  /**
   * Optional callback for maximize button (overrides default drawer behavior)
   */
  onMaximize?: () => void;
  
  /**
   * Enable tooltip synchronization with other charts via SyncedChartContext
   */
  enableSync?: boolean;
  
  /**
   * Shared range for synchronized brush control (used in drawer)
   */
  sharedRange?: { startIndex: number; endIndex: number };
  
  /**
   * Callback when range changes (for internal brush)
   */
  onRangeChange?: (range: { startIndex: number; endIndex: number }) => void;
  
  /**
   * Callback to report data length after loading (for global brush)
   */
  onDataLoad?: (dataLength: number, data: any[]) => void;
  
  /**
   * Optional chart height in pixels (defaults to 256px)
   */
  height?: number;
  
  /**
   * Show vertical resize handle (drawer only)
   */
  showResizeHandle?: boolean;
  
  /**
   * Callback when height changes via resize handle
   */
  onHeightChange?: (deltaY: number) => void;
  
  /**
   * Show drag handle for reordering (drawer only)
   */
  showDragHandle?: boolean;
  
  /**
   * Props from @dnd-kit for drag handle
   */
  dragHandleProps?: any;
  
  /**
   * Whether the chart is currently being dragged
   */
  isDragging?: boolean;
}

