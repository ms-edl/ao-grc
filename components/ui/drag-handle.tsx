import { HTMLAttributes } from 'react';
import { TooltipButton } from './tooltip-button';
import { cva, type VariantProps } from 'class-variance-authority';

const dragHandleVariants = cva(
  "drag-handle inline-flex items-center justify-center rounded-lg transition-opacity duration-150 hover:opacity-100",
  {
    variants: {
      orientation: {
        vertical: "flex-col",
        horizontal: "flex-row",
      },
      width: {
        sm: "w-6 h-6",
        md: "w-8 h-8",
        lg: "w-10 h-10",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      width: "md",
    },
  }
);

interface DragHandleProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof dragHandleVariants> {
  isDragging?: boolean;
}

/**
 * DragHandle - Reusable grip handle for drag & drop with orientation and size variants
 * 
 * Features:
 * - 6-dot grip icon (2x3 or 3x2 grid based on orientation)
 * - Always visible (opacity 0.3, increases to 1 on hover)
 * - Uses content-tertiary color
 * - Configurable size (sm/md/lg)
 * - Configurable orientation (vertical/horizontal)
 * - Cursor: grab/grabbing states
 */
export function DragHandle({ 
  isDragging, 
  orientation = "vertical",
  width = "md",
  className = '', 
  ...props 
}: DragHandleProps) {
  // Size configurations for different width variants
  const sizeConfig = {
    sm: { iconSize: 12, dotRadius: 1, spacing: { vertical: [4, 3, 8, 3, 12, 3], horizontal: [3, 4, 3, 8, 3, 12] } },
    md: { iconSize: 16, dotRadius: 1.5, spacing: { vertical: [5, 4, 11, 4, 5, 8, 11, 8, 5, 12, 11, 12], horizontal: [4, 5, 8, 5, 12, 5, 4, 11, 8, 11, 12, 11] } },
    lg: { iconSize: 20, dotRadius: 2, spacing: { vertical: [6, 5, 14, 5, 6, 10, 14, 10, 6, 15, 14, 15], horizontal: [5, 6, 10, 6, 15, 6, 5, 14, 10, 14, 15, 14] } },
  };

  const config = sizeConfig[width as keyof typeof sizeConfig] || sizeConfig.md;
  const isVertical = orientation === "vertical";

  return (
    <div
      className={dragHandleVariants({ orientation, width, className })}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        opacity: 0.3,
      }}
      {...props}
    >
      <svg
        width={config.iconSize}
        height={config.iconSize}
        viewBox={`0 0 ${config.iconSize} ${config.iconSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ color: 'rgb(var(--content-tertiary))' }}
      >
        {isVertical ? (
          // Vertical orientation: 2 columns, 3 rows (default)
          <>
            {/* Top row dots */}
            <circle cx={config.spacing.vertical[0]} cy={config.spacing.vertical[1]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.vertical[2]} cy={config.spacing.vertical[3]} r={config.dotRadius} fill="currentColor" />
            
            {/* Middle row dots */}
            <circle cx={config.spacing.vertical[4]} cy={config.spacing.vertical[5]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.vertical[6]} cy={config.spacing.vertical[7]} r={config.dotRadius} fill="currentColor" />
            
            {/* Bottom row dots */}
            <circle cx={config.spacing.vertical[8]} cy={config.spacing.vertical[9]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.vertical[10]} cy={config.spacing.vertical[11]} r={config.dotRadius} fill="currentColor" />
          </>
        ) : (
          // Horizontal orientation: 3 columns, 2 rows
          <>
            {/* Left column dots */}
            <circle cx={config.spacing.horizontal[0]} cy={config.spacing.horizontal[1]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.horizontal[2]} cy={config.spacing.horizontal[3]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.horizontal[4]} cy={config.spacing.horizontal[5]} r={config.dotRadius} fill="currentColor" />
            
            {/* Right column dots */}
            <circle cx={config.spacing.horizontal[6]} cy={config.spacing.horizontal[7]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.horizontal[8]} cy={config.spacing.horizontal[9]} r={config.dotRadius} fill="currentColor" />
            <circle cx={config.spacing.horizontal[10]} cy={config.spacing.horizontal[11]} r={config.dotRadius} fill="currentColor" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * DragHandleButton - DragHandle with tooltip wrapper
 * Use this when you need the tooltip functionality
 */
interface DragHandleButtonProps extends DragHandleProps {
  tooltip?: string;
}

export function DragHandleButton({ 
  isDragging, 
  orientation = "vertical",
  width = "md",
  tooltip = "Drag to reorder",
  className = '',
  ...props 
}: DragHandleButtonProps) {
  // Size configurations for different width variants
  const sizeConfig = {
    sm: { iconSize: 12, dotRadius: 1, spacing: { vertical: [4, 3, 8, 3, 12, 3], horizontal: [3, 4, 3, 8, 3, 12] } },
    md: { iconSize: 16, dotRadius: 1.5, spacing: { vertical: [5, 4, 11, 4, 5, 8, 11, 8, 5, 12, 11, 12], horizontal: [4, 5, 8, 5, 12, 5, 4, 11, 8, 11, 12, 11] } },
    lg: { iconSize: 20, dotRadius: 2, spacing: { vertical: [6, 5, 14, 5, 6, 10, 14, 10, 6, 15, 14, 15], horizontal: [5, 6, 10, 6, 15, 6, 5, 14, 10, 14, 15, 14] } },
  };

  const config = sizeConfig[width as keyof typeof sizeConfig] || sizeConfig.md;
  const isVertical = orientation === "vertical";

  return (
    <TooltipButton
      className={dragHandleVariants({ orientation, width, className })}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        opacity: 0.3,
      }}
      tooltip={tooltip}
      tooltipSide="bottom"
      asChild
    >
      <div {...props}>
        <svg
          width={config.iconSize}
          height={config.iconSize}
          viewBox={`0 0 ${config.iconSize} ${config.iconSize}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: 'rgb(var(--content-tertiary))' }}
        >
          {isVertical ? (
            // Vertical orientation: 2 columns, 3 rows (default)
            <>
              {/* Top row dots */}
              <circle cx={config.spacing.vertical[0]} cy={config.spacing.vertical[1]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.vertical[2]} cy={config.spacing.vertical[3]} r={config.dotRadius} fill="currentColor" />
              
              {/* Middle row dots */}
              <circle cx={config.spacing.vertical[4]} cy={config.spacing.vertical[5]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.vertical[6]} cy={config.spacing.vertical[7]} r={config.dotRadius} fill="currentColor" />
              
              {/* Bottom row dots */}
              <circle cx={config.spacing.vertical[8]} cy={config.spacing.vertical[9]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.vertical[10]} cy={config.spacing.vertical[11]} r={config.dotRadius} fill="currentColor" />
            </>
          ) : (
            // Horizontal orientation: 3 columns, 2 rows
            <>
              {/* Left column dots */}
              <circle cx={config.spacing.horizontal[0]} cy={config.spacing.horizontal[1]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.horizontal[2]} cy={config.spacing.horizontal[3]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.horizontal[4]} cy={config.spacing.horizontal[5]} r={config.dotRadius} fill="currentColor" />
              
              {/* Right column dots */}
              <circle cx={config.spacing.horizontal[6]} cy={config.spacing.horizontal[7]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.horizontal[8]} cy={config.spacing.horizontal[9]} r={config.dotRadius} fill="currentColor" />
              <circle cx={config.spacing.horizontal[10]} cy={config.spacing.horizontal[11]} r={config.dotRadius} fill="currentColor" />
            </>
          )}
        </svg>
      </div>
    </TooltipButton>
  );
}
