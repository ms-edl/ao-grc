import React, { useEffect, useMemo, useState } from "react";
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
import ChartDrawer from "./ChartDrawer";
import ChartCard from "./ChartCard";
import { useTimeAxis, toDate } from "./TimeAxis";
import ChartHeader, { MetricButton, MaximizeButton } from "./ChartHeader";
import { useChartTheme } from "./hooks/useChartTheme";
import { useChartLegendHover } from "./hooks/useChartLegendHover";
import { ChartLegend, LegendItem } from "./ChartLegend";
import { useChartLineStyle } from "./hooks/useChartLineStyle";
import { ChartReferenceLabel } from "./ChartReferenceLabel";
import { applyRollingWindowToDataset } from "./utils/rollingWindowStats";
import { calculateYAxisDomain, calculateNiceTicks } from "./utils/calculateYAxisDomain";
import { getPreviewMetrics, renderPreviewLines } from "./utils/previewLines";
import { ChartTooltip, TooltipItem } from "./ChartTooltip";

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

export default function WanLatencyChart() {
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
  
  // Legend hover with tooltip support for focus mode
  const {
    hoveredItem: hoveredLegendMetric,
    showTooltipForItem: showIsolateTooltip,
    handleMouseEnter: handleLegendMouseEnter,
    handleMouseLeave: handleLegendMouseLeave,
    cleanup: cleanupLegendHover,
  } = useChartLegendHover({
    showIsolateTooltip: true,
    tooltipDelay: 2000,
  });
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const slicedData = useMemo(() => data.slice(range.left, range.right + 1), [data, range]);

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
  }, [slicedData, hoveredMetric, selectedMetric]);


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
  const { ticks: xTicks, renderTick } = useTimeAxis({
    data,
    xKey: "x",
    startIndex: range.left,
    endIndex: range.right,
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
          selectedMetric={selectedMetric}
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
          value: rowAtLabel[`latency_ms_${selectedMetric}`] || null,
          color: colors.latency,
          unit: "ms",
          isVisible: !hiddenMetrics.has("latency_ms"),
        },
        {
          id: "jitter_ms",
          label: "Jitter",
          value: rowAtLabel[`jitter_ms_${selectedMetric}`] || null,
          color: colors.jitter,
          unit: "ms",
          isVisible: !hiddenMetrics.has("jitter_ms"),
        },
        {
          id: "packet_loss_percent",
          label: "Packet Loss",
          value: rowAtLabel[`packet_loss_percent_${selectedMetric}`] || null,
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

  const renderMetricLegend = () => {
    const legendItems: LegendItem[] = (["latency_ms", "jitter_ms", "packet_loss_percent"] as MetricKey[]).map((key) => ({
      id: key,
      label: METRIC_LABELS[key],
      color: colors[key === "latency_ms" ? "latency" : key === "jitter_ms" ? "jitter" : "packetLoss"],
      isHidden: hiddenMetrics.has(key),
    }));

    return (
    <div className="w-full flex items-center justify-between gap-2">
      {/* Metric indicators */}
        <ChartLegend
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
          showTooltipForItem={showIsolateTooltip}
          focusedItem={focusedMetric}
          onExitFocus={() => {
            setFocusedMetric(null);
            setHiddenMetrics(preFocusHiddenMetrics);
            setHoveredMetric(null);
          }}
          showFocusMode={true}
        />

      {/* Metric toggle */}
      <div className="flex items-center chart-gradient-border rounded-md" style={{ gap: 0, height: 24, backgroundColor: 'rgb(var(--surface-tile))' }}>
          {(["min", "avg", "max"] as MetricType[]).map((metric) => {
          const isActive = selectedMetric === metric;
          return (
            <button
              key={metric}
              className={isActive ? "transition-colors text-toggle-label-active" : "transition-colors"}
              style={{ 
                paddingLeft: 12, 
                paddingRight: 12,
                fontSize: 13,
                fontFamily: 'inherit',
                height: '100%',
                borderRadius: 4,
                fontWeight: isActive ? 500 : 400,
                backgroundColor: isActive ? 'rgb(var(--toggle-bg-active))' : 'rgb(var(--surface-tile))',
                color: isActive ? undefined : 'rgb(var(--content-tertiary))'
              }}
              onClick={() => setSelectedMetric(metric)}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
  };

  const renderChart = (isDrawer: boolean = false) => {
    // WAN chart has 2 Y axes (left for ms, right for %), so right margin should be 8
    // Labels will be positioned within the right Y axis space
    const hasRightYAxis = true; // WAN chart always has right Y axis for packet loss
    const rightMargin = hasRightYAxis ? 0 : 32;
    
    return (
    <div style={{ overflow: "visible", position: "relative" }}>
      <div style={{ height: isDrawer ? 560 : 360, overflow: "visible", position: "relative" }}>
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={aggregatedData} margin={{ top: 8, right: rightMargin, left: 0, bottom: 8 }}>
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
                position={{ y: 0 }}
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
                  dataKey: `${focusedMetric}_${selectedMetric}`,
                  showBoundaryMarkers: true,
                });
                
                // Get preview metrics (the other two)
                const previewMetrics = getPreviewMetrics(selectedMetric);
                
                return (
                  <>
                    {/* Main line for selected metric with dots */}
                    <Line
                      yAxisId={yAxisId}
                      type="monotone"
                      dataKey={`${focusedMetric}_${selectedMetric}`}
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
                const previewMetrics = getPreviewMetrics(selectedMetric);
                
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
                      dataKey: `latency_ms_${selectedMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={`latency_ms_${selectedMetric}`}
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
                      dataKey: `jitter_ms_${selectedMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey={`jitter_ms_${selectedMetric}`}
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
                      dataKey: `packet_loss_percent_${selectedMetric}`,
                      showBoundaryMarkers: true,
                    });
                    
                    return (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={`packet_loss_percent_${selectedMetric}`}
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
                  if (selectedMetric === "avg") {
                    previewMetrics.push("min", "max");
                  } else if (selectedMetric === "min") {
                    previewMetrics.push("avg", "max");
                  } else if (selectedMetric === "max") {
                    previewMetrics.push("min", "avg");
                  }
                } else {
                  // When hovering, show the other two metrics (already excludes selected)
                  previewMetrics.push(...getPreviewMetrics(selectedMetric));
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

  return (
    <>
      <ChartCard
        header={
          <ChartHeader
            title="WAN history"
            metricButton={<MetricButton label="Latency" />}
            actions={<MaximizeButton onClick={() => setIsDrawerOpen(true)} />}
          />
        }
        legend={renderMetricLegend()}
      >
        {renderChart(false)}
      </ChartCard>

      <ChartDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
      >
        {renderChart(true)}
      </ChartDrawer>
    </>
  );
}
