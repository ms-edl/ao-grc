import React from 'react';

type MetricType = "avg" | "min" | "max";

interface PreviewLabel {
  metric: MetricType;
  value: number;
  color: string;
}

interface ChartPreviewLabelsProps {
  labels: PreviewLabel[];
  chartHeight: number;
  yAxisDomain: [number, number];
  topMargin?: number;
  bottomMargin?: number;
  rightOffset?: string;
}

export function ChartPreviewLabels({
  labels,
  chartHeight,
  yAxisDomain,
  topMargin = 8,
  bottomMargin = 8,
  rightOffset = '-12px',
}: ChartPreviewLabelsProps) {
  const usableHeight = chartHeight - topMargin - bottomMargin;

  return (
    <>
      {labels.map(({ metric, value, color }) => {
        // Calculate Y position (inverted because CSS top is from top)
        const normalizedValue = (value - yAxisDomain[0]) / (yAxisDomain[1] - yAxisDomain[0]);
        const yPosition = topMargin + (1 - normalizedValue) * usableHeight;
        
        return (
          <div
            key={metric}
            style={{
              position: 'absolute',
              right: rightOffset,
              top: `${yPosition - 14}px`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              pointerEvents: 'none',
              transform: 'translateY(-50%)',
              zIndex: 10
            }}
          >
            <svg width="26" height="11" viewBox="0 0 26 11" fill="none">
              <path 
                d="M3.39951 1.25061C3.77906 0.77618 4.35368 0.5 4.96125 0.5H24C25.1046 0.5 26 1.39543 26 2.5V8.5C26 9.60457 25.1046 10.5 24 10.5H4.96125C4.35368 10.5 3.77906 10.2238 3.39951 9.74939L0.999512 6.74939C0.415163 6.01895 0.415162 4.98105 0.999512 4.25061L3.39951 1.25061Z" 
                fill={color}
              />
              <text
                x="14"
                y="5.5"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '9px',
                  fill: 'rgb(var(--surface-tile))',
                  fontWeight: 500,
                  userSelect: 'none'
                }}
              >
                {metric}
              </text>
            </svg>
          </div>
        );
      })}
    </>
  );
}

