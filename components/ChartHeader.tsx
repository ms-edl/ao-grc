import { ReactNode, useState } from 'react';
import { Icon } from './ui/icons';
import { TooltipButton } from './ui/tooltip-button';
import { DragHandle } from './ui/drag-handle';

// Re-export AoBtnFilter for convenience
export { AoBtnFilter } from './ui/ao-btn-filter';

export type MetricType = 'min' | 'avg' | 'max';

interface ChartHeaderProps {
  title: string;
  metricButton?: ReactNode;
  actions?: ReactNode;
  showDragHandle?: boolean;
  dragHandleProps?: any; // Props from @dnd-kit useSortable
  isDragging?: boolean;
  metricType?: MetricType;
  onMetricTypeChange?: (type: MetricType) => void;
}

/**
 * ChartHeader - Shared header component for charts
 * 
 * Provides consistent layout:
 * - Left: Title + optional metric selector dropdown
 * - Right: Optional metric type toggles + action buttons (filters, maximize, etc.) + optional drag handle
 */
export default function ChartHeader({ 
  title, 
  metricButton, 
  actions,
  showDragHandle = false,
  dragHandleProps,
  isDragging = false,
  metricType,
  onMetricTypeChange,
}: ChartHeaderProps) {
  const [isHandleHovered, setIsHandleHovered] = useState(false);

  return (
    <div className="chart-header">
      <div className="chart-header-left">
        <h3 className="chart-title">{title}</h3>
        {metricButton}
      </div>
      
      {/* Actions container (right-aligned) */}
      <div className="chart-header-right">
        {actions}
        
        {/* Drag handle - only shown when enabled */}
        {showDragHandle && (
          <div
            {...dragHandleProps}
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-opacity duration-150"
            onMouseEnter={() => setIsHandleHovered(true)}
            onMouseLeave={() => setIsHandleHovered(false)}
            title="Drag to reorder"
          >
              <DragHandle
                orientation="vertical"
                size="md"
            isDragging={isDragging}
                isActive={false}
                isHovered={isHandleHovered}
          />
            </div>
        )}
      </div>
    </div>
  );
}

/**
 * MetricButton - Standard metric selector button with dropdown icon
 */
interface MetricButtonProps {
  label: string;
  onClick?: () => void;
}

export function MetricButton({ label, onClick }: MetricButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center h-8 pl-3 pr-2 rounded-lg text-content-primary button-gradient-border"
      onClick={onClick}
    >
      <span className="text-xs font-medium">{label}</span>
      <Icon name="chevron-down" size={16} className="ml-1.5" />
    </button>
  );
}

/**
 * MaximizeButton - Standard maximize button with tooltip
 */
interface MaximizeButtonProps {
  onClick: () => void;
}

export function MaximizeButton({ onClick }: MaximizeButtonProps) {
  return (
    <TooltipButton
      type="button"
      aria-label="Maximise"
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
      onClick={onClick}
      tooltip="Maximise"
      tooltipSide="bottom"
    >
      <Icon name="maximize" size={16} />
    </TooltipButton>
  );
}

/**
 * FilterDivider - Visual divider between action groups
 */
export function FilterDivider() {
  return <div className="drawer-button-separator" />;
}

/**
 * SizeToggleButton - Toggle between chart sizes (sm/md)
 */
interface SizeToggleButtonProps {
  size: 'sm' | 'md';
  onSizeChange: (size: 'sm' | 'md') => void;
}

export function SizeToggleButton({ size, onSizeChange }: SizeToggleButtonProps) {
  return (
    <TooltipButton
      type="button"
      aria-label={size === 'sm' ? 'Expand chart' : 'Shrink chart'}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
      onClick={() => onSizeChange(size === 'sm' ? 'md' : 'sm')}
      tooltip={size === 'sm' ? 'Expand chart' : 'Shrink chart'}
      tooltipSide="bottom"
    >
      {size === 'sm' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 14 10 14 10 20" />
          <polyline points="20 10 14 10 14 4" />
          <line x1="14" y1="10" x2="21" y2="3" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      )}
    </TooltipButton>
  );
}

