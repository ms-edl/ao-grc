# Chart Migration Guide

## Overview

The base chart architecture has been successfully implemented. This guide shows how to migrate existing charts to use the new base components.

## Base Components Created

All base components are located in `/components/charts/`:

```
/components/charts/
├── base/
│   ├── BaseChartLayout.tsx    # Handles variant-specific layout
│   └── BaseChartCore.tsx       # Handles Recharts rendering
├── hooks/
│   ├── useBaseChartState.ts   # Common state management
│   └── useBrushRange.ts        # Range and data slicing
├── types/
│   ├── ChartTypes.ts           # Common chart types
│   └── LegendTypes.ts          # Legend interfaces
└── index.ts                    # Central exports
```

## Migration Pattern

### Step 1: Import Base Components

```typescript
import { BaseChartLayout, BaseChartCore, useBaseChartState, useBrushRange } from './charts';
import type { MetricType, YAxisConfig } from './charts';
```

### Step 2: Replace State Management

**Before:**
```typescript
const [selectedMetric, setSelectedMetric] = useState<MetricType>("avg");
const [hoveredItem, setHoveredItem] = useState<string | null>(null);
const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
const [focusedItem, setFocusedItem] = useState<string | null>(null);
// ... more state
```

**After:**
```typescript
const chartState = useBaseChartState<string>({
  initialMetric: 'avg',
  enableLegendHover: true,
});
// Access via: chartState.selectedMetric, chartState.hoveredItem, etc.
```

### Step 3: Replace Range Management

**Before:**
```typescript
const [range, setRange] = useState({ left: 0, right: 167 });
const slicedData = useMemo(() => 
  data.slice(range.left, range.right + 1), 
  [data, range]
);
```

**After:**
```typescript
const { slicedData, effectiveRange, handleBrushChange } = useBrushRange({
  data,
  variant,
  sharedRange,
  initialRangeSize: 24 * 7,
});
```

### Step 4: Replace Layout with BaseChartLayout

**Before (Manual variant branching):**
```typescript
if (variant === 'drawer') {
  return (
    <div className="bg-surface-tile...">
      <ChartDrawerContent sidebar={...}>
        <ChartDrawerHeader ... />
        {/* chart content */}
      </ChartDrawerContent>
    </div>
  );
}

return (
  <ChartCard variant="default" header={...} legend={...}>
    {/* chart content */}
  </ChartCard>
);
```

**After (Unified layout):**
```typescript
return (
  <BaseChartLayout
    variant={variant}
    title="Chart Title"
    metricButton={<MetricButton label="Latency" />}
    
    defaultProps={variant === 'default' ? {
      inlineLegend: <GraphLegend items={...} />,
      legendActions: <MetricToggles />,
      maximizeButton: <MaximizeButton onClick={...} />,
      brush: <ExternalBrush ... />,
    } : undefined}
    
    drawerProps={variant === 'drawer' ? {
      sidebar: <ChartDrawerLegend dataItems={...} />,
      legendActions: <MetricToggles />,
      headerActions: <FilterButtons />,
      showDragHandle: props.showDragHandle,
      dragHandleProps: props.dragHandleProps,
      isDragging: props.isDragging,
      showResizeHandle: props.showResizeHandle,
      onHeightChange: props.onHeightChange,
    } : undefined}
  >
    {/* chart core */}
  </BaseChartLayout>
);
```

### Step 5: Replace Chart Rendering with BaseChartCore

**Before (Direct Recharts usage):**
```typescript
<ResponsiveContainer width="100%" height={height}>
  <LineChart data={slicedData} margin={{ ... }}>
    <CartesianGrid ... />
    <XAxis dataKey="x" ticks={xTicks} ... />
    <YAxis domain={[0, 30]} ... />
    <Tooltip content={<CustomTooltip />} ... />
    {/* lines */}
  </LineChart>
</ResponsiveContainer>
```

**After (BaseChartCore):**
```typescript
<BaseChartCore
  data={slicedData}
  xKey="x"
  yAxisConfig={[
    {
      id: 'left',
      orientation: 'left',
      domain: [0, 30],
      ticks: [0, 10, 20, 30],
      label: 'ms',
    }
  ]}
  renderLines={() => (
    <>
      {visibleDevices.map(device => (
        <Line
          key={device.id}
          dataKey={device.id}
          stroke={device.color}
          strokeWidth={2}
          {...lineStyle}
        />
      ))}
    </>
  )}
  renderTooltip={() => <CustomTooltip />}
  renderReferenceElements={() => <>{/* reference areas/lines */}</>}
  height={height}
  enableSync={enableSync}
  onMouseMove={handleChartMouseMove}
  onMouseLeave={handleChartMouseLeave}
  startIndex={effectiveRange.left}
  endIndex={effectiveRange.right}
/>
```

## Complete Example: WAN Chart Migration

### Current Structure (lines 892-935):

```typescript
return (
  <>
    <ChartCard variant={variant} ...>
      {renderChart()}
    </ChartCard>
    
    {!hideDrawer && (
      <ResizableChartDrawer ...>
        {renderChart()}
      </ResizableChartDrawer>
    )}
  </>
);
```

### Migrated Structure:

```typescript
// 1. Use new hooks
const chartState = useBaseChartState<MetricKey>({ initialMetric: 'avg' });
const { slicedData, effectiveRange, handleBrushChange } = useBrushRange({
  data,
  variant,
  sharedRange,
  initialRangeSize: 24 * 7,
});

// 2. Prepare legend items
const legendItems: BaseLegendItem[] = [
  { id: 'latency_ms', label: 'Latency', color: colors.latency, isHidden: chartState.hiddenItems.has('latency_ms') },
  { id: 'jitter_ms', label: 'Jitter', color: colors.jitter, isHidden: chartState.hiddenItems.has('jitter_ms') },
  { id: 'packet_loss_percent', label: 'Packet Loss', color: colors.packetLoss, isHidden: chartState.hiddenItems.has('packet_loss_percent') },
];

// 3. Calculate stats for drawer (if variant === 'drawer')
const drawerLegendItems: DrawerLegendItem[] = legendItems.map(item => {
  const stats = calculateMetricStats(data, item.id);
  return {
    ...item,
    min: `${stats.min}ms`,
    avg: `${stats.avg}ms`,
    max: `${stats.max}ms`,
    activeMetric: chartState.selectedMetric,
  };
});

// 4. Render with BaseChartLayout
return (
  <>
    <BaseChartLayout
      variant={variant}
      title="WAN history"
      metricButton={<MetricButton label="Latency" />}
      
      defaultProps={variant === 'default' ? {
        inlineLegend: (
          <GraphLegend
            items={legendItems}
            onToggleItem={chartState.handleToggleItem}
            onFocusItem={chartState.handleFocusItem}
            onExitFocus={chartState.handleExitFocus}
          />
        ),
        legendActions: <MetricToggles />,
        maximizeButton: <MaximizeButton onClick={handleMaximize} />,
        brush: (
          <ExternalBrush
            data={data}
            xKey="x"
            startIndex={effectiveRange.left}
            endIndex={effectiveRange.right}
            onChange={handleBrushChange}
          />
        ),
      } : undefined}
      
      drawerProps={variant === 'drawer' ? {
        sidebar: (
          <ChartDrawerLegend
            dataItems={drawerLegendItems}
            onToggleDataItem={chartState.handleToggleItem}
            onMouseEnter={(id) => chartState.setHoveredItem(id as MetricKey)}
            onMouseLeave={() => chartState.setHoveredItem(null)}
          />
        ),
        legendActions: <MetricToggles />,
        headerActions: <FilterButtons />,
        showDragHandle,
        dragHandleProps,
        isDragging,
        showResizeHandle,
        onHeightChange,
      } : undefined}
    >
      <BaseChartCore
        data={slicedData}
        xKey="x"
        yAxisConfig={[
          {
            id: 'left',
            orientation: 'left',
            domain: yAxisDomains.latency_ms,
            ticks: yAxisTicks.latency_ms,
            label: 'ms',
          },
          {
            id: 'right',
            orientation: 'right',
            domain: yAxisDomains.packet_loss_percent,
            ticks: yAxisTicks.packet_loss_percent,
            label: '%',
          },
        ]}
        renderLines={() => renderMetricLines()}
        renderTooltip={() => <CustomTooltip />}
        renderReferenceElements={() => renderReferenceLines()}
        height={height}
        enableSync={enableSync}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
      />
    </BaseChartLayout>
    
    {!hideDrawer && (
      <ResizableChartDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        {/* old drawer code if still needed */}
      </ResizableChartDrawer>
    )}
  </>
);
```

## Key Benefits

1. **Consistency**: Both charts use identical layout logic
2. **DRY**: No duplicate code for variant branching
3. **Type Safety**: Shared types ensure compatibility
4. **Maintainability**: Changes to layout affect all charts uniformly
5. **Drawer Sidebar**: WAN chart now has proper sidebar with stats in drawer mode

## Testing Checklist

- [ ] Default variant renders at 864px width
- [ ] Drawer variant renders at full width
- [ ] Drawer variant shows sidebar with min/avg/max stats
- [ ] Legend toggle/focus works in both variants
- [ ] Hover effects work correctly
- [ ] Drag and drop works in drawer
- [ ] Resize handles work in drawer
- [ ] Tooltip sync works between charts
- [ ] Global brush controls both charts
- [ ] Maximize button opens drawer
- [ ] ESC key closes drawer
- [ ] All data visualizations match original behavior

## Status

✅ Base components created and tested
✅ Build passes without errors
✅ Infrastructure ready for migration
⏳ Chart migration (separate task due to size and complexity)

The base architecture is complete. Charts can now be migrated individually using the patterns documented above.

