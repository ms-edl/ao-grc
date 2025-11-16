import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ==========================
// Types
// ==========================
interface Point {
  x: string | number;
  [key: string]: any;
}

// ==========================
// Utilities
// ==========================
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toDate = (v: any): Date | null => {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
};

// ==========================
// Types
// ==========================
export interface ExternalBrushProps {
  data: Point[];
  xKey: string;
  startIndex: number;
  endIndex: number;
  minSelectionPoints: number;
  maxSelectionPoints: number;
  onChange: (range: { startIndex: number; endIndex: number }) => void;
  /** Optional aggregator to compute a single numeric value per row for the mini overview */
  overviewMetric?: (row: any) => number | null | undefined;
  /** Optional color for the mini overview line/area */
  overviewColor?: string;
}

// ==========================
// Components
// ==========================
const HandleVisual: React.FC<{ hover?: boolean; active?: boolean; bandHovered?: boolean; anyHandleInteracted?: boolean }> = ({ hover = false, active = false, bandHovered = false, anyHandleInteracted = false }) => {
  let backgroundColor = "rgb(var(--content-tertiary))";
  let opacity = 0;
  
  if (hover || active) {
    backgroundColor = "rgb(var(--content-primary))";
    opacity = 1;
  } else if (bandHovered || anyHandleInteracted) {
    backgroundColor = "rgb(var(--content-tertiary))";
    opacity = 1;
  }
  
  return (
    <div
      className="transition-all duration-150"
      style={{ 
        width: 4,
        height: 12,
        borderRadius: 2,
        backgroundColor,
        boxShadow: (hover || active) ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.2)",
        opacity,
      }}
    />
  );
};

const TooltipBadge: React.FC<{ label: string; visible?: boolean; side?: 'left' | 'right' }> = ({ label, visible, side }) => {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: `translateY(${visible ? 0 : 4}px) translateY(-50%)`,
    opacity: visible ? 1 : 0,
    pointerEvents: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    width: 'auto',
    maxWidth: 'none',
    userSelect: 'none',
  };
  if (side === 'left') {
    Object.assign(baseStyle, { right: '100%', marginRight: -4 });
  } else if (side === 'right') {
    Object.assign(baseStyle, { left: '100%', marginLeft: -4 });
  }
  return (
    <div
      className="px-2 py-1 rounded-md absolute-gradient-border bg-surface-tile text-xs text-content-primary whitespace-nowrap transition-all duration-200"
      style={baseStyle}
    >
      {label}
    </div>
  );
};

// ==========================
// Main brush component
// ==========================
export const ExternalBrush: React.FC<ExternalBrushProps> = ({
  data,
  xKey,
  startIndex,
  endIndex,
  minSelectionPoints,
  maxSelectionPoints,
  onChange,
  overviewMetric,
  overviewColor = "rgb(var(--content-tertiary))",
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<"left" | "right" | "range" | null>(null);
  const [localStart, setLocalStart] = useState<number>(startIndex);
  const [localEnd, setLocalEnd] = useState<number>(endIndex);
  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);
  const [hoverBand, setHoverBand] = useState(false);
  const [trackWidth, setTrackWidth] = useState<number>(0);

  useEffect(() => {
    setLocalStart(startIndex);
    setLocalEnd(endIndex);
  }, [startIndex, endIndex]);

  // Observe width so the mini overview scales responsively
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof window === "undefined") return;
    const RO = (window as any).ResizeObserver;
    if (RO) {
      const resizeObserver = new RO((entries: any[]) => {
        for (const entry of entries) {
          const w = entry.contentRect?.width || el.clientWidth || 0;
          setTrackWidth(Math.max(0, w - 32)); // minus inset-x-4 (16px left + right)
        }
      });
      resizeObserver.observe(el);
      return () => resizeObserver.disconnect();
    } else {
      // Fallback
      const handle = () => setTrackWidth(Math.max(0, (trackRef.current?.clientWidth || 0) - 32));
      handle();
      window.addEventListener("resize", handle);
      return () => window.removeEventListener("resize", handle);
    }
  }, []);

  const total = data.length;
  const pxFromIndex = useCallback(
    (idx: number) => {
      const el = trackRef.current;
      if (!el || total <= 1) return 0;
      const w = el.clientWidth - 32; // accounts for inset-x-4 (16px left + right)
      return (idx / (total - 1)) * w;
    },
    [total]
  );

  const indexFromPx = useCallback(
    (px: number) => {
      const el = trackRef.current;
      if (!el || total <= 1) return 0;
      const w = el.clientWidth - 32;
      const ratio = clamp(px / w, 0, 1);
      return Math.round(ratio * (total - 1));
    },
    [total]
  );

  // Maintain pointer offset when dragging the selection band
  const rangeDragOffsetRef = useRef<number>(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left - 16; // align to inset-x-4

    let s = localStart;
    let en = localEnd;
    const maxW = Math.max(minSelectionPoints, maxSelectionPoints);

    if (dragging === "left") {
      const target = indexFromPx(px);
      const minLeft = Math.max(0, en - maxW);
      const maxLeft = en - minSelectionPoints;
      s = clamp(target, minLeft, maxLeft);
    } else if (dragging === "right") {
      const target = indexFromPx(px);
      const minRight = s + minSelectionPoints;
      const maxRight = Math.min(total - 1, s + maxW);
      en = clamp(target, minRight, maxRight);
    } else if (dragging === "range") {
      const width = clamp(en - s, minSelectionPoints, maxW);
      const anchor = indexFromPx(px) - rangeDragOffsetRef.current; // maintain offset from left edge
      s = clamp(anchor, 0, Math.max(0, total - 1 - width));
      en = s + width;
    }

    setLocalStart(s);
    setLocalEnd(en);
    onChange({ startIndex: s, endIndex: en });
  }, [dragging, localStart, localEnd, total, minSelectionPoints, maxSelectionPoints, indexFromPx, onChange]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [dragging, onMouseMove, handleMouseUp]);

  const handleLeft = pxFromIndex(localStart);
  const handleRight = pxFromIndex(localEnd);
  const selectionLeft = Math.min(handleLeft, handleRight);
  const selectionRight = Math.max(handleLeft, handleRight);

  const tooltipsVisible = dragging !== null || hoverLeft || hoverRight || hoverBand;
  const anyHandleInteracted = hoverLeft || hoverRight || dragging === "left" || dragging === "right";

  const labelForIndex = useCallback((idx: number) => {
    const v = (data[idx] as any)[xKey];
    const d = toDate(v);
    if (!d) return String(v);
    // Always show clean hours (no minutes)
    const dateStr = `${d.toLocaleDateString(undefined, {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    })}, ${d.getUTCHours().toString().padStart(2, '0')}:00`;
    return dateStr;
  }, [data, xKey]);

  // ==========================
  // Mini overview computation
  // ==========================
  const previewValues: Array<number | null> = useMemo(() => {
    const res: Array<number | null> = [];
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      let val: number | null | undefined;
      if (overviewMetric) {
        val = overviewMetric(row);
      } else {
        // Default: average of all numeric keys except xKey
        let sum = 0;
        let count = 0;
        for (const k of Object.keys(row)) {
          if (k === xKey) continue;
          const v = (row as any)[k];
          if (typeof v === "number" && Number.isFinite(v)) {
            sum += v;
            count += 1;
          }
        }
        val = count > 0 ? sum / count : null;
      }
      res.push(val == null || !Number.isFinite(val as number) ? null : (val as number));
    }
    return res;
  }, [data, xKey, overviewMetric]);

  const { minY, maxY } = useMemo(() => {
    let minV = +Infinity;
    let maxV = -Infinity;
    for (const v of previewValues) {
      if (v == null) continue;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    if (!Number.isFinite(minV) || !Number.isFinite(maxV)) {
      return { minY: 0, maxY: 1 };
    }
    if (minV === maxV) {
      const pad = Math.max(1, Math.abs(minV) * 0.1);
      return { minY: minV - pad, maxY: maxV + pad };
    }
    return { minY: minV, maxY: maxV };
  }, [previewValues]);

  const previewPaths = useMemo(() => {
    const h = 40; // track height (h-10)
    const w = Math.max(0, trackWidth);
    const yToPx = (y: number) => {
      if (maxY === minY) return h / 2;
      const t = (y - minY) / (maxY - minY);
      return h - t * h;
    };

    let linePath = "";
    let areaPath = "";
    const baselineY = h; // bottom

    const totalPts = previewValues.length;
    for (let i = 0; i < totalPts; i++) {
      const v = previewValues[i];
      const x = totalPts > 1 ? (i / (totalPts - 1)) * w : 0;
      if (v == null) {
        // break the path on gaps
        linePath += " ";
        areaPath += " ";
        continue;
      }
      const y = yToPx(v);
      if (!linePath || /\s$/.test(linePath)) {
        linePath += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
        areaPath += `M ${x.toFixed(2)} ${baselineY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)}`;
      } else {
        linePath += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
        areaPath += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    }
    if (areaPath) {
      areaPath += ` L ${w.toFixed(2)} ${baselineY.toFixed(2)} Z`;
    }
    return { linePath, areaPath, w, h };
  }, [previewValues, minY, maxY, trackWidth]);

  return (
    <div className="mt-4">
      <div ref={trackRef} className="relative w-full" style={{ height: 64, userSelect: 'none' }}>
        {/* Track with mini chart */}
        <div 
          className="absolute inset-x-4 top-2 h-8 transition-colors duration-200 rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: "rgb(var(--content-primary) / 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)"
          }}
        >
          {/* Mini chart visualization */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(1, previewPaths.w)} 40`}
            preserveAspectRatio="none"
            aria-hidden
            style={{ pointerEvents: "none", display: "block" }}
          >
            {previewPaths.areaPath && (
              <path d={previewPaths.areaPath}
                fill="rgb(var(--content-tertiary))"
                fillOpacity={0.15}
                stroke="none"
              />
            )}
            {previewPaths.linePath && (
              <path d={previewPaths.linePath}
                fill="none"
                stroke={overviewColor}
                strokeWidth={1.5}
                opacity={0.6}
              />
            )}
          </svg>

          {/* Dimming overlays for areas outside selection */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: 0, width: `${selectionLeft + 1}px`, background: "rgb(var(--surface-tile)/0.7)", zIndex: 0, pointerEvents: "none" }}
          />
          <div
            className="absolute top-0 bottom-0"
            style={{ left: selectionRight, width: `${Math.max(0, previewPaths.w - selectionRight + 1)}px`, background: "rgb(var(--surface-tile)/0.7)", zIndex: 0, pointerEvents: "none" }}
          />
        </div>

        {/* Selection band */}
        <div
          className="absolute top-2 h-8 cursor-grab active:cursor-grabbing"
          style={{
            left: Math.min(handleLeft, handleRight) + 16,
            width: Math.abs(handleRight - handleLeft),
            background: `rgb(var(--content-primary) / 0.1)`,
            borderRadius: 8,
            transition: "background-color 150ms ease",
            zIndex: 2,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging("range");
            const el = trackRef.current!;
            const rect = el.getBoundingClientRect();
            const px = e.clientX - rect.left - 16;
            rangeDragOffsetRef.current = indexFromPx(px) - localStart;
          }}
          onMouseEnter={() => setHoverBand(true)}
          onMouseLeave={() => setHoverBand(false)}
        />

        {/* Left handle */}
        <div
          role="slider"
          aria-label="Start"
          className="absolute flex items-center justify-center cursor-ew-resize"
          style={{ 
            left: handleLeft + 6,
            top: 24,
            transform: `translateY(-50%) ${hoverLeft || dragging === "left" ? 'scale(1.2)' : 'scale(1)'}`,
            transition: 'transform 150ms ease',
            zIndex: 3,
            width: 32,
            height: 32,
            padding: 4,
          }}
          onMouseDown={(e) => { e.preventDefault(); setDragging("left"); }}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
        >
          <HandleVisual hover={hoverLeft} active={dragging === "left"} bandHovered={hoverBand} anyHandleInteracted={anyHandleInteracted} />
          <TooltipBadge label={labelForIndex(localStart)} visible={tooltipsVisible} side="left" />
        </div>

        {/* Right handle */}
        <div
          role="slider"
          aria-label="End"
          className="absolute flex items-center justify-center cursor-ew-resize"
          style={{ 
            left: handleRight - 6,
            top: 24,
            transform: `translateY(-50%) ${hoverRight || dragging === "right" ? 'scale(1.2)' : 'scale(1)'}`,
            transition: 'transform 150ms ease',
            zIndex: 3,
            width: 32,
            height: 32,
            padding: 4,
          }}
          onMouseDown={(e) => { e.preventDefault(); setDragging("right"); }}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
        >
          <HandleVisual hover={hoverRight} active={dragging === "right"} bandHovered={hoverBand} anyHandleInteracted={anyHandleInteracted} />
          <TooltipBadge label={labelForIndex(localEnd)} visible={tooltipsVisible} side="right" />
        </div>
      </div>
    </div>
  );
};
