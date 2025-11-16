"use client"

import * as React from "react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

// Simple drag handle icon (6 dots in 2 columns)
const DragHandleIcon = () => (
  <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
    <circle cx="2" cy="3" r="1.5" fill="currentColor" />
    <circle cx="2" cy="8" r="1.5" fill="currentColor" />
    <circle cx="2" cy="13" r="1.5" fill="currentColor" />
    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
  </svg>
)

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  style,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => {
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "group relative flex w-px items-center justify-center bg-gradient-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-surface-accent-purple focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      style={style}
      {...props}
    >
    {withHandle && (
      <div 
        className="opacity-0 group-hover:opacity-100"
        style={{
          transition: 'opacity 200ms ease-in-out',
          color: 'rgb(var(--content-primary))'
        }}
      >
        <DragHandleIcon />
      </div>
    )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
