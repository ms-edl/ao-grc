/**
 * Unified legend interfaces for both inline and drawer legends
 */

/**
 * Base legend item with common fields
 */
export interface BaseLegendItem {
  id: string;
  label: string;
  color?: string;
  dashArray?: string;
  isHidden?: boolean;
}

/**
 * Extended legend item for drawer variant with statistics
 */
export interface DrawerLegendItem extends BaseLegendItem {
  min?: string | number;
  avg?: string | number;
  max?: string | number;
  activeMetric?: 'min' | 'avg' | 'max';
}

/**
 * Section item for drawer legend (e.g., band types)
 */
export interface DrawerLegendSectionItem {
  id: string;
  label: string;
  dashArray?: string;
  isHidden?: boolean;
}

/**
 * Common legend callback handlers
 */
export interface LegendCallbacks {
  onToggleItem?: (id: string) => void;
  onFocusItem?: (id: string) => void;
  onShowAll?: () => void;
  onMouseEnter?: (id: string, isHidden?: boolean) => void;
  onMouseLeave?: () => void;
  onExitFocus?: () => void;
}

/**
 * Adapter function type to convert data to inline legend format
 */
export type ToInlineLegendItems<T> = (items: T[]) => BaseLegendItem[];

/**
 * Adapter function type to convert data to drawer legend format with stats
 */
export type ToDrawerLegendItems<T> = (
  items: T[],
  data: any[],
  calculateStats: (data: any[], itemId: string) => { min: number; avg: number; max: number }
) => DrawerLegendItem[];

