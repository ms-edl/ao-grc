"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { XIcon } from "./icons"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable"
import { TooltipButton } from "./tooltip-button"
import { Kbd } from "./kbd"

interface ResizableChartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  defaultSize?: number  // Percentage of screen width (default: 50)
  minSize?: number      // Minimum percentage (default: 30)
  maxSize?: number      // Maximum percentage (default: 80)
  closeButtonTooltip?: React.ReactNode  // Tooltip content for the close button
}

/**
 * ResizableChartDrawer - Right-side drawer with resizable width
 * Uses react-resizable-panels for smooth resize interactions
 */
export function ResizableChartDrawer({
  open,
  onOpenChange,
  children,
  title = "Chart Comparison",
  defaultSize = 50,
  minSize = 30,
  maxSize = 80,
  closeButtonTooltip,
}: ResizableChartDrawerProps) {
  // Default tooltip with Kbd component
  const defaultTooltip = (
    <span className="inline-flex items-center gap-1.5">
      Dismiss <Kbd style={{ marginRight: '-4px' }}>Esc</Kbd>
    </span>
  );

  // Handle ESC key manually since dismissible={false}
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={true}
      dismissible={false}  // Disable all auto-dismiss (backdrop, drag, etc)
      direction="right"    // Right-side drawer animation
    >
      <DrawerPrimitive.Portal>
        {/* Backdrop - purely visual, non-interactive */}
        <DrawerPrimitive.Overlay
          className="fixed inset-0 z-40 bg-black/50"
        />

        {/* Outer wrapper for Vaul animations */}
        <DrawerPrimitive.Content
          className="fixed inset-0 z-50 pointer-events-none flex"
        >
          {/* Resizable Container - controls the drawer width */}
          <ResizablePanelGroup direction="horizontal">
            {/* Left empty space */}
            <ResizablePanel 
              defaultSize={100 - defaultSize}
              minSize={100 - maxSize}
              maxSize={100 - minSize}
              className="pointer-events-none"
            />
            
            {/* Resize handle - wrapped in zero-width container */}
            <div className="relative" style={{ width: 0 }}>
              <ResizableHandle 
                withHandle 
                className="absolute pointer-events-auto cursor-ew-resize hover:bg-content-tertiary/10 transition-colors"
                style={{ 
                  width: '32px',
                  left: '-32px',  // Offset 32px to the left
                  height: '100%'
                }}
              />
            </div>
            
            {/* Drawer Panel - controls the drawer width */}
            <ResizablePanel 
              defaultSize={defaultSize}
              minSize={minSize}
              maxSize={maxSize}
              className="pointer-events-auto"
              id="chart-drawer"
            >
              {/* Drawer Content UI - fills the resizable panel */}
              <div
                className={cn(
                  "h-full w-full flex flex-col bg-surface-section border-l",
                  "outline-none"
                )}
                style={{
                  borderLeftColor: 'rgb(var(--border-border-flat))',
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
                    type="button"
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
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

// Export the non-resizable version too for simpler cases
export { ChartDrawer } from "./chart-drawer"

