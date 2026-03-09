# GRC Drawer Chart Alignment — Implementation Plan

## Problem

Charts stacked inside the GRC drawer (`ResizableChartDrawer` under `CombinedLatencyPage`) have misaligned plot areas because each chart independently sizes its left Y-axis. Charts with wider Y-axis labels push their plot area to the right, breaking horizontal alignment across charts.

## Solution

1. **Shared Y-axis width (Option 2)**: Compute the maximum required left Y-axis width across all visible drawer charts and apply it uniformly.
2. **Global shared X-axis footer**: A single time axis at the bottom of the drawer (below the brush), with per-chart time labels removed.

## Decisions

| Decision | Choice |
|----------|--------|
| Alignment approach | Option 2 — measure and share max Y-axis width |
| Scope | Drawer charts inside `CombinedLatencyPage` only |
| Width measurement | Compute from label data at render time (canvas `measureText`), report up, re-render with max |
| Global X-axis footer | Below the brush; per-chart X-axes remove time label text only |
| BaseChartCore refactor | Yes — drawer variants only |
| Phasing | Phase 1 → Phase 2 (ship & validate) → Phase 3 |
| Drawer resize | Y-axis width depends on labels not drawer width — no recalc needed on resize |
| Chart add/remove | Recalculate shared width when chart set changes |
| Right Y-axis | Left side only for now |

---

## Phase 1: Refactor drawer variants to `BaseChartCore` ✅ COMPLETE

**Goal**: Both charts' drawer variants consume `BaseChartCore` instead of inline Recharts boilerplate.

**Status**: Completed. Both drawer variants now use `BaseChartCore`. Visually verified pixel-identical output.

### Step 1.1 — Enhance `BaseChartCore`

**File**: `components/charts/base/BaseChartCore.tsx` (+ `components/charts/types/ChartTypes.ts`)

1. **Make Y-axis `ticks` optional** — Only pass `ticks` to `<YAxis>` when defined in config, so Recharts can auto-generate (needed for WanLatencyChart's right axis which omits explicit ticks).
2. **Make tooltip `position` configurable** — Add optional `tooltipPosition` prop. Fall back to current `{ y: 0 }` default if not provided.
3. **Add `renderDefs` prop** — Optional `() => ReactNode` for SVG `<defs>` (hatch patterns, gradients). Render inside `<LineChart>` before other children.

These are backward-compatible — existing consumers of `BaseChartCore` won't break.

### Step 1.2 — Refactor `WanLatencyChart` drawer variant

**File**: `components/WanLatencyChart.tsx`

Replace the drawer variant's inline Recharts block (~lines 817–1010) with `<BaseChartCore>`:

- `yAxisConfig`: Two entries — left (`latency_ms`, width 50) and right (`packet_loss_percent`, width 50, no explicit ticks).
- `renderLines()`: All `<Line>` and `<ReferenceLine>` elements.
- `renderTooltip()`: `<CustomTooltip />`.
- `renderReferenceElements()`: `<ReferenceLine>` with `<ChartReferenceLabel>`.
- `margin`: `{ top: 8, right: 0, left: 0, bottom: 8 }` (right is 0 because right Y-axis is present).
- `startIndex` / `endIndex`: From `sharedRange`.
- Remove the drawer variant's own `useTimeAxis` call — `BaseChartCore` handles this internally.

**Validation**: Visual diff — drawer WanLatencyChart should be pixel-identical before and after.

### Step 1.3 — Refactor `MultiDeviceLatencyChart` drawer variant

**File**: `components/MultiDeviceLatencyChart.tsx`

Replace the drawer variant's inline Recharts block (~lines 956–1141) with `<BaseChartCore>`:

- `yAxisConfig`: One entry — left (`latency_ms`, domain `[0, 30]`).
  - Note: domain is currently hardcoded to `[0, 30]` in the drawer variant while the default variant uses `yAxisDomain`. Flag as potential bug to revisit.
- `renderLines()`: All `<Line>` elements with band-specific `strokeDasharray`.
- `renderTooltip()`: `<CustomTooltip />`.
- `renderReferenceElements()`: Outage `<ReferenceArea>` elements (both fill and hatch).
- `renderDefs()`: `<defs><pattern id="outageHatch-drawer" ...>` block.
- `margin`: `{ top: 8, right: 32, left: 0, bottom: 8 }`.
- `startIndex` / `endIndex`: From `sharedRange`.
- Remove the drawer variant's custom `generateSmartTicks` usage — `BaseChartCore`'s `useTimeAxis` handles this identically.

**Validation**: Visual diff — drawer MultiDeviceLatencyChart should be pixel-identical before and after.

---

## Phase 2: Shared Y-axis width

**Goal**: All drawer charts share the same left Y-axis width, determined by the widest labels.

### Step 2.1 — Create `SharedAxisWidthContext`

**New file**: `components/charts/context/SharedAxisWidthContext.tsx`

Provider + hook that:

- Holds a map of `{ [chartId: string]: number }` — each chart's required left Y-axis width.
- Exposes `reportWidth(chartId: string, width: number)` for charts to report their computed width.
- Exposes `sharedLeftAxisWidth: number` — the max of all reported widths (with a floor of 50px).
- Handles cleanup when a chart unmounts (removes its entry from the map, recalculates max).
- Recalculates when entries change (chart add/remove/data change).

### Step 2.2 — Width computation utility

**New file**: `components/charts/utils/measureAxisWidth.ts`

```typescript
function measureYAxisWidth(labels: string[], fontSize?: number): number
```

- Creates an offscreen `<canvas>` 2D context.
- Sets font to match Y-axis tick styling (fontSize 11, same font family as the charts).
- Measures each label string via `ctx.measureText()`.
- Returns max width + padding for `tickMargin` (8px) + Y-axis label ("ms", "%").
- Called synchronously at render time — no layout shift, no two-pass render.

### Step 2.3 — Wire shared width into `BaseChartCore`

**File**: `components/charts/base/BaseChartCore.tsx`

- Add optional `sharedLeftAxisWidth?: number` prop.
- When provided, override the first left-oriented Y-axis `width` in `yAxisConfig` with this value.

### Step 2.4 — Wire into `CombinedLatencyPage`

**File**: `src/CombinedLatencyPage.tsx`

- Wrap chart content with `<SharedAxisWidthProvider>`.
- Each chart's drawer variant:
  1. Computes its needed Y-axis width via `measureYAxisWidth(tickLabels)`.
  2. Reports it to the context via `reportWidth(chartId, neededWidth)`.
  3. Reads `sharedLeftAxisWidth` from the context.
  4. Passes it to `<BaseChartCore sharedLeftAxisWidth={sharedLeftAxisWidth}>`.

### Validation

- Both charts' plot areas align on the left edge.
- Add/remove a chart → remaining charts recalculate and stay aligned.
- No visible layout shift (width is computed synchronously before paint).

**Ship & validate Phase 2 before proceeding to Phase 3.**

---

## Phase 3: Global shared X-axis footer

**Goal**: Single time axis at the bottom of the drawer, below the brush.

### Step 3.1 — Create `SharedTimeAxis` component

**New file**: `components/charts/SharedTimeAxis.tsx`

- Renders time axis labels for the shared time domain.
- Props: `data`, `xKey`, `startIndex`, `endIndex`, `leftOffset` (= `sharedLeftAxisWidth`), `rightOffset`.
- Implementation: Lightweight SVG that renders tick labels at the correct horizontal positions. Reuses `useTimeAxis` for tick generation and consistent styling with the charts.
- Does not need a full Recharts chart — a simple SVG with positioned `<text>` elements is sufficient.

### Step 3.2 — Integrate into drawer footer

**Files**: `src/CombinedLatencyPage.tsx`, `components/ui/resizable-chart-drawer.tsx`

- In `bottomContent`, render `<SharedTimeAxis>` below the existing `<SimplifiedBrush>`.
- Increase footer height from 100px to ~130px to accommodate the axis.
- Adjust `pb-[120px]` on `drawer-wrapper` to match new footer height.
- `SharedTimeAxis` receives `leftOffset` from the shared axis width context so it aligns with chart plot areas.

### Step 3.3 — Hide per-chart X-axis time labels

**File**: `components/charts/base/BaseChartCore.tsx`

- Add optional `hideXAxisLabels?: boolean` prop.
- When true: keep the `<XAxis>` element but suppress tick text rendering (e.g., render tick as empty/transparent). The X-axis space, grid, and structure remain unchanged — only the visible time label text is removed.
- `CartesianGrid vertical={false}` stays as-is (no vertical grid lines added).

### Step 3.4 — Pass flag in drawer mode

**File**: `src/CombinedLatencyPage.tsx`

- Pass `hideXAxisLabels={true}` to each chart's drawer variant when the global footer axis is active.

### Validation

- Footer axis labels align horizontally with chart plot areas (same left offset).
- Per-chart bottom area has no time label text.
- Brush range changes → footer axis updates ticks accordingly.
- Footer axis styling matches what was previously shown on individual charts.

---

## File Change Summary

| Step | Files | Type |
|------|-------|------|
| 1.1 | `components/charts/base/BaseChartCore.tsx`, `components/charts/types/ChartTypes.ts` | Modify |
| 1.2 | `components/WanLatencyChart.tsx` | Modify |
| 1.3 | `components/MultiDeviceLatencyChart.tsx` | Modify |
| 2.1 | `components/charts/context/SharedAxisWidthContext.tsx` | New |
| 2.2 | `components/charts/utils/measureAxisWidth.ts` | New |
| 2.3 | `components/charts/base/BaseChartCore.tsx` | Modify |
| 2.4 | `src/CombinedLatencyPage.tsx` | Modify |
| 3.1 | `components/charts/SharedTimeAxis.tsx` | New |
| 3.2 | `src/CombinedLatencyPage.tsx`, `components/ui/resizable-chart-drawer.tsx` | Modify |
| 3.3 | `components/charts/base/BaseChartCore.tsx` | Modify |
| 3.4 | `src/CombinedLatencyPage.tsx` | Modify |

---

## Future Tasks

- [ ] **Refactor default (standalone) variants** of `WanLatencyChart` and `MultiDeviceLatencyChart` to consume `BaseChartCore`. Lower priority; separate task.
- [ ] **Right Y-axis coordination** — Align right edges of plot areas across charts (WanLatencyChart has right axis at 50px, MultiDeviceLatencyChart has 32px right margin → ~18px misalignment). Deferred.
- [ ] **New chart types** (quality steps with text Y-axis labels, etc.) — When added, they benefit automatically from `BaseChartCore` and `SharedAxisWidthContext`.
- [ ] **Fix MultiDeviceLatencyChart drawer Y-axis domain** — Currently hardcoded to `[0, 30]` while the default variant uses dynamic `yAxisDomain`. Likely a bug.
