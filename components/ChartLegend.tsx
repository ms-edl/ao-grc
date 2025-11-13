import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { Kbd } from './ui/kbd';

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
  focusedItem,
  onExitFocus,
  showFocusMode = true,
  className = '',
}: ChartLegendProps) {
  const hiddenCount = items.filter(item => item.isHidden).length;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

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
        <TooltipProvider key={item.id} delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            {showFocusMode && (
              <TooltipContent side="bottom">
                <span className="inline-flex items-center gap-1.5">
                  <Kbd style={{ marginLeft: '-4px' }}>{isMac ? '⌥' : 'Alt'}</Kbd> + Click to focus
                </span>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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

