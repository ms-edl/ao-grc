import React from 'react';
import { Line } from 'recharts';

export type MetricType = "avg" | "min" | "max";

/**
 * Get the preview metrics (the other two) based on the selected metric
 * @param selectedMetric - The currently selected metric
 * @returns Array of the other two metrics
 */
export function getPreviewMetrics(selectedMetric: MetricType): MetricType[] {
  if (selectedMetric === "avg") {
    return ["min", "max"];
  } else if (selectedMetric === "min") {
    return ["avg", "max"];
  } else {
    return ["min", "avg"];
  }
}

export interface PreviewLineConfig {
  /** The item ID (metric key or device ID) */
  itemId: string;
  /** Color for the preview lines */
  color: string;
  /** Y-axis ID (for WAN chart, can be "left" or "right") */
  yAxisId?: string;
  /** Data key prefix (e.g., "latency_ms" or device ID) */
  dataKeyPrefix: string;
  /** Preview metrics to show */
  previewMetrics: MetricType[];
}

/**
 * Render preview lines with consistent styling
 * Used for both hover and focus modes
 */
export function renderPreviewLines(config: PreviewLineConfig): React.ReactElement[] {
  const { itemId, color, yAxisId, dataKeyPrefix, previewMetrics } = config;
  
  return previewMetrics.map((metric) => (
    <Line
      key={`${itemId}__preview_${metric}`}
      yAxisId={yAxisId}
      type="monotone"
      dataKey={`${dataKeyPrefix}__preview_${metric}`}
      stroke={color}
      strokeWidth={1}
      dot={false}
      isAnimationActive={false}
      connectNulls={true}
      strokeOpacity={0.6}
      activeDot={false}
    />
  ));
}

