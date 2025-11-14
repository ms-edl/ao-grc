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
  bottomContent?: React.ReactNode  // Optional fixed content at bottom (e.g., global brush)
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
  bottomContent,
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
                  "h-full w-full flex flex-col bg-surface-section border-l relative",
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
                  <DrawerPrimitive.Title className="flex items-center gap-2 font-semibold text-content-primary" style={{ fontSize: '1.25rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path opacity="0.7" d="M7.24235 11.0828C7.69086 9.40921 9.41117 7.6889 11.0848 7.24039L21.5188 4.44419C23.1924 3.99568 24.1855 4.98882 23.737 6.66242L20.9408 17.0964C20.4923 18.77 18.772 20.4903 17.0984 20.9388L6.66437 23.735C4.99077 24.1835 3.99764 23.1904 4.44614 21.5168L7.24235 11.0828Z" fill="rgb(var(--content-secondary))"/>
                      <path d="M3.05936 6.89971C3.50787 5.22611 5.22818 3.5058 6.90178 3.05729L17.3358 0.261088C19.0094 -0.187419 20.0025 0.805715 19.554 2.47932L16.7578 12.9133C16.3093 14.5869 14.589 16.3072 12.9154 16.7557L2.48139 19.5519C0.807789 20.0004 -0.185349 19.0073 0.263159 17.3337L3.05936 6.89971Z" fill="rgb(var(--content-secondary))"/>
                    </svg>
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
                <div className="flex-1 overflow-y-auto" style={{ paddingBottom: bottomContent ? '0' : '0' }}>
                  <div className="p-6">
                    {children}
                  </div>
                </div>

                {/* Bottom Content (Fixed) */}
                {bottomContent && (
                  <div 
                    className="flex-shrink-0 absolute bottom-0 left-0 right-0"
                    style={{ 
                      height: '100px',
                      overflow: 'visible',
                      zIndex: 1001,
                    }}
                  >
                    {/* Gradient Background Layer */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to bottom, rgb(var(--surface-section) / 0) 0%, rgb(var(--surface-section) / 1) 100%)',
                        zIndex: 1,
                      }}
                    />
                    {/* Brush Content Layer */}
                    <div className="px-6 py-4 h-full relative" style={{ zIndex: 2 }}>
                      {bottomContent}
                    </div>
                  </div>
                )}
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

