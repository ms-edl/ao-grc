/**
 * TooltipButton Component
 * 
 * A button component with integrated tooltip support.
 * Wraps any button with a tooltip that appears on hover.
 */

import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";

interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
  tooltipSideOffset?: number;
  children: React.ReactNode;
}

export const TooltipButton = React.forwardRef<HTMLButtonElement, TooltipButtonProps>(
  ({ tooltip, tooltipSide = "bottom", tooltipAlign = "center", tooltipSideOffset = 8, children, className, ...props }, ref) => {
    // If no tooltip is provided, just render the button
    if (!tooltip) {
      return (
        <button ref={ref} className={className} {...props}>
          {children}
        </button>
      );
    }

    // Render button with tooltip
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button ref={ref} className={className} {...props}>
              {children}
            </button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide} align={tooltipAlign} sideOffset={tooltipSideOffset}>
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

TooltipButton.displayName = "TooltipButton";

