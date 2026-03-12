# Widget Selector Sidebar Implementation

## ✅ Completed

### Overview
Added a slide-out sidebar to the shared device drawer that appears when clicking the "+" button below the drawer title. The sidebar allows users to browse and select additional widgets/graphs to add to the drawer.

### Features Implemented

#### 1. Sidebar UI Components
- **Slide-out animation**: Sidebar appears from the left side of the drawer
- **Search functionality**: Filter available widgets by name or description
- **Categorized widget list**: Widgets grouped by category (CPE HISTORY, CLIENT HISTORY, LAN&WLAN HISTORY)
- **Responsive design**: Follows the existing design system with gradient borders and proper theming

#### 2. Core Functionality
- **Toggle visibility**: Opens when "+" button is clicked, closes with back button or ESC key
- **Search filtering**: Real-time search that filters widgets across all categories
- **Widget selection**: Click on any widget to select it (logs selection for now)
- **State management**: Sidebar state is properly managed and resets when drawer closes

#### 3. Component Updates

##### `components/ui/chart-drawer.tsx`
- Added `AvailableWidget` interface for widget definitions
- Added `availableWidgets` and `onWidgetSelect` props
- Implemented sidebar state management with search
- Created sidebar UI with header, search bar, and categorized widget list
- Updated "+" button to trigger sidebar opening

##### `components/ui/resizable-chart-drawer.tsx`
- Imported `AvailableWidget` type from chart-drawer
- Added same props: `availableWidgets` and `onWidgetSelect`
- Implemented identical sidebar functionality for resizable variant
- Enhanced ESC key handler to close sidebar before closing drawer

##### `src/CombinedLatencyPage.tsx`
- Created sample `availableWidgets` array with example widgets
- Implemented `handleWidgetSelect` callback (currently logs selection)
- Passed widgets and handler to `ResizableChartDrawer`

### API Reference

#### AvailableWidget Interface
```typescript
export interface AvailableWidget {
  id: string          // Unique identifier
  label: string       // Display name
  category: string    // Category for grouping
  description?: string // Optional subtitle/description
}
```

#### ChartDrawer Props (New)
```typescript
interface ChartDrawerProps {
  // ... existing props ...
  availableWidgets?: AvailableWidget[]  // Widgets to show in sidebar
  onWidgetSelect?: (widgetId: string) => void  // Selection handler
}
```

### Sidebar UI Structure

```
┌─────────────────────────────────────┐
│ Add graph                       ← │  // Header with back button
├─────────────────────────────────────┤
│ 🔍 Search...                        │  // Search input
├─────────────────────────────────────┤
│ CPE HISTORY                         │  // Category header
│ ┌─────────────────────────────────┐ │
│ │ QoE                          + │ │  // Widget item
│ │ Score · Hourly                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ CPU usage/Load               + │ │
│ │ Score · Hourly                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ CLIENT HISTORY                      │
│ ... more widgets ...                │
└─────────────────────────────────────┘
```

### User Flow

1. **Open drawer**: Click maximize button on any chart
2. **View current graphs**: See client and WAN latency charts with tags
3. **Add graph**: Click "+" button below drawer title
4. **Browse widgets**: Sidebar slides in from left showing available widgets
5. **Search (optional)**: Type to filter widgets by name/description
6. **Select widget**: Click on any widget to add it (triggers `onWidgetSelect`)
7. **Close sidebar**: Click back button, ESC key, or automatic after selection

### Keyboard Shortcuts

- **ESC**: 
  - First press: Close sidebar (if open)
  - Second press: Close drawer

### Styling Features

- Matches existing design system
- Gradient borders using CSS variables
- Smooth hover states
- Proper text truncation for long names
- Responsive to theme changes (light/dark)
- Clean typography hierarchy

### Sample Data

The implementation includes sample widgets across three categories:
- **CPE HISTORY**: QoE, CPU usage/Load, CPU free memory, CPU temperature, Reboots
- **CLIENT HISTORY**: QoE, CPU usage/Load, CPU free memory, CPU temperature, Reboots
- **LAN&WLAN HISTORY**: QoE, CPU usage/Load

### Next Steps (TODO)

The sidebar is fully functional and ready to use. To integrate it with your chart system:

1. **Implement widget addition logic** in `handleWidgetSelect`:
   ```typescript
   const handleWidgetSelect = useCallback((widgetId: string) => {
     // Add the selected widget/chart to the drawer
     // Update chartTags array
     // Possibly add new chart component to orderedCharts
   }, []);
   ```

2. **Create actual chart components** for each widget type (QoE, CPU usage, etc.)

3. **Update chartTags** when a widget is added to show the new tag

4. **Add tag removal logic** to remove charts when their tag is clicked

### Testing

To test the sidebar:
1. Run the app: `npm run dev`
2. Open the shared drawer (click maximize on any chart)
3. Click the "+" button below the drawer title
4. Sidebar should slide in from the left
5. Try searching for widgets
6. Click on a widget (check console for log)
7. Close with back button or ESC key

### Files Modified

- `components/ui/chart-drawer.tsx` - Base drawer with sidebar
- `components/ui/resizable-chart-drawer.tsx` - Resizable drawer with sidebar
- `src/CombinedLatencyPage.tsx` - Integration with sample data

### Design Notes

The sidebar design follows the patterns shown in your Figma reference:
- 382px fixed width
- Same background and borders as drawer
- Search bar with icon
- Uppercase category headers
- Widget items with hover states
- Plus icon on the right of each widget

