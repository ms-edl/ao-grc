import { ReactNode } from 'react';

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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ml-1.5"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
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
    <div className="relative group">
      <button
        type="button"
        aria-label="Maximise"
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
        onClick={onClick}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 21 3 21 3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="21" y1="3" x2="14" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="21" x2="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 translate-y-4 group-hover:translate-y-0 mb-2 px-2 py-1 rounded text-xs text-content-primary whitespace-nowrap transition-all duration-200 shadow-md absolute-gradient-border" style={{ backgroundColor: 'rgb(var(--surface-overlay))', zIndex: 50 }}>
        Maximise
      </div>
    </div>
  );
}

/**
 * FilterDivider - Visual divider between action groups
 */
export function FilterDivider() {
  return <div className="w-px h-5" style={{ backgroundColor: 'rgb(var(--border-border-flat))' }} />;
}

