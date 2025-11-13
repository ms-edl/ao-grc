"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { XIcon } from "./icons"
import { TooltipButton } from "./tooltip-button"
import { Kbd } from "./kbd"

interface ChartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  closeButtonTooltip?: React.ReactNode  // Tooltip content for the close button
}

/**
 * ChartDrawer - Right-side drawer using shadcn/vaul
 * Configured for desktop right-side drawer (not mobile bottom drawer)
 */
export function ChartDrawer({
  open,
  onOpenChange,
  children,
  title = "Chart Comparison",
  closeButtonTooltip,
}: ChartDrawerProps) {
  // Default tooltip with Kbd component
  const defaultTooltip = (
    <span className="inline-flex items-center gap-1.5">
      Dismiss <Kbd style={{ marginRight: '-4px' }}>Esc</Kbd>
    </span>
  );

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      direction="right" // RIGHT-SIDE DRAWER!
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        {/* Backdrop */}
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-40 bg-black/50"
          style={{
            animation: 'fadeIn 0.2s ease-out',
          }}
        />

        {/* Drawer Content */}
        <DrawerPrimitive.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-surface-section",
            "sm:max-w-2xl", // Max width on desktop
            "outline-none"
          )}
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--surface-section)), rgb(var(--surface-section))),
              linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
            `,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gradient-border flex-shrink-0">
            <DrawerPrimitive.Title className="text-lg font-semibold text-content-primary">
              {title}
            </DrawerPrimitive.Title>
            <TooltipButton
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
              aria-label="Close drawer"
              tooltip={closeButtonTooltip ?? defaultTooltip}
              tooltipSide="left"
              tooltipAlign="center"
              tooltipSideOffset={12}
            >
              <XIcon className="h-4 w-4" />
            </TooltipButton>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

// Export trigger for use in other components
export const ChartDrawerTrigger = DrawerPrimitive.Trigger

