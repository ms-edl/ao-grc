interface ChartReferenceLabelProps {
  viewBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  value?: string;
  color: string;
}

/**
 * Custom label component for Recharts ReferenceLine
 * Renders a pill-shaped label with arrow pointing to the line
 */
export function ChartReferenceLabel({ viewBox, value, color }: ChartReferenceLabelProps) {
  if (!viewBox || !value) return null;
  
  // Position at the right edge of the chart with 8px offset
  const x = viewBox.x + viewBox.width;
  const y = viewBox.y;
  
  return (
    <foreignObject x={x - 18} y={y - 5.5} width="34" height="11" style={{ overflow: 'visible', zIndex: 1000 }}>
      <div style={{ paddingLeft: '16px', paddingBottom: '4px', display: 'inline-block', position: 'relative', zIndex: 1000 }}>
        <svg width="26" height="11" viewBox="0 0 26 11" style={{ display: 'block' }}>
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
            {value}
          </text>
        </svg>
      </div>
    </foreignObject>
  );
}

