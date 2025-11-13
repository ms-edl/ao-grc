import { ReactNode } from 'react';
import { Icon } from './ui/icons';
import { TooltipButton } from './ui/tooltip-button';

// Re-export AoBtnFilter for convenience
export { AoBtnFilter } from './ui/ao-btn-filter';

interface ChartHeaderProps {
  title: string;
  metricButton?: ReactNode;
  actions?: ReactNode;
}

/**
 * ChartHeader - Shared header component for charts
 * 
 * Provides consistent layout:
 * - Left: Title + optional metric selector dropdown
 * - Right: Optional action buttons (filters, maximize, etc.)
 */
export default function ChartHeader({ title, metricButton, actions }: ChartHeaderProps) {
  return (
    <div className="w-full flex items-top justify-between relative">
      <div className="flex items-center gap-3">
        <h3 className="text-base font-semibold text-content-primary">{title}</h3>
        {metricButton}
      </div>
      
      {/* Actions container (right-aligned) */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
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
  return <div className="w-px h-5" style={{ backgroundColor: 'rgb(var(--border-border-flat))' }} />;
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

