/**
 * AoBtnFilter Component
 * 
 * A reusable filter button component with icon and count label.
 * 
 * @example
 * ```tsx
 * <AoBtnFilter
 *   iconName="wifi"
 *   countLabel="3/3"
 *   ariaLabel="WiFi Bands"
 *   tooltipText="Wi-Fi bands"
 *   onClick={() => console.log('clicked')}
 *   buttonRef={myButtonRef}
 * />
 * ```
 */

import React from 'react';
import { Icon } from './icons';
import { TooltipButton } from './tooltip-button';

export interface AoBtnFilterProps {
  /**
   * The name of the icon from feather-icons
   */
  iconName: string;
  /**
   * The count label to display (e.g., "3/3", "4/4")
   */
  countLabel: string;
  /**
   * The aria-label for accessibility
   */
  ariaLabel: string;
  /**
   * Optional tooltip text that appears on hover
   */
  tooltipText?: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Optional ref for the button element
   */
  buttonRef?: React.RefObject<HTMLButtonElement>;
  /**
   * Optional className to override or extend styles
   */
  className?: string;
}

export const AoBtnFilter: React.FC<AoBtnFilterProps> = ({
  iconName,
  countLabel,
  ariaLabel,
  tooltipText,
  onClick,
  buttonRef,
  className = '',
}) => {
  return (
    <TooltipButton
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary ${className}`}
      style={{ height: '32px', paddingLeft: '8px', paddingRight: '8px', gap: '4px' }}
      onClick={onClick}
      ref={buttonRef}
      tooltip={tooltipText}
      tooltipSide="bottom"
    >
      <Icon name={iconName} size={14} color="currentColor" />
      <span className="ui-12-book text-content-primary">
        {countLabel}
      </span>
    </TooltipButton>
  );
};

export default AoBtnFilter;

