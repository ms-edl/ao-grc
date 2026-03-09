import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { ExternalBrush } from "./ExternalBrush";
import { ResizableChartDrawer } from "./ui/resizable-chart-drawer";
import { ResizeHandleVertical } from "./ui/resize-handle-vertical";
import ChartHeader, { MetricButton, MaximizeButton, FilterDivider, AoBtnFilter } from "./ChartHeader";
import ChartDrawerHeader from "./ChartDrawerHeader";
import { ChartDrawerContent } from "./ChartDrawerContent";
import { ChartDrawerLegend, DrawerLegendItem, DrawerLegendSectionItem } from "./ChartDrawerLegend";
import { useChartTheme } from "./hooks/useChartTheme";
import { useChartLegendHover } from "./hooks/useChartLegendHover";
import { GraphLegend } from "./ui/graph-legend";
import { GraphLegendItem } from "./ui/graph-legend-item";
import { useChartLineStyle } from "./hooks/useChartLineStyle";
import { calculateMetrics } from "./utils/rollingWindowStats";
import { ChartReferenceLabel } from "./ChartReferenceLabel";
import { calculateYAxisDomainFromDevices } from "./utils/calculateYAxisDomain";
import { getPreviewMetrics, renderPreviewLines } from "./utils/previewLines";
import { BaseChartCore } from "./charts/base/BaseChartCore";
import { ChartTooltip, TooltipItem } from "./ChartTooltip";
import { useSyncedChart, findClosestTimestampIndex } from "./SyncedChartContext";
import { Icon } from "./ui/icons";

const toDate = (v: any): Date | null => {
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  return null;
};

type Row = {
  x: string; // ISO timestamp
  [key: string]: string | number;
};

// Theme-specific color palettes for optimal contrast
const COLOR_ORDER = {
  light: [
    "#7A8D0F", // dev-1: darker lime
    "#16A32A", // dev-2: darker green
    "#29536B", // dev-3: navy
    "#2C7A7D", // dev-4: darker teal
    "#D99F3B", // dev-5: darker yellow
    "#D65A0F", // orange: darker
    "#B831CA", // magenta: darker
    "#1D4ED8", // blue
    "#0D9669", // emerald: darker
    "#DC2626", // red: darker
    "#0F8F8F", // teal: darker
    "#8B31D9", // violet: darker
  ],
  dark: [
    "#D1EC1C", // dev-1: brighter lime
    "#22E33D", // dev-2: brighter green
    "#3B7A99", // dev-3: lighter navy
    "#34B3BB", // dev-4: brighter teal
    "#FFD166", // dev-5: brighter yellow
    "#FF8A3D", // orange: brighter
    "#F161FF", // magenta: brighter
    "#3B82F6", // blue: brighter
    "#14DCA3", // emerald: brighter
    "#FF6B6B", // red: brighter
    "#16D6D6", // teal: brighter
    "#C77DFF", // violet: brighter
  ]
};

// Metric types for data visualization
type MetricType = "avg" | "min" | "max";

// Band codes and styles
type BandCode = "24" | "5";
const BAND_LABEL: Record<BandCode, string> = {
  "24": "2.4GHz",
  "5": "5GHz",
};
const BAND_DASH: Record<BandCode, string | undefined> = {
  "24": undefined, // solid
  "5": "8 6",    // dashed
};

const BAND_META_PREFIX = "__band:"; // stored per row as __band:<deviceId>

const normalizeBand = (raw: string | undefined | null): BandCode | null => {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (/(2\.4|2g|2 ghz|2\.4ghz)/.test(s)) return "24";
  if (/(5|5ghz|5 ghz|5ghz mesh|5 ghz mesh|mesh5|backhaul|mesh)/.test(s)) return "5";
  return null;
};

interface MultiDeviceLatencyChartProps {
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

export default function MultiDeviceLatencyChart({ 
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
}: MultiDeviceLatencyChartProps = {}) {
  // Chart height (from prop or default)
  const chartHeight = height ?? 256;
  
  // Core data state
  const [data, setData] = useState<Row[]>([]);
  const [deviceNames, setDeviceNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Theme and device interaction state
  const theme = useChartTheme();
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null);
  const [focusedDevice, setFocusedDevice] = useState<string | null>(null);
  const [preFocusHiddenDevices, setPreFocusHiddenDevices] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("avg");
  
  // Use metricType prop if provided, otherwise use internal state
  const activeMetric = metricType ?? selectedMetric;
  
  // Legend hover with tooltip support
  const {
    hoveredItem: hoveredLegendDevice,
    handleMouseEnter: handleLegendMouseEnter,
    handleMouseLeave: handleLegendMouseLeave,
    cleanup: cleanupLegendHover,
  } = useChartLegendHover({
    showIsolateTooltip: true,
    tooltipDelay: 2000,
  });
  
  // Band interaction state
  const [hoveredBand, setHoveredBand] = useState<BandCode | null>(null);
  const [hiddenBands, setHiddenBands] = useState<Set<BandCode>>(new Set());
  
  // === Filters state (controls dataset inclusion) ===
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPanel, setFilterPanel] = useState<"root" | "bands" | "clients">("root");
  const [selectedBands, setSelectedBands] = useState<Set<BandCode>>(new Set(["24", "5"]));
  // selectedClients: empty Set => "all" selected (implicit)
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // === Visibility state (controls visualization only) ===
  // hiddenDevices: devices hidden from legend view (does not affect filter)
  const [hiddenDevices, setHiddenDevices] = useState<Set<string>>(new Set());
  
  // === Drawer state ===
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Note: Chart hover state removed - sidebar no longer shows hover timestamps or live values
  // Tooltips now handle all hover interactions
  
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  // === Tooltip sync state ===
  const syncContext = enableSync ? useSyncedChart() : undefined;

  // Close filter on outside click or ESC
  useEffect(() => {
    if (!isFilterOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (filterPopoverRef.current?.contains(t as Node)) return;
      if (filterButtonRef.current?.contains(t as Node)) return;
      setIsFilterOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isFilterOpen]);

  const parseTSV = (text: string): { rows: Row[]; names: Record<string, string> } => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const tmpByTime = new Map<string, Row>();
    const names: Record<string, string> = {};
    for (const line of lines) {
      const parts = line.split(/\t+/);
      if (parts.length < 4) continue;
      const [timeStr, deviceId, deviceName, latencyStr] = parts;
      const dateIso = new Date(timeStr.replace(" ", "T") + "Z").toISOString();
      const latency = Number(latencyStr);
      names[deviceId] = deviceName;
      if (!tmpByTime.has(dateIso)) tmpByTime.set(dateIso, { x: dateIso });
      tmpByTime.get(dateIso)![deviceId] = latency;
      // Heuristic band from device name if possible (TSV has no explicit band column)
      const heuristic = normalizeBand(deviceName);
      if (heuristic) (tmpByTime.get(dateIso) as any)![`${BAND_META_PREFIX}${deviceId}`] = heuristic;
    }
    const rows = Array.from(tmpByTime.values()).sort((a, b) => +new Date(a.x) - +new Date(b.x));
    return { rows, names };
  };

  const parseCSV = (text: string): { rows: Row[]; names: Record<string, string> } => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return { rows: [], names: {} };
    // Expect header: timestamp,device_id,device_name,latency_ms[,band]
    const header = lines[0].split(/\s*,\s*/).map((h) => h.replace(/^"|"$/g, ""));
    const idxTimestamp = header.indexOf("timestamp");
    const idxDeviceId = header.indexOf("device_id");
    const idxDeviceName = header.indexOf("device_name");
    const idxLatency = header.indexOf("latency_ms");
    const lower = header.map((h) => h.toLowerCase());
    const candidates = ["band", "wifi_band", "connection_band", "connected_band", "uplink", "radio", "frequency", "freq"];
    let idxBand = -1;
    for (const c of candidates) {
      const i = lower.indexOf(c);
      if (i !== -1) { idxBand = i; break; }
    }
    const tmpByTime = new Map<string, Row>();
    const names: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/); // naive CSV split
      if (parts.length < 4) continue;
      const timeStr = parts[idxTimestamp]?.replace(/^"|"$/g, "");
      const deviceId = parts[idxDeviceId]?.replace(/^"|"$/g, "");
      const deviceName = parts[idxDeviceName]?.replace(/^"|"$/g, "");
      const latencyStr = parts[idxLatency]?.replace(/^"|"$/g, "");
      const bandStr = idxBand >= 0 ? parts[idxBand]?.replace(/^"|"$/g, "") : undefined;
      if (!timeStr || !deviceId || !latencyStr) continue;
      const dateIso = new Date(timeStr.replace(" ", "T") + "Z").toISOString();
      const latency = Number(latencyStr);
      names[deviceId] = deviceName;
      if (!tmpByTime.has(dateIso)) tmpByTime.set(dateIso, { x: dateIso });
      tmpByTime.get(dateIso)![deviceId] = latency;
      const norm = normalizeBand(bandStr) || normalizeBand(deviceName);
      if (norm) (tmpByTime.get(dateIso) as any)![`${BAND_META_PREFIX}${deviceId}`] = norm;
    }
    const rows = Array.from(tmpByTime.values()).sort((a, b) => +new Date(a.x) - +new Date(b.x));
    return { rows, names };
  };

  // Deterministic helpers for synthetic values (to avoid overlapping series)
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const isNumeric = (v: any) => typeof v === "number" && !Number.isNaN(v);

  const hashStringToUnit = (s: string) => {
    let h = 2166136261 >>> 0; // FNV-1a
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 0xffffffff; // 0..1
  };

  const augmentRowsForSparseDevices = (rows: Row[], names: Record<string, string>): Row[] => {
    if (!rows.length) return rows;
    // Collect device IDs from names and the actual rows
    const ids = new Set<string>();
    for (const k of Object.keys(names)) if (k !== "gap") ids.add(k);
    for (const r of rows) for (const k of Object.keys(r)) if (k !== "x" && k !== "gap") ids.add(k);
    const deviceIdsAll = Array.from(ids);
    if (deviceIdsAll.length === 0) return rows;

    // Measure coverage for each device
    const coverageCount: Record<string, number> = {};
    for (const id of deviceIdsAll) coverageCount[id] = 0;
    for (const r of rows) {
      for (const id of deviceIdsAll) if (isNumeric((r as any)[id])) coverageCount[id]++;
    }

    // Choose base devices as those with best coverage (top 4)
    const baseIds = deviceIdsAll
      .slice()
      .sort((a, b) => (coverageCount[b] || 0) - (coverageCount[a] || 0))
      .slice(0, 4)
      .filter((id) => coverageCount[id] > 0);
    if (baseIds.length === 0) return rows;

    // Helper to compute a baseline at a row (median of available base devices)
    const baselineAt = (r: any): number | null => {
      const vals: number[] = [];
      for (const id of baseIds) {
        const v = r[id];
        if (isNumeric(v)) vals.push(Number(v));
      }
      if (!vals.length) return null;
      vals.sort((a, b) => a - b);
      return vals[Math.floor(vals.length / 2)];
    };

    const total = rows.length;

    // For each sparse device, synthesize values when missing
    const minCoverage = Math.floor(total * 0.6); // if less than 60% points -> treat as sparse
    for (const id of deviceIdsAll) {
      if ((coverageCount[id] || 0) >= minCoverage) continue; // sufficiently covered
      const seed = hashStringToUnit(id);
      const offset = (seed * 6 - 3); // [-3, +3]
      const multiplier = 0.9 + (seed * 0.4); // [0.9, 1.3)
      const amp = 0.5 + (hashStringToUnit(id + "amp") * 1.8); // [0.5, 2.3]
      const phase = hashStringToUnit(id + "phase") * Math.PI * 2; // [0, 2pi)
      const noiseMag = 0.6 + hashStringToUnit(id + "noise") * 0.9; // [0.6, 1.5]

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i] as any;
        if (Object.prototype.hasOwnProperty.call(r, "gap")) continue; // honor global outage bands
        const existing = r[id];
        if (isNumeric(existing)) continue; // keep real data
        const base = baselineAt(r);
        if (base == null) continue;
        // Smooth daily oscillation + per-device offset and multiplier + small noise
        const t = i; // treat index as time for deterministic sinusoid
        const diurnal = amp * Math.sin((2 * Math.PI * t) / 24 + phase);
        const noise = (hashStringToUnit(id + ":" + i) - 0.5) * 2 * noiseMag;
        const val = clamp(base * multiplier + offset + diurnal + noise, 0, 25);
        r[id] = Number(val.toFixed(2));
      }
    }

    return rows;
  };

  // Minimal embedded fallback so the chart renders if TSV is missing
  const fallbackTSV = [
    "2025-08-13 00:00:00\tdev-1\tARCADYAN SPEEDHOMEWLAN\t7.0",
    "2025-08-13 00:00:00\tdev-2\tWNC DT-EXT03A-WNC\t9.64",
    "2025-08-13 00:00:00\tdev-3\tWNC DT-EXT01A-WNC (A)\t14.14",
    "2025-08-13 00:00:00\tdev-4\tWNC DT-EXT01A-WNC (B)\t14.71",
    "2025-08-13 00:00:00\tdev-5\tWNC DT-EXT01A-WNC (C)\t21.58",
    "2025-08-13 01:00:00\tdev-1\tARCADYAN SPEEDHOMEWLAN\t7.66",
    "2025-08-13 01:00:00\tdev-2\tWNC DT-EXT03A-WNC\t12.17",
    "2025-08-13 01:00:00\tdev-3\tWNC DT-EXT01A-WNC (A)\t15.26",
    "2025-08-13 01:00:00\tdev-4\tWNC DT-EXT01A-WNC (B)\t17.4",
    "2025-08-13 01:00:00\tdev-5\tWNC DT-EXT01A-WNC (C)\t25.0",
    "2025-08-13 02:00:00\tdev-1\tARCADYAN SPEEDHOMEWLAN\t4.07",
    "2025-08-13 02:00:00\tdev-2\tWNC DT-EXT03A-WNC\t10.72",
    "2025-08-13 02:00:00\tdev-3\tWNC DT-EXT01A-WNC (A)\t15.80",
    "2025-08-13 02:00:00\tdev-4\tWNC DT-EXT01A-WNC (B)\t18.22",
    "2025-08-13 02:00:00\tdev-5\tWNC DT-EXT01A-WNC (C)\t24.68"
  ].join("\n");

  // Load TSV dataset from public folder
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Prefer CSV if available, then TSV
        let csvText: string | null = null;
        try {
          const csvRes = await fetch("/client-latency.csv");
          if (csvRes.ok) csvText = await csvRes.text();
        } catch {}
        let text: string | null = null;
        if (!csvText) {
          const tsvRes = await fetch("/client-latency.tsv");
          if (!tsvRes.ok) throw new Error(`Failed to fetch latency.csv or latency.tsv`);
          text = await tsvRes.text();
        }
        if (cancelled) return;
        const parsed = csvText ? parseCSV(csvText) : parseTSV(text!);
        const augmentedRows = augmentRowsForSparseDevices(parsed.rows, parsed.names);
        setDeviceNames(parsed.names);
        setData(augmentedRows);
        setLoading(false);
        // Report data length to parent for global brush
        if (onDataLoad) {
          onDataLoad(augmentedRows.length, augmentedRows);
        }
      } catch (e: any) {
        if (cancelled) return;
        try {
          const parsed = parseTSV(fallbackTSV);
          setDeviceNames(parsed.names);
          setData(parsed.rows);
          setError(null);
        } catch {
          setError(e?.message || String(e));
        } finally {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const len = data.length;

  const [range, setRange] = useState<{ left: number; right: number }>({ left: 0, right: Math.max(0, Math.min(24 * 7 - 1, len - 1)) });

  useEffect(() => {
    if (!len) return;
    setRange(prev => ({ left: 0, right: Math.max(prev.right, Math.min(24 * 7 - 1, len - 1)) }));
  }, [len]);

  // Use sharedRange when in drawer, otherwise use internal range
  const effectiveRange = variant === 'drawer' && sharedRange 
    ? { left: sharedRange.startIndex, right: sharedRange.endIndex }
    : range;

  const slicedData = useMemo(() => data.slice(effectiveRange.left, effectiveRange.right + 1), [data, effectiveRange]);

  // Detect all device IDs present in the dataset (exclude synthetic "gap" and meta keys)
  const deviceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id] of Object.entries(deviceNames)) {
      if (id && id !== "gap") ids.add(id);
    }
    for (const row of data) {
      for (const key of Object.keys(row)) {
        if (key !== "x" && key !== "gap" && !key.startsWith("__")) ids.add(key);
      }
    }
    return Array.from(ids).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [deviceNames, data]);

  // Filtered clients (dataset inclusion based on filter)
  const filteredDeviceIds = useMemo(() => {
    if (selectedClients.size === 0) return deviceIds;
    return deviceIds.filter((id) => selectedClients.has(id));
  }, [deviceIds, selectedClients]);

  // Visible clients (visualization layer - respects filter, focus mode, and hidden devices)
  const visibleDeviceIds = useMemo(() => {
    // If in focus mode, only show the focused device
    if (focusedDevice) {
      return [focusedDevice];
    }
    
    // Start with filtered devices
    let visible = filteredDeviceIds;
    
    // Apply hidden devices (legend visibility toggle)
    visible = visible.filter(id => !hiddenDevices.has(id));
    
    return visible;
  }, [filteredDeviceIds, hiddenDevices, focusedDevice]);


  // Map device IDs to theme-specific colors from the palette
  const DEVICE_COLORS = useMemo(() => {
    const map: Record<string, string> = {};
    const palette = COLOR_ORDER[theme];
    deviceIds.forEach((id, idx) => {
      map[id] = palette[idx % palette.length];
    });
    return map;
  }, [deviceIds, theme]);

  // Precompute simple quantiles per device to heuristically infer band when not provided
  const deviceLatencyQuantiles = useMemo(() => {
    const q: Record<string, { q25: number; q75: number } | undefined> = {};
    for (const id of deviceIds) {
      const vals: number[] = [];
      for (const r of data as any[]) {
        const v = r[id];
        if (typeof v === "number" && !Number.isNaN(v)) vals.push(Number(v));
      }
      if (!vals.length) { q[id] = undefined; continue; }
      vals.sort((a, b) => a - b);
      const idx25 = Math.max(0, Math.floor(vals.length * 0.25));
      const idx75 = Math.max(0, Math.floor(vals.length * 0.75));
      q[id] = { q25: vals[idx25], q75: vals[idx75] };
    }
    return q;
  }, [data, deviceIds]);

  // Compute global outage ranges within the visible slice.
  // A timestamp is considered an outage when:
  // - none of the known deviceIds have a numeric value OR
  // - the parsed row contains a synthetic "gap" key (from CSV rows with device_id=gap)
  const outageRanges = useMemo(() => {
    const ranges: { x1: string; x2: string }[] = [];
    if (!slicedData.length) return ranges;
    const isNumeric = (v: any) => typeof v === "number" && !Number.isNaN(v);
    let startIdx: number | null = null;
    for (let i = 0; i < slicedData.length; i++) {
      const row: any = slicedData[i];
      const hasGapFlag = Object.prototype.hasOwnProperty.call(row, "gap");
      const allMissing = deviceIds.length === 0 || deviceIds.every((id) => !isNumeric(row[id]));
      const isOutage = hasGapFlag || allMissing;
      if (isOutage && startIdx == null) {
        startIdx = i;
      } else if (!isOutage && startIdx != null) {
        const endIdx = i - 1;
        const left = slicedData[Math.max(0, startIdx - 1)] as any;
        const right = slicedData[Math.min(slicedData.length - 1, endIdx + 1)] as any;
        ranges.push({ x1: (left?.x as string) ?? (slicedData[startIdx] as any).x, x2: (right?.x as string) ?? (slicedData[endIdx] as any).x });
        startIdx = null;
      }
    }
    if (startIdx != null) {
      const endIdx = slicedData.length - 1;
      const left = slicedData[Math.max(0, startIdx - 1)] as any;
      ranges.push({ x1: (left?.x as string) ?? (slicedData[startIdx] as any).x, x2: (slicedData[endIdx] as any).x as string });
    }
    return ranges;
  }, [slicedData]);

  // Band-split dataset and boundary dots per split key
  const slicedDataBanded = useMemo(() => {
    // Window size for rolling calculations (shared calculateMetrics imported from utils)
    const windowSize = 3; // Use 3-point window for all metrics

    // Track previous band and timestamp for each device to detect breaks
    const deviceState: Record<string, { band: BandCode | null; timestamp: Date | null }> = {};
    for (const id of deviceIds) {
      deviceState[id] = { band: null, timestamp: null };
    }

    return slicedData.map((row: any, idx: number) => {
      const out: any = { ...row };
      const currentTimestamp = toDate(row.x);
      
      for (const id of deviceIds) {
        const v = row[id];
        if (!(typeof v === "number" && !Number.isNaN(v))) {
          // ensure keys exist but null to keep chart gaps clean
          for (const code of ["24", "5"] as BandCode[]) out[`${id}__band_${code}`] = null;
          deviceState[id] = { band: null, timestamp: null };
          continue;
        }

        // 1) explicit band from data/heuristic parsing
        let b: BandCode | null | undefined = row[`${BAND_META_PREFIX}${id}`] as BandCode | null | undefined;
        // 2) device-name heuristic for mesh/ext
        if (!b) {
          const name = deviceNames[id] || "";
          if (/\b(mesh|ext|extender|backhaul)\b/i.test(name)) b = "5";
        }
        // 3) latency-based heuristic: below q25 -> 5GHz, above q75 -> 2.4GHz, between -> keep previous band if available
        if (!b) {
          const q = deviceLatencyQuantiles[id];
          if (q) {
            if (v <= q.q25) b = "5";
            else if (v >= q.q75) b = "24";
          }
        }
        // 4) if still none, default solid 2.4
        const code: BandCode = (b as BandCode) ?? "24";

        // Check if we should break the line
        const prevState = deviceState[id];
        let shouldBreak = false;
        
        if (prevState.band !== null && prevState.timestamp !== null && currentTimestamp !== null) {
          // Check 1: Band changed
          if (prevState.band !== code) {
            shouldBreak = true;
          }
          
          // Check 2: Time gap > 1 hour (3600000 ms)
          const timeDiff = Math.abs(currentTimestamp.getTime() - prevState.timestamp.getTime());
          if (timeDiff > 3600000) {
            shouldBreak = true;
          }
        }

        // Calculate metrics using a sliding window
        const windowValues: number[] = [];
        for (let i = Math.max(0, idx - windowSize + 1); i <= Math.min(slicedData.length - 1, idx + windowSize - 1); i++) {
          const windowRow = slicedData[i] as any;
          const windowVal = windowRow[id];
          if (typeof windowVal === "number" && !Number.isNaN(windowVal)) {
            windowValues.push(windowVal);
          }
        }
        
        let metricValue = v; // fallback to raw value
        const metrics = calculateMetrics(windowValues);
        if (metrics) {
          metricValue = metrics[activeMetric];
          // Always store min/max for hover preview (for all bands)
          out[`${id}__band_${code}__min`] = metrics.min;
          out[`${id}__band_${code}__max`] = metrics.max;
        } else {
          out[`${id}__band_${code}__min`] = null;
          out[`${id}__band_${code}__max`] = null;
        }

        // If we should break the line, set all bands to null for this point
        // This creates a visual gap before the new segment
        if (shouldBreak) {
          for (const c of ["24", "5"] as BandCode[]) {
            out[`${id}__band_${c}`] = null;
            out[`${id}__band_${c}__min`] = null;
            out[`${id}__band_${c}__max`] = null;
          }
          // Update state but mark that we just broke
          deviceState[id] = { band: code, timestamp: currentTimestamp };
        } else {
          out[`${id}__band_${code}`] = metricValue;
          const others: BandCode[] = ["24", "5"].filter((x) => x !== code) as BandCode[];
          for (const o of others) {
            out[`${id}__band_${o}`] = null;
            out[`${id}__band_${o}__min`] = null;
            out[`${id}__band_${o}__max`] = null;
          }
          // Update state
          deviceState[id] = { band: code, timestamp: currentTimestamp };
        }
      }
      return out;
    });
  }, [slicedData, deviceIds, deviceNames, deviceLatencyQuantiles, activeMetric]);

  // Calculate Y-axis domain from the FULL dataset (not just visible slice)
  // This prevents Y-axis jumps when changing the timeframe
  // Domain adjusts based on which devices are visible/hidden
  const yAxisDomain = useMemo(() => {
    // Use visible devices, or fallback to all devices if none are visible
    const devicesToUse = visibleDeviceIds.length > 0 ? visibleDeviceIds : deviceIds;
    
    // Calculate from full dataset using raw device values
    // Uses smart "nice numbers" algorithm for optimal space usage with even intervals
    // This gives a good approximation since band values are derived from device values
    return calculateYAxisDomainFromDevices(data, devicesToUse);
  }, [data, visibleDeviceIds, deviceIds]);

  // Add preview data for all three metrics when hovering or in focus mode
  const chartData = useMemo(() => {
    const baseData = slicedDataBanded;
    
    // Add preview metrics if hovering or in focus mode
    let dataWithPreviews = baseData;
    const deviceToPreview = focusedDevice || hoveredDevice;
    if (deviceToPreview) {
      dataWithPreviews = baseData.map((row: any) => {
        const id = deviceToPreview;
        const allBandValues: number[] = [];
        (["24", "5"] as BandCode[]).forEach((code) => {
          const minVal = row[`${id}__band_${code}__min`];
          const maxVal = row[`${id}__band_${code}__max`];
          if (typeof minVal === "number" && !Number.isNaN(minVal)) allBandValues.push(minVal);
          if (typeof maxVal === "number" && !Number.isNaN(maxVal)) allBandValues.push(maxVal);
        });
        
        const min = allBandValues.length > 0 ? Math.min(...allBandValues) : null;
        const max = allBandValues.length > 0 ? Math.max(...allBandValues) : null;
        
        // Calculate avg as the midpoint between min and max across all bands
        // This gives us a true average of the range, independent of selected metric
        const avg = (min !== null && max !== null) ? (min + max) / 2 : null;
        
        return {
          ...row,
          [`${id}__preview_min`]: min,
          [`${id}__preview_max`]: max,
          [`${id}__preview_avg`]: avg,
        };
      });
    }
    
    // Ensure we have data points at regular intervals for tooltip to work everywhere
    // This is needed because Recharts only shows tooltips where there are data points
    if (dataWithPreviews.length < 2) return dataWithPreviews;
    
    const firstTime = toDate(dataWithPreviews[0].x);
    const lastTime = toDate(dataWithPreviews[dataWithPreviews.length - 1].x);
    if (!firstTime || !lastTime) return dataWithPreviews;
    
    // Generate all hourly timestamps in the range
    const allTimestamps = new Set<string>();
    dataWithPreviews.forEach((row: any) => allTimestamps.add(row.x));
    
    const filledData: any[] = [];
    let current = new Date(firstTime);
    
    while (current <= lastTime) {
      const isoStr = current.toISOString();
      const existingRow = dataWithPreviews.find((r: any) => r.x === isoStr);
      
      if (existingRow) {
        filledData.push(existingRow);
      } else {
        // Add a synthetic row with just the timestamp - all values will be null
        const syntheticRow: any = { x: isoStr };
        // Add null values for all device bands to ensure tooltip can render
        for (const id of deviceIds) {
          for (const code of ["24", "5"] as BandCode[]) {
            syntheticRow[`${id}__band_${code}`] = null;
          }
        }
        filledData.push(syntheticRow);
      }
      
      current.setUTCHours(current.getUTCHours() + 1);
    }
    
    return filledData;
  }, [slicedDataBanded, hoveredDevice, focusedDevice, deviceIds]);

  // === Smart tick density (same logic as other chart) ===
  const generateSmartTicks = useCallback((rows: Row[], startIndex: number, endIndex: number, xKey: string) => {
    if (!rows.length) return { ticks: [] as string[], dayTicks: new Set<string>() };
    const sliced = rows.slice(startIndex, endIndex + 1);
    if (sliced.length === 0) return { ticks: [] as string[], dayTicks: new Set<string>() };

    const firstDate = toDate((sliced[0] as any)[xKey]);
    const lastDate = toDate((sliced[sliced.length - 1] as any)[xKey]);
    if (!firstDate || !lastDate) return { ticks: [] as string[], dayTicks: new Set<string>() };

    const hoursDiff = Math.abs((+lastDate - +firstDate) / (1000 * 60 * 60));
    const daysDiff = hoursDiff / 24;

    const ticks = new Set<string>();
    const dayTicks = new Set<string>();

    const findClosestPoint = (targetTime: number) => {
      let closest = sliced[0];
      let minDiff = Math.abs(new Date((closest as any)[xKey] as any).getTime() - targetTime);
      for (const pt of sliced) {
        const diff = Math.abs(new Date((pt as any)[xKey] as any).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = pt;
        }
      }
      return closest;
    };

    const addDayTick = (date: Date) => {
      const closest = findClosestPoint(date.getTime());
      const value = String((closest as any)[xKey]);
      ticks.add(value);
      dayTicks.add(value);
    };

    const addCleanTimeTick = (date: Date) => {
      const closest = findClosestPoint(date.getTime());
      const value = String((closest as any)[xKey]);
      ticks.add(value);
    };

    const getTimeIntervals = (d: number) => {
      // Show hourly ticks for windows up to ~6.5 hours
      if (d <= 0.27) return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      if (d <= 0.5) return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
      if (d <= 1) return [3, 6, 9, 12, 15, 18, 21];
      if (d <= 3) return [0, 4, 8, 12, 16, 20];
      if (d <= 5) return [6, 12, 18];
      if (d <= 7) return [12];
      if (d <= 16) return [];
      return [];
    };

    const getDayStep = (d: number) => {
      if (d <= 16) return 1;
      if (d <= 30) return 2;
      if (d <= 60) return 3;
      if (d <= 90) return 5;
      return Math.max(1, Math.floor(d / 10));
    };

    const dayStep = getDayStep(daysDiff);
    let current = new Date(firstDate);
    current.setUTCHours(0, 0, 0, 0);
    if (current < firstDate) current.setUTCDate(current.getUTCDate() + 1);
    while (current <= lastDate) {
      addDayTick(current);
      current.setUTCDate(current.getUTCDate() + dayStep);
    }

    // Decouple hour tick visibility from day step so hour labels don't
    // disappear just because the day label density changes while panning.
    const intervals = getTimeIntervals(daysDiff);
    if (intervals.length) {
      current = new Date(firstDate);
      current.setUTCHours(0, 0, 0, 0);
      // Do NOT skip the first day even if midnight is before firstDate.
      // Instead, include hour ticks only when their exact timestamp is within the visible window.
      while (current <= lastDate) {
        for (const h of intervals) {
          const t = new Date(current);
          t.setUTCHours(h, 0, 0, 0);
          if (t >= firstDate && t <= lastDate && h !== 0) addCleanTimeTick(t);
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    return { ticks: Array.from(ticks), dayTicks };
  }, []);

  // In drawer mode with sync, generate ticks from the original data indices (shared range)
  // to ensure consistent x-axis across charts
  const { ticks: xTicks, dayTicks } = useMemo(() => {
    if (variant === 'drawer' && sharedRange) {
      // Use full data array with shared range indices to ensure consistent tick generation
      return generateSmartTicks(data, sharedRange.startIndex, sharedRange.endIndex, "x");
    }
    return generateSmartTicks(slicedData, 0, Math.max(0, slicedData.length - 1), "x");
  }, [variant, sharedRange, data, slicedData, generateSmartTicks]);

  const CustomTick: React.FC<any> = ({ x, y, payload }) => {
    const date = toDate(payload.value);
    if (!date) return null;
    const isDay = dayTicks.has(String(payload.value)) || date.getUTCHours() === 0;
    const label = isDay
      ? date.toLocaleDateString(undefined, { timeZone: "UTC", day: "2-digit", month: "short" })
      : `${date.toLocaleTimeString(undefined, { timeZone: "UTC", hour: "2-digit", hour12: false }).split(":")[0]}:00`;
    return (
      <g transform={`translate(${x},${y})`}>
        <text dy={16} textAnchor="middle" style={{ fontSize: 10, userSelect: "none" }} fill={isDay ? "rgb(var(--content-primary))" : "rgb(var(--content-tertiary))"} fontWeight={isDay ? "600" : "400"}>
          {label}
        </text>
      </g>
    );
  };

  const renderXAxisTick = useCallback((props: any) => <CustomTick {...props} />, [dayTicks]);

  // Removed scroll-to-zoom behavior per request

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    // Keep tooltip visible on outage areas too: allow empty payload
    if (!active || !label) return null;

    const targetIso = String(label ?? payload?.[0]?.payload?.x ?? "");
    let rowAtLabel = chartData.find((r: any) => String(r.x) === targetIso) as any | undefined;
    
    // If we don't have a row at this exact timestamp, try to find the closest one
    if (!rowAtLabel) {
      const d = toDate(label);
      if (d) {
      let best: any | undefined;
      let bestDiff = Number.POSITIVE_INFINITY;
      for (const r of chartData as any[]) {
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
    
    // If still no row found, create a synthetic one with the timestamp
    if (!rowAtLabel) {
      rowAtLabel = { x: targetIso };
    }
    
    // In focus mode, show all three metrics for the focused device
    if (focusedDevice && rowAtLabel) {
      const id = focusedDevice;
      const color = DEVICE_COLORS[id] || "#999";
      const labelText = deviceNames[id] || id;
      
      // First, determine which band is actually active at this timestamp
      let activeBand: BandCode | undefined;
      for (const code of ["24", "5"] as BandCode[]) {
        const bandValue = (rowAtLabel as any)[`${id}__band_${code}`];
        if (typeof bandValue === "number" && !Number.isNaN(bandValue)) {
          activeBand = code;
          break;
        }
      }
      
      // Get min, avg, max values for the active band
      const focusItems: TooltipItem[] = [];
      if (activeBand) {
        const minVal = (rowAtLabel as any)[`${id}__band_${activeBand}__min`];
        const maxVal = (rowAtLabel as any)[`${id}__band_${activeBand}__max`];
        const avgVal = (rowAtLabel as any)[`${id}__band_${activeBand}`];
        const bandLabel = BAND_LABEL[activeBand];

        // Add all three metrics with the correct band (min, avg, max order)
        focusItems.push({ id, label: labelText, value: minVal || null, color, metric: "min", band: bandLabel });
        focusItems.push({ id, label: labelText, value: avgVal || null, color, metric: "avg", band: bandLabel });
        focusItems.push({ id, label: labelText, value: maxVal || null, color, metric: "max", band: bandLabel });
      }
      
      return (
        <ChartTooltip
          active={active}
          payload={payload}
          label={label}
          data={chartData}
          xKey="x"
          focusedItem={focusedDevice}
          selectedMetric={activeMetric}
          focusItems={focusItems}
          focusHeader={{ label: labelText, color }}
          showBand={true}
        />
      );
    }
    
    // Normal mode: show single metric for all visible devices (including those with no data)
    const items: TooltipItem[] = visibleDeviceIds.map((id) => {
      let value: number | undefined;
      let band: BandCode | undefined;

      // First try to get the value from the payload (this contains the actual displayed values)
      if (payload && payload.length > 0) {
        for (const p of payload) {
          const key = p.dataKey as string;
          if (key.startsWith(`${id}__band_`)) {
            const val = p.value;
            if (typeof val === "number" && !Number.isNaN(val)) {
              value = val;
              band = key.split("__band_")[1] as BandCode;
              break;
            }
          }
        }
      }
      
      // Fallback to rowAtLabel if no value found in payload
      if (value === undefined && rowAtLabel) {
        for (const code of ["24", "5"] as BandCode[]) {
          const bandValue = (rowAtLabel as any)[`${id}__band_${code}`];
          if (typeof bandValue === "number" && !Number.isNaN(bandValue)) {
            value = bandValue;
            band = code;
            break;
          }
        }
      }
      
          const color = DEVICE_COLORS[id] || "#999";
          const labelText = deviceNames[id] || id;
      const bandLabel = band ? BAND_LABEL[band] : undefined;

      return {
        id,
        label: labelText,
        value: value !== undefined ? value : null,
        color,
        band: bandLabel,
      };
    });

    return (
      <ChartTooltip
        active={active}
        payload={payload}
        label={label}
        data={chartData}
        xKey="x"
        items={items}
        showBand={true}
      />
                    );
                  };

  // === Sync handlers ===
  const handleChartMouseMove = useCallback((state: any) => {
    if (enableSync && syncContext) {
      // Extract active tooltip index from recharts state
      if (state && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
        const timestamp = chartData[state.activeTooltipIndex].x;
        syncContext.setSyncedTimestamp(timestamp);
      }
    }
    
    // Note: Removed hover timestamp tracking - sidebar no longer updates on hover
  }, [enableSync, syncContext, chartData, variant]);

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

  if (loading) {
    return (
      <div className="w-full p-5 bg-surface-tile chart-gradient-border rounded-md">Loading latency dataset…</div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-5 bg-surface-tile chart-gradient-border rounded-md text-red-700">{error}</div>
    );
  }
  
  // Debug log
  console.log('MultiDeviceLatencyChart rendering, variant:', variant, 'deviceIds:', visibleDeviceIds.length);

  // Render drawer variant with new layout
  if (variant === 'drawer') {
    
    // Calculate min/avg/max values for each device (for drawer legend)
    const deviceStats: Record<string, { min: number; avg: number; max: number }> = {};
    
    visibleDeviceIds.forEach((id) => {
      let sum = 0;
      let count = 0;
      let min = Infinity;
      let max = -Infinity;
      
      chartData.forEach((row: any) => {
        const val = row[id];
        if (typeof val === 'number' && !isNaN(val)) {
          sum += val;
          count++;
          min = Math.min(min, val);
          max = Math.max(max, val);
        }
      });
      
      if (count > 0) {
        deviceStats[id] = {
          min: Number(min.toFixed(1)),
          avg: Number((sum / count).toFixed(1)),
          max: Number(max.toFixed(1)),
        };
      }
    });
    
    // Prepare drawer legend items with min/avg/max
    // Use filteredDeviceIds (not visibleDeviceIds) so hidden items still appear
    const drawerLegendItems: DrawerLegendItem[] = filteredDeviceIds.map((id) => {
      const stats = deviceStats[id] || { min: 0, avg: 0, max: 0 };
      return {
        id,
        label: deviceNames[id] || id,
        color: DEVICE_COLORS[id] || "#999",
        min: `${stats.min}ms`,
        avg: `${stats.avg}ms`,
        max: `${stats.max}ms`,
        isHidden: hiddenDevices.has(id),
        activeMetric: activeMetric, // Pass the active metric (respects metricType prop)
      };
    });
    
    // Prepare section items (band types)
    const drawerSectionItems: DrawerLegendSectionItem[] = (["24", "5"] as BandCode[])
      .filter((code) => selectedBands.has(code))
      .map((code) => ({
        id: code,
        label: BAND_LABEL[code],
        dashArray: BAND_DASH[code],
        isHidden: hiddenBands.has(code),
      }));
    
    return (
      <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ height: `${chartHeight + 90}px` }}>
        <ChartDrawerContent
          sidebar={
            <ChartDrawerLegend
              dataItems={drawerLegendItems}
              sectionItems={drawerSectionItems}
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
              focusedItem={focusedDevice}
              onFocusItem={(id) => {
                setPreFocusHiddenDevices(hiddenDevices);
                setFocusedDevice(id);
                cleanupLegendHover();
              }}
              onExitFocus={() => {
                setFocusedDevice(null);
                setHiddenDevices(preFocusHiddenDevices);
                setHoveredDevice(null);
              }}
              onToggleDataItem={(id) => {
                setHoveredDevice(null);
                setHiddenDevices((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) {
                    next.delete(id);
                  } else {
                    next.add(id);
                  }
                  return next;
                });
              }}
              onToggleSectionItem={(id) => {
                setHoveredBand(null);
                setHiddenBands((prev) => {
                  const next = new Set(prev);
                  const code = id as BandCode;
                  if (next.has(code)) {
                    next.delete(code);
                  } else {
                    next.add(code);
                  }
                  return next;
                });
              }}
              onMouseEnter={(id) => {
                // Check if it's a band or device
                if (["24", "5"].includes(id)) {
                  setHoveredBand(id as BandCode);
                } else {
                  if (!focusedDevice && !hiddenDevices.has(id)) {
                    setHoveredDevice(id);
                  }
                }
              }}
              onMouseLeave={() => {
                setHoveredDevice(null);
                setHoveredBand(null);
              }}
            />
          }
        >
          {/* Header */}
          <ChartDrawerHeader
            title="Client history"
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
            actions={
              <>
                <AoBtnFilter
                  iconName="wifi"
                  countLabel={`${selectedBands.size}/${["24", "5"].length}`}
                  ariaLabel="WiFi Bands"
                  tooltipText="Wi-Fi bands"
                  onClick={() => { setIsFilterOpen(true); setFilterPanel("bands"); }}
                  buttonRef={filterButtonRef}
                />
                <AoBtnFilter
                  iconName="smartphone"
                  countLabel={`${selectedClients.size === 0 ? deviceIds.length : selectedClients.size}/${deviceIds.length}`}
                  ariaLabel="Client Devices"
                  tooltipText="Client devices"
                  onClick={() => { setIsFilterOpen(true); setFilterPanel("clients"); }}
                />
              </>
            }
          />
          
          {/* Chart */}
          <div className="chart-drawer-chart-container">
            <BaseChartCore
              data={chartData}
              xKey="x"
              height={chartHeight}
              margin={{ top: 8, right: 32, left: 0, bottom: 8 }}
              yAxisConfig={[
                { id: "latency_ms", orientation: "left", domain: [0, 30], label: "ms", width: 50 },
              ]}
              startIndex={0}
              endIndex={chartData.length - 1}
              enableSync={!!enableSync}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              renderTooltip={() => <CustomTooltip />}
              renderDefs={() => (
                <defs>
                  <pattern id="outageHatch-drawer" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgb(var(--content-tertiary))" strokeWidth="2" />
                  </pattern>
                </defs>
              )}
              renderLines={() => (
                <>
                  {(() => {
                    if (focusedDevice) {
                      const deviceId = focusedDevice!;
                      const deviceColor = DEVICE_COLORS[deviceId] || "#999";
                      const previewMetrics = getPreviewMetrics(activeMetric);
                      
                      return renderPreviewLines({
                        itemId: deviceId,
                        color: deviceColor,
                        yAxisId: "latency_ms",
                        dataKeyPrefix: deviceId,
                        previewMetrics,
                      });
                    }
                    
                    if (hoveredDevice) {
                      const deviceId = hoveredDevice!;
                      const deviceColor = DEVICE_COLORS[deviceId] || "#999";
                      const previewMetrics = getPreviewMetrics(activeMetric);
                      
                      return renderPreviewLines({
                        itemId: deviceId,
                        color: deviceColor,
                        yAxisId: "latency_ms",
                        dataKeyPrefix: deviceId,
                        previewMetrics,
                      });
                    }
                    
                    return null;
                  })()}

                  {visibleDeviceIds.flatMap((id) => (
                    (["24", "5"] as BandCode[]).filter((code) => selectedBands.has(code) && !hiddenBands.has(code)).map((code) => {
                      const key = `${id}__band_${code}`;
                      const color = DEVICE_COLORS[id] || "#555";
                      const deviceId = id.split('__band_')[0];
                      const isDeviceHighlighted = hoveredDevice === null || hoveredDevice === deviceId;
                      const isBandHighlighted = hoveredBand === null || hoveredBand === code;
                      const isHighlighted = isDeviceHighlighted && isBandHighlighted;
                      
                      const lineStyle = useChartLineStyle({
                        isHighlighted,
                        color,
                        chartData,
                        dataKey: key,
                        showBoundaryMarkers: true,
                      });
                      
                      return (
                        <Line
                          key={key}
                          yAxisId="latency_ms"
                          type="monotone"
                          dataKey={key}
                          name={id}
                          dot={lineStyle.dot}
                          strokeWidth={2.0}
                          stroke={color}
                          strokeDasharray={BAND_DASH[code]}
                          isAnimationActive={false}
                          connectNulls={false}
                          strokeOpacity={lineStyle.strokeOpacity}
                          activeDot={lineStyle.activeDot}
                        />
                      );
                    })
                  ))}
                </>
              )}
              renderReferenceElements={() => (
                <>
                  {outageRanges.map((r, i) => (
                    <ReferenceArea
                      key={`outage-${i}`}
                      yAxisId="latency_ms"
                      x1={r.x1}
                      x2={r.x2}
                      fill="rgb(var(--content-tertiary))"
                      fillOpacity={0.08}
                      stroke="rgb(var(--content-tertiary))"
                      strokeOpacity={0.2}
                    />
                  ))}

                  {outageRanges.map((r, i) => (
                    <ReferenceArea
                      key={`outage-hatch-${i}`}
                      yAxisId="latency_ms"
                      x1={r.x1}
                      x2={r.x2}
                      fill="url(#outageHatch-drawer)"
                      fillOpacity={0.15}
                      stroke="rgb(var(--content-tertiary))"
                      strokeOpacity={0.2}
                    />
                  ))}

                  {(hoveredDevice || focusedDevice) && (() => {
                    const deviceToShow = focusedDevice || hoveredDevice;
                    if (!deviceToShow) return null;
                    
                    const deviceColor = DEVICE_COLORS[deviceToShow] || "#999";
                    const previewMetrics: MetricType[] = [];
                    
                    if (focusedDevice) {
                      previewMetrics.push(...getPreviewMetrics(activeMetric));
                    } else {
                      previewMetrics.push(...getPreviewMetrics(activeMetric));
                    }
                    
                    const previewValues: Record<MetricType, number | null> = {
                      avg: null,
                      min: null,
                      max: null,
                    };
                    
                    previewMetrics.forEach((metric) => {
                      for (let i = chartData.length - 1; i >= 0; i--) {
                        const rowValue = chartData[i]?.[`${deviceToShow}__preview_${metric}`];
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
                            key={`${deviceToShow}__label_${metric}`}
                            yAxisId="latency_ms"
                            y={value}
                            stroke="transparent"
                            label={<ChartReferenceLabel value={metric} color={deviceColor} />}
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
        
        {/* Filter popover */}
        {isFilterOpen && filterPopoverRef && (
          <div
            ref={filterPopoverRef}
            className="absolute z-50 bg-surface-section border border-gradient-border rounded-lg shadow-lg p-4"
            style={{ top: '60px', right: '20px', minWidth: '200px' }}
          >
            {/* Filter content - simplified for now */}
            <div className="text-content-primary">Filter options</div>
          </div>
        )}
      </div>
    );
  }

  // Default variant rendering (unchanged)

  return (
    <>
    <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ overflow: "visible", width: "864px" }}>
      <div className="p-5 flex flex-col items-start gap-3">
        {/* Title row with actions on the right */}
        <div className="relative w-full">
          <ChartHeader
            title="Client history"
            metricButton={metricType === undefined ? <MetricButton label="Latency" /> : undefined}
            showDragHandle={showDragHandle}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            metricType={metricType}
            onMetricTypeChange={onMetricTypeChange}
            actions={
              <>
                {/* Filter buttons group */}
                <div className="flex items-center gap-1">
                  <AoBtnFilter
                    iconName="wifi"
                    countLabel={`${selectedBands.size}/${["24", "5"].length}`}
                    ariaLabel="WiFi Bands"
                    tooltipText="Wi-Fi bands"
                    onClick={() => { setIsFilterOpen(true); setFilterPanel("bands"); }}
                    buttonRef={filterButtonRef}
                  />

                  <AoBtnFilter
                    iconName="smartphone"
                    countLabel={`${selectedClients.size === 0 ? deviceIds.length : selectedClients.size}/${deviceIds.length}`}
                    ariaLabel="Client Devices"
                    tooltipText="Client devices"
                    onClick={() => { setIsFilterOpen(true); setFilterPanel("clients"); }}
                  />
                </div>

                {variant === 'default' && (
                  <>
                    <FilterDivider />

                    <MaximizeButton onClick={() => {
                      if (onMaximize) {
                        onMaximize();
                      } else {
                        setIsFilterOpen(false);
                        setIsDrawerOpen(true);
                      }
                    }} />
                  </>
                )}
              </>
            }
          />
          {/* Filter Popover (anchored to header to avoid flex gap reflow) */}
          {isFilterOpen && (
            <div
              ref={filterPopoverRef}
              className="absolute right-0 top-full mt-2 z-50"
              style={{ display: "flex", flexDirection: "row-reverse", gap: 24 }}
            >
              {/* Root panel */}
              <div className={`w-64 rounded-lg bg-surface-overlay shadow-md absolute-gradient-border ${filterPanel === "root" ? "block" : "hidden"}`}>
                <div className="px-2 pt-3 flex items-center">
                  <div className="text-xs text-content-tertiary leading-4">FILTER</div>
                </div>
                <div className="p-2 space-y-1">
                <button
                  className="w-full flex items-center justify-between px-3 h-9 rounded-md bg-surface-action hover:bg-surface-action--hover transition-colors"
                  onClick={() => setFilterPanel("bands")}
                >
                  <div className="flex items-center gap-2">
                    {/* Feather wifi icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-content-primary">Bands</span>
                  </div>
                  {/* Feather chevron-right */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="pointer-events-none">
                    <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  className="w-full flex items-center justify-between px-3 h-9 rounded-md bg-surface-action hover:bg-surface-action--hover transition-colors"
                  onClick={() => setFilterPanel("clients")}
                >
                  <div className="flex items-center gap-2">
                    {/* Feather smartphone icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                      <line x1="12" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-content-primary">Clients</span>
                  </div>
                  {/* Feather chevron-right */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="pointer-events-none">
                    <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                </div>
              </div>

              {/* Bands panel */}
              {filterPanel !== "root" && (
                <div className="w-64 rounded-lg bg-surface-overlay shadow-md absolute-gradient-border">
                  <div className="px-3 py-2 border-b border-gradient-border flex items-center justify-between">
                    <div className="text-xs text-content-tertiary leading-4">{filterPanel === "bands" ? "BANDS" : "CLIENTS"}</div>
                    {filterPanel === "clients" && (
                      <button
                        className={`ui-12-medium ${selectedClients.size === 0 ? 'text-content-tertiary cursor-not-allowed' : 'text-content-primary hover:text-content-secondary transition-colors'}`}
                        onClick={() => setSelectedClients(new Set())}
                        disabled={selectedClients.size === 0}
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  {filterPanel === "bands" && (
                    <div className="space-y-2 p-2">
                      {(["24", "5"] as BandCode[]).map((code) => {
                        const checked = selectedBands.has(code);
                        return (
                          <label
                            key={code}
                            className="flex items-center justify-between px-3 h-9 rounded-md bg-surface-action hover:bg-surface-action--hover transition-colors cursor-pointer"
                          >
                            <div className="text-sm text-content-primary">{BAND_LABEL[code]}</div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={() => {
                                setSelectedBands((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(code)) next.delete(code); else next.add(code);
                                  return next;
                                });
                              }}
                            />
                            <span className={`inline-flex items-center justify-center rounded-md flex-shrink-0 ${checked ? "bg-surface-accent-purple" : "bg-surface-tile border border-gradient-border"}`} style={{ width: 20, height: 20 }}>
                              {checked ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <polyline points="20 6 9 17 4 12" stroke="rgb(var(--static-white))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {filterPanel === "clients" && (
                    <div className="space-y-2 max-h-80 overflow-auto pr-1 p-2">
                      {deviceIds.map((id) => {
                        const isImplicitAll = selectedClients.size === 0;
                        const checked = isImplicitAll ? true : selectedClients.has(id);
                        const color = DEVICE_COLORS[id] || "#999";
                        return (
                          <label
                            key={id}
                            className="flex items-center gap-6 px-3 py-2 rounded-md bg-surface-action hover:bg-surface-action--hover transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <span className="inline-block flex-shrink-0 mt-1" style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: color }} />
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm truncate text-content-primary">{deviceNames[id] || id}</span>
                                <span className="text-xs truncate text-content-tertiary">{
                                  // Map device IDs to fictitious MAC addresses
                                  {
                                    'dev-1': '00:1A:2B:3C:4D:5E',
                                    'dev-2': '00:2B:3C:4D:5E:6F',
                                    'dev-3': '00:3C:4D:5E:6F:7A',
                                    'dev-4': '00:4D:5E:6F:7A:8B',
                                    'dev-5': '00:5E:6F:7A:8B:9C',
                                    'dev-6': '00:6F:7A:8B:9C:0D',
                                    'dev-7': '00:7A:8B:9C:0D:1E',
                                    'dev-8': '00:8B:9C:0D:1E:2F',
                                    'dev-9': '00:9C:0D:1E:2F:3A',
                                    'dev-10': '00:0D:1E:2F:3A:4B',
                                    'dev-11': '00:1E:2F:3A:4B:5C',
                                    'dev-12': '00:2F:3A:4B:5C:6D'
                                  }[id] || id
                                }</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={checked}
                              onChange={() => {
                                setSelectedClients((prev) => {
                                  const base = prev.size === 0 ? new Set(deviceIds) : new Set(prev);
                                  if (base.has(id)) base.delete(id); else base.add(id);
                                  // collapse back to implicit-all when all selected
                                  if (base.size === deviceIds.length) return new Set();
                                  return base;
                                });
                              }}
                            />
                            <span className={`inline-flex items-center justify-center rounded-md flex-shrink-0 ${checked ? "bg-surface-accent-purple" : "bg-surface-tile border border-gradient-border"}`} style={{ width: 20, height: 20 }}>
                              {checked ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <polyline points="20 6 9 17 4 12" stroke="rgb(var(--static-white))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : null}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Popover moved inside header; removed extra flex child to avoid gap spacing */}

        {/* Legend row: device colors */}
        {(() => {
          const legendItems = filteredDeviceIds.map((id) => ({
            id,
            label: deviceNames[id] || id,
            color: DEVICE_COLORS[id] || "#999",
            isHidden: hiddenDevices.has(id),
          }));
                
                return (
            <GraphLegend
              items={legendItems}
              onToggleItem={(id) => {
                          setHoveredDevice(null);
                          setHiddenDevices((prev) => {
                            const next = new Set(prev);
                            if (next.has(id)) {
                              next.delete(id);
                            } else {
                              next.add(id);
                            }
                            return next;
                          });
              }}
              onFocusItem={(id) => {
                setPreFocusHiddenDevices(hiddenDevices);
                setFocusedDevice(id);
                cleanupLegendHover();
              }}
              onShowAll={() => {
                      setHoveredDevice(null);
                      setHiddenDevices(new Set());
                    }}
              hoveredItem={hoveredLegendDevice}
              onMouseEnter={(id, isHidden) => {
                if (!focusedDevice && !isHidden) {
                  setHoveredDevice(id);
                }
                handleLegendMouseEnter(id, isHidden);
              }}
              onMouseLeave={() => {
                setHoveredDevice(null);
                handleLegendMouseLeave();
              }}
              focusedItem={focusedDevice}
              onExitFocus={() => {
                setFocusedDevice(null);
                setHiddenDevices(preFocusHiddenDevices);
                setHoveredDevice(null);
              }}
              showFocusMode={true}
            />
          );
        })()}

        {/* Legend row: band styles and metric toggle */}
        <div className="w-full flex items-center justify-between gap-2">
          {/* Band styles */}
          <div className="flex items-center gap-2 text-content-secondary">
            {(["24", "5"] as BandCode[]).filter((code) => selectedBands.has(code)).map((code) => {
              const isHidden = hiddenBands.has(code);
              return (
                <GraphLegendItem
                  key={code} 
                  id={code}
                  dashArray={BAND_DASH[code]}
                  label={BAND_LABEL[code]}
                  isHidden={isHidden}
                  onClick={() => {
                    setHoveredBand(null);
                    setHiddenBands((prev) => {
                      const next = new Set(prev);
                      if (next.has(code)) {
                        next.delete(code);
                      } else {
                        next.add(code);
                      }
                      return next;
                    });
                  }}
                  onMouseEnter={() => {
                    if (!isHidden) setHoveredBand(code);
                  }}
                  onMouseLeave={() => {
                    setHoveredBand(null);
                  }}
                />
              );
            })}
          </div>

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
      </div>

              <div className="chart-content-main" style={{ overflow: "visible", position: "relative" }}>
        <div style={{ height: chartHeight, overflow: "visible", position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            {/* Client chart has only 1 Y axis (left), so right margin should be 32 for labels */}
            <LineChart 
              data={chartData} 
              margin={{ top: 8, right: 32, left: 0, bottom: 8 }}
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
                tick={renderXAxisTick as any}
              />
              <YAxis
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                domain={yAxisDomain}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: "rgb(var(--content-tertiary))", fontSize: 12 } }}
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

              {/* Shaded bands for global outages in the visible window */}
              {/* Defs for diagonal hatch pattern */}
              <defs>
                <pattern id="outageHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="rgb(var(--content-tertiary))" strokeWidth="2" />
                </pattern>
              </defs>

              {outageRanges.map((r, i) => (
                <ReferenceArea
                  key={`outage-${i}`}
                  x1={r.x1}
                  x2={r.x2}
                  fill="rgb(var(--content-tertiary))"
                  fillOpacity={0.08}
                  stroke="rgb(var(--content-tertiary))"
                  strokeOpacity={0.2}
                />
              ))}

              {/* Overlay subtle hatch on top for visibility without heavy contrast */}
              {outageRanges.map((r, i) => (
                <ReferenceArea
                  key={`outage-hatch-${i}`}
                  x1={r.x1}
                  x2={r.x2}
                  fill="url(#outageHatch)"
                  fillOpacity={0.15}
                  stroke="rgb(var(--content-tertiary))"
                  strokeOpacity={0.2}
                />
              ))}
              
              {/* Preview lines when hovering on a device - show the other two metrics */}
              {/* In focus mode, show selected metric as main line with dots, others as preview lines */}
              {(() => {
                // In focus mode, show selected metric as main line with dots, others as preview
                if (focusedDevice) {
                  const deviceColor = DEVICE_COLORS[focusedDevice] || "#999";
                  
                  // Show the other two metrics as preview lines (without dots)
                  const previewMetrics = getPreviewMetrics(activeMetric);
                  
                  // Note: The main line for the selected metric is rendered below via visibleDeviceIds
                  // which will use useChartLineStyle to show dots
                  return renderPreviewLines({
                    itemId: focusedDevice,
                    color: deviceColor,
                    dataKeyPrefix: focusedDevice,
                    previewMetrics,
                  });
                }
                
                // Normal hover mode: show the other two metrics with labels
                if (hoveredDevice) {
                  const deviceColor = DEVICE_COLORS[hoveredDevice] || "#999";
                  const previewMetrics = getPreviewMetrics(activeMetric);
                  
                  // Find the last non-null values for preview metrics (for labels)
                  const previewValues: Record<MetricType, number | null> = {
                    avg: null,
                    min: null,
                    max: null,
                  };
                  
                  previewMetrics.forEach((metric) => {
                    for (let i = chartData.length - 1; i >= 0; i--) {
                      const rowValue = chartData[i]?.[`${hoveredDevice}__preview_${metric}`];
                      if (typeof rowValue === "number" && !Number.isNaN(rowValue)) {
                        previewValues[metric] = rowValue;
                        break;
                      }
                    }
                  });
                  
                  // Add preview lines using shared utility
                  const previewLines = renderPreviewLines({
                    itemId: hoveredDevice,
                    color: deviceColor,
                    dataKeyPrefix: hoveredDevice,
                    previewMetrics,
                  });
                  
                  // Don't add labels here - they'll be added after all lines
                  return previewLines;
                }
                
                return null;
              })()}

              {visibleDeviceIds.flatMap((id) => (
                (["24", "5", "5m"] as BandCode[]).filter((code) => selectedBands.has(code) && !hiddenBands.has(code)).map((code) => {
                  const key = `${id}__band_${code}`;
                  const color = DEVICE_COLORS[id] || "#555";
                  
                  // Calculate opacity based on both device and band hover states
                  const deviceId = id.split('__band_')[0];
                  const isDeviceHighlighted = hoveredDevice === null || hoveredDevice === deviceId;
                  const isBandHighlighted = hoveredBand === null || hoveredBand === code;
                  const isHighlighted = isDeviceHighlighted && isBandHighlighted;
                  
                  // Use shared line styling utility
                  const lineStyle = useChartLineStyle({
                    isHighlighted,
                    color,
                    chartData,
                    dataKey: key,
                    showBoundaryMarkers: true,
                  });
                  
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={id}
                      dot={lineStyle.dot}
                      strokeWidth={2.0}
                      stroke={color}
                      strokeDasharray={BAND_DASH[code]}
                      isAnimationActive={false}
                      connectNulls={false}
                      strokeOpacity={lineStyle.strokeOpacity}
                      activeDot={lineStyle.activeDot}
                    />
                  );
                })
              ))}
          
              {/* Reference lines with labels - rendered last to appear on top */}
              {(hoveredDevice || focusedDevice) && (() => {
                const deviceToShow = focusedDevice || hoveredDevice;
                if (!deviceToShow) return null;
                
                const deviceColor = DEVICE_COLORS[deviceToShow] || "#999";
            const previewMetrics: MetricType[] = [];
                
                // In focus mode, show all three metrics except the selected one
                if (focusedDevice) {
                  // Show all metrics except the selected one
                  previewMetrics.push(...getPreviewMetrics(activeMetric));
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
              for (let i = chartData.length - 1; i >= 0; i--) {
                    // Use preview values for all metrics (they're calculated from actual data)
                    const rowValue = chartData[i]?.[`${deviceToShow}__preview_${metric}`];
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
                        key={`${deviceToShow}__label_${metric}`}
                        y={value}
                        stroke="transparent"
                        label={<ChartReferenceLabel value={metric} color={deviceColor} />}
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

      {/* Resize handle - only visible in drawer variant */}
      {showResizeHandle && onHeightChange && (
        <ResizeHandleVertical onResize={onHeightChange} />
      )}
    </div>
    {!hideDrawer && (
    <ResizableChartDrawer 
      open={isDrawerOpen} 
      onOpenChange={setIsDrawerOpen} 
      title="Client History"
      defaultSize={50}
      minSize={30}
      maxSize={80}
    >
        <div className="bg-surface-tile chart-gradient-border rounded-lg" style={{ overflow: "visible", width: "100%", maxWidth: "100%" }}>
          <div className="p-5 flex flex-col items-start gap-3">
            {/* Title row with actions on the right */}
            <div className="relative w-full">
              <ChartHeader
                title="Client history"
                metricButton={metricType === undefined ? <MetricButton label="Latency" /> : undefined}
                showDragHandle={showDragHandle}
                dragHandleProps={dragHandleProps}
                isDragging={isDragging}
                metricType={metricType}
                onMetricTypeChange={onMetricTypeChange}
                actions={
                  <>
                    {/* Filter buttons group */}
                    <div className="flex items-center gap-1">
                      <AoBtnFilter
                        iconName="wifi"
                        countLabel={`${selectedBands.size}/${["24", "5"].length}`}
                        ariaLabel="WiFi Bands"
                        onClick={() => { setIsFilterOpen(true); setFilterPanel("bands"); }}
                      />

                      <AoBtnFilter
                        iconName="smartphone"
                        countLabel={`${selectedClients.size === 0 ? deviceIds.length : selectedClients.size}/${deviceIds.length}`}
                        ariaLabel="Client Devices"
                        onClick={() => { setIsFilterOpen(true); setFilterPanel("clients"); }}
                      />
                    </div>
                  </>
                }
              />
            </div>

            {/* Legend row: device colors */}
            {(() => {
              const legendItems = filteredDeviceIds.map((id) => ({
                id,
                label: deviceNames[id] || id,
                color: DEVICE_COLORS[id] || "#999",
                isHidden: hiddenDevices.has(id),
              }));
                    
                    return (
                <GraphLegend
                  items={legendItems}
                  onToggleItem={(id) => {
                              setHoveredDevice(null);
                              setHiddenDevices((prev) => {
                                const next = new Set(prev);
                                if (next.has(id)) {
                                  next.delete(id);
                                } else {
                                  next.add(id);
                                }
                                return next;
                              });
                  }}
                  onFocusItem={(id) => {
                    setPreFocusHiddenDevices(hiddenDevices);
                    setFocusedDevice(id);
                    cleanupLegendHover();
                  }}
                  onShowAll={() => {
                          setHoveredDevice(null);
                          setHiddenDevices(new Set());
                        }}
                  hoveredItem={hoveredLegendDevice}
                  onMouseEnter={(id, isHidden) => {
                    if (!focusedDevice && !isHidden) {
                      setHoveredDevice(id);
                    }
                    handleLegendMouseEnter(id, isHidden);
                  }}
                  onMouseLeave={() => {
                    setHoveredDevice(null);
                    handleLegendMouseLeave();
                  }}
                  focusedItem={focusedDevice}
                  onExitFocus={() => {
                    setFocusedDevice(null);
                    setHiddenDevices(preFocusHiddenDevices);
                    setHoveredDevice(null);
                  }}
                  showFocusMode={true}
                />
              );
            })()}

            {/* Legend row: band styles and metric toggle */}
            <div className="w-full flex items-center justify-between gap-2">
              {/* Band styles */}
              <div className="flex items-center gap-2 text-content-secondary">
                {(["24", "5"] as BandCode[]).filter((code) => selectedBands.has(code)).map((code) => {
                  const isHidden = hiddenBands.has(code);
                  return (
                    <GraphLegendItem
                      key={code} 
                      id={code}
                      dashArray={BAND_DASH[code]}
                      label={BAND_LABEL[code]}
                      isHidden={isHidden}
                      onClick={() => {
                        setHoveredBand(null);
                        setHiddenBands((prev) => {
                          const next = new Set(prev);
                          if (next.has(code)) {
                            next.delete(code);
                          } else {
                            next.add(code);
                          }
                          return next;
                        });
                      }}
                      onMouseEnter={() => {
                        if (!isHidden) setHoveredBand(code);
                      }}
                      onMouseLeave={() => {
                        setHoveredBand(null);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="chart-content-main" style={{ overflow: "visible", position: "relative" }}>
            <div style={{ height: chartHeight, overflow: "visible", position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                {/* Client chart has only 1 Y axis (left), so right margin should be 32 for labels */}
                <LineChart 
                  data={chartData} 
                  margin={{ top: 8, right: 32, left: 0, bottom: 8 }}
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
                    tick={renderXAxisTick as any}
                  />
                  <YAxis
                    tickMargin={8}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 30]}
                    label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fill: "rgb(var(--content-tertiary))", fontSize: 12 } }}
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

                  <defs>
                    <pattern id="outageHatch-drawer" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="rgb(var(--content-tertiary))" strokeWidth="2" />
                    </pattern>
                  </defs>

                  {outageRanges.map((r, i) => (
                    <ReferenceArea
                      key={`outage-${i}`}
                      x1={r.x1}
                      x2={r.x2}
                      fill="rgb(var(--content-tertiary))"
                      fillOpacity={0.08}
                      stroke="rgb(var(--content-tertiary))"
                      strokeOpacity={0.2}
                    />
                  ))}

                  {outageRanges.map((r, i) => (
                    <ReferenceArea
                      key={`outage-hatch-${i}`}
                      x1={r.x1}
                      x2={r.x2}
                      fill="url(#outageHatch-drawer)"
                      fillOpacity={0.15}
                      stroke="rgb(var(--content-tertiary))"
                      strokeOpacity={0.2}
                    />
                  ))}
                  
                  {(() => {
                    if (focusedDevice) {
                      const deviceId = focusedDevice!;
                      const deviceColor = DEVICE_COLORS[deviceId] || "#999";
                      const previewMetrics = getPreviewMetrics(activeMetric);
                      
                      return renderPreviewLines({
                        itemId: deviceId,
                        color: deviceColor,
                        dataKeyPrefix: deviceId,
                        previewMetrics,
                      });
                    }
                    
                    if (hoveredDevice) {
                      const deviceId = hoveredDevice!;
                      const deviceColor = DEVICE_COLORS[deviceId] || "#999";
                      const previewMetrics = getPreviewMetrics(activeMetric);
                      
                      return renderPreviewLines({
                        itemId: deviceId,
                        color: deviceColor,
                        dataKeyPrefix: deviceId,
                        previewMetrics,
                      });
                    }
                    
                    return null;
                  })()}

                  {visibleDeviceIds.flatMap((id) => (
                    (["24", "5"] as BandCode[]).filter((code) => selectedBands.has(code) && !hiddenBands.has(code)).map((code) => {
                      const key = `${id}__band_${code}`;
                      const color = DEVICE_COLORS[id] || "#555";
                      const deviceId = id.split('__band_')[0];
                      const isDeviceHighlighted = hoveredDevice === null || hoveredDevice === deviceId;
                      const isBandHighlighted = hoveredBand === null || hoveredBand === code;
                      const isHighlighted = isDeviceHighlighted && isBandHighlighted;
                      
                      // Use shared line styling utility
                      const lineStyle = useChartLineStyle({
                        isHighlighted,
                        color,
                        chartData,
                        dataKey: key,
                        showBoundaryMarkers: true,
                      });
                      
                      return (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={id}
                          dot={lineStyle.dot}
                          strokeWidth={2.0}
                          stroke={color}
                          strokeDasharray={BAND_DASH[code]}
                          isAnimationActive={false}
                          connectNulls={false}
                          strokeOpacity={lineStyle.strokeOpacity}
                          activeDot={lineStyle.activeDot}
                        />
                      );
                    })
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'none' }}>
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

          {/* Resize handle - only visible in drawer variant */}
          {showResizeHandle && onHeightChange && (
            <ResizeHandleVertical onResize={onHeightChange} />
          )}
        </div>
      </ResizableChartDrawer>
    )}
    </>
  );
}


