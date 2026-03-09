# GRC Drawer Chart Alignment — Implementation Plan

## Problem

Charts stacked inside the GRC drawer (`ResizableChartDrawer` under `CombinedLatencyPage`) have misaligned plot areas because each chart independently sizes its Y-axes. Differences in left Y-axis label width push plot areas to different horizontal positions. Additionally, charts differ on the right side — `WanLatencyChart` has a right Y-axis (50px for packet loss %) while `MultiDeviceLatencyChart` has no right axis (32px right margin), causing ~18px right-edge misalignment.

## Solution

1. **Shared Y-axis width (Option 2)**: Compute the maximum required Y-axis width across all visible drawer charts and apply it uniformly — both left and right sides.
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
| Y-axis coordination | Both left and right sides |

---

## Phase 1: Refactor drawer variants to `BaseChartCore` ✅ COMPLETE

**Goal**: Both charts' drawer variants consume `BaseChartCore` instead of inline Recharts boilerplate.

**Status**: Implemented and committed.

---

## Phase 2: Shared Y-axis width (left + right) ✅ COMPLETE

**Goal**: All drawer charts share the same left Y-axis width and right Y-axis width/margin, so plot areas align on both edges.

**Status**: Implemented and committed.

### Current right-side state

| Chart | Right Y-axis | Right margin | Effective right space |
|-------|-------------|-------------|----------------------|
| `WanLatencyChart` | Yes — 50px (`packet_loss_percent`) | `right: 0` | ~50px |
| `MultiDeviceLatencyChart` | No | `right: 32` | 32px |

The right edges of plot areas are misaligned by ~18px. The fix is the same mechanism as the left: compute a shared max and apply uniformly.

### Step 2.1 — Create `SharedAxisWidthContext`

**New file**: `components/charts/context/SharedAxisWidthContext.tsx`

Provider + hook that:

- Holds a map of `{ [chartId: string]: { left: number, right: number } }` — each chart's required left and right axis widths.
- Exposes `reportWidths(chartId: string, left: number, right: number)` for charts to report their computed widths.
- Exposes `sharedLeftAxisWidth: number` — max of all reported left widths (floor of 50px).
- Exposes `sharedRightAxisWidth: number` — max of all reported right widths (floor of 0px).
- Handles cleanup when a chart unmounts (removes its entry, recalculates both maxes).
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

Used for both left and right axes. Charts without a right axis report `right: 0`.

### Step 2.3 — Wire shared widths into `BaseChartCore`

**File**: `components/charts/base/BaseChartCore.tsx`

- Add optional `sharedLeftAxisWidth?: number` prop.
- Add optional `sharedRightAxisWidth?: number` prop.
- When `sharedLeftAxisWidth` is provided, override the first left-oriented Y-axis `width` in `yAxisConfig` with this value.
- When `sharedRightAxisWidth` is provided:
  - If the chart **has** a right Y-axis: override its `width` with this value.
  - If the chart **does not** have a right Y-axis: set `margin.right` to this value so the plot area reserves equivalent space on the right.

### Step 2.4 — Wire into `CombinedLatencyPage`

**File**: `src/CombinedLatencyPage.tsx`

- Wrap chart content with `<SharedAxisWidthProvider>`.
- Each chart's drawer variant:
  1. Computes its needed left and right Y-axis widths via `measureYAxisWidth(tickLabels)`.
  2. Reports both to the context via `reportWidths(chartId, leftWidth, rightWidth)`.
  3. Reads `sharedLeftAxisWidth` and `sharedRightAxisWidth` from the context.
  4. Passes both to `<BaseChartCore>`.
- `WanLatencyChart` reports `right: measuredRightAxisWidth` (from its packet loss tick labels).
- `MultiDeviceLatencyChart` reports `right: 0` (no right axis). It will receive `sharedRightAxisWidth` and apply it as `margin.right`, so its plot area ends at the same position as WanLatencyChart's.

### Validation

- Both charts' plot areas align on **both** left and right edges.
- Add/remove a chart → remaining charts recalculate and stay aligned.
- No visible layout shift (widths are computed synchronously before paint).
- `WanLatencyChart`'s right Y-axis labels and `MultiDeviceLatencyChart`'s empty right margin occupy the same horizontal space.

**Ship & validate Phase 2 before proceeding to Phase 3.**

---

## Phase 3: Global shared X-axis footer

**Goal**: Single time axis at the bottom of the drawer, below the brush.

### Step 3.1 — Create `SharedTimeAxis` component

**New file**: `components/charts/SharedTimeAxis.tsx`

- Renders time axis labels for the shared time domain.
- Props: `data`, `xKey`, `startIndex`, `endIndex`, `leftOffset` (= `sharedLeftAxisWidth`), `rightOffset` (= `sharedRightAxisWidth`).
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
| ~~1.1~~ | ~~`components/charts/base/BaseChartCore.tsx`, `components/charts/types/ChartTypes.ts`~~ | ~~Modify~~ ✅ |
| ~~1.2~~ | ~~`components/WanLatencyChart.tsx`~~ | ~~Modify~~ ✅ |
| ~~1.3~~ | ~~`components/MultiDeviceLatencyChart.tsx`~~ | ~~Modify~~ ✅ |
| ~~2.1~~ | ~~`components/charts/context/SharedAxisWidthContext.tsx`~~ | ~~New~~ ✅ |
| ~~2.2~~ | ~~`components/charts/utils/measureAxisWidth.ts`~~ | ~~New~~ ✅ |
| ~~2.3~~ | ~~`components/charts/base/BaseChartCore.tsx`~~ | ~~Modify~~ ✅ |
| ~~2.4~~ | ~~`src/CombinedLatencyPage.tsx`, `components/WanLatencyChart.tsx`, `components/MultiDeviceLatencyChart.tsx`~~ | ~~Modify~~ ✅ |
| 3.1 | `components/charts/SharedTimeAxis.tsx` | New |
| 3.2 | `src/CombinedLatencyPage.tsx`, `components/ui/resizable-chart-drawer.tsx` | Modify |
| 3.3 | `components/charts/base/BaseChartCore.tsx` | Modify |
| 3.4 | `src/CombinedLatencyPage.tsx` | Modify |

---

## Future Tasks

- [ ] **Refactor default (standalone) variants** of `WanLatencyChart` and `MultiDeviceLatencyChart` to consume `BaseChartCore`. Lower priority; separate task.
- [ ] **New chart types** (quality steps with text Y-axis labels, etc.) — When added, they benefit automatically from `BaseChartCore` and `SharedAxisWidthContext`.
- [ ] **Fix MultiDeviceLatencyChart drawer Y-axis domain** — Currently hardcoded to `[0, 30]` while the default variant uses dynamic `yAxisDomain`. Likely a bug.
