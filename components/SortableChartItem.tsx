import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactNode, cloneElement, isValidElement } from 'react';

interface SortableChartItemProps {
  id: string;
  children: ReactNode;
}

/**
 * SortableChartItem - Wrapper for individual charts with drag & drop functionality
 * 
 * Features:
 * - Uses @dnd-kit's useSortable hook
 * - Manages drag state (isDragging, isOver)
 * - Applies transform and transition styles
 * - Renders drop zone overlay when dragging over
 * - Semi-transparent during drag (opacity: 0.5)
 * - Passes dragHandleProps to children
 */
export function SortableChartItem({ id, children }: SortableChartItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease-in-out',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  // Clone children and pass drag handle props
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as any, {
        showDragHandle: true,
        dragHandleProps: {
          ...attributes,
          ...listeners,
        },
        isDragging,
      })
    : children;

  return (
    <div ref={setNodeRef} style={style} className="group">
      {/* Drop zone overlay - shown when dragging over */}
      {isOver && !isDragging && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg transition-all duration-150 ease-in-out z-10"
          style={{
            border: '2px dashed rgb(var(--border-accent))',
            backgroundColor: 'rgba(var(--surface-hover), 0.5)',
          }}
        />
      )}
      
      {childrenWithProps}
    </div>
  );
}

