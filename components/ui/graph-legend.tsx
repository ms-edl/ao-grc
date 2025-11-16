import React from 'react';
import { GraphLegendItem } from './graph-legend-item';

export interface GraphLegendProps {
  /**
   * Legend items
   */
  items: Array<{
    id: string;
    label: string;
    color?: string;
    dashArray?: string;
    isHidden?: boolean;
  }>;
  
  /**
   * Toggle visibility of an item
   */
  onToggleItem: (id: string) => void;
  
  /**
   * Focus on a single item (Alt+Click)
   */
  onFocusItem?: (id: string) => void;
  
  /**
   * Show all hidden items
   */
  onShowAll?: () => void;
  
  /**
   * Hover handlers
   */
  onMouseEnter?: (id: string, isHidden: boolean) => void;
  onMouseLeave?: () => void;
  
  /**
   * Focus mode
   */
  focusedItem?: string | null;
  onExitFocus?: () => void;
  
  /**
   * Hover state for external tracking
   */
  hoveredItem?: string | null;
  
  /**
   * Whether to show focus mode tooltip
   */
  showFocusMode?: boolean;
  
  className?: string;
}

/**
 * GraphLegend - Container for multiple legend items
 * 
 * Features:
 * - Wrapping layout for inline legends
 * - "Show all" button when items are hidden
 * - Focus mode support with single item display
 * - Alt+Click to focus functionality
 */
export function GraphLegend({
  items,
  onToggleItem,
  onFocusItem,
  onShowAll,
  onMouseEnter,
  onMouseLeave,
  focusedItem = null,
  onExitFocus,
  hoveredItem: _hoveredItem,
  showFocusMode = true,
  className = '',
}: GraphLegendProps) {
  const hiddenCount = items.filter(item => item.isHidden).length;
  
  // Focus mode: show only focused item with exit button
  if (focusedItem) {
    const focusedItemData = items.find(item => item.id === focusedItem);
    if (!focusedItemData) return null;
    
    return (
      <div className={`w-full flex items-center gap-2 ${className}`}>
        <div className="flex items-center rounded" style={{ padding: "4px 8px", gap: "4px" }}>
          {focusedItemData.dashArray !== undefined ? (
            /* Line indicator */
            <svg width="16" height="2" className="flex-shrink-0">
              <line
                x1="0"
                y1="1"
                x2="16"
                y2="1"
                stroke="rgb(var(--content-secondary))"
                strokeWidth="2"
                strokeDasharray={focusedItemData.dashArray}
              />
            </svg>
          ) : (
            /* Circular dot */
            <span
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, backgroundColor: focusedItemData.color }}
            />
          )}
          <span className="truncate text-xs text-content-primary" style={{ maxWidth: '160px' }}>
            {focusedItemData.label}
          </span>
        </div>
        {onExitFocus && (
          <button
            className="flex items-center hover:bg-surface-action-hover transition-colors rounded cursor-pointer text-content-primary font-medium text-xs"
            style={{ padding: "4px 8px" }}
            onClick={onExitFocus}
          >
            Exit focus mode
          </button>
        )}
      </div>
    );
  }
  
  // Normal mode: show all items
  return (
    <div className={`w-full flex flex-wrap items-center justify-start text-content-secondary text-xs ${className}`} style={{ gap: "4px 4px" }}>
      {items.map((item) => (
        <GraphLegendItem
          key={item.id}
          id={item.id}
          label={item.label}
          color={item.color}
          dashArray={item.dashArray}
          isHidden={item.isHidden}
          onClick={() => onToggleItem(item.id)}
          onMouseEnter={() => onMouseEnter?.(item.id, !!item.isHidden)}
          onMouseLeave={onMouseLeave}
          onFocus={onFocusItem ? () => onFocusItem(item.id) : undefined}
          showFocusMode={showFocusMode && !!onFocusItem}
        />
      ))}
      
      {onShowAll && hiddenCount > 0 && (
        <div className="relative group">
          <div 
            className="flex items-center hover:bg-surface-action-hover transition-colors rounded cursor-pointer text-content-primary"
            style={{ padding: "4px 8px" }}
            onClick={onShowAll}
          >
            <span>Show all</span>
          </div>
        </div>
      )}
    </div>
  );
}

