import { GraphLegendExtended } from './ui/graph-legend-extended';
import { GraphLegendItem } from './ui/graph-legend-item';
import { DrawerLegendItem as SharedDrawerLegendItem, DrawerLegendSectionItem as SharedDrawerLegendSectionItem } from './charts/types/LegendTypes';

// Re-export shared types for backward compatibility
export type DrawerLegendItem = SharedDrawerLegendItem;
export type DrawerLegendSectionItem = SharedDrawerLegendSectionItem;

interface ChartDrawerLegendProps {
  /**
   * Main data items (devices, metrics, etc.) with min/avg/max values
   */
  dataItems: DrawerLegendItem[];
  
  /**
   * Secondary items (band types, connection types, etc.)
   */
  sectionItems?: DrawerLegendSectionItem[];
  
  /**
   * Toggle visibility of a data item
   */
  onToggleDataItem?: (id: string) => void;
  
  /**
   * Toggle visibility of a section item
   */
  onToggleSectionItem?: (id: string) => void;
  
  /**
   * Focus mode handlers
   */
  onFocusItem?: (id: string) => void;
  onExitFocus?: () => void;
  focusedItem?: string | null;
  
  /**
   * Hover handlers
   */
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
  
  /**
   * Timestamp range or specific hover timestamp
   */
  timestamp?: {
    type: 'range' | 'point';
    startDate?: Date;
    endDate?: Date;
    currentDate?: Date;
  };
  
  /**
   * Live values when hovering (overrides min/avg/max)
   */
  liveValues?: Record<string, {
    value: string | number;
    band?: string;  // for client chart
  }>;
  
  /**
   * Selected metrics for toggle buttons (min/avg/max)
   */
  selectedMetrics?: ('min' | 'avg' | 'max')[];
  
  /**
   * Callback when metrics toggle changes
   */
  onMetricsChange?: (metrics: ('min' | 'avg' | 'max')[]) => void;
  
  /**
   * Whether the brush is currently being adjusted
   */
  isBrushAdjusting?: boolean;
  
  className?: string;
}

/**
 * ChartDrawerLegend - Sidebar legend for drawer charts
 * 
 * Features:
 * - Fixed width (256px)
 * - Timestamp header showing range or hovered point
 * - Styled data items with 4px color indicator
 * - Min/Avg/Max meta row OR live hover values
 * - Secondary section items (band types, etc.)
 */
export function ChartDrawerLegend({
  dataItems,
  sectionItems = [],
  onToggleDataItem,
  onToggleSectionItem,
  onFocusItem,
  onExitFocus,
  focusedItem,
  onMouseEnter,
  onMouseLeave,
  timestamp,
  liveValues,
  selectedMetrics = ['avg'],
  onMetricsChange,
  isBrushAdjusting = false,
  className = '',
}: ChartDrawerLegendProps) {
  // Format timestamp for display
  const formatTimestamp = () => {
    if (!timestamp) return null;
    
    if (timestamp.type === 'point' && timestamp.currentDate) {
      // Show specific point: "Aug 15, 14:00"
      return timestamp.currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } else if (timestamp.type === 'range' && timestamp.startDate && timestamp.endDate) {
      const startDate = timestamp.startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const endDate = timestamp.endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      const startTime = timestamp.startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const endTime = timestamp.endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      // Check if start and end are on the same day
      const sameDay = startDate === endDate;
      
      if (sameDay) {
        // Same day: "Aug 15, 08:00 - 16:00"
        return `${startDate}, ${startTime} - ${endTime}`;
      } else {
        // Different days: "Aug 13, 08:00 - Aug 15, 16:00"
        return `${startDate}, ${startTime} - ${endDate}, ${endTime}`;
      }
    }
    
    return null;
  };
  
  const timestampText = formatTimestamp();
  const isHoveringPoint = timestamp?.type === 'point';
  
  // Handle metric toggle (for Min/Avg/Max buttons)
  const handleMetricToggle = (metric: 'min' | 'avg' | 'max') => {
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
    <div className={`sidebar-legend ${className}`}>
      {/* Timestamp Header */}
      {timestampText && (
        <div className="sidebar-legend-timestamp">
          <div className={`text-xs font-medium ${isBrushAdjusting ? 'text-content-primary' : 'text-content-tertiary'}`}>
            {timestampText}
          </div>
        </div>
      )}
      
      {/* Min/Avg/Max Toggles Section */}
      {onMetricsChange && !isHoveringPoint && (
        <div className="sidebar-legend-metric-toggles">
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
      
      {/* Scrollable Content Area */}
      <div className="sidebar-legend-content">
        {/* Data Items Section */}
        {dataItems.length > 0 && (
          <div className="sidebar-legend-section">
            {dataItems.map((item) => {
              // In focus mode, only show the focused item
              if (focusedItem && item.id !== focusedItem) {
                return null;
              }
              
              // Check if we're in hover mode (liveValues exist)
              const isHovering = liveValues !== undefined;
              const liveValue = liveValues?.[item.id];
              
              let metaValues = [];
              
              if (isHovering) {
                // In hover mode: show live value or N/A
                if (liveValue) {
                  metaValues = [
                    { 
                      value: liveValue.band 
                        ? `${liveValue.value} · ${liveValue.band}` 
                        : liveValue.value,
                      isActive: true 
                    }
                  ];
                } else {
                  // No data at this point
                  metaValues = [
                    { value: 'N/A', isActive: true }
                  ];
                }
              } else {
                // Not hovering: show min/avg/max with active highlighting
                if (item.min !== undefined) {
                  metaValues.push({ value: item.min, isActive: item.activeMetric === 'min' });
                }
                if (item.avg !== undefined) {
                  metaValues.push({ value: item.avg, isActive: item.activeMetric === 'avg' });
                }
                if (item.max !== undefined) {
                  metaValues.push({ value: item.max, isActive: item.activeMetric === 'max' });
                }
              }
              
              const handleClick = (e: React.MouseEvent) => {
                // Option/Alt + Click for focus mode
                if (e.altKey && onFocusItem) {
                  if (focusedItem === item.id) {
                    // Exit focus if clicking the same item
                    onExitFocus?.();
                  } else {
                    // Enter focus mode for this item
                    onFocusItem(item.id);
                  }
                } else {
                  // Regular click toggles visibility
                  onToggleDataItem?.(item.id);
                }
              };
              
              return (
                <GraphLegendExtended
                  key={item.id}
                  color={item.color || '#999'}
                  label={item.label}
                  metaValues={metaValues}
                  isHidden={item.isHidden}
                  isFocused={focusedItem === item.id}
                  showFocusMode={true}
                  onExitFocus={onExitFocus}
                  onClick={handleClick}
                  onMouseEnter={() => onMouseEnter?.(item.id)}
                  onMouseLeave={() => onMouseLeave?.()}
                />
              );
            })}
          </div>
        )}
        
        {/* Section Items (Band types, etc.) - Separate section */}
        {sectionItems.length > 0 && (
          <div className="sidebar-legend-section--secondary">
            {sectionItems.map((item) => (
              <GraphLegendItem
                key={item.id}
                id={item.id}
                dashArray={item.dashArray}
                label={item.label}
                isHidden={item.isHidden}
                onClick={() => onToggleSectionItem?.(item.id)}
                onMouseEnter={() => onMouseEnter?.(item.id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
            ))}
          </div>
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

