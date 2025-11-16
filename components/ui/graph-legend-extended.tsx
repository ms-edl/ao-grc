import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
import { Kbd } from './kbd';

export interface GraphLegendExtendedMetaValue {
  value: string | number;
  isActive?: boolean;
}

export interface GraphLegendExtendedProps {
  /**
   * Color for the 4px indicator bar
   */
  color: string;
  
  /**
   * Item label
   */
  label: string;
  
  /**
   * Flexible meta values array (e.g., min/avg/max, or any other metrics)
   */
  metaValues?: GraphLegendExtendedMetaValue[];
  
  /**
   * Whether the item is hidden/disabled
   */
  isHidden?: boolean;
  
  /**
   * Whether the item is focused (isolate mode)
   */
  isFocused?: boolean;
  
  /**
   * Whether to show focus mode tooltip
   */
  showFocusMode?: boolean;
  
  /**
   * Handler to exit focus mode
   */
  onExitFocus?: () => void;
  
  /**
   * Click handler for toggling
   */
  onClick?: (e: React.MouseEvent) => void;
  
  /**
   * Hover enter handler
   */
  onMouseEnter?: (e: React.MouseEvent) => void;
  
  /**
   * Hover leave handler
   */
  onMouseLeave?: (e: React.MouseEvent) => void;
  
  className?: string;
}

/**
 * GraphLegendExtended - Extended legend item for drawer sidebars
 * 
 * Features:
 * - 4px vertical color bar indicator
 * - Label with truncation
 * - Flexible meta values row with active state highlighting
 * - Hover and click interactions
 */
export function GraphLegendExtended({
  color,
  label,
  metaValues,
  isHidden = false,
  isFocused = false,
  showFocusMode = false,
  onExitFocus,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: GraphLegendExtendedProps) {
  const hasMetaValues = metaValues && metaValues.length > 0;
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');
  
  const content = (
    <div
      className={`flex items-start gap-3 cursor-pointer py-2 px-2 rounded-lg overflow-hidden ${className}`}
      style={{
        opacity: isHidden ? 0.4 : 1,
        backgroundColor: isFocused ? 'rgb(var(--surface-action-hover))' : 'transparent',
        transition: 'background-color 200ms ease-in-out',
      }}
      onMouseEnter={(e) => {
        if (!isFocused) {
        e.currentTarget.style.backgroundColor = 'rgb(var(--surface-action-hover))';
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (!isFocused) {
        e.currentTarget.style.backgroundColor = 'transparent';
        }
        onMouseLeave?.(e);
      }}
      onClick={(e) => onClick?.(e)}
    >
      {/* 4px Color Indicator - matches content height */}
      <div
        className="flex-shrink-0"
        style={{
          width: '4px',
          backgroundColor: color,
          borderRadius: '2px',
          alignSelf: 'stretch',
        }}
      />
      
      {/* Content */}
      <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
        {/* Label - truncate to 1 line */}
        <div
          className="text-content-primary font-medium overflow-hidden"
          style={{ 
            fontSize: '12px', 
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textDecoration: isHidden ? 'line-through' : 'none',
          }}
        >
          {label}
        </div>
        
        {/* Meta values with active highlight */}
          {!isHidden && hasMetaValues && (
          <div
              className="flex items-center gap-1 overflow-hidden"
              style={{ 
                fontSize: '12px', 
                lineHeight: '16px',
                whiteSpace: 'nowrap',
              }}
            >
              {metaValues.map((meta, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <span className="text-content-tertiary">·</span>
                  )}
                  <span 
                    className={meta.isActive ? 'text-content-primary' : 'text-content-tertiary'}
                  >
                    {meta.value}
                  </span>
                </React.Fragment>
              ))}
          </div>
        )}
        
        {/* Exit Focus Button - shown when focused */}
        {isFocused && onExitFocus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExitFocus();
            }}
            className="flex items-center justify-center gap-2 px-3 rounded-lg bg-surface-tile hover:bg-surface-action transition-colors text-content-primary font-medium chart-gradient-border"
            style={{ 
              fontSize: '12px',
              height: '28px',
              marginTop: '4px',
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Exit focus mode
          </button>
        )}
      </div>
    </div>
  );
  
  // Wrap with tooltip if focus mode is enabled and not already focused
  if (showFocusMode && onExitFocus && !isFocused) {
    return (
      <TooltipProvider delayDuration={1500}>
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

