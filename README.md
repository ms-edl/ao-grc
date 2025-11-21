# Combined Latency Chart Visualization

🔗 **[Live Preview](https://ao-graphical-representation-center.vercel.app/)**

This repository contains a prototype implementation of combined latency visualization charts (Client and WAN) using Recharts. This is a **proof of concept** and requires additional optimization and hardening before production use.

## Overview

The prototype demonstrates:
- Combined Client and WAN latency visualization
- Multi-device latency tracking with band switching (2.4GHz/5GHz)
- Resizable drawer with both charts and shared brush control
- Drag-and-drop chart reordering with persistence
- Interactive brush component for time range selection
- Theme-aware styling (light/dark modes)
- Data gap visualization with shaded regions
- Band-specific line styles (solid, dashed, dotted)
- Interactive device filtering and metric toggling (min/avg/max)

## ⚠️ Prototype limitations

### Performance considerations

1. **Brush component**
- Heavy DOM measurements during drag operations
- Synchronous calculations during brush interactions
- Multiple state updates during interactions
- Recommendation: Implement throttling and batched updates

2. **Data processing**
- Synchronous data transformations for band splitting
- Large datasets may cause rendering delays
- No data virtualization implemented
- Recommendation: Implement data windowing and virtualization

3. **Drawer interactions**
- Multiple chart instances in drawer with independent resize handlers
- Drag-and-drop reordering may cause layout shifts
- Shared brush state synchronization overhead
- Recommendation: Optimize rendering pipeline for drawer content

4. **Style system**
- Heavy reliance on CSS-in-JS calculations
- Theme changes trigger full re-renders
- Multiple duplicate style definitions
- Recommendation: Implement style caching and shared theme context

## CSS variable usage

The project uses a combination of Tailwind CSS and custom CSS variables. Key variable categories:

### Theme variables
```css
:root {
  /* Spacing */
  --d0: 0;
  --d1: 4px;
  /* ... through d64 */

  /* Colors */
  --neutral-0: 255 255 255;
  --neutral-50: 247 248 248;
  /* ... through neutral-1000 */

  /* Typography */
  --font-size-2xs: 0.625rem;
  --font-size-xs: 0.75rem;
  /* ... through font-size-2xl */

  /* Border Radius */
  --radius-2xs: 4px;
  --radius-xs: 6px;
  /* ... through radius-2xl */
}
```

### Theme-specific colors
```css
.main-light {
  --background: 0 0% 100%;
  --foreground: 224 71.4% 4.1%;
  /* ... other light theme variables */
}

.main-dark {
  --background: 224 71.4% 4.1%;
  --foreground: 210 20% 98%;
  /* ... other dark theme variables */
}
```

## Data format

The chart accepts data in two formats:

### CSV format (Client Latency)
```csv
timestamp,device_id,device_name,latency_ms,band
2025-08-13 00:00:00,dev-1,ARCADYAN SPEEDHOMEWLAN,7.0,2.4
```

### CSV format (WAN Latency)
```csv
timestamp,latency_ms
2025-08-13 00:00:00,7.0
```

### TSV format
```tsv
2025-08-13 00:00:00	dev-1	ARCADYAN SPEEDHOMEWLAN	7.0
```

## Features

### Combined View
- Both Client and WAN latency charts displayed side-by-side
- Each chart has independent controls and filters
- Maximize button opens shared drawer view

### Drawer View
- **Drag-and-drop reordering**: Charts can be reordered by dragging
- **Independent height adjustment**: Each chart has a resize handle (256px - 600px range)
- **Shared brush control**: Single brush affects all charts for unified time range selection
- **Persistence**: Chart order and heights are saved to localStorage
- **Metric toggles**: Switch between min/avg/max values per chart
- **Synchronized interactions**: Hover and selection states sync across charts

### Chart Features
- **Client Latency**: Multi-device support with band filtering (2.4GHz/5GHz)
- **WAN Latency**: Network-level latency tracking
- **Data gaps**: Visual indication of missing data periods
- **Theme support**: Seamless light/dark mode switching
- **Interactive legends**: Click to toggle series visibility

## Component architecture

The application follows a hierarchical component structure:

### Page components
- `App.tsx`: Root application component with ThemeProvider and layout
- `CombinedLatencyPage.tsx`: Main page displaying both Client and WAN latency charts with shared drawer

### Core chart components
- `MultiDeviceLatencyChart`: Client latency chart with multi-device support and band switching
- `WanLatencyChart`: WAN latency chart with network performance metrics
- `ResizableChartDrawer`: Shared drawer component with drag-and-drop chart reordering
- `SimplifiedBrush`: Custom brush implementation for time range selection
- `SortableChartContainer` / `SortableChartItem`: Drag-and-drop functionality for charts

### Theme system
- `ThemeProvider`: Context provider for theme state and color schemes
- `AnimatedThemeToggle`: Interactive theme switcher with animations
- `ThemeContext`: Shared theme state and color definitions

### Data flow
- Data is loaded independently in each chart component
- Chart state (filters, selection, hover) is managed per-chart
- Shared brush range is synchronized across charts in drawer view
- Theme state is managed globally through context
- Chart order and heights are persisted to localStorage

### State management
- **Global**: Theme context
- **Page-level**: Drawer state, shared brush range, chart order, chart heights
- **Component-level**: Chart data, filters, metric types, device selection
- **Synchronized**: Brush state between main view and drawer view

## Known issues

1. Memory leaks:
   - Resize observers may not be properly cleaned up
   - Event listeners might persist after component unmount
   - Multiple chart instances in drawer maintain separate observers

2. Performance issues:
   - Large datasets cause rendering delays
   - Multiple charts in drawer affect overall performance
   - Theme changes trigger unnecessary re-renders
   - Drag-and-drop reordering may cause momentary layout shifts

3. Style issues:
   - Some styles are hardcoded and not theme-aware
   - CSS-in-JS performance impact
   - Duplicate style definitions

4. State synchronization:
   - Brush state synchronization between main and drawer views has overhead
   - Chart order persistence uses debounced localStorage writes
   - Height changes trigger multiple state updates
   - Recommendation: Implement more efficient state batching