import React, { ReactNode } from 'react';
import ChartCard from '../../ChartCard';
import ChartHeader from '../../ChartHeader';
import ChartDrawerHeader from '../../ChartDrawerHeader';
import { ChartDrawerContent } from '../../ChartDrawerContent';
import { ResizeHandleVertical } from '../../ui/resize-handle-vertical';
import { ChartVariant } from '../types/ChartTypes';

interface DefaultVariantProps {
  /**
   * Inline legend for default variant (horizontal layout)
   */
  inlineLegend: ReactNode;
  
  /**
   * Legend actions (Avg/Min/Max toggles)
   */
  legendActions?: ReactNode;
  
  /**
   * Maximize button
   */
  maximizeButton: ReactNode;
  
  /**
   * Brush component (shown below chart)
   */
  brush?: ReactNode;
}

interface DrawerVariantProps {
  /**
   * Sidebar content (ChartDrawerLegend with stats)
   */
  sidebar: ReactNode;
  
  /**
   * Legend actions (Avg/Min/Max toggles) - shown above chart
   */
  legendActions?: ReactNode;
  
  /**
   * Header action buttons (filters, more button, etc.)
   */
  headerActions: ReactNode;
  
  /**
   * Show drag handle for reordering
   */
  showDragHandle?: boolean;
  
  /**
   * Props from @dnd-kit for drag handle
   */
  dragHandleProps?: any;
  
  /**
   * Whether chart is currently being dragged
   */
  isDragging?: boolean;
  
  /**
   * Show vertical resize handle
   */
  showResizeHandle?: boolean;
  
  /**
   * Callback when height changes
   */
  onHeightChange?: (deltaY: number) => void;
  
  /**
   * Chart height in pixels
   */
  height?: number;
}

export interface BaseChartLayoutProps {
  /**
   * Chart variant (determines layout structure)
   */
  variant: ChartVariant;
  
  /**
   * Chart title
   */
  title: string;
  
  /**
   * Metric selector button
   */
  metricButton: ReactNode;
  
  /**
   * Chart content (BaseChartCore)
   */
  children: ReactNode;
  
  /**
   * Props specific to default variant
   */
  defaultProps?: DefaultVariantProps;
  
  /**
   * Props specific to drawer variant
   */
  drawerProps?: DrawerVariantProps;
}

/**
 * BaseChartLayout - Unified layout component for both chart variants
 * 
 * Handles structural differences between:
 * - Default variant: ChartCard with inline legend, maximize button, brush
 * - Drawer variant: ChartDrawerContent with sidebar, filters, drag/resize handles
 * 
 * Ensures consistent layout patterns across all charts
 */
export function BaseChartLayout({
  variant,
  title,
  metricButton,
  children,
  defaultProps,
  drawerProps,
}: BaseChartLayoutProps) {
  // DEFAULT VARIANT - Fixed width, inline legend, maximize button
  if (variant === 'default') {
    if (!defaultProps) {
      console.error('BaseChartLayout: defaultProps required for default variant');
      return null;
    }
    
    const { inlineLegend, legendActions, maximizeButton, brush } = defaultProps;
    
    return (
      <ChartCard
        variant="default"
        header={
          <ChartHeader
            title={title}
            metricButton={metricButton}
            actions={maximizeButton}
          />
        }
        legend={inlineLegend}
        legendActions={legendActions}
      >
        {children}
        {brush}
      </ChartCard>
    );
  }
  
  // DRAWER VARIANT - Full width, sidebar with stats, filters, drag/resize handles
  if (variant === 'drawer') {
    if (!drawerProps) {
      console.error('BaseChartLayout: drawerProps required for drawer variant');
      return null;
    }
    
    const {
      sidebar,
      legendActions,
      headerActions,
      showDragHandle,
      dragHandleProps,
      isDragging,
      showResizeHandle,
      onHeightChange,
    } = drawerProps;
    
    return (
      <div
        className="bg-surface-tile chart-gradient-border rounded-lg"
        style={{ width: '100%', maxWidth: '100%', overflow: 'visible' }}
      >
        <ChartDrawerContent sidebar={sidebar}>
          {/* Header with filters and drag handle */}
          <ChartDrawerHeader
            title={title}
            metricButton={metricButton}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            actions={headerActions}
          />
          
          {/* Metric toggles (Avg/Min/Max) - shown inline in drawer */}
          {legendActions && (
            <div className="px-6 pt-4">
              {legendActions}
            </div>
          )}
          
          {/* Chart content */}
          <div className="flex-1 mt-6">
            {children}
          </div>
        </ChartDrawerContent>
        
        {/* Resize handle at bottom */}
        {showResizeHandle && onHeightChange && (
          <ResizeHandleVertical onResize={onHeightChange} />
        )}
      </div>
    );
  }
  
  return null;
}

