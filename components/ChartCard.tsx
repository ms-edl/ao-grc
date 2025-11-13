import { ReactNode } from 'react';

interface ChartCardProps {
  header: ReactNode;
  legend: ReactNode;
  legendActions?: ReactNode; // Optional second legend row for toggles/actions
  children: ReactNode;
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
 */
export default function ChartCard({ 
  header,
  legend,
  legendActions,
  children 
}: ChartCardProps) {
  return (
    <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ overflow: "visible", width: "864px" }}>
      {/* Header container with padding */}
      <div className="p-5 flex flex-col items-start gap-3">
        {/* Title row with actions */}
        {header}

        {/* Legend row */}
        {legend}

        {/* Optional legend actions row (e.g., Avg/Min/Max toggle) */}
        {legendActions}
      </div>

      {/* Chart container with padding */}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

