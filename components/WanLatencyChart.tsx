import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ExternalBrush } from "./ExternalBrush";
import { ResizableChartDrawer } from "./ui/resizable-chart-drawer";
import { ResizeHandleVertical } from "./ui/resize-handle-vertical";
import ChartCard from "./ChartCard";
import { useTimeAxis, toDate } from "./TimeAxis";
import ChartHeader, { MetricButton, MaximizeButton } from "./ChartHeader";
import ChartDrawerHeader from "./ChartDrawerHeader";
import { ChartDrawerContent } from "./ChartDrawerContent";
import { ChartDrawerLegend, DrawerLegendItem } from "./ChartDrawerLegend";
import { useChartTheme } from "./hooks/useChartTheme";
import { useChartLegendHover } from "./hooks/useChartLegendHover";
import { GraphLegend } from "./ui/graph-legend";
import { useChartLineStyle } from "./hooks/useChartLineStyle";
import { ChartReferenceLabel } from "./ChartReferenceLabel";
import { applyRollingWindowToDataset } from "./utils/rollingWindowStats";
import { calculateYAxisDomain, calculateNiceTicks } from "./utils/calculateYAxisDomain";
import { getPreviewMetrics, renderPreviewLines } from "./utils/previewLines";
import { BaseChartCore } from "./charts/base/BaseChartCore";
import { ChartTooltip, TooltipItem } from "./ChartTooltip";
import { useSyncedChart, findClosestTimestampIndex } from "./SyncedChartContext";
import { Icon } from "./ui/icons";

type Row = {
  x: string; // ISO timestamp
  latency_ms: number;
  jitter_ms: number;
  packet_loss_percent: number;
};

type MetricType = "avg" | "min" | "max";

// Theme-specific color palettes for WAN metrics
const METRIC_COLORS = {
  light: {
    latency: "#2C7A7D", // darker teal
    jitter: "#D99F3B",  // darker yellow
    packetLoss: "#DC2626", // red
  },
  dark: {
    latency: "#34B3BB", // brighter teal
    jitter: "#FFD166",  // brighter yellow
    packetLoss: "#FF6B6B", // brighter red
  }
};

type MetricKey = "latency_ms" | "jitter_ms" | "packet_loss_percent";

const METRIC_LABELS: Record<MetricKey, string> = {
  latency_ms: "Latency",
  jitter_ms: "Jitter",
  packet_loss_percent: "Packet Loss",
};

interface WanLatencyChartProps {
  /**
   * If true, hides the internal drawer (useful when chart is already inside a drawer)
   */
  hideDrawer?: boolean;
  /**
   * Optional callback for maximize button (overrides default drawer behavior)
   */
  onMaximize?: () => void;
  /**
   * Variant for different display contexts:
   * - 'default': Fixed width, shows maximize button and brush
   * - 'drawer': Full width, hides maximize button and brush
   */
  variant?: 'default' | 'drawer';
  /**
   * Enable tooltip synchronization with other charts via SyncedChartContext
   */
  enableSync?: boolean;
  /**
   * Shared range for synchronized brush control (used in drawer)
   */
  sharedRange?: { startIndex: number; endIndex: number };
  /**
   * Callback when range changes (for internal brush)
   */
  onRangeChange?: (range: { startIndex: number; endIndex: number }) => void;
  /**
   * Callback to report data length after loading (for global brush)
   */
  onDataLoad?: (dataLength: number, data: any[]) => void;
  /**
   * Optional chart height in pixels (defaults to 256px)
   */
  height?: number;
  /**
   * Show vertical resize handle (drawer only)
   */
  showResizeHandle?: boolean;
  /**
   * Callback when height changes via resize handle
   */
  onHeightChange?: (deltaY: number) => void;
  /**
   * Show drag handle for reordering (drawer only)
   */
  showDragHandle?: boolean;
  /**
   * Metric type to display (min/avg/max)
   */
  metricType?: 'min' | 'avg' | 'max';
  /**
   * Callback when metric type changes
   */
  onMetricTypeChange?: (type: 'min' | 'avg' | 'max') => void;
  /**
   * Props from @dnd-kit for drag handle
   */
  dragHandleProps?: any;
  /**
   * Whether the chart is currently being dragged
   */
  isDragging?: boolean;
  /**
   * Whether the brush is currently being adjusted
   */
  isBrushAdjusting?: boolean;
}

export default function WanLatencyChart({ 
  hideDrawer = false, 
  onMaximize,
  variant = 'default',
  enableSync = false,
  sharedRange,
  onRangeChange,
  onDataLoad,
  height,
  showResizeHandle = false,
  onHeightChange,
  showDragHandle = false,
  dragHandleProps,
  isDragging = false,
  metricType,
  onMetricTypeChange,
  isBrushAdjusting = false,
}: WanLatencyChartProps = {}) {
  // Core data state
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Theme state
  const theme = useChartTheme();
  
  // Interaction state
  const [hoveredMetric, setHoveredMetric] = useState<MetricKey | null>(null);
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<MetricKey>>(new Set());
  const [focusedMetric, setFocusedMetric] = useState<MetricKey | null>(null);
  const [preFocusHiddenMetrics, setPreFocusHiddenMetrics] = useState<Set<MetricKey>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("avg");
  
  // Use metricType prop if provided, otherwise use internal state
  const activeMetric = metricType ?? selectedMetric;
  
  // Legend hover with tooltip support for focus mode
  const {
    hoveredItem: hoveredLegendMetric,
    handleMouseEnter: handleLegendMouseEnter,
    handleMouseLeave: handleLegendMouseLeave,
    cleanup: cleanupLegendHover,
  } = useChartLegendHover({
    showIsolateTooltip: true,
    tooltipDelay: 2000,
  });
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Note: Chart hover state removed - sidebar no longer shows hover timestamps or live values
  // Tooltips now handle all hover interactions

  // === Tooltip sync state ===
  const syncContext = enableSync ? useSyncedChart() : undefined;

  // Parse CSV data
  const parseCSV = (text: string): Row[] => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    
    // Expect header: timestamp,latency_ms,jitter_ms,packet_loss_percent
    const header = lines[0].split(/\s*,\s*/).map((h) => h.replace(/^"|"$/g, ""));
    const idxTimestamp = header.indexOf("timestamp");
    const idxLatency = header.indexOf("latency_ms");
    const idxJitter = header.indexOf("jitter_ms");
    const idxPacketLoss = header.indexOf("packet_loss_percent");
    
    const rows: Row[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      if (parts.length < 4) continue;
      
      const timeStr = parts[idxTimestamp]?.replace(/^"|"$/g, "");
      const latencyStr = parts[idxLatency]?.replace(/^"|"$/g, "");
      const jitterStr = parts[idxJitter]?.replace(/^"|"$/g, "");
      const packetLossStr = parts[idxPacketLoss]?.replace(/^"|"$/g, "");
      
      if (!timeStr || !latencyStr || !jitterStr || !packetLossStr) continue;
      
      const dateIso = new Date(timeStr.replace(" ", "T") + "Z").toISOString();
      
      rows.push({
        x: dateIso,
        latency_ms: Number(latencyStr),
        jitter_ms: Number(jitterStr),
        packet_loss_percent: Number(packetLossStr),
      });
    }
    
    return rows.sort((a, b) => +new Date(a.x) - +new Date(b.x));
  };

  // Load CSV dataset from public folder
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const csvRes = await fetch("/wan-latency.csv");
        if (!csvRes.ok) throw new Error(`Failed to fetch wan-latency.csv`);
        const csvText = await csvRes.text();
        if (cancelled) return;
        const parsed = parseCSV(csvText);
        setData(parsed);
        setLoading(false);
        // Report data length to parent for global brush
        if (onDataLoad) {
          onDataLoad(parsed.length, parsed);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || String(e));
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const len = data.length;

  const [range, setRange] = useState<{ left: number; right: number }>({ 
    left: 0, 
    right: Math.max(0, Math.min(24 * 7 - 1, len - 1)) 
  });

  useEffect(() => {
    if (!len) return;
    setRange(prev => ({ 
      left: 0, 
      right: Math.max(prev.right, Math.min(24 * 7 - 1, len - 1)) 
    }));
  }, [len]);

  // Use sharedRange when in drawer, otherwise use internal range
  const effectiveRange = variant === 'drawer' && sharedRange 
    ? { left: sharedRange.startIndex, right: sharedRange.endIndex }
    : range;

  const slicedData = useMemo(() => data.slice(effectiveRange.left, effectiveRange.right + 1), [data, effectiveRange]);

  // Calculate Y-axis domains from the FULL dataset (not just visible slice)
  // This prevents Y-axis jumps when changing the timeframe
  // Domains adjust based on which metrics are visible/hidden, and scale dynamically in focus mode
  const yAxisDomains = useMemo(() => {
    // Calculate from full dataset to keep domain consistent
    const fullAggregated = applyRollingWindowToDataset(
      data,
      ['latency_ms', 'jitter_ms', 'packet_loss_percent'],
      3
    );
    
    // In focus mode, calculate domain for the focused metric including all variants
    if (focusedMetric) {
      const focusedKeys = [
        `${focusedMetric}_avg`,
        `${focusedMetric}_min`,
        `${focusedMetric}_max`
      ];
      
      // For packet loss in focus mode, use dynamic scaling with smaller minimum
      if (focusedMetric === "packet_loss_percent") {
        const domain = calculateYAxisDomain(fullAggregated, focusedKeys, undefined, 4);
        // Ensure minimum is 0, but allow very small max values for decimal precision
        return {
          latency_ms: [0, 10], // Not used in focus mode
          jitter_ms: [0, 10], // Not used in focus mode
          packet_loss_percent: [0, Math.max(0.5, domain[1])], // Dynamic, minimum 0.5% for visibility
        };
      } else {
        // For latency and jitter, use normal calculation
        return {
          latency_ms: focusedMetric === "latency_ms"
            ? calculateYAxisDomain(fullAggregated, focusedKeys)
            : [0, 10],
          jitter_ms: focusedMetric === "jitter_ms"
            ? calculateYAxisDomain(fullAggregated, focusedKeys)
            : [0, 10],
          packet_loss_percent: [0, 100], // Not used in focus mode
        };
      }
    }
    
    // Normal mode: calculate domains for each metric, only including visible metrics
    // Uses smart "nice numbers" algorithm for optimal space usage with even intervals
    const latencyKeys = !hiddenMetrics.has("latency_ms") 
      ? ["latency_ms_avg", "latency_ms_min", "latency_ms_max"]
      : [];
    const jitterKeys = !hiddenMetrics.has("jitter_ms")
      ? ["jitter_ms_avg", "jitter_ms_min", "jitter_ms_max"]
      : [];
    
    return {
      latency_ms: latencyKeys.length > 0 
        ? calculateYAxisDomain(fullAggregated, latencyKeys)
        : [0, 10],
      jitter_ms: jitterKeys.length > 0
        ? calculateYAxisDomain(fullAggregated, jitterKeys)
        : [0, 10],
      packet_loss_percent: [0, 100], // Fixed for percentage in normal mode
    };
  }, [data, hiddenMetrics, focusedMetric]);

  // Calculate nice tick values for Y-axes
  const yAxisTicks = useMemo(() => {
    return {
      latency_ms: calculateNiceTicks(yAxisDomains.latency_ms as [number, number], 5),
      jitter_ms: calculateNiceTicks(yAxisDomains.jitter_ms as [number, number], 5),
      packet_loss_percent: calculateNiceTicks(yAxisDomains.packet_loss_percent as [number, number], 5),
    };
  }, [yAxisDomains]);

  // Compute aggregated data with avg/min/max for each metric using rolling window
  const aggregatedData = useMemo(() => {
    // Apply rolling window statistics to get realistic min/max variations
    // Window size of 3 means we look at current point ± 1 neighbor (3 points total)
    const baseData = applyRollingWindowToDataset(
      slicedData,
      ['latency_ms', 'jitter_ms', 'packet_loss_percent'],
      3 // windowSize = 3 (matches client chart)
    );

    // Add preview metrics if hovering or in focus mode (for min/max/avg preview lines)
    const metricToPreview = focusedMetric || hoveredMetric;
    if (metricToPreview) {
      return baseData.map((row: any) => {
        const metricKey = metricToPreview;
      return {
          ...row,
          [`${metricKey}__preview_min`]: row[`${metricKey}_min`],
          [`${metricKey}__preview_max`]: row[`${metricKey}_max`],
          [`${metricKey}__preview_avg`]: row[`${metricKey}_avg`],
      };
    });
    }

    return baseData;
  }, [slicedData, hoveredMetric, activeMetric]);


  const colors = METRIC_COLORS[theme];

  // Visible metrics (not hidden, or only focused metric when in focus mode)
  const visibleMetrics = useMemo(() => {
    // If in focus mode, only show the focused metric
    if (focusedMetric) {
      return [focusedMetric];
    }
    
    // Otherwise, show all non-hidden metrics
    const all: MetricKey[] = ["latency_ms", "jitter_ms", "packet_loss_percent"];
    return all.filter(m => !hiddenMetrics.has(m));
  }, [hiddenMetrics, focusedMetric]);
  
  // Use visibleMetrics to check if at least one is visible
  const hasVisibleMetrics = visibleMetrics.length > 0;

  // Use shared time axis hook
  // In drawer mode with sync, use sharedRange to ensure consistent x-axis across charts
  const { ticks: xTicks, renderTick } = useTimeAxis({
    data,
    xKey: "x",
    startIndex: variant === 'drawer' && sharedRange ? sharedRange.startIndex : range.left,
    endIndex: variant === 'drawer' && sharedRange ? sharedRange.endIndex : range.right,
  });

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !label) return null;

    const targetIso = String(label ?? payload?.[0]?.payload?.x ?? "");
    let rowAtLabel = aggregatedData.find((r: any) => String(r.x) === targetIso) as any | undefined;
    
    if (!rowAtLabel) {
      const d = toDate(label);
      if (d) {
        let best: any | undefined;
        let bestDiff = Number.POSITIVE_INFINITY;
        for (const r of aggregatedData as any[]) {
          const rd = toDate((r as any).x);
          if (!rd) continue;
          const diff = Math.abs(+rd - +d);
          if (diff < bestDiff) {
            best = r;
            bestDiff = diff;
          }
        }
        rowAtLabel = best;
      }
    }
    
    if (!rowAtLabel) {
      rowAtLabel = { x: targetIso };
    }

    // Prepare tooltip items based on mode
    if (focusedMetric) {
      // Focus mode: show min/avg/max for focused metric
      const metricKey = focusedMetric;
      const labelText = METRIC_LABELS[metricKey];
      const unit = metricKey === "packet_loss_percent" ? "%" : "ms";
      const color = colors[metricKey === "latency_ms" ? "latency" : metricKey === "jitter_ms" ? "jitter" : "packetLoss"];

      const focusItems: TooltipItem[] = [
        { id: metricKey, label: labelText, value: rowAtLabel[`${metricKey}_min`] || null, color, unit, metric: "min", isVisible: !hiddenMetrics.has(metricKey) },
        { id: metricKey, label: labelText, value: rowAtLabel[`${metricKey}_avg`] || null, color, unit, metric: "avg", isVisible: !hiddenMetrics.has(metricKey) },
        { id: metricKey, label: labelText, value: rowAtLabel[`${metricKey}_max`] || null, color, unit, metric: "max", isVisible: !hiddenMetrics.has(metricKey) },
    ];

    return (
        <ChartTooltip
          active={active}
          payload={payload}
          label={label}
          data={aggregatedData}
          xKey="x"
          focusedItem={focusedMetric}
          selectedMetric={activeMetric}
          focusItems={focusItems}
          focusHeader={{ label: labelText, color }}
        />
      );
    } else {
      // Normal mode: show all metrics
      const items: TooltipItem[] = [
        {
          id: "latency_ms",
          label: "Latency",
          value: rowAtLabel[`latency_ms_${activeMetric}`] || null,
          color: colors.latency,
          unit: "ms",
          isVisible: !hiddenMetrics.has("latency_ms"),
        },
        {
          id: "jitter_ms",
          label: "Jitter",
          value: rowAtLabel[`jitter_ms_${activeMetric}`] || null,
          color: colors.jitter,
          unit: "ms",
          isVisible: !hiddenMetrics.has("jitter_ms"),
        },
        {
          id: "packet_loss_percent",
          label: "Packet Loss",
          value: rowAtLabel[`packet_loss_percent_${activeMetric}`] || null,
          color: colors.packetLoss,
          unit: "%",
          isVisible: !hiddenMetrics.has("packet_loss_percent"),
        },
      ];

            return (
        <ChartTooltip
          active={active}
          payload={payload}
          label={label}
          data={aggregatedData}
          xKey="x"
          items={items}
        />
      );
    }
  };

  // === Sync handlers ===
  const handleChartMouseMove = useCallback((state: any) => {
    if (enableSync && syncContext) {
    // Extract active tooltip index from recharts state
    if (state && state.activeTooltipIndex !== undefined && aggregatedData[state.activeTooltipIndex]) {
      const timestamp = aggregatedData[state.activeTooltipIndex].x;
      syncContext.setSyncedTimestamp(timestamp);
    }
    }
    
    // Note: Removed hover timestamp tracking - sidebar no longer updates on hover
  }, [enableSync, syncContext, aggregatedData, variant]);

  const handleChartMouseLeave = useCallback(() => {
    if (enableSync && syncContext) {
    syncContext.setSyncedTimestamp(null);
    }
    
    // Note: Removed hover timestamp clearing - no longer tracked
  }, [enableSync, syncContext, variant]);

  // Note: syncedActiveIndex removed - no longer needed since sidebar doesn't show live hover values

  // Note: effectiveHoverIndex removed - no longer needed since sidebar doesn't show live hover values

  // Note: computeLiveValues removed - sidebar now always shows min/avg/max instead of hover values
  // since drawer charts now have tooltips

  // Compute timestamp info for sidebar - always show range, not hover point
  const timestampInfo = useMemo(() => {
    if (variant !== 'drawer') return undefined;
    
    // Always show range (removed hover point display since tooltips now handle that)
    if (slicedData.length > 0) {
      return {
        type: 'range' as const,
        startDate: new Date(slicedData[0].x),
        endDate: new Date(slicedData[slicedData.length - 1].x),
      };
    }
    
    return undefined;
  }, [variant, slicedData]);

  // Note: liveValues removed - sidebar now always shows min/avg/max instead of hover values
  // since drawer charts now have tooltips

  const renderMetricLegend = () => {
    const legendItems = (["latency_ms", "jitter_ms", "packet_loss_percent"] as MetricKey[]).map((key) => ({
      id: key,
      label: METRIC_LABELS[key],
      color: colors[key === "latency_ms" ? "latency" : key === "jitter_ms" ? "jitter" : "packetLoss"],
      isHidden: hiddenMetrics.has(key),
    }));

    return (
    <div className="w-full flex items-center justify-between gap-2">
      {/* Metric indicators */}
        <GraphLegend
          items={legendItems}
          onToggleItem={(id) => {
                  setHoveredMetric(null);
                  setHiddenMetrics((prev) => {
                    const next = new Set(prev);
              if (next.has(id as MetricKey)) {
                next.delete(id as MetricKey);
                    } else {
                next.add(id as MetricKey);
                    }
                    return next;
                  });
                }}
          onFocusItem={(id) => {
            setPreFocusHiddenMetrics(hiddenMetrics);
            setFocusedMetric(id as MetricKey);
            cleanupLegendHover();
          }}
          onShowAll={() => {
                setHoveredMetric(null);
                setHiddenMetrics(new Set());
              }}
          hoveredItem={hoveredLegendMetric}
          onMouseEnter={(id, isHidden) => {
            if (!focusedMetric && !isHidden) setHoveredMetric(id as MetricKey);
            handleLegendMouseEnter(id, isHidden);
          }}
          onMouseLeave={() => {
            setHoveredMetric(null);
            handleLegendMouseLeave();
          }}
          focusedItem={focusedMetric}
          onExitFocus={() => {
            setFocusedMetric(null);
            setHiddenMetrics(preFocusHiddenMetrics);
            setHoveredMetric(null);
          }}
          showFocusMode={true}
        />

      {/* Metric toggle - only show for default view (non-drawer) */}
      {variant === 'default' && (
        <div className="flex items-center gap-1">
          {(["min", "avg", "max"] as MetricType[]).map((metric) => {
            const isActive = activeMetric === metric;
            return (
              <button
                key={metric}
                type="button"
                className="transition-opacity hover:opacity-80"
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  lineHeight: '16px',
                  fontWeight: 500,
                  color: isActive ? 'rgb(var(--content-primary))' : 'rgb(var(--content-tertiary))',
                  backgroundColor: isActive ? 'rgb(var(--surface-action-hover))' : 'transparent',
                }}
                onClick={() => {
                  if (onMetricTypeChange) {
                    onMetricTypeChange(metric);
                  } else {
                    setSelectedMetric(metric);
                  }
                }}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
  };

  const renderChart = () => {
    // WAN chart has 2 Y axes (left for ms, right for %), so right margin should be 8
    // Labels will be positioned within the right Y axis space
    const hasRightYAxis = true; // WAN chart always has right Y axis for packet loss
    const rightMargin = hasRightYAxis ? 0 : 32;
    
    // Chart height (from prop or default)
    const chartHeight = height ?? 256;
    
    return (
    <div style={{ overflow: "visible", position: "relative" }}>
      <div style={{ height: chartHeight, overflow: "visible", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={aggregatedData} 
              margin={{ top: 8, right: rightMargin, left: 0, bottom: 8 }}
              onMouseMove={enableSync ? handleChartMouseMove : undefined}
              onMouseLeave={enableSync ? handleChartMouseLeave : undefined}
              syncId={enableSync ? "tooltipSync" : undefined}
              syncMethod="index"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border-border-flat))" vertical={false} />
              <XAxis
                dataKey="x"
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                interval={0}
                ticks={xTicks as any}
                tick={renderTick as any}
              />
              <YAxis
                yAxisId="left"
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                domain={yAxisDomains.latency_ms}
                ticks={yAxisTicks.latency_ms}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: "rgb(var(--content-tertiary))", fontSize: 12 } }}
                tick={{ fontSize: 11, fill: "rgb(var(--content-tertiary))", style: { userSelect: "none" } as any }}
                width={50}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                domain={yAxisDomains.packet_loss_percent}
                label={{ value: '%', angle: 90, position: 'insideRight', style: { fill: "rgb(var(--content-tertiary))", fontSize: 12 } }}
                tick={{ fontSize: 11, fill: "rgb(var(--content-tertiary))", style: { userSelect: "none" } as any }}
                width={50}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: "rgb(var(--border-border-flat))" }} 
                offset={12}
                allowEscapeViewBox={{ x: false, y: true }}
                isAnimationActive={false}
                wrapperStyle={{ zIndex: 1000 }}
              />

              {/* In focus mode, show selected metric as main line with dots, others as preview lines */}
              {focusedMetric && (() => {
                const metricColor = colors[focusedMetric === "latency_ms" ? "latency" : focusedMetric === "jitter_ms" ? "jitter" : "packetLoss"];
                const yAxisId = focusedMetric === "packet_loss_percent" ? "right" : "left";
                
                // Show selected metric as main line with dots (like hover mode)
                const lineStyle = useChartLineStyle({
                  isHighlighted: true,
                  color: metricColor,
                  chartData: aggregatedData,
                  dataKey: `${focusedMetric}_${activeMetric}`,
                  showBoundaryMarkers: true,
                });
                
                // Get preview metrics (the other two)
                const previewMetrics = getPreviewMetrics(activeMetric);
                
                return (
                  <>
                    {/* Main line for selected metric with dots */}
                    <Line
                      yAxisId={yAxisId}
                      type="monotone"
                      dataKey={`${focusedMetric}_${activeMetric}`}
                      stroke={metricColor}
                      strokeWidth={2.0}
                      dot={lineStyle.dot}
                      activeDot={lineStyle.activeDot}
                      isAnimationActive={false}
                      connectNulls={false}
                      strokeOpacity={lineStyle.strokeOpacity}
                    />
                    
                    {/* Preview lines for other metrics without dots */}
                    {renderPreviewLines({
                      itemId: focusedMetric,
                      color: metricColor,
                      yAxisId,
                      dataKeyPrefix: focusedMetric,
                      previewMetrics,
                    })}
                  </>
                );
              })()}

              {/* Preview lines when hovering on a metric (not in focus mode) */}
              {!focusedMetric && hoveredMetric && (() => {
                const metricColor = colors[hoveredMetric === "latency_ms" ? "latency" : hoveredMetric === "jitter_ms" ? "jitter" : "packetLoss"];
                const yAxisId = hoveredMetric === "packet_loss_percent" ? "right" : "left";
                const previewMetrics = getPreviewMetrics(activeMetric);
                
                return renderPreviewLines({
                  itemId: hoveredMetric,
                  color: metricColor,
                  yAxisId,
                  dataKeyPrefix: hoveredMetric,
                  previewMetrics,
                });
              })()}

              {/* Main metric lines - only show when not in focus mode and not hovering */}
              {!focusedMetric && (
                <>
              {/* Latency line */}
                  {!hiddenMetrics.has("latency_ms") && (() => {
                    const isHighlighted = hoveredMetric === null || hoveredMetric === "latency_ms";
                    const lineStyle = useChartLineStyle({
                      isHighlighted,
                      color: colors.latency,
                      chartData: aggregatedData,
                      dataKey: `latency_ms_${activeMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={`latency_ms_${activeMetric}`}
                  stroke={colors.latency}
                        strokeWidth={2.0}
                        dot={lineStyle.dot}
                        activeDot={lineStyle.activeDot}
                  isAnimationActive={false}
                  connectNulls={false}
                        strokeOpacity={lineStyle.strokeOpacity}
                />
                    );
                  })()}
              
              {/* Jitter line */}
                  {!hiddenMetrics.has("jitter_ms") && (() => {
                    const isHighlighted = hoveredMetric === null || hoveredMetric === "jitter_ms";
                    const lineStyle = useChartLineStyle({
                      isHighlighted,
                      color: colors.jitter,
                      chartData: aggregatedData,
                      dataKey: `jitter_ms_${activeMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={`jitter_ms_${activeMetric}`}
                  stroke={colors.jitter}
                        strokeWidth={2.0}
                        dot={lineStyle.dot}
                        activeDot={lineStyle.activeDot}
                  isAnimationActive={false}
                  connectNulls={false}
                        strokeOpacity={lineStyle.strokeOpacity}
                />
                    );
                  })()}
              
              {/* Packet loss line */}
                  {!hiddenMetrics.has("packet_loss_percent") && (() => {
                    const isHighlighted = hoveredMetric === null || hoveredMetric === "packet_loss_percent";
                    const lineStyle = useChartLineStyle({
                      isHighlighted,
                      color: colors.packetLoss,
                      chartData: aggregatedData,
                      dataKey: `packet_loss_percent_${activeMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={`packet_loss_percent_${activeMetric}`}
                  stroke={colors.packetLoss}
                        strokeWidth={2.0}
                        dot={lineStyle.dot}
                        activeDot={lineStyle.activeDot}
                  isAnimationActive={false}
                  connectNulls={false}
                        strokeOpacity={lineStyle.strokeOpacity}
                      />
                    );
                  })()}
                </>
              )}

              {/* Reference lines with labels - rendered last to appear on top */}
              {(hoveredMetric || focusedMetric) && (() => {
                const metricToShow = focusedMetric || hoveredMetric;
                if (!metricToShow) return null;
                const metricColor = colors[metricToShow === "latency_ms" ? "latency" : metricToShow === "jitter_ms" ? "jitter" : "packetLoss"];
                const yAxisId = metricToShow === "packet_loss_percent" ? "right" : "left";
                const previewMetrics: MetricType[] = [];
                
                // In focus mode, show all three metrics except the selected one
                if (focusedMetric) {
                  // Show all metrics except the selected one
                  if (activeMetric === "avg") {
                    previewMetrics.push("min", "max");
                  } else if (activeMetric === "min") {
                    previewMetrics.push("avg", "max");
                  } else if (activeMetric === "max") {
                    previewMetrics.push("min", "avg");
                  }
                } else {
                  // When hovering, show the other two metrics (already excludes selected)
                  previewMetrics.push(...getPreviewMetrics(activeMetric));
                }
                
                // Find the last non-null values for preview metrics (for labels)
                const previewValues: Record<MetricType, number | null> = {
                  avg: null,
                  min: null,
                  max: null,
                };
                
                previewMetrics.forEach((metric) => {
                  for (let i = aggregatedData.length - 1; i >= 0; i--) {
                    const rowValue = aggregatedData[i]?.[`${metricToShow}__preview_${metric}`];
                    if (typeof rowValue === "number" && !Number.isNaN(rowValue)) {
                      previewValues[metric] = rowValue;
                      break;
                    }
                  }
                });
                
                    // Add reference lines with labels for each preview metric
                    return previewMetrics.map((metric) => {
                      const value = previewValues[metric];
                      if (value !== null) {
                        return (
                          <ReferenceLine
                            key={`${metricToShow}__label_${metric}`}
                            yAxisId={yAxisId}
                            y={value}
                            stroke="transparent"
                            label={<ChartReferenceLabel value={metric} color={metricColor} />}
                          />
                        );
                      }
                      return null;
                    }).filter(Boolean);
                  })()}
            </LineChart>
        </ResponsiveContainer>
      </div>

      {variant === 'default' && (
      <div>
        <ExternalBrush
            data={data as any}
            xKey="x"
            startIndex={range.left}
            endIndex={range.right}
            minSelectionPoints={6}
            maxSelectionPoints={24 * 15}
            onChange={({ startIndex, endIndex }) => setRange({ left: startIndex, right: endIndex })}
        />
      </div>
      )}
    </div>
  );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-content-tertiary">Loading WAN latency data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-content-tertiary">Error: {error}</div>
      </div>
    );
  }

  if (!data.length || !hasVisibleMetrics) {
    return (
      <div className="flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-content-tertiary">{!data.length ? "No data available" : "No visible metrics"}</div>
      </div>
    );
  }

  // Render drawer variant with new layout
  if (variant === 'drawer') {
    // Chart height (from prop or default)
    const chartHeight = height ?? 256;
    
    // Calculate min/avg/max values for each metric (for drawer legend)
    const metricStats: Record<MetricKey, { min: string; avg: string; max: string }> = {
      latency_ms: { min: '0ms', avg: '0ms', max: '0ms' },
      jitter_ms: { min: '0ms', avg: '0ms', max: '0ms' },
      packet_loss_percent: { min: '0%', avg: '0%', max: '0%' },
    };
    
    // Calculate stats from aggregated data
    const metricsToCalculate: MetricKey[] = ['latency_ms', 'jitter_ms', 'packet_loss_percent'];
    metricsToCalculate.forEach((metricKey) => {
      let sumMin = 0, sumAvg = 0, sumMax = 0;
      let countMin = 0, countAvg = 0, countMax = 0;
      let minMin = Infinity, minAvg = Infinity, minMax = Infinity;
      let maxMin = -Infinity, maxAvg = -Infinity, maxMax = -Infinity;
      
      aggregatedData.forEach((row: any) => {
        const minVal = row[`${metricKey}_min`];
        const avgVal = row[`${metricKey}_avg`];
        const maxVal = row[`${metricKey}_max`];
        
        if (typeof minVal === 'number' && !isNaN(minVal)) {
          sumMin += minVal;
          countMin++;
          minMin = Math.min(minMin, minVal);
          maxMin = Math.max(maxMin, minVal);
        }
        if (typeof avgVal === 'number' && !isNaN(avgVal)) {
          sumAvg += avgVal;
          countAvg++;
          minAvg = Math.min(minAvg, avgVal);
          maxAvg = Math.max(maxAvg, avgVal);
        }
        if (typeof maxVal === 'number' && !isNaN(maxVal)) {
          sumMax += maxVal;
          countMax++;
          minMax = Math.min(minMax, maxVal);
          maxMax = Math.max(maxMax, maxVal);
        }
      });
      
      const unit = metricKey === 'packet_loss_percent' ? '%' : 'ms';
      
      if (countMin > 0 && countAvg > 0 && countMax > 0) {
        metricStats[metricKey] = {
          min: `${Number(minMin.toFixed(1))}${unit}`,
          avg: `${Number((sumAvg / countAvg).toFixed(1))}${unit}`,
          max: `${Number(maxMax.toFixed(1))}${unit}`,
        };
      }
    });
    
    // Prepare drawer legend items with min/avg/max
    const drawerLegendItems: DrawerLegendItem[] = metricsToCalculate.map((metricKey) => {
      const stats = metricStats[metricKey];
      return {
        id: metricKey,
        label: METRIC_LABELS[metricKey],
        color: colors[metricKey === "latency_ms" ? "latency" : metricKey === "jitter_ms" ? "jitter" : "packetLoss"],
        min: stats.min,
        avg: stats.avg,
        max: stats.max,
        isHidden: hiddenMetrics.has(metricKey),
        activeMetric: activeMetric,
      };
    });
    
    // WAN chart has 2 Y axes (left for ms, right for %), so right margin should be 8
    const hasRightYAxis = true;
    const rightMargin = hasRightYAxis ? 0 : 32;
    
    return (
      <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ height: `${chartHeight + 90}px` }}>
        <ChartDrawerContent
          sidebar={
            <ChartDrawerLegend
              dataItems={drawerLegendItems}
              timestamp={timestampInfo}
              isBrushAdjusting={isBrushAdjusting}
              selectedMetrics={[activeMetric]}
              onMetricsChange={onMetricTypeChange ? (metrics) => {
                if (metrics.length > 0) {
                  onMetricTypeChange(metrics[metrics.length - 1] as MetricType);
                }
              } : metricType === undefined ? (metrics) => {
                if (metrics.length > 0) {
                  setSelectedMetric(metrics[metrics.length - 1] as MetricType);
                }
              } : undefined}
              focusedItem={focusedMetric}
              onFocusItem={(id) => {
                setPreFocusHiddenMetrics(hiddenMetrics);
                setFocusedMetric(id as MetricKey);
                cleanupLegendHover();
              }}
              onExitFocus={() => {
                setFocusedMetric(null);
                setHiddenMetrics(preFocusHiddenMetrics);
                setHoveredMetric(null);
              }}
              onToggleDataItem={(id) => {
                setHoveredMetric(null);
                setHiddenMetrics((prev) => {
                  const next = new Set(prev);
                  const metricKey = id as MetricKey;
                  if (next.has(metricKey)) {
                    next.delete(metricKey);
                  } else {
                    next.add(metricKey);
                  }
                  return next;
                });
              }}
              onMouseEnter={(id) => {
                if (!focusedMetric && !hiddenMetrics.has(id as MetricKey)) {
                  setHoveredMetric(id as MetricKey);
                }
              }}
              onMouseLeave={() => {
                setHoveredMetric(null);
              }}
            />
          }
        >
          {/* Header */}
          <ChartDrawerHeader
            title="WAN history"
            metricButton={metricType === undefined ? <MetricButton label="Latency" /> : undefined}
            selectedMetrics={[activeMetric]}
            onMetricsChange={onMetricTypeChange ? (metrics) => {
              if (metrics.length > 0) {
                onMetricTypeChange(metrics[metrics.length - 1] as MetricType);
              }
            } : metricType === undefined ? (metrics) => {
              if (metrics.length > 0) {
                setSelectedMetric(metrics[metrics.length - 1] as MetricType);
              }
            } : undefined}
            hideMetricToggles={true}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
          />
          
          {/* Chart */}
          <div className="chart-drawer-chart-container">
            <BaseChartCore
              data={aggregatedData}
              xKey="x"
              height={chartHeight}
              margin={{ top: 8, right: rightMargin, left: 0, bottom: 8 }}
              yAxisConfig={[
                { id: "left", orientation: "left", domain: yAxisDomains.latency_ms as [number, number], ticks: yAxisTicks.latency_ms, label: "ms", width: 50 },
                { id: "right", orientation: "right", domain: yAxisDomains.packet_loss_percent as [number, number], label: "%", width: 50 },
              ]}
              startIndex={0}
              endIndex={aggregatedData.length - 1}
              enableSync={!!enableSync}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              renderTooltip={() => <CustomTooltip />}
              renderLines={() => (
                <>
                  {focusedMetric && (() => {
                    const metricColor = colors[focusedMetric === "latency_ms" ? "latency" : focusedMetric === "jitter_ms" ? "jitter" : "packetLoss"];
                    const yAxisId = focusedMetric === "packet_loss_percent" ? "right" : "left";
                    
                    const lineStyle = useChartLineStyle({
                      isHighlighted: true,
                      color: metricColor,
                      chartData: aggregatedData,
                      dataKey: `${focusedMetric}_${activeMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    const previewMetrics = getPreviewMetrics(activeMetric);
                    
                    return (
                      <>
                        <Line
                          yAxisId={yAxisId}
                          type="monotone"
                          dataKey={`${focusedMetric}_${activeMetric}`}
                          stroke={metricColor}
                          strokeWidth={2.0}
                          dot={lineStyle.dot}
                          activeDot={lineStyle.activeDot}
                          isAnimationActive={false}
                          connectNulls={false}
                          strokeOpacity={lineStyle.strokeOpacity}
                        />
                        
                        {renderPreviewLines({
                          itemId: focusedMetric,
                          color: metricColor,
                          yAxisId,
                          dataKeyPrefix: focusedMetric,
                          previewMetrics,
                        })}
                      </>
                    );
                  })()}

                  {!focusedMetric && hoveredMetric && (() => {
                    const metricColor = colors[hoveredMetric === "latency_ms" ? "latency" : hoveredMetric === "jitter_ms" ? "jitter" : "packetLoss"];
                    const yAxisId = hoveredMetric === "packet_loss_percent" ? "right" : "left";
                    const previewMetrics = getPreviewMetrics(activeMetric);
                    
                    return renderPreviewLines({
                      itemId: hoveredMetric,
                      color: metricColor,
                      yAxisId,
                      dataKeyPrefix: hoveredMetric,
                      previewMetrics,
                    });
                  })()}

                  {!focusedMetric && (
                    <>
                      {!hiddenMetrics.has("latency_ms") && (() => {
                        const isHighlighted = hoveredMetric === null || hoveredMetric === "latency_ms";
                        const lineStyle = useChartLineStyle({
                          isHighlighted,
                          color: colors.latency,
                          chartData: aggregatedData,
                          dataKey: `latency_ms_${activeMetric}`,
                          showBoundaryMarkers: true,
                        });
                        
                        return (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey={`latency_ms_${activeMetric}`}
                            stroke={colors.latency}
                            strokeWidth={2.0}
                            dot={lineStyle.dot}
                            activeDot={lineStyle.activeDot}
                            isAnimationActive={false}
                            connectNulls={false}
                            strokeOpacity={lineStyle.strokeOpacity}
                          />
                        );
                      })()}
                  
                      {!hiddenMetrics.has("jitter_ms") && (() => {
                        const isHighlighted = hoveredMetric === null || hoveredMetric === "jitter_ms";
                        const lineStyle = useChartLineStyle({
                          isHighlighted,
                          color: colors.jitter,
                          chartData: aggregatedData,
                          dataKey: `jitter_ms_${activeMetric}`,
                          showBoundaryMarkers: true,
                        });
                        
                        return (
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey={`jitter_ms_${activeMetric}`}
                            stroke={colors.jitter}
                            strokeWidth={2.0}
                            dot={lineStyle.dot}
                            activeDot={lineStyle.activeDot}
                            isAnimationActive={false}
                            connectNulls={false}
                            strokeOpacity={lineStyle.strokeOpacity}
                          />
                        );
                      })()}
                  
                      {!hiddenMetrics.has("packet_loss_percent") && (() => {
                        const isHighlighted = hoveredMetric === null || hoveredMetric === "packet_loss_percent";
                        const lineStyle = useChartLineStyle({
                          isHighlighted,
                          color: colors.packetLoss,
                          chartData: aggregatedData,
                          dataKey: `packet_loss_percent_${activeMetric}`,
                          showBoundaryMarkers: true,
                        });
                        
                        return (
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey={`packet_loss_percent_${activeMetric}`}
                            stroke={colors.packetLoss}
                            strokeWidth={2.0}
                            dot={lineStyle.dot}
                            activeDot={lineStyle.activeDot}
                            isAnimationActive={false}
                            connectNulls={false}
                            strokeOpacity={lineStyle.strokeOpacity}
                          />
                        );
                      })()}
                    </>
                  )}
                </>
              )}
              renderReferenceElements={() => (
                <>
                  {(hoveredMetric || focusedMetric) && (() => {
                    const metricToShow = focusedMetric || hoveredMetric;
                    if (!metricToShow) return null;
                    const metricColor = colors[metricToShow === "latency_ms" ? "latency" : metricToShow === "jitter_ms" ? "jitter" : "packetLoss"];
                    const yAxisId = metricToShow === "packet_loss_percent" ? "right" : "left";
                    const previewMetrics: MetricType[] = [];
                    
                    if (focusedMetric) {
                      if (activeMetric === "avg") {
                        previewMetrics.push("min", "max");
                      } else if (activeMetric === "min") {
                        previewMetrics.push("avg", "max");
                      } else if (activeMetric === "max") {
                        previewMetrics.push("min", "avg");
                      }
                    } else {
                      previewMetrics.push(...getPreviewMetrics(activeMetric));
                    }
                    
                    const previewValues: Record<MetricType, number | null> = {
                      avg: null,
                      min: null,
                      max: null,
                    };
                    
                    previewMetrics.forEach((metric) => {
                      for (let i = aggregatedData.length - 1; i >= 0; i--) {
                        const rowValue = aggregatedData[i]?.[`${metricToShow}__preview_${metric}`];
                        if (typeof rowValue === "number" && !Number.isNaN(rowValue)) {
                          previewValues[metric] = rowValue;
                          break;
                        }
                      }
                    });
                    
                    return previewMetrics.map((metric) => {
                      const value = previewValues[metric];
                      if (value !== null) {
                        return (
                          <ReferenceLine
                            key={`${metricToShow}__label_${metric}`}
                            yAxisId={yAxisId}
                            y={value}
                            stroke="transparent"
                            label={<ChartReferenceLabel value={metric} color={metricColor} />}
                          />
                        );
                      }
                      return null;
                    }).filter(Boolean);
                  })()}
                </>
              )}
            />
          </div>
        </ChartDrawerContent>
        
        {/* Resize handle - only visible in drawer variant */}
        {showResizeHandle && onHeightChange && (
          <ResizeHandleVertical onResize={onHeightChange} />
        )}
      </div>
    );
  }

  // Default variant rendering
  return (
    <>
      <ChartCard
        variant={variant}
        showResizeHandle={showResizeHandle}
        onHeightChange={onHeightChange}
        header={
          <ChartHeader
            title="WAN history"
            metricButton={metricType === undefined ? <MetricButton label="Latency" /> : undefined}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            metricType={metricType}
            onMetricTypeChange={onMetricTypeChange}
            actions={variant === 'default' ? (
              <MaximizeButton onClick={() => {
                if (onMaximize) {
                  onMaximize();
                } else {
                  setIsDrawerOpen(true);
                }
              }} />
            ) : undefined}
          />
        }
        legend={renderMetricLegend()}
      >
        {renderChart()}
      </ChartCard>

      {!hideDrawer && (
      <ResizableChartDrawer 
        open={isDrawerOpen} 
        onOpenChange={setIsDrawerOpen}
        title="WAN History"
        defaultSize={50}
        minSize={30}
        maxSize={80}
      >
        {renderChart()}
      </ResizableChartDrawer>
      )}
    </>
  );
}
