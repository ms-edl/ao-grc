import React, { ReactNode } from 'react';

interface ChartDrawerContentProps {
  /**
   * Main content (chart)
   */
  children: ReactNode;
  
  /**
   * Sidebar content (legend)
   */
  sidebar?: ReactNode;
  
  /**
   * Padding for main content area
   */
  mainPadding?: string;
  
  /**
   * Padding for sidebar area
   */
  sidebarPadding?: string;
  
  className?: string;
}

/**
 * ChartDrawerContent - 2-column layout for drawer charts
 * 
 * Layout:
 * - Main column: 100% width (header + chart)
 * - Sidebar column: 288px width (legend)
 */
export function ChartDrawerContent({
  children,
  sidebar,
  mainPadding,
  sidebarPadding,
  className = '',
}: ChartDrawerContentProps) {
  // Use semantic classes by default, allow override with props
  const mainClass = mainPadding === undefined ? 'drawer-content-main' : '';
  const mainStyle = mainPadding !== undefined ? { padding: mainPadding, minWidth: 0 } : { minWidth: 0 };
  
  const sidebarClass = sidebarPadding === undefined ? 'drawer-sidebar' : 'flex-shrink-0 border-l border-gradient-border overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden';
  const sidebarStyle = sidebarPadding !== undefined ? {
    width: 'var(--drawer-sidebar-width, 256px)',
    padding: sidebarPadding,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
  } : undefined;
  
  return (
    <div className={`flex w-full h-full ${className}`} style={{ minHeight: 0, overflow: 'visible' }}>
      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col overflow-visible ${mainClass}`}
        style={mainStyle}
      >
        {children}
      </div>
      
      {/* Sidebar (Legend) */}
      {sidebar && (
        <div
          className={sidebarClass}
          style={sidebarStyle}
        >
          {sidebar}
        </div>
      )}
    </div>
  );
}

