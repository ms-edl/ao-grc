import React from 'react';
import { formatTooltipTimestamp, toDate } from './TimeAxis';

export type MetricType = "avg" | "min" | "max";

export interface TooltipItem {
  id: string;
  label: string;
  value: number | null;
  color: string;
  unit?: string;
  isVisible?: boolean;
  // For focus mode metrics
  metric?: MetricType;
  // For client chart bands
  band?: string;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  data: any[];
  xKey: string;
  // Focus mode props
  focusedItem?: string | null;
  selectedMetric?: MetricType;
  // Normal mode items
  items?: TooltipItem[];
  // Focus mode items (min, avg, max)
  focusItems?: TooltipItem[];
  // Focus mode header (item name with color)
  focusHeader?: {
    label: string;
    color: string;
  };
  // For client chart - show band column
  showBand?: boolean;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  data,
  xKey,
  focusedItem,
  selectedMetric = "avg",
  items,
  focusItems,
  focusHeader,
  showBand = false,
}) => {
  if (!active || !label) return null;

  const title = formatTooltipTimestamp(label);

  // Find the row at the label timestamp
  const targetIso = String(label ?? payload?.[0]?.payload?.[xKey] ?? "");
  let rowAtLabel = data.find((r: any) => String(r[xKey]) === targetIso) as any | undefined;

  if (!rowAtLabel) {
    const d = toDate(label);
    if (d) {
      let best: any | undefined;
      let bestDiff = Number.POSITIVE_INFINITY;
      for (const r of data as any[]) {
        const rd = toDate((r as any)[xKey]);
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
    rowAtLabel = { [xKey]: targetIso };
  }

  const isFocusMode = !!focusedItem;
  const width = isFocusMode ? 216 : 256;

  return (
    <div
      className="flex flex-col absolute-gradient-border"
      style={{
        position: 'relative',
        backgroundColor: "rgb(var(--surface-overlay) / 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 8,
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        padding: 16,
        width,
        gap: 8,
        zIndex: 1000,
        backgroundImage: `
          linear-gradient(rgb(var(--surface-overlay) / 0.7), rgb(var(--surface-overlay) / 0.7)),
          linear-gradient(180deg, var(--border-gradient-start), var(--border-gradient-end))
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box'
      }}
    >
      <div style={{ fontSize: 12 }} className="text-content-primary font-medium">
        {title}
      </div>

      {/* Focus mode header - item name with colored dot */}
      {isFocusMode && focusHeader && (
        <div className="flex items-center" style={{ gap: 4, fontSize: 12, marginBottom: 4 }}>
          <span
            className="inline-block flex-shrink-0"
            style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: focusHeader.color }}
          />
          <span
            className="text-content-secondary"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {focusHeader.label}
          </span>
        </div>
      )}

      <div className="flex flex-col" style={{ gap: 2 }}>
        {isFocusMode && focusItems
          ? focusItems.map((item) => {
              const hasValue = item.value !== null && !Number.isNaN(item.value);
              const isActive = item.metric === selectedMetric;
              const gridCols = showBand ? '45px auto auto' : '45px auto';
              // Reduce gap between value and band in focus mode
              const gridGap = showBand ? 2 : 4;

              return (
                <div
                  key={`${item.id}-${item.metric || ''}`}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: gridCols,
                    gap: gridGap,
                    minHeight: 24,
                    opacity: item.isVisible !== false ? (isActive ? 1 : 0.5) : 0.4
                  }}
                >
                  {/* Metric label */}
                  <span
                    className="font-medium"
                    style={{
                      fontSize: 12,
                      color: 'rgb(var(--content-primary))',
                      textTransform: 'capitalize'
                    }}
                  >
                    {item.metric}
                  </span>

                  {/* Value - right aligned */}
                  <span
                    className="font-medium"
                    style={{
                      fontSize: 13,
                      color: 'rgb(var(--content-primary))',
                      textAlign: 'right',
                      minWidth: 40
                    }}
                  >
                    {hasValue ? `${item.value!.toFixed(1)}${item.unit ? ` ${item.unit}` : ''}` : 'N/A'}
                  </span>

                  {/* Band - right aligned (client chart only) */}
                  {showBand && item.band && (
                    <span
                      className="text-content-tertiary"
                      style={{
                        fontSize: 11,
                        textAlign: 'right',
                        minWidth: 60
                      }}
                    >
                      {item.band}
                    </span>
                  )}
                </div>
              );
            })
          : items?.map((item) => {
              const hasValue = item.value !== null && !Number.isNaN(item.value);
              const gridCols = showBand ? '8px 1fr auto auto' : '8px 1fr auto';

              return (
                <div
                  key={item.id}
                  className="grid items-center"
                  style={{
                    gridTemplateColumns: gridCols,
                    gap: 4,
                    minHeight: 24,
                    opacity: item.isVisible !== false ? 1 : 0.4
                  }}
                >
                  {/* Dot */}
                  <span
                    className="inline-block flex-shrink-0"
                    style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: item.color }}
                  />

                  {/* Name */}
                  <span
                    className="text-content-secondary"
                    style={{
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {item.label}
                  </span>

                  {/* Value - right aligned */}
                  <span
                    className="font-medium"
                    style={{
                      fontSize: 13,
                      color: hasValue ? 'rgb(var(--content-primary))' : 'rgb(var(--content-tertiary))',
                      textAlign: "right",
                      minWidth: 40
                    }}
                  >
                    {hasValue ? `${item.value!.toFixed(1)}${item.unit ? ` ${item.unit}` : ''}` : 'N/A'}
                  </span>

                  {/* Band - right aligned (client chart only) */}
                  {showBand && item.band && hasValue && (
                    <span
                      className="text-content-tertiary"
                      style={{
                        fontSize: 11,
                        textAlign: 'right',
                        minWidth: 60
                      }}
                    >
                      {item.band}
                    </span>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
};

