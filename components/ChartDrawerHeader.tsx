import React, { ReactNode } from 'react';
import { Icon } from './ui/icons';

type MetricType = 'min' | 'avg' | 'max';

interface ChartDrawerHeaderProps {
  /**
   * Chart title
   */
  title: string;
  
  /**
   * Metric selector dropdown button
   */
  metricButton?: ReactNode;
  
  /**
   * Selected metrics to toggle (Min/Avg/Max)
   */
  selectedMetrics?: MetricType[];
  
  /**
   * Callback when metric toggle changes
   */
  onMetricsChange?: (metrics: MetricType[]) => void;
  
  /**
   * Action buttons (filters, etc.)
   */
  actions?: ReactNode;
  
  /**
   * Show drag handle for reordering
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
  
  /**
   * Hide metric toggles (when controlled by global toggle)
   */
  hideMetricToggles?: boolean;
  
  /**
   * Show more button
   */
  showMoreButton?: boolean;
  
  /**
   * Callback when more button is clicked
   */
  onMoreClick?: () => void;
}

/**
 * ChartDrawerHeader - Header component for drawer chart variant
 * 
 * Layout:
 * - Left: Title + Metric dropdown + Min/Avg/Max toggles
 * - Right: Action buttons (filters, etc.)
 */
export default function ChartDrawerHeader({
  title,
  metricButton,
  selectedMetrics = ['avg'],
  onMetricsChange,
  actions,
  showDragHandle = false,
  dragHandleProps,
  isDragging = false,
  hideMetricToggles = false,
  showMoreButton = true,
  onMoreClick,
}: ChartDrawerHeaderProps) {
  const handleMetricToggle = (metric: MetricType) => {
    if (!onMetricsChange) return;
    
    const isSelected = selectedMetrics.includes(metric);
    
    if (isSelected) {
      // Remove if selected (but keep at least one)
      if (selectedMetrics.length > 1) {
        onMetricsChange(selectedMetrics.filter(m => m !== metric));
      }
    } else {
      // Add if not selected
      onMetricsChange([...selectedMetrics, metric]);
    }
  };
  
  return (
    <div className="chart-header--drawer">
      {/* Left side: Title + Metric */}
      <div className="chart-header--drawer-left">
        {/* Title */}
        <h3 className="chart-title">
          {title}
        </h3>
        
        {/* Metric Button */}
        {metricButton}
      </div>
      
      {/* Right side: Actions + Min/Avg/Max Toggles + More */}
      <div className="chart-header--drawer-right">
        {actions && (
          <>
            {actions}
            
            {/* Divider after actions (filters) */}
            {onMetricsChange && !hideMetricToggles && <div className="drawer-button-separator" />}
          </>
        )}
        
        {/* Min/Avg/Max Toggles */}
        {onMetricsChange && !hideMetricToggles && (
          <>
            <div className="flex items-center gap-1">
              <MetricToggle
                label="Min"
                isActive={selectedMetrics.includes('min')}
                onClick={() => handleMetricToggle('min')}
              />
              <MetricToggle
                label="Avg"
                isActive={selectedMetrics.includes('avg')}
                onClick={() => handleMetricToggle('avg')}
              />
              <MetricToggle
                label="Max"
                isActive={selectedMetrics.includes('max')}
                onClick={() => handleMetricToggle('max')}
              />
            </div>
            
            {/* Divider after toggles */}
            {showMoreButton && <div className="drawer-button-separator" />}
          </>
        )}
        
        {/* More Button */}
        {showMoreButton && (
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
            onClick={onMoreClick || (() => console.log('More options'))}
          >
            <Icon name="more-vertical" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * MetricToggle - Individual metric toggle button
 */
interface MetricToggleProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function MetricToggle({ label, isActive, onClick }: MetricToggleProps) {
  return (
    <button
      type="button"
      className="transition-opacity hover:opacity-80"
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: 500,
        color: isActive ? 'rgb(var(--content-primary))' : 'rgb(var(--content-tertiary))',
        backgroundColor: isActive ? 'rgb(var(--surface-action-hover))' : 'transparent',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

