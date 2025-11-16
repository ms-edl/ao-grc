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
 * - Sidebar column: 256px width (legend)
 */
export function ChartDrawerContent({
  children,
  sidebar,
  mainPadding = '24px',
  sidebarPadding = '16px',
  className = '',
}: ChartDrawerContentProps) {
  return (
    <div className={`flex w-full h-full ${className}`} style={{ minHeight: 0, overflow: 'hidden' }}>
      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        style={{ padding: mainPadding, minWidth: 0 }}
      >
        {children}
      </div>
      
      {/* Sidebar (Legend) */}
      {sidebar && (
        <div
          className="flex-shrink-0 border-l border-gradient-border overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden"
          style={{
            width: '288px',
            padding: sidebarPadding,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {sidebar}
        </div>
      )}
    </div>
  );
}

