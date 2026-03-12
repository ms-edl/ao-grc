# Drawer Header Update

## Overview
The drawer headers have been updated to support a new device card layout with an avatar, device name, and metadata row.

## Changes Made

### Updated Components
- `components/ui/resizable-chart-drawer.tsx`
- `components/ui/chart-drawer.tsx`

### New Props

Both drawer components now support the following additional props:

```typescript
interface DrawerProps {
  // ... existing props
  deviceName?: string         // Device name/identifier
  deviceType?: string         // Device type (e.g., "Router", "Access Point")
  deviceStatus?: string       // Device status (e.g., "Online since 3d ago")
  deviceAvatar?: string | React.ReactNode  // Device image URL or custom React component
}
```

## Usage Examples

### Option 1: Using Device Layout (New Design)

```tsx
<ResizableChartDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  deviceName="C4000LG2117813461"
  deviceType="Router"
  deviceStatus="Online since 3d ago"
  deviceAvatar="/path/to/device-image.png"
>
  {/* Chart content */}
</ResizableChartDrawer>
```

### Option 2: Using Custom Avatar Component

```tsx
<ResizableChartDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  deviceName="C4000LG2117813461"
  deviceType="Router"
  deviceStatus="Online since 3d ago"
  deviceAvatar={
    <svg width="40" height="40" viewBox="0 0 24 24">
      {/* Custom SVG icon */}
    </svg>
  }
>
  {/* Chart content */}
</ResizableChartDrawer>
```

### Option 3: Legacy Title Layout (Backward Compatible)

```tsx
<ResizableChartDrawer
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Client history"
>
  {/* Chart content */}
</ResizableChartDrawer>
```

## Visual Layout

### Device Layout
When `deviceName` is provided, the header displays:
```
┌────────────────────────────────────────────┐
│ [Avatar]  Device Name                  [X] │
│           Device Type · Device Status      │
└────────────────────────────────────────────┘
```

### Legacy Layout
When only `title` is provided (no `deviceName`):
```
┌────────────────────────────────────────────┐
│ [Icon] Title                           [X] │
└────────────────────────────────────────────┘
```

## Features

1. **Responsive Avatar**: Supports both image URLs and custom React components
2. **Default Fallback**: If no avatar is provided, a default device icon is shown
3. **Metadata Row**: Shows device type and status with a separator bullet (·)
4. **Truncation**: Device name truncates if too long to prevent overflow
5. **Backward Compatible**: Existing implementations using `title` prop continue to work

## Styling Details

- Avatar size: 72px × 72px with rounded corners (rounded-xl)
- Device name: 20px font size, semibold
- Metadata: 14px font size, secondary color
- Background: Uses `--surface-action` CSS variable for avatar background
- Colors: Uses theme-aware content colors (primary/secondary)

## Migration Guide

To migrate existing drawer implementations to the new design:

1. Replace `title` prop with `deviceName`
2. Add `deviceType` and `deviceStatus` props
3. (Optional) Add `deviceAvatar` prop with image URL or custom component

**Before:**
```tsx
<ResizableChartDrawer
  title="Client history"
  ...
/>
```

**After:**
```tsx
<ResizableChartDrawer
  deviceName="C4000LG2117813461"
  deviceType="Router"
  deviceStatus="Online since 3d ago"
  deviceAvatar="/device-avatar.png"
  ...
/>
```

