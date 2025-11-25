"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { XIcon } from "./icons"
import { TooltipButton } from "./tooltip-button"
import { Kbd } from "./kbd"

interface ChartTag {
  id: string
  label: string
  onRemove?: (id: string) => void
}

export interface AvailableWidget {
  id: string
  label: string
  category: string
  description?: string
}

interface ChartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  deviceName?: string
  deviceType?: string
  deviceStatus?: string
  deviceAvatar?: string | React.ReactNode
  chartTags?: ChartTag[]  // Chart tags to display below header
  onAddChart?: () => void  // Handler for "+" button
  closeButtonTooltip?: React.ReactNode  // Tooltip content for the close button
  availableWidgets?: AvailableWidget[]  // Available widgets to show in sidebar
  onWidgetSelect?: (widgetId: string) => void  // Handler for widget selection
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
  deviceName,
  deviceType,
  deviceStatus,
  deviceAvatar,
  chartTags,
  onAddChart,
  closeButtonTooltip,
  availableWidgets = [],
  onWidgetSelect,
}: ChartDrawerProps) {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Default tooltip with Kbd component
  const defaultTooltip = (
    <span className="inline-flex items-center gap-1.5">
      Dismiss <Kbd style={{ marginRight: '-4px' }}>Esc</Kbd>
    </span>
  );

  // Group widgets by category
  const groupedWidgets = React.useMemo(() => {
    const groups: Record<string, AvailableWidget[]> = {};
    availableWidgets.forEach(widget => {
      if (!groups[widget.category]) {
        groups[widget.category] = [];
      }
      groups[widget.category].push(widget);
    });
    return groups;
  }, [availableWidgets]);

  // Filter widgets based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedWidgets;
    
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, AvailableWidget[]> = {};
    
    Object.entries(groupedWidgets).forEach(([category, widgets]) => {
      const matchingWidgets = widgets.filter(widget =>
        widget.label.toLowerCase().includes(query) ||
        widget.description?.toLowerCase().includes(query)
      );
      if (matchingWidgets.length > 0) {
        filtered[category] = matchingWidgets;
      }
    });
    
    return filtered;
  }, [groupedWidgets, searchQuery]);

  // Handle add chart button click
  const handleAddChartClick = () => {
    if (onAddChart) {
      onAddChart();
    }
    setIsSidebarOpen(true);
  };

  // Handle widget selection
  const handleWidgetSelect = (widgetId: string) => {
    if (onWidgetSelect) {
      onWidgetSelect(widgetId);
    }
    setIsSidebarOpen(false);
    setSearchQuery("");
  };

  // Close sidebar when drawer closes
  React.useEffect(() => {
    if (!open) {
      setIsSidebarOpen(false);
      setSearchQuery("");
    }
  }, [open]);

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
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-surface-section border",
            "sm:max-w-2xl", // Max width on desktop
            "outline-none"
          )}
          style={{
            padding: '8px',
            borderRadius: '24px',
            borderColor: 'rgb(var(--border-border-flat))',
            backgroundImage: `
              linear-gradient(rgb(var(--surface-section)), rgb(var(--surface-section))),
              linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
            `,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gradient-border flex-shrink-0">
            {/* Use device layout if deviceName is provided, otherwise use legacy title */}
            {deviceName ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Device Avatar */}
                <div 
                  className="flex-shrink-0 w-[40px] h-[40px] overflow-hidden flex items-center justify-center"
                  style={{
                    borderRadius: '8px',
                    padding: '4px',
                    backgroundImage: `
                      linear-gradient(rgb(var(--surface-action)), rgb(var(--surface-action))),
                      linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    border: '1px solid transparent',
                  }}
                >
                  {typeof deviceAvatar === 'string' ? (
                    <img 
                      src={deviceAvatar} 
                      alt={deviceName}
                      className="w-full h-full object-cover"
                      style={{ borderRadius: '4px' }}
                    />
                  ) : deviceAvatar ? (
                    deviceAvatar
                  ) : (
                    // Default device icon
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="rgb(var(--content-secondary))" strokeWidth="1.5" fill="none"/>
                      <path d="M2 9h20" stroke="rgb(var(--content-secondary))" strokeWidth="1.5"/>
                      <circle cx="6" cy="6.5" r="0.5" fill="rgb(var(--content-secondary))"/>
                      <circle cx="8" cy="6.5" r="0.5" fill="rgb(var(--content-secondary))"/>
                      <circle cx="10" cy="6.5" r="0.5" fill="rgb(var(--content-secondary))"/>
                    </svg>
                  )}
                </div>

                {/* Device Info */}
                <div className="flex-1 min-w-0">
                  <DrawerPrimitive.Title 
                    className="chart-title truncate"
                  >
                    {deviceName}
                  </DrawerPrimitive.Title>
                  {(deviceType || deviceStatus) && (
                    <div 
                      className="flex items-center gap-2 text-content-secondary"
                      style={{ fontSize: '12px', lineHeight: '16px', marginTop: '4px' }}
                    >
                      {deviceType && <span>{deviceType}</span>}
                      {deviceType && deviceStatus && (
                        <span className="opacity-50">·</span>
                      )}
                      {deviceStatus && <span>{deviceStatus}</span>}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Legacy title without icon
              <DrawerPrimitive.Title className="chart-title">
                {title}
              </DrawerPrimitive.Title>
            )}

            <TooltipButton
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary flex-shrink-0 ml-4"
              aria-label="Close drawer"
              tooltip={closeButtonTooltip ?? defaultTooltip}
              tooltipSide="left"
              tooltipAlign="center"
              tooltipSideOffset={12}
            >
              <XIcon className="h-4 w-4" />
            </TooltipButton>
          </div>

          {/* Chart Tags Section */}
          {(chartTags && chartTags.length > 0) || onAddChart ? (
            <div className="px-6 py-3 border-b border-gradient-border flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Add Chart Button */}
                {onAddChart && (
                  <button
                    type="button"
                    onClick={handleAddChartClick}
                    className="flex-shrink-0 flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '8px',
                      backgroundImage: `
                        linear-gradient(rgb(var(--surface-action)), rgb(var(--surface-action))),
                        linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                      `,
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      border: '1px solid transparent',
                    }}
                    aria-label="Add chart"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3.5V12.5M3.5 8H12.5" stroke="rgb(var(--content-primary))" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}

                {/* Chart Tags */}
                {chartTags?.map((tag) => (
                  <div
                    key={tag.id}
                    className="chart-tag"
                  >
                    <span className="chart-tag-label">
                      {tag.label}
                    </span>
                    {tag.onRemove && (
                      <button
                        type="button"
                        onClick={() => tag.onRemove?.(tag.id)}
                        className="chart-tag-remove"
                        aria-label={`Remove ${tag.label}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M9 3L3 9M3 3L9 9" stroke="rgb(var(--content-primary))" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Widget Selector Sidebar */}
          {availableWidgets.length > 0 && (
            <div
              className="absolute top-0 left-0 h-full bg-surface-section flex flex-col transition-transform duration-300 ease-in-out"
              style={{
                width: '256px',
                backgroundImage: `
                  linear-gradient(rgb(var(--surface-section)), rgb(var(--surface-section))),
                  linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                `,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                borderRight: '1px solid transparent',
                zIndex: isSidebarOpen ? 10 : -1,
                transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                pointerEvents: isSidebarOpen ? 'auto' : 'none',
              }}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gradient-border flex-shrink-0">
                <h3 className="text-content-primary font-semibold" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  Add widget
                </h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary flex-shrink-0"
                  aria-label="Close sidebar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gradient-border flex-shrink-0">
                <div
                  className="relative w-full rounded-lg overflow-hidden transition-colors group"
                  style={{
                    height: '32px',
                    backgroundImage: `
                      linear-gradient(rgb(var(--surface-action)), rgb(var(--surface-action))),
                      linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundImage = `
                      linear-gradient(rgb(var(--surface-action-hover)), rgb(var(--surface-action-hover))),
                      linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundImage = `
                      linear-gradient(rgb(var(--surface-action)), rgb(var(--surface-action))),
                      linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                    `;
                  }}
                >
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary pointer-events-none"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-full bg-transparent border-none outline-none text-content-primary placeholder:text-content-tertiary"
                    style={{
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              {/* Widget List */}
              <div 
                className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {Object.entries(filteredGroups).map(([category, widgets]) => (
                  <div 
                    key={category} 
                    className="p-4 border-b border-gradient-border last:border-b-0"
                  >
                    <h4
                      className="text-content-tertiary uppercase mb-3"
                      style={{ fontSize: '12px', lineHeight: '16px', fontWeight: 500, letterSpacing: '0.5px', marginLeft: '12px', marginTop: '4px' }}
                    >
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {widgets.map((widget) => (
                        <button
                          key={widget.id}
                          onClick={() => handleWidgetSelect(widget.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-left group"
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-content-primary truncate"
                              style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 500 }}
                            >
                              {widget.label}
                            </div>
                            {widget.description && (
                              <div
                                className="text-content-tertiary truncate mt-0.5"
                                style={{ fontSize: '12px', lineHeight: '16px' }}
                              >
                                {widget.description}
                              </div>
                            )}
                          </div>
                          <svg
                            className="flex-shrink-0 text-content-tertiary group-hover:text-content-primary transition-colors"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(filteredGroups).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-content-tertiary" style={{ fontSize: '14px' }}>
                      No widgets found
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  )
}

// Export trigger for use in other components
export const ChartDrawerTrigger = DrawerPrimitive.Trigger

