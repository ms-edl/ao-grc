/**
 * Kbd Component
 * 
 * Display keyboard shortcuts with OS detection.
 * Supports single keys or shortcut arrays.
 * 
 * @example
 * ```tsx
 * <Kbd>K</Kbd>
 * <Kbd shortcut={["⌘", "K"]} />
 * ```
 */

import * as React from "react";
import { cn } from "../../src/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Shortcut as an array of keys (e.g., ["⌘", "K"])
   */
  shortcut?: string[];
  /**
   * Single key or text content
   */
  children?: React.ReactNode;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, shortcut, children, ...props }, ref) => {
    const content = shortcut ? (
      <>
        {shortcut.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="mx-0.5">+</span>}
            <kbd
              className={cn(
                "inline-flex items-center justify-center rounded px-1.5 py-0.5",
                "text-xs font-medium text-content-secondary",
                "button-gradient-border",
                "font-mono",
                "transition-colors duration-200 ease-in-out"
              )}
              style={{
                backgroundColor: "rgb(var(--surface-action))",
              }}
            >
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </>
    ) : (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded px-1.5 py-0.5",
          "text-xs font-medium text-content-secondary",
          "button-gradient-border",
          "font-mono",
          "transition-colors duration-200 ease-in-out",
          className
        )}
        style={{
          backgroundColor: "rgb(var(--surface-action))",
          fontSize: "10px",
        }}
        {...props}
      >
        {children}
      </kbd>
    );

    return shortcut ? <span className="inline-flex items-center">{content}</span> : content;
  }
);

Kbd.displayName = "Kbd";

export { Kbd };

