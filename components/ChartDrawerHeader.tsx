import { ReactNode } from 'react';
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

  /**
   * Move chart up in drawer order
   */
  onMoveUp?: () => void;

  /**
   * Move chart down in drawer order
   */
  onMoveDown?: () => void;

  /**
   * Delete chart from drawer
   */
  onDelete?: () => void;

  /**
   * Disable move up action (already first)
   */
  disableMoveUp?: boolean;

  /**
   * Disable move down action (already last)
   */
  disableMoveDown?: boolean;
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
  showDragHandle: _showDragHandle = false,
  dragHandleProps: _dragHandleProps,
  isDragging: _isDragging = false,
  hideMetricToggles = false,
  showMoreButton = true,
  onMoreClick,
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp = false,
  disableMoveDown = false,
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

        {/* Per-chart controls shown next to metric dropdown */}
        {(onMoveUp || onMoveDown || onDelete) && (
          <div className="flex items-center gap-0">
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center gap-0">
                {onMoveUp && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-l-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onMoveUp}
                    disabled={disableMoveUp}
                    aria-label="Move chart up"
                    title="Move up"
                  >
                    <Icon name="arrow-up" size={16} />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-r-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onMoveDown}
                    disabled={disableMoveDown}
                    aria-label="Move chart down"
                    title="Move down"
                  >
                    <Icon name="arrow-down" size={16} />
                  </button>
                )}
              </div>
            )}

            {onDelete && (
              <>
                {(onMoveUp || onMoveDown) && <div className="drawer-button-separator mx-1" />}
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
                  onClick={onDelete}
                  aria-label="Delete chart"
                  title="Delete"
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Right side: Actions + Min/Avg/Max Toggles + More */}
      <div className="chart-header--drawer-right">
        {actions}
        
        {/* Divider after actions (filters) */}
        {actions && (onMetricsChange && !hideMetricToggles || showMoreButton) && (
          <div className="drawer-button-separator" />
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

