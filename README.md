# GRC Graphical Center — Chart Prototype

🔗 **[Live Preview](https://graph-ui-improvements.axon-grc.pages.dev/)**

This repository is a prototype for the Graphical Representation Center (GRC) chart drawer. It is used to validate and ship fixes/features before they are integrated into the main product.

---

## What this branch addresses

### OAAS-2376 — Cannot reorder graphs in the Graphical Center drawer

**Problem:** There was no working way to change the order of charts in the drawer — charts were stuck in their initial position.

**Fix:** Replaced the broken drag-and-drop approach with explicit up/down arrow buttons (`onMoveUp` / `onMoveDown`) rendered in each chart's header. The chevron buttons are always visible, disabled when a chart is already at the top or bottom, and commit the new order immediately.

---

### OAAS-2665 — Misalignment of graphs in the GRC

**Problem:** When a chart's Y-axis had discrete string labels (e.g. "Very good", "Good", "Average") those labels were wider than numeric labels. Without coordination, each chart reserved a different amount of left/right space for its axis, causing the plot areas and X-axes to be horizontally offset relative to each other.

**Fix:** Implemented `SharedAxisWidthProvider` + `useSharedAxisWidth`. Every chart in the drawer measures its required Y-axis widths with `measureYAxisWidth(...)`, reports them to the shared context, and `BaseChartCore` applies the computed maximum across all charts so every plot area starts and ends at the same horizontal position.

**Integration checklist (for any new chart added to the shared drawer):**
1. Wrap the drawer chart stack in `SharedAxisWidthProvider` (already done in `CombinedLatencyPage`).
2. Compute left/right tick-label widths with `measureYAxisWidth`.
3. Call `useSharedAxisWidth(chartId, leftWidth, rightWidth)` — pass `rightWidth = 0` if no right axis.
4. Pass the returned `sharedLeftAxisWidth` / `sharedRightAxisWidth` into `BaseChartCore`.
5. Keep axis tick formatting stable, since widths are measured from rendered labels.

---

### OAAS-2426 — Removing a graph from the drawer is too hard to discover

**Problem:** The only way to remove a chart was a small "×" that appeared on hover over the chart tab. Users consistently missed it.

**Fix:** Added a visible remove button directly on each chart tile in the drawer so the action is discoverable without any hover state.

---

### OAAS-1216 — Multi-series support in all graphical representations

**Problem:** Each chart could only display one data series at a time. Agents requested the ability to plot multiple series (e.g. Packet Loss + Jitter) on the same graph.

**Fix:** Extended the metric selector combobox to allow multi-select. Each selected metric is rendered as a separate series within the same chart, respecting left/right Y-axis assignment and the shared axis-width system.

**Production constraint:** Charts support at most two Y-axes (left and right). This means multiple metrics can be combined on one chart only if all selected metrics fit within two distinct units. For example, Jitter + Latency + Packet Loss is valid because Jitter and Latency share the same axis (ms) while Packet Loss uses the other (%). Combining QoE score, Jitter (ms), and Packet Loss (%) is not valid because each metric requires its own unit axis, which would need three axes.

---

## Architecture

```
src/
  CombinedLatencyPage.tsx     — only page; owns shared brush range, chart order/heights, drawer open state
  App.tsx                     — ThemeProvider wrapper
  styles.css                  — all design tokens (CSS variables) + Tailwind utility overrides
  lib/utils.ts                — cn() (clsx + tailwind-merge)

components/
  MultiDeviceLatencyChart.tsx — feature chart (bands/clients filter, drawer variant)
  WanLatencyChart.tsx         — feature chart
  CpeQoeHistoryChart.tsx      — feature chart
  charts/
    base/                     — BaseChartCore (Recharts wiring), BaseChartLayout (chrome)
    context/                  — SharedTimeAxisProvider, SyncedChartContext, SharedAxisWidthProvider
  ui/
    resizable-chart-drawer.tsx — Vaul + react-resizable-panels; Saved views Combobox lives here
    combobox.tsx               — Popover-based multi/single select with footer actions
    popover.tsx                — Radix Popover with absolute-gradient-border fix
    icons.tsx                  — all inline SVG icons via <Icon name="..." size={n} />
```

---

## Running locally

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

---

## Data formats

### CSV — Client latency
```csv
timestamp,device_id,device_name,latency_ms,band
2025-08-13 00:00:00,dev-1,ARCADYAN SPEEDHOMEWLAN,7.0,2.4
```

### CSV — WAN latency
```csv
timestamp,latency_ms
2025-08-13 00:00:00,7.0
```

---

## Design tokens

Tokens are **RGB triplets** in CSS variables; reference them as `rgb(var(--token))` in inline styles or via the matching Tailwind utility class.

| Token | Tailwind class | Usage |
|---|---|---|
| `--surface-section` | `bg-surface-section` | Page background |
| `--surface-tile` | `bg-surface-tile` | Card / chart tile background |
| `--surface-overlay` | — | Popover/modal background |
| `--surface-action` | `bg-surface-action` | Button resting state |
| `--surface-action-hover` | `hover:bg-surface-action-hover` | Button hover, highlighted items |
| `--surface-accent-purple` | `bg-surface-accent-purple` | Selected checkbox fill |
| `--content-primary` | `text-content-primary` | Primary text |
| `--content-secondary` | `text-content-secondary` | Secondary / label text |
| `--content-tertiary` | `text-content-tertiary` | Placeholder, muted text |
| `--gradient-border` | `border-gradient-border` | Subtle dividers, section separators |

---

## Known prototype limitations

- **Brush performance:** DOM measurements are synchronous during drag; large datasets may lag. Throttling / batched updates are recommended before production.
- **Data processing:** Band-splitting transforms run synchronously; no data windowing or virtualization.
- **Drawer rendering:** Multiple chart instances each maintain independent resize observers — this is acceptable for a prototype but should be consolidated in production.
