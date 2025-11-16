import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { Kbd } from './kbd';

export interface GraphLegendItemProps {
  /**
   * Item ID
   */
  id: string;
  
  /**
   * Item label
   */
  label: string;
  
  /**
   * Color for circular indicator (mutually exclusive with dashArray)
   * If provided, shows a circular dot with this color
   */
  color?: string;
  
  /**
   * Dash pattern for line indicator (mutually exclusive with color)
   * If provided, shows a line with content-tertiary color
   * undefined = solid line
   */
  dashArray?: string;
  
  /**
   * Whether the item is hidden/disabled
   */
  isHidden?: boolean;
  
  /**
   * Click handler for toggling
   */
  onClick?: (e: React.MouseEvent) => void;
  
  /**
   * Hover enter handler
   */
  onMouseEnter?: () => void;
  
  /**
   * Hover leave handler
   */
  onMouseLeave?: () => void;
  
  /**
   * Focus handler (Alt+Click)
   */
  onFocus?: () => void;
  
  /**
   * Whether to show focus mode tooltip
   */
  showFocusMode?: boolean;
  
  className?: string;
}

/**
 * GraphLegendItem - Unified legend item component
 * 
 * Features:
 * - Supports both circular dot and line indicators
 * - Hover effects and click interactions
 * - Alt+Click focus mode support
 * - Tooltip with keyboard shortcut hint
 * - Hidden state with visual feedback
 * 
 * Usage:
 * - Pass `color` for circular dot indicator (for metrics/devices)
 * - Pass `dashArray` for line indicator (for line styles/bands)
 */
export function GraphLegendItem({
  id,
  label,
  color,
  dashArray,
  isHidden = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  showFocusMode = false,
  className = '',
}: GraphLegendItemProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  const hasLineIndicator = dashArray !== undefined || (color === undefined && dashArray === undefined);
  
  const handleClick = (e: React.MouseEvent) => {
    if (showFocusMode && e.altKey && onFocus) {
      onFocus();
    } else {
      onClick?.(e);
    }
  };
  
  const content = (
    <div
      className={`flex items-center hover:bg-surface-action-hover transition-colors rounded cursor-pointer ${className}`}
      style={{
        padding: "4px 8px",
        opacity: isHidden ? 0.4 : 1,
        gap: hasLineIndicator ? "8px" : "4px",
        minWidth: 0
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
    >
      {/* Indicator: Circle or Line */}
      {hasLineIndicator ? (
        /* Line indicator for band types */
        <svg width="16" height="2" className="flex-shrink-0">
          <line
            x1="0"
            y1="1"
            x2="16"
            y2="1"
            stroke="rgb(var(--content-secondary))"
            strokeWidth="2"
            strokeDasharray={dashArray}
          />
        </svg>
      ) : (
        /* Circular dot for metrics/devices */
        <span
          className="inline-block rounded-full flex-shrink-0"
          style={{ width: 8, height: 8, backgroundColor: color }}
        />
      )}
      
      {/* Label */}
      <span
        className="text-content-secondary text-xs truncate"
        style={{
          maxWidth: '160px',
          textDecoration: isHidden ? 'line-through' : 'none'
        }}
      >
        {label}
      </span>
    </div>
  );
  
  // Wrap with tooltip if focus mode is enabled
  if (showFocusMode && onFocus) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <span className="inline-flex items-center gap-1.5">
              <Kbd style={{ marginLeft: '-4px' }}>{isMac ? '⌥' : 'Alt'}</Kbd> + Click to focus
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return content;
}
