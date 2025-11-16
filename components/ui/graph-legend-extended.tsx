import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
   * Click handler for toggling
   */
  onClick?: () => void;
  
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
 * - Smooth animations with framer-motion
 * - Hover and click interactions
 */
export function GraphLegendExtended({
  color,
  label,
  metaValues,
  isHidden = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}: GraphLegendExtendedProps) {
  const hasMetaValues = metaValues && metaValues.length > 0;
  
  return (
    <motion.div
      layout
      className={`flex items-start gap-3 cursor-pointer py-2 px-2 rounded-lg overflow-hidden ${className}`}
      style={{
        opacity: isHidden ? 0.4 : 1,
        transition: 'background-color 200ms ease-in-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgb(var(--surface-action-hover))';
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        onMouseLeave?.(e);
      }}
      onClick={onClick}
    >
      {/* 4px Color Indicator - matches content height */}
      <motion.div
        layout
        className="flex-shrink-0"
        style={{
          width: '4px',
          backgroundColor: color,
          borderRadius: '2px',
          alignSelf: 'stretch',
        }}
      />
      
      {/* Content */}
      <motion.div layout className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
        {/* Label - truncate to 1 line */}
        <motion.div
          layout
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
        </motion.div>
        
        {/* Meta values with active highlight and animation */}
        <AnimatePresence initial={false}>
          {!isHidden && hasMetaValues && (
            <motion.div
              initial={{ height: 0, opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              animate={{ height: 'auto', opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ height: 0, opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              transition={{ 
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="flex items-center gap-1 overflow-hidden"
              style={{ 
                fontSize: '12px', 
                lineHeight: '16px',
                whiteSpace: 'nowrap',
                originY: 0,
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

