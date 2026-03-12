import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "recharts";
import { ExternalBrush } from "./ExternalBrush";
import { ResizableChartDrawer } from "./ui/resizable-chart-drawer";
import ChartCard from "./ChartCard";
import ChartHeader, { MetricButton, MaximizeButton } from "./ChartHeader";
import ChartDrawerHeader from "./ChartDrawerHeader";
import { ChartDrawerContent } from "./ChartDrawerContent";
import { ChartDrawerLegend, DrawerLegendItem } from "./ChartDrawerLegend";
import { GraphLegend } from "./ui/graph-legend";
import { BaseChartCore } from "./charts/base/BaseChartCore";
import { ChartTooltip, TooltipItem } from "./ChartTooltip";
import { useSyncedChart } from "./SyncedChartContext";
import { useChartLineStyle } from "./hooks/useChartLineStyle";
import { applyRollingWindowToDataset } from "./utils/rollingWindowStats";
import { useSharedAxisWidth } from "./charts/context/SharedAxisWidthContext";
import { measureYAxisWidth } from "./charts/utils/measureAxisWidth";
import { ResizeHandleVertical } from "./ui/resize-handle-vertical";

type MetricType = "avg" | "min" | "max";

type Row = {
  x: string;
  qoe: number;
  qoeLabel: string;
};

interface CpeQoeHistoryChartProps {
  hideDrawer?: boolean;
  onMaximize?: () => void;
  variant?: "default" | "drawer";
  enableSync?: boolean;
  sharedRange?: { startIndex: number; endIndex: number };
  onDataLoad?: (dataLength: number, data: any[]) => void;
  height?: number;
  showResizeHandle?: boolean;
  onHeightChange?: (deltaY: number) => void;
  showDragHandle?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
  metricType?: MetricType;
  onMetricTypeChange?: (type: MetricType) => void;
  isBrushAdjusting?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  disableMoveUp?: boolean;
  disableMoveDown?: boolean;
}

const QOE_COLORS = {
  main: "#EF4444",
};

const GERMAN_TO_QOE: Record<string, { score: number; english: string }> = {
  "sehr gut": { score: 5, english: "Excellent" },
  "gut": { score: 4, english: "Good" },
  "mittel": { score: 3, english: "Fair" },
  "schlecht": { score: 2, english: "Poor" },
  "sehr schlecht": { score: 1, english: "Very Poor" },
};

const SCORE_TO_ENGLISH: Record<number, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Fair",
  4: "Good",
  5: "Excellent",
};

const QOE_TICKS = [1, 2, 3, 4, 5];

const clampScore = (value: number): number => Math.max(1, Math.min(5, value));
const roundScore = (value: number): number => Math.round(clampScore(value));

const scoreToEnglish = (value: number): string => {
  const rounded = Math.round(clampScore(value));
  return SCORE_TO_ENGLISH[rounded] ?? "Unknown";
};

const formatQoeTick = (value: any): string => {
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  const rounded = roundScore(n);
  return `${rounded} (${scoreToEnglish(rounded)})`;
};

const formatQoeDisplay = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "N/A";
  const rounded = roundScore(value);
  return `${rounded} (${scoreToEnglish(rounded)})`;
};

export default function CpeQoeHistoryChart({
  hideDrawer = false,
  onMaximize,
  variant = "default",
  enableSync = false,
  sharedRange,
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
  onMoveUp,
  onMoveDown,
  onDelete,
  disableMoveUp = false,
  disableMoveDown = false,
}: CpeQoeHistoryChartProps = {}) {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenMetric, setHiddenMetric] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("avg");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const activeMetric = metricType ?? selectedMetric;
  const syncContext = enableSync ? useSyncedChart() : undefined;

  const parseCSV = (text: string): Row[] => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];

    const header = lines[0].split(/\s*,\s*/).map((h) => h.replace(/^"|"$/g, ""));
    const idxTimestamp = header.indexOf("timestamp");
    const idxLevel = header.indexOf("qoe_level");
    const idxScore = header.indexOf("qoe_score");

    const rows: Row[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      if (!parts.length) continue;

      const timeStr = parts[idxTimestamp]?.replace(/^"|"$/g, "");
      const levelStr = parts[idxLevel]?.replace(/^"|"$/g, "");
      const scoreStr = idxScore >= 0 ? parts[idxScore]?.replace(/^"|"$/g, "") : "";
      if (!timeStr || (!levelStr && !scoreStr)) continue;

      const normalizedLevel = String(levelStr || "").trim().toLowerCase();
      const germanMapped = GERMAN_TO_QOE[normalizedLevel];
      const explicitScore = scoreStr ? Number(scoreStr) : NaN;
      const score = Number.isFinite(explicitScore)
        ? clampScore(explicitScore)
        : germanMapped?.score ?? 3;
      const english = germanMapped?.english ?? scoreToEnglish(score);

      rows.push({
        x: new Date(timeStr.replace(" ", "T") + "Z").toISOString(),
        qoe: score,
        qoeLabel: english,
      });
    }

    return rows.sort((a, b) => +new Date(a.x) - +new Date(b.x));
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const csvRes = await fetch("/cpe-qoe-history.csv");
        if (!csvRes.ok) throw new Error("Failed to fetch cpe-qoe-history.csv");
        const csvText = await csvRes.text();
        if (cancelled) return;
        const parsed = parseCSV(csvText);
        setData(parsed);
        setLoading(false);
        onDataLoad?.(parsed.length, parsed);
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
  }, [onDataLoad]);

  const len = data.length;
  const [range, setRange] = useState<{ left: number; right: number }>({
    left: 0,
    right: Math.max(0, Math.min(24 * 7 - 1, len - 1)),
  });

  useEffect(() => {
    if (!len) return;
    setRange((prev) => ({
      left: 0,
      right: Math.max(prev.right, Math.min(24 * 7 - 1, len - 1)),
    }));
  }, [len]);

  const effectiveRange =
    variant === "drawer" && sharedRange
      ? { left: sharedRange.startIndex, right: sharedRange.endIndex }
      : range;

  const slicedData = useMemo(
    () => data.slice(effectiveRange.left, effectiveRange.right + 1),
    [data, effectiveRange],
  );

  const aggregatedData = useMemo(() => {
    return applyRollingWindowToDataset(slicedData, ["qoe"], 3);
  }, [slicedData]);

  const displayData = useMemo(() => {
    return aggregatedData.map((row: any) => {
      const out = { ...row };
      const avg = out.qoe_avg;
      const min = out.qoe_min;
      const max = out.qoe_max;
      out.qoe_avg = typeof avg === "number" && !Number.isNaN(avg) ? roundScore(avg) : avg;
      out.qoe_min = typeof min === "number" && !Number.isNaN(min) ? roundScore(min) : min;
      out.qoe_max = typeof max === "number" && !Number.isNaN(max) ? roundScore(max) : max;
      return out;
    });
  }, [aggregatedData]);

  const measuredLeftWidth = useMemo(
    () => measureYAxisWidth(QOE_TICKS.map((tick) => formatQoeTick(tick))),
    [],
  );
  const { sharedLeftAxisWidth, sharedRightAxisWidth } = useSharedAxisWidth(
    "cpe-qoe",
    measuredLeftWidth,
    0,
  );

  const hasVisibleMetric = !hiddenMetric;

  const handleChartMouseMove = useCallback(
    (state: any) => {
      if (!enableSync || !syncContext) return;
      if (state && state.activeTooltipIndex !== undefined && displayData[state.activeTooltipIndex]) {
        syncContext.setSyncedTimestamp(displayData[state.activeTooltipIndex].x);
      }
    },
    [enableSync, syncContext, displayData],
  );

  const handleChartMouseLeave = useCallback(() => {
    if (!enableSync || !syncContext) return;
    syncContext.setSyncedTimestamp(null);
  }, [enableSync, syncContext]);

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !label) return null;

    const targetIso = String(label ?? payload?.[0]?.payload?.x ?? "");
    const rowAtLabel = displayData.find((r: any) => String(r.x) === targetIso) as any | undefined;
    const score = rowAtLabel?.[`qoe_${activeMetric}`] ?? null;

    const items: TooltipItem[] = [
      {
        id: "qoe",
        label: "QoE",
        value: typeof score === "number" && !Number.isNaN(score) ? score : null,
        color: QOE_COLORS.main,
        unit: score !== null ? `(${scoreToEnglish(roundScore(score))})` : undefined,
        isVisible: !hiddenMetric,
      },
    ];

    return (
      <ChartTooltip
        active={active}
        payload={payload}
        label={label}
        data={displayData}
        xKey="x"
        items={items}
        valuePrecision={0}
      />
    );
  };

  const lineStyle = useChartLineStyle({
    isHighlighted: true,
    color: QOE_COLORS.main,
    chartData: displayData,
    dataKey: `qoe_${activeMetric}`,
    showBoundaryMarkers: true,
  });

  const renderLegend = () => (
    <div className="w-full flex items-center justify-between gap-2">
      <GraphLegend
        items={[
          {
            id: "qoe",
            label: "QoE",
            color: QOE_COLORS.main,
            isHidden: hiddenMetric,
          },
        ]}
        onToggleItem={() => setHiddenMetric((prev) => !prev)}
        onShowAll={() => setHiddenMetric(false)}
      />
      {variant === "default" && (
        <div className="flex items-center gap-1">
          {(["min", "avg", "max"] as MetricType[]).map((metric) => {
            const isActive = activeMetric === metric;
            return (
              <button
                key={metric}
                type="button"
                className="transition-opacity hover:opacity-80"
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  lineHeight: "16px",
                  fontWeight: 500,
                  color: isActive ? "rgb(var(--content-primary))" : "rgb(var(--content-tertiary))",
                  backgroundColor: isActive ? "rgb(var(--surface-action-hover))" : "transparent",
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

  const renderChartCore = (chartHeight: number) => (
    <BaseChartCore
      data={displayData}
      xKey="x"
      height={chartHeight}
      margin={{ top: 8, right: 0, left: 0, bottom: 8 }}
      yAxisConfig={[
        {
          id: "qoe",
          orientation: "left",
          domain: [1, 5],
          ticks: QOE_TICKS,
          tickFormatter: formatQoeTick,
          label: "QoE",
          width: 50,
        },
      ]}
      sharedLeftAxisWidth={sharedLeftAxisWidth}
      sharedRightAxisWidth={sharedRightAxisWidth}
      startIndex={0}
      endIndex={displayData.length - 1}
      enableSync={!!enableSync}
      onMouseMove={handleChartMouseMove}
      onMouseLeave={handleChartMouseLeave}
      renderTooltip={() => <CustomTooltip />}
      renderLines={() =>
        hasVisibleMetric ? (
          <Line
            yAxisId="qoe"
            type="stepAfter"
            dataKey={`qoe_${activeMetric}`}
            stroke={QOE_COLORS.main}
            strokeWidth={2.0}
            dot={lineStyle.dot}
            activeDot={lineStyle.activeDot}
            isAnimationActive={false}
            connectNulls={false}
            strokeOpacity={lineStyle.strokeOpacity}
          />
        ) : null
      }
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-content-tertiary">Loading CPE QoE data...</div>
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

  if (!data.length || !hasVisibleMetric) {
    return (
      <div className="flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-content-tertiary">{!data.length ? "No data available" : "No visible metrics"}</div>
      </div>
    );
  }

  if (variant === "drawer") {
    const chartHeight = height ?? 256;

    const stats = {
      min: displayData.length ? Math.min(...displayData.map((r: any) => Number(r.qoe_min ?? 3))) : null,
      avg: displayData.length
        ? displayData.reduce((sum: number, row: any) => sum + Number(row.qoe_avg ?? 3), 0) / displayData.length
        : null,
      max: displayData.length ? Math.max(...displayData.map((r: any) => Number(r.qoe_max ?? 3))) : null,
    };

    const drawerLegendItems: DrawerLegendItem[] = [
      {
        id: "qoe",
        label: "QoE",
        color: QOE_COLORS.main,
        min: formatQoeDisplay(stats.min),
        avg: formatQoeDisplay(stats.avg),
        max: formatQoeDisplay(stats.max),
        isHidden: hiddenMetric,
        activeMetric,
      },
    ];

    const timestampInfo =
      slicedData.length > 0
        ? {
            type: "range" as const,
            startDate: new Date(slicedData[0].x),
            endDate: new Date(slicedData[slicedData.length - 1].x),
          }
        : undefined;

    return (
      <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ height: `${chartHeight + 90}px` }}>
        <ChartDrawerContent
          sidebar={
            <ChartDrawerLegend
              dataItems={drawerLegendItems}
              timestamp={timestampInfo}
              isBrushAdjusting={isBrushAdjusting}
              selectedMetrics={[activeMetric]}
              onMetricsChange={onMetricTypeChange
                ? (metrics) => {
                    if (metrics.length > 0) onMetricTypeChange(metrics[metrics.length - 1] as MetricType);
                  }
                : metricType === undefined
                  ? (metrics) => {
                      if (metrics.length > 0) setSelectedMetric(metrics[metrics.length - 1] as MetricType);
                    }
                  : undefined}
              onToggleDataItem={() => setHiddenMetric((prev) => !prev)}
            />
          }
        >
          <ChartDrawerHeader
            title="CPE history"
            metricButton={metricType === undefined ? <MetricButton label="QoE" /> : undefined}
            selectedMetrics={[activeMetric]}
            onMetricsChange={onMetricTypeChange
              ? (metrics) => {
                  if (metrics.length > 0) onMetricTypeChange(metrics[metrics.length - 1] as MetricType);
                }
              : metricType === undefined
                ? (metrics) => {
                    if (metrics.length > 0) setSelectedMetric(metrics[metrics.length - 1] as MetricType);
                  }
                : undefined}
            hideMetricToggles={true}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onDelete={onDelete}
            disableMoveUp={disableMoveUp}
            disableMoveDown={disableMoveDown}
          />
          <div className="chart-drawer-chart-container">{renderChartCore(chartHeight)}</div>
        </ChartDrawerContent>
        {showResizeHandle && onHeightChange && <ResizeHandleVertical onResize={onHeightChange} />}
      </div>
    );
  }

  const chartHeight = height ?? 256;
  const defaultChart = (
    <div style={{ overflow: "visible", position: "relative" }}>
      {renderChartCore(chartHeight)}
      {variant === "default" && (
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

  return (
    <>
      <ChartCard
        variant={variant}
        showResizeHandle={showResizeHandle}
        onHeightChange={onHeightChange}
        header={
          <ChartHeader
            title="CPE history"
            metricButton={metricType === undefined ? <MetricButton label="QoE" /> : undefined}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            metricType={metricType}
            onMetricTypeChange={onMetricTypeChange}
            actions={
              variant === "default" ? (
                <MaximizeButton
                  onClick={() => {
                    if (onMaximize) {
                      onMaximize();
                    } else {
                      setIsDrawerOpen(true);
                    }
                  }}
                />
              ) : undefined
            }
          />
        }
        legend={renderLegend()}
      >
        {defaultChart}
      </ChartCard>

      {!hideDrawer && (
        <ResizableChartDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          title="CPE QoE History"
          defaultSize={50}
          minSize={30}
          maxSize={80}
        >
          {defaultChart}
        </ResizableChartDrawer>
      )}
    </>
  );
}
