import { ReactNode } from 'react';
import { ResizeHandleVertical } from './ui/resize-handle-vertical';

interface ChartCardProps {
  header: ReactNode;
  legend: ReactNode;
  legendActions?: ReactNode; // Optional second legend row for toggles/actions
  children: ReactNode;
  variant?: 'default' | 'drawer'; // Variant for different display contexts
  showResizeHandle?: boolean; // Show vertical resize handle (drawer only)
  onHeightChange?: (deltaY: number) => void; // Callback when height changes
}

/**
 * ChartCard - Base component for chart layout structure
 * Enforces consistent layout with two separate containers:
 * 1. Header container (p-5) with title, metric selector, and actions
 * 2. Chart container with legend and chart content
 * 
 * Props:
 * - header: Title row with metric selector and action buttons
 * - legend: Primary legend row (device/metric indicators)
 * - legendActions: Optional second legend row for toggles (Avg/Min/Max, etc.)
 * - children: Chart content
 * - variant: 'default' (fixed width) or 'drawer' (full width)
 * - showResizeHandle: Show vertical resize handle at bottom (drawer only)
 * - onHeightChange: Callback when height changes via resize handle
 */
export default function ChartCard({ 
  header,
  legend,
  legendActions,
  children,
  variant = 'default',
  showResizeHandle = false,
  onHeightChange
}: ChartCardProps) {
  const widthStyle = variant === 'drawer' 
    ? { overflow: "visible", width: "100%", maxWidth: "100%" } 
    : { overflow: "visible", width: "864px" };

  return (
    <div className="bg-surface-tile chart-gradient-border rounded-lg relative" style={widthStyle}>
      {/* Header container with padding */}
      <div className="p-5 flex flex-col items-start gap-3">
        {/* Title row with actions */}
        {header}

        {/* Legend row */}
        {legend}

        {/* Optional legend actions row (e.g., Avg/Min/Max, etc.) */}
        {legendActions}
      </div>

      {/* Chart container with padding */}
      <div className="p-5">
        {children}
      </div>

      {/* Resize handle - only visible in drawer variant */}
      {showResizeHandle && variant === 'drawer' && onHeightChange && (
        <ResizeHandleVertical onResize={onHeightChange} />
      )}
    </div>
  );
}

