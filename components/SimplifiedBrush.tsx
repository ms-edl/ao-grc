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
  const anyHandleInteracted = hoverLeft || hoverRight || dragging === "left" || dragging === "right";

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
      // Skip first and last ticks
      if (i === 0 || i >= data.length - tickInterval) continue;
      
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
          className="absolute inset-x-4 top-2 h-8 transition-colors duration-200 rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: "rgb(var(--content-primary) / 0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)"
          }}
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
            {tickPositions.map((x, i) => {
              // Check if this tick is within the selected range
              const isInSelection = x >= selectionLeft && x <= selectionRight;
              return (
                <line
                  key={i}
                  x1={x}
                  y1={16}
                  x2={x}
                  y2={24}
                  stroke="rgb(var(--content-primary))"
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={isInSelection ? 0.1 : 0.03}
                />
              );
            })}
          </svg>
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

