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
      // Show range: "Aug 13 - Aug 19"
      const start = timestamp.startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const end = timestamp.endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${start} - ${end}`;
    }
    
    return null;
  };
  
  const timestampText = formatTimestamp();
  const isHoveringPoint = timestamp?.type === 'point';
  
  return (
    <div className={`sidebar-legend ${className}`}>
      {/* Timestamp Header */}
      {timestampText && (
        <div className="sidebar-legend-timestamp">
          <div className={`text-xs font-medium ${isHoveringPoint ? 'text-content-primary' : 'text-content-tertiary'}`}>
            {timestampText}
          </div>
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

