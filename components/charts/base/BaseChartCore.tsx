import React, { ReactNode } from 'react';
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useTimeAxis } from '../../TimeAxis';
import { YAxisConfig, ChartMargin } from '../types/ChartTypes';

export interface BaseChartCoreProps<TData = any> {
  /**
   * Chart data array
   */
  data: TData[];
  
  /**
   * Key for X-axis (timestamp field)
   */
  xKey: string;
  
  /**
   * Y-axis configurations
   */
  yAxisConfig: YAxisConfig[];
  
  /**
   * Render function for line components
   */
  renderLines: () => ReactNode;
  
  /**
   * Render function for tooltip
   */
  renderTooltip: () => ReactNode;
  
  /**
   * Optional render function for reference elements (areas, lines, etc.)
   */
  renderReferenceElements?: () => ReactNode;
  
  /**
   * Chart height in pixels
   */
  height?: number;
  
  /**
   * Chart margins
   */
  margin?: ChartMargin;
  
  /**
   * Enable tooltip synchronization across charts
   */
  enableSync?: boolean;
  
  /**
   * Mouse move handler for sync
   */
  onMouseMove?: (state: any) => void;
  
  /**
   * Mouse leave handler for sync
   */
  onMouseLeave?: () => void;
  
  /**
   * Range for time axis calculation
   */
  startIndex?: number;
  endIndex?: number;
}

/**
 * BaseChartCore - Core chart rendering component
 * 
 * Handles:
 * - Recharts LineChart setup
 * - X-axis with time formatting
 * - Multiple Y-axes configuration
 * - Tooltip and grid
 * - Chart synchronization
 * 
 * Delegates line rendering and tooltip content to parent via render props
 */
export function BaseChartCore<TData = any>({
  data,
  xKey,
  yAxisConfig,
  renderLines,
  renderTooltip,
  renderReferenceElements,
  height = 256,
  margin = { top: 8, right: 32, left: 0, bottom: 8 },
  enableSync = false,
  onMouseMove,
  onMouseLeave,
  startIndex = 0,
  endIndex,
}: BaseChartCoreProps<TData>) {
  // Generate X-axis ticks using time axis hook
  const { ticks: xTicks, renderTick } = useTimeAxis({
    data,
    xKey,
    startIndex,
    endIndex: endIndex !== undefined ? endIndex : data.length - 1,
  });
  
  return (
    <div style={{ height, overflow: 'visible', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={margin}
          onMouseMove={enableSync ? onMouseMove : undefined}
          onMouseLeave={enableSync ? onMouseLeave : undefined}
          syncId={enableSync ? 'tooltipSync' : undefined}
          syncMethod="index"
        >
          {/* Grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border-border-flat))"
            vertical={false}
          />
          
          {/* X-Axis */}
          <XAxis
            dataKey={xKey}
            tickMargin={8}
            axisLine={false}
            tickLine={false}
            interval={0}
            ticks={xTicks as any}
            tick={renderTick as any}
          />
          
          {/* Y-Axes - configured dynamically */}
          {yAxisConfig.map((config) => (
            <YAxis
              key={config.id}
              yAxisId={config.id}
              orientation={config.orientation || 'left'}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              domain={config.domain}
              ticks={config.ticks}
              label={
                config.label
                  ? {
                      value: config.label,
                      angle: config.orientation === 'right' ? 90 : -90,
                      position: config.orientation === 'right' ? 'insideRight' : 'insideLeft',
                      style: { fill: 'rgb(var(--content-tertiary))', fontSize: 12 },
                    }
                  : undefined
              }
              tick={{
                fontSize: 11,
                fill: 'rgb(var(--content-tertiary))',
                style: { userSelect: 'none' } as any,
              }}
              width={config.width || 50}
            />
          ))}
          
          {/* Tooltip */}
          <Tooltip
            content={renderTooltip()}
            cursor={{ stroke: 'rgb(var(--border-border-flat))' }}
            offset={12}
            allowEscapeViewBox={{ x: false, y: true }}
            isAnimationActive={false}
            wrapperStyle={{ zIndex: 1000 }}
            position={{ y: 0 }}
          />
          
          {/* Reference elements (areas, lines, etc.) */}
          {renderReferenceElements?.()}
          
          {/* Lines - rendered by parent */}
          {renderLines()}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

