import React from 'react';

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  isHidden?: boolean;
}

interface ChartLegendProps {
  items: LegendItem[];
  onToggleItem: (id: string) => void;
  onFocusItem?: (id: string) => void;
  onShowAll: () => void;
  
  // Hover state
  hoveredItem: string | null;
  onMouseEnter: (id: string, isHidden: boolean) => void;
  onMouseLeave: () => void;
  
  // Tooltip
  showTooltipForItem: string | null;
  tooltipText?: string;
  
  // Focus mode
  focusedItem: string | null;
  onExitFocus?: () => void;
  
  // Customization
  showFocusMode?: boolean;
  className?: string;
}

export function ChartLegend({
  items,
  onToggleItem,
  onFocusItem,
  onShowAll,
  hoveredItem: _hoveredItem,
  onMouseEnter,
  onMouseLeave,
  showTooltipForItem,
  tooltipText,
  focusedItem,
  onExitFocus,
  showFocusMode = true,
  className = '',
}: ChartLegendProps) {
  const hiddenCount = items.filter(item => item.isHidden).length;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const modifierKey = isMac ? '⌥' : 'Alt';
  const defaultTooltipText = `${modifierKey} + Click to focus`;

  if (focusedItem) {
    const focusedItemData = items.find(item => item.id === focusedItem);
    if (!focusedItemData) return null;

    return (
      <div className={`w-full flex items-center gap-2 ${className}`}>
        <div className="flex items-center rounded" style={{ padding: "4px 8px", gap: "4px" }}>
          <span
            className="inline-block rounded-full flex-shrink-0"
            style={{ width: 8, height: 8, backgroundColor: focusedItemData.color }}
          />
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

  return (
    <div className={`w-full flex flex-wrap items-center justify-start text-content-secondary text-xs ${className}`} style={{ gap: "4px 4px" }}>
      {items.map((item) => (
        <div key={item.id} className="relative group">
          <div 
            className="flex items-center hover:bg-surface-action-hover transition-colors rounded cursor-pointer" 
            style={{ 
              padding: "4px 8px",
              opacity: item.isHidden ? 0.4 : 1,
              gap: "4px",
              minWidth: 0
            }}
            onMouseEnter={() => onMouseEnter(item.id, !!item.isHidden)}
            onMouseLeave={onMouseLeave}
            onClick={(e) => {
              if (showFocusMode && e.altKey && onFocusItem) {
                onFocusItem(item.id);
              } else {
                onToggleItem(item.id);
              }
            }}
          >
            <span
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 8, height: 8, backgroundColor: item.color }}
            />
            <span 
              className="truncate" 
              style={{ 
                maxWidth: '160px',
                textDecoration: item.isHidden ? 'line-through' : 'none'
              }}
            >
              {item.label}
            </span>
          </div>
          
          {/* Isolate/Focus Tooltip */}
          {showFocusMode && showTooltipForItem === item.id && (
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface-tile rounded text-xs text-content-primary whitespace-nowrap shadow-md absolute-gradient-border"
              style={{ pointerEvents: 'none', zIndex: 50 }}
            >
              {tooltipText || defaultTooltipText}
            </div>
          )}
        </div>
      ))}
      
      {hiddenCount > 0 && (
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

