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
export interface SimplifiedBrushProps {
  data: Point[];
  xKey: string;
  startIndex: number;
  endIndex: number;
  minSelectionPoints: number;
  maxSelectionPoints: number;
  onChange: (range: { startIndex: number; endIndex: number }) => void;
}

// ==========================
// Components
// ==========================
const HandleVisual: React.FC<{ hover?: boolean }> = ({ hover = false }) => (
  <div
    className="rounded-full transition-all duration-150"
    style={{ 
      width: 12,
      height: 12,
      backgroundColor: "rgb(var(--content-tertiary))",
      boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.2)",
    }}
  />
);

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
    Object.assign(baseStyle, { right: '100%', marginRight: 8 });
  } else if (side === 'right') {
    Object.assign(baseStyle, { left: '100%', marginLeft: 8 });
  }
  return (
    <div
      className="px-2 py-1 rounded-md bg-surface-tile text-xs text-content-primary whitespace-nowrap transition-all duration-200 absolute-gradient-border"
      style={baseStyle}
    >
      {label}
    </div>
  );
};

// ==========================
// Main brush component
// ==========================
export const SimplifiedBrush: React.FC<SimplifiedBrushProps> = ({
  data,
  xKey,
  startIndex,
  endIndex,
  minSelectionPoints,
  maxSelectionPoints,
  onChange,
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

  // Observe width so brush scales responsively
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
      const w = el.clientWidth - 32;
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

  const rangeDragOffsetRef = useRef<number>(0);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left - 16;

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
      const anchor = indexFromPx(px) - rangeDragOffsetRef.current;
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

  const labelForIndex = useCallback((idx: number) => {
    const v = (data[idx] as any)[xKey];
    const d = toDate(v);
    if (!d) return String(v);
    const dateStr = `${d.toLocaleDateString(undefined, {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    })}, ${d.getUTCHours().toString().padStart(2, '0')}:00`;
    return dateStr;
  }, [data, xKey]);

  // ==========================
  // Simplified tick marks visualization
  // ==========================
  const tickPositions = useMemo(() => {
    if (!data.length || !trackWidth) return [];
    
    // Generate tick marks every ~6 hours (denser ticks)
    const totalHours = data.length; // assuming hourly data
    const tickInterval = 6; // tick every 6 hours for denser appearance
    
    const ticks: number[] = [];
    for (let i = 0; i < data.length; i += tickInterval) {
      const x = (i / (total - 1)) * trackWidth;
      ticks.push(x);
    }
    
    return ticks;
  }, [data.length, trackWidth, total]);

  return (
    <div className="mt-4">
      <div ref={trackRef} className="relative w-full" style={{ height: 64, userSelect: 'none' }}>
        {/* Track with simplified tick visualization */}
        <div 
          className="absolute inset-x-4 top-2 h-8 transition-colors duration-200 bg-surface-section absolute-gradient-border rounded-full overflow-hidden"
        >
          {/* Tick marks */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(1, trackWidth)} 40`}
            preserveAspectRatio="none"
            aria-hidden
            style={{ pointerEvents: "none", display: "block" }}
          >
            {tickPositions.map((x, i) => (
              <line
                key={i}
                x1={x}
                y1={16}
                x2={x}
                y2={24}
                stroke="rgb(var(--content-tertiary))"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.2}
              />
            ))}
          </svg>

          {/* Dimming overlays for areas outside selection */}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: 0, width: `${selectionLeft + 1}px`, background: "rgb(var(--surface-tile)/0.65)", zIndex: 0, pointerEvents: "none" }}
          />
          <div
            className="absolute top-0 bottom-0"
            style={{ left: selectionRight, width: `${Math.max(0, trackWidth - selectionRight + 1)}px`, background: "rgb(var(--surface-tile)/0.65)", zIndex: 0, pointerEvents: "none" }}
          />
        </div>

        {/* Selection band */}
        <div
          className="absolute top-2 h-8 cursor-grab active:cursor-grabbing"
          style={{
            left: Math.min(handleLeft, handleRight) + 16,
            width: Math.abs(handleRight - handleLeft),
            background: `rgb(var(--content-tertiary)/${hoverBand ? "0.25" : "0.15"})`,
            borderRadius: 100,
            transition: "background-color 150ms ease",
            zIndex: 2,
            border: "1px solid rgb(var(--content-tertiary))",
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
            left: handleLeft + 26,
            top: 24,
            transform: `translateY(-50%) ${hoverLeft ? 'scale(1.2)' : 'scale(1)'}`,
            transition: 'transform 150ms ease',
            zIndex: 3,
            width: 12,
            height: 12,
          }}
          onMouseDown={(e) => { e.preventDefault(); setDragging("left"); }}
          onMouseEnter={() => setHoverLeft(true)}
          onMouseLeave={() => setHoverLeft(false)}
        >
          <HandleVisual hover={hoverLeft} />
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
            transform: `translateY(-50%) ${hoverRight ? 'scale(1.2)' : 'scale(1)'}`,
            transition: 'transform 150ms ease',
            zIndex: 3,
            width: 12,
            height: 12,
          }}
          onMouseDown={(e) => { e.preventDefault(); setDragging("right"); }}
          onMouseEnter={() => setHoverRight(true)}
          onMouseLeave={() => setHoverRight(false)}
        >
          <HandleVisual hover={hoverRight} />
          <TooltipBadge label={labelForIndex(localEnd)} visible={tooltipsVisible} side="right" />
        </div>
      </div>
    </div>
  );
};

