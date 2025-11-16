import { ReactNode, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableChartContainerProps {
  children: ReactNode;
  chartIds: string[];
  onReorder: (newOrder: string[]) => void;
}

/**
 * SortableChartContainer - Context provider for drag & drop chart reordering
 * 
 * Features:
 * - Uses DndContext from @dnd-kit/core
 * - Uses SortableContext with verticalListSortingStrategy
 * - Handles onDragEnd event with array reordering
 * - Uses closestCenter collision detection
 * - Smooth FLIP animations via @dnd-kit
 * - Keyboard accessibility support
 */
export function SortableChartContainer({
  children,
  chartIds,
  onReorder,
}: SortableChartContainerProps) {
  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = chartIds.indexOf(active.id as string);
        const newIndex = chartIds.indexOf(over.id as string);

        const newOrder = arrayMove(chartIds, oldIndex, newIndex);
        onReorder(newOrder);
      }
    },
    [chartIds, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={chartIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">{children}</div>
      </SortableContext>
    </DndContext>
  );
}

