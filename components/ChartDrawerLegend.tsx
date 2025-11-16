import { GraphLegendExtended } from './ui/graph-legend-extended';
import { GraphLegendItem } from './ui/graph-legend-item';

export interface DrawerLegendItem {
  id: string;
  label: string;
  color: string;
  min?: string | number;
  avg?: string | number;
  max?: string | number;
  isHidden?: boolean;
  activeMetric?: 'min' | 'avg' | 'max'; // Which metric is currently selected
}

export interface DrawerLegendSectionItem {
  id: string;
  label: string;
  dashArray?: string;
  isHidden?: boolean;
}

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
   * Hover handlers
   */
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
  
  className?: string;
}

/**
 * ChartDrawerLegend - Sidebar legend for drawer charts
 * 
 * Features:
 * - Fixed width (256px)
 * - Styled data items with 4px color indicator
 * - Min/Avg/Max meta row for each data item
 * - Secondary section items (band types, etc.)
 */
export function ChartDrawerLegend({
  dataItems,
  sectionItems = [],
  onToggleDataItem,
  onToggleSectionItem,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: ChartDrawerLegendProps) {
  return (
    <div 
      className={`flex flex-col gap-6 ${className}`}
      style={{ width: '100%', maxWidth: '288px', flexShrink: 0 }}
    >
      {/* Data Items Section */}
      {dataItems.length > 0 && (
        <div className="flex flex-col gap-2">
          {dataItems.map((item) => {
            // Convert min/avg/max to flexible metaValues array
            const metaValues = [];
            if (item.min !== undefined) {
              metaValues.push({ value: item.min, isActive: item.activeMetric === 'min' });
            }
            if (item.avg !== undefined) {
              metaValues.push({ value: item.avg, isActive: item.activeMetric === 'avg' });
            }
            if (item.max !== undefined) {
              metaValues.push({ value: item.max, isActive: item.activeMetric === 'max' });
            }
            
            return (
              <GraphLegendExtended
                key={item.id}
                color={item.color}
                label={item.label}
                metaValues={metaValues}
                isHidden={item.isHidden}
                onClick={() => onToggleDataItem?.(item.id)}
                onMouseEnter={() => onMouseEnter?.(item.id)}
                onMouseLeave={() => onMouseLeave?.()}
              />
            );
          })}
        </div>
      )}
      
      {/* Section Items (Band types, etc.) */}
      {sectionItems.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2">
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
  );
}

