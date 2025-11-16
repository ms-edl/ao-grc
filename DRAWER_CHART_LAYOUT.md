# Drawer Chart Layout Structure

This document describes the new 2-column layout structure for drawer chart variants.

## Overview

The new drawer layout provides a cleaner, more organized structure with:
- **Main column**: Header + Chart (100% width, flexible)
- **Sidebar column**: Legend with styled items (256px fixed width)
- **Min/Avg/Max toggles**: Integrated into the header (left side)

## Component Architecture

### 1. ChartDrawerContent

Main layout component that provides the 2-column structure.

```tsx
<ChartDrawerContent
  sidebar={<ChartDrawerLegend ... />}
  mainPadding="24px"
  sidebarPadding="24px"
>
  <ChartDrawerHeader ... />
  <div className="flex-1">
    {/* Chart component */}
  </div>
</ChartDrawerContent>
```

**Props:**
- `children`: Main content (header + chart)
- `sidebar`: Sidebar content (legend)
- `mainPadding`: Padding for main content area (default: "24px")
- `sidebarPadding`: Padding for sidebar area (default: "24px")

### 2. ChartDrawerHeader

Header component with integrated Min/Avg/Max toggles.

```tsx
<ChartDrawerHeader
  title="Client history"
  metricButton={<MetricButton label="Latency" onClick={...} />}
  selectedMetrics={['avg']}
  onMetricsChange={(metrics) => setSelectedMetrics(metrics)}
  actions={
    <>
      <AoBtnFilter icon={...} label="3/3" onClick={...} />
      <button>...</button>
    </>
  }
/>
```

**Props:**
- `title`: Chart title
- `metricButton`: Metric selector dropdown button
- `selectedMetrics`: Array of selected metrics (['min', 'avg', 'max'])
- `onMetricsChange`: Callback when metric toggles change
- `actions`: Action buttons (filters, more menu, etc.)
- `showDragHandle`: Show drag handle for reordering
- `dragHandleProps`: Props from @dnd-kit for drag handle
- `isDragging`: Whether the chart is currently being dragged

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Title  Metric▼  [Min] [Avg] [Max]      [Filters...] [More] │
└─────────────────────────────────────────────────────────────┘
```

### 3. ChartDrawerLegend

Sidebar legend component with styled data items and section items.

```tsx
<ChartDrawerLegend
  dataItems={[
    {
      id: 'device-1',
      label: 'WNC DT-EXT03A-WNC',
      color: '#D1EC1C',
      min: '18.1ms',
      avg: '24.5ms',
      max: '31.4ms',
      isHidden: false,
    },
  ]}
  sectionItems={[
    {
      id: 'band-24',
      label: '2.4GHz',
      isHidden: false,
    },
    {
      id: 'band-5',
      label: '5GHz',
      dashArray: '8 6',
      isHidden: false,
    },
  ]}
  onToggleDataItem={(id) => handleToggleDevice(id)}
  onToggleSectionItem={(id) => handleToggleBand(id)}
  onMouseEnter={(id) => handleMouseEnter(id)}
  onMouseLeave={() => handleMouseLeave()}
/>
```

**Props:**
- `dataItems`: Main data items (devices, metrics, etc.) with min/avg/max values
- `sectionItems`: Secondary items (band types, connection types, etc.)
- `onToggleDataItem`: Toggle visibility of a data item
- `onToggleSectionItem`: Toggle visibility of a section item
- `onMouseEnter`: Hover enter handler
- `onMouseLeave`: Hover leave handler

**Data Item Structure:**
```tsx
interface DrawerLegendItem {
  id: string;
  label: string;
  color: string;
  min?: string | number;
  avg?: string | number;
  max?: string | number;
  isHidden?: boolean;
}
```

**Section Item Structure:**
```tsx
interface DrawerLegendSectionItem {
  id: string;
  label: string;
  dashArray?: string; // SVG dash array (e.g., "8 6" for dashed)
  isHidden?: boolean;
}
```

## Visual Design

### Data Items

Each data item is styled with:
- **4px colored indicator** on the left edge (full height, rounded corners)
- **Label** (14px, font-medium, truncated)
- **Min/Avg/Max meta row** (12px, tertiary color)
- **Background gradient** (same as "Add graph" sidebar items)
- **Rounded corners** (8px border radius)
- **Hover state** (opacity 0.8)

```
┌─────────────────────────────────┐
│█ WNC DT-EXT03A-WNC              │
│█ Min 18.1  Avg 24.5  Max 31.4   │
└─────────────────────────────────┘
```

### Section Items

Each section item shows:
- **Line indicator** (16px wide, with dash pattern)
- **Label** (12px, secondary color)
- **No background** (transparent)

```
─── 2.4GHz
--- 5GHz
... 5GHz mesh
```

## Full Layout Example

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client history  Latency▼  [Min] [Avg] [Max]      [WiFi 3/3] [Devices 2/11] [...] │
├───────────────────────────────────────────────────┬─────────────────────────────┤
│                                                   │ ┌───────────────────────┐   │
│                                                   │ │█ WNC DT-EXT03A-WNC    │   │
│                                                   │ │█ 18.1  24.5  31.4     │   │
│                                                   │ └───────────────────────┘   │
│                                                   │                             │
│                                                   │ ┌───────────────────────┐   │
│                Chart Area                         │ │█ Lenovo               │   │
│                                                   │ │█ 18.1  21.2  31.4     │   │
│                                                   │ └───────────────────────┘   │
│                                                   │                             │
│                                                   │ ─── 2.4GHz                  │
│                                                   │ --- 5GHz                    │
│                                                   │ ... 5GHz mesh               │
│                                                   │                             │
└───────────────────────────────────────────────────┴─────────────────────────────┘
│                    100% width                     │      256px fixed width      │
```

## Integration with Existing Charts

To integrate these components into existing chart components (like `MultiDeviceLatencyChart`):

1. **Wrap the chart content** with `ChartDrawerContent`
2. **Replace the existing header** with `ChartDrawerHeader`
3. **Move the legend** to the sidebar using `ChartDrawerLegend`
4. **Update metric toggle logic** to use the header component
5. **Calculate min/avg/max values** for each data item

Example integration:

```tsx
return (
  <ChartDrawerContent
    sidebar={
      <ChartDrawerLegend
        dataItems={devices.map(device => ({
          id: device.id,
          label: device.name,
          color: device.color,
          min: calculateMin(device),
          avg: calculateAvg(device),
          max: calculateMax(device),
          isHidden: hiddenDevices.has(device.id),
        }))}
        sectionItems={bandTypes.map(band => ({
          id: band.id,
          label: band.label,
          dashArray: band.dashArray,
          isHidden: hiddenBands.has(band.id),
        }))}
        onToggleDataItem={handleToggleDevice}
        onToggleSectionItem={handleToggleBand}
      />
    }
  >
    <ChartDrawerHeader
      title="Client history"
      metricButton={<MetricButton label="Latency" onClick={...} />}
      selectedMetrics={selectedMetrics}
      onMetricsChange={setSelectedMetrics}
      actions={<>...</>}
    />
    
    <div className="flex-1 mt-6">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data}>
          {/* ... chart components */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartDrawerContent>
);
```

## Benefits

1. **Better organization**: Clear separation between chart and legend
2. **More space**: Full width for chart, dedicated space for legend
3. **Cleaner header**: Min/Avg/Max toggles integrated into header
4. **Better UX**: Styled legend items with clear visual hierarchy
5. **Consistent design**: Matches "Add graph" sidebar styling
6. **Flexible**: Easy to adapt to different chart types

## Files

- `components/ChartDrawerContent.tsx`: Main layout component
- `components/ChartDrawerHeader.tsx`: Header with Min/Avg/Max toggles
- `components/ChartDrawerLegend.tsx`: Styled sidebar legend
- `components/ChartDrawerExample.tsx`: Example integration

