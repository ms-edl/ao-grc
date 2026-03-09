"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { XIcon, Icon } from "./icons"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./resizable"
import { TooltipButton } from "./tooltip-button"
import { Kbd } from "./kbd"
import { AvailableWidget } from "./chart-drawer"

export interface ChartTag {
  id: string
  label: string
  onRemove?: (id: string) => void
}

export type MetricType = 'min' | 'avg' | 'max';

interface ResizableChartDrawerProps {
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
  defaultSize?: number  // Percentage of screen width (default: 50)
  minSize?: number      // Minimum percentage (default: 30)
  maxSize?: number      // Maximum percentage (default: 80)
  minWidth?: number     // Minimum width in pixels (default: 1080)
  closeButtonTooltip?: React.ReactNode  // Tooltip content for the close button
  bottomContent?: React.ReactNode  // Optional fixed content at bottom (e.g., global brush)
  availableWidgets?: AvailableWidget[]  // Available widgets to show in sidebar
  onWidgetSelect?: (widgetId: string) => void  // Handler for widget selection
  metricType?: MetricType  // Current metric type (min/avg/max)
  onMetricTypeChange?: (type: MetricType) => void  // Handler for metric type change
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
  deviceName,
  deviceType,
  deviceStatus,
  deviceAvatar,
  chartTags,
  onAddChart,
  defaultSize = 50,
  minSize = 30,
  maxSize = 80,
  minWidth = 1080,
  closeButtonTooltip,
  bottomContent,
  availableWidgets = [],
  onWidgetSelect,
  metricType,
  onMetricTypeChange,
}: ResizableChartDrawerProps) {
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isResizeHandleHovered, setIsResizeHandleHovered] = React.useState(false);

  // Calculate minSize percentage based on minWidth pixels and viewport width
  const [calculatedMinSize, setCalculatedMinSize] = React.useState(minSize);

  React.useEffect(() => {
    const updateMinSize = () => {
      const viewportWidth = window.innerWidth;
      const minSizePercentage = (minWidth / viewportWidth) * 100;
      // Use the larger of the provided minSize or calculated minSize
      setCalculatedMinSize(Math.max(minSize, minSizePercentage));
    };

    updateMinSize();
    window.addEventListener('resize', updateMinSize);
    return () => window.removeEventListener('resize', updateMinSize);
  }, [minWidth, minSize]);

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

  // Handle ESC key manually since dismissible={false}
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (isSidebarOpen) {
          setIsSidebarOpen(false);
        } else {
          onOpenChange(false);
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange, isSidebarOpen])

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
          className="fixed inset-0 z-40 bg-black/80"
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
              <div
                onMouseEnter={() => setIsResizeHandleHovered(true)}
                onMouseLeave={() => setIsResizeHandleHovered(false)}
              >
                <ResizableHandle 
                  withHandle 
                  className="absolute pointer-events-auto cursor-ew-resize transition-colors"
                  style={{ 
                    width: '32px',
                    left: '-32px',  // Offset 32px to the left
                    height: '100%'
                  }}
                />
              </div>
            </div>
            
            {/* Drawer Panel - controls the drawer width */}
            <ResizablePanel 
              defaultSize={defaultSize}
              minSize={calculatedMinSize}
              maxSize={maxSize}
              className="pointer-events-auto"
              id="chart-drawer"
            >
              {/* Drawer Content UI - fills the resizable panel */}
              <div
                className={cn(
                  "h-full w-full flex flex-col bg-surface-section relative",
                  "outline-none transition-all duration-200"
                )}
                style={{
                  ['--drawer-sidebar-width' as any]: '256px',
                  border: isResizeHandleHovered 
                    ? '1px solid rgb(var(--content-tertiary))'
                    : '1px solid rgb(var(--border-border-flat))',
                  overflowX: 'hidden',
                  overflowY: 'visible',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-gradient-border flex-shrink-0" style={{ background: 'rgb(var(--surface-tile))' }}>
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
                    // Legacy title with icon
                    <DrawerPrimitive.Title className="chart-title flex items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.7" d="M7.24235 11.0828C7.69086 9.40921 9.41117 7.6889 11.0848 7.24039L21.5188 4.44419C23.1924 3.99568 24.1855 4.98882 23.737 6.66242L20.9408 17.0964C20.4923 18.77 18.772 20.4903 17.0984 20.9388L6.66437 23.735C4.99077 24.1835 3.99764 23.1904 4.44614 21.5168L7.24235 11.0828Z" fill="rgb(var(--content-secondary))"/>
                        <path d="M3.05936 6.89971C3.50787 5.22611 5.22818 3.5058 6.90178 3.05729L17.3358 0.261088C19.0094 -0.187419 20.0025 0.805715 19.554 2.47932L16.7578 12.9133C16.3093 14.5869 14.589 16.3072 12.9154 16.7557L2.48139 19.5519C0.807789 20.0004 -0.185349 19.0073 0.263159 17.3337L3.05936 6.89971Z" fill="rgb(var(--content-secondary))"/>
                      </svg>
                      {title}
                    </DrawerPrimitive.Title>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    {/* Saved views button */}
                    <button type="button" className="drawer-action-button">
                      <Icon name="layout" size={16} />
                      <span className="ui-12-book">Saved views</span>
                    </button>

                    {/* Separator */}
                    <div className="drawer-button-separator" />

                    {/* Close button */}
                  <TooltipButton
                    type="button"
                    onClick={() => onOpenChange(false)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary flex-shrink-0"
                    aria-label="Close drawer"
                    tooltip={closeButtonTooltip ?? defaultTooltip}
                    tooltipSide="left"
                    tooltipAlign="center"
                    tooltipSideOffset={12}
                  >
                    <XIcon className="h-4 w-4" />
                  </TooltipButton>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto overflow-x-visible" style={{ paddingBottom: bottomContent ? '0' : '0' }}>
                    <div className="drawer-wrapper p-6 pb-[150px]" style={{ overflow: 'visible' }}>
                      {/* Chart Tags Section */}
                      {((chartTags && chartTags.length > 0) || onAddChart) && (
                        <div className="flex items-center gap-2 flex-wrap mb-6">
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
                      )}
                      
                      {children}
                      
                      {/* Add Widget Button */}
                      <button
                        type="button"
                        onClick={handleAddChartClick}
                        className="drawer-add-widget-button"
                        aria-label="Add widget"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 3.5V12.5M3.5 8H12.5" stroke="rgb(var(--content-primary))" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span 
                          className="text-content-primary font-medium"
                          style={{ fontSize: '14px', lineHeight: '20px' }}
                        >
                          Add widget
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Content (Fixed) */}
                {bottomContent && (
                  <div className="drawer-footer">
                    <div className="drawer-footer-gradient" />
                    <div className={`drawer-footer-content${isSidebarOpen ? ' is-sidebar-open' : ''}`}>
                      {bottomContent}
                    </div>
                  </div>
                )}

                {/* Widget Selector Sidebar */}
                {availableWidgets.length > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full bg-surface-section flex flex-col"
                    style={{
                      width: '256px',
                      backgroundImage: `
                        linear-gradient(rgb(var(--surface-section)), rgb(var(--surface-section))),
                        linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
                      `,
                      backgroundOrigin: 'border-box',
                      backgroundClip: 'padding-box, border-box',
                      borderRight: '1px solid transparent',
                      zIndex: 50,
                      transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                      pointerEvents: isSidebarOpen ? 'auto' : 'none',
                      transition: 'transform 300ms ease-in-out',
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

