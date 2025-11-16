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
    <div className="w-full flex items-center justify-between gap-4">
      {/* Left side: Title + Metric */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Title */}
        <h3 
          className="text-content-primary font-semibold flex-shrink-0"
          style={{ fontSize: '16px', lineHeight: '24px' }}
        >
          {title}
        </h3>
        
        {/* Metric Button */}
        {metricButton}
      </div>
      
      {/* Right side: Min/Avg/Max Toggles + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Min/Avg/Max Toggles */}
        {onMetricsChange && (
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
        )}
        
        {actions && (
          <>
            {actions}
          </>
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
        backgroundColor: isActive ? 'rgb(var(--surface-action))' : 'transparent',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

