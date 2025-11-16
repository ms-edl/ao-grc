import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dragHandleVariants = cva(
  "drag-handle rounded-full transition-all duration-150",
  {
    variants: {
      orientation: {
        horizontal: "",
        vertical: "",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    compoundVariants: [
      // Horizontal orientation: width x 4px height
      { orientation: "horizontal", size: "sm", class: "w-3 h-1" },      // 12x4
      { orientation: "horizontal", size: "md", class: "w-6 h-1" },      // 24x4
      { orientation: "horizontal", size: "lg", class: "w-8 h-1" },      // 32x4
      // Vertical orientation: 4px width x height
      { orientation: "vertical", size: "sm", class: "w-1 h-3" },        // 4x12
      { orientation: "vertical", size: "md", class: "w-1 h-6" },        // 4x24
      { orientation: "vertical", size: "lg", class: "w-1 h-8" },        // 4x32
    ],
    defaultVariants: {
      orientation: "horizontal",
      size: "md",
    },
  }
);

interface DragHandleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>, VariantProps<typeof dragHandleVariants> {
  /**
   * Whether the handle is being actively dragged
   */
  isDragging?: boolean;
/**
   * Whether the handle should be visible (e.g., when parent element is hovered)
   * inactive: opacity 0
   * active: opacity 1
   */
  isActive?: boolean;
  /**
   * Whether the handle itself is being hovered
   * hover: changes color to content-primary
   */
  isHovered?: boolean;
}

/**
 * DragHandle - Simple rounded bar handle for drag & drop interactions
 * 
 * Design:
 * - Rounded bar (no icon)
 * - Horizontal: 12/24/32 x 4px
 * - Vertical: 4 x 12/24/32px
 * 
 * States:
 * - inactive: content-tertiary, opacity: 0
 * - active: content-tertiary, opacity: 1
 * - hover: content-primary, opacity: 1
 */
export function DragHandle({ 
  isDragging, 
  isActive = false,
  isHovered = false,
  orientation = "horizontal",
  size = "md",
  className = '',
  ...props 
}: DragHandleProps) {
  // Determine state-based styles
  const getOpacity = () => {
    if (isHovered || isDragging) return 1;
    if (isActive) return 1;
    return 0;
  };

  const getBackgroundColor = () => {
    if (isHovered || isDragging) {
      return 'rgb(var(--content-primary))';
    }
    return 'rgb(var(--content-tertiary))';
  };

  return (
    <div
      className={cn(dragHandleVariants({ orientation, size }), className)}
      style={{
        backgroundColor: getBackgroundColor(),
        opacity: getOpacity(),
        touchAction: 'none',
        pointerEvents: 'none', // Let parent handle pointer events
      }}
      {...props}
    />
  );
}
