# Drag Handle Component Implementation

## Overview

Created a unified drag handle component with a clean, minimal design - a simple rounded bar that adapts to different contexts through orientation and size variants.

## Design Philosophy

**Minimalist Approach:**
- No icons or complex graphics
- Simple rounded bar (pill shape)
- State-driven visibility and color
- Consistent behavior across all contexts

## Component Design

### Visual Specification

**Shape:** Rounded bar (fully rounded corners using `rounded-full`)

**Size Variants:**

| Size | Horizontal | Vertical |
|------|-----------|----------|
| `sm` | 12 × 4px  | 4 × 12px |
| `md` | 24 × 4px  | 4 × 24px |
| `lg` | 32 × 4px  | 4 × 32px |

**Orientation:**
- `horizontal`: Width varies, height is always 4px
- `vertical`: Height varies, width is always 4px

### State System

The drag handle has three distinct visual states:

#### **1. Inactive State** (Default)
- **Color:** `content-tertiary`
- **Opacity:** `0` (hidden)
- **When:** Handle is not being interacted with

#### **2. Active State**
- **Color:** `content-tertiary`
- **Opacity:** `1` (visible)
- **When:** Parent/related element is hovered (e.g., brush selection band)

#### **3. Hover State**
- **Color:** `content-primary`
- **Opacity:** `1` (visible)
- **When:** Handle itself is directly hovered or being dragged

### Component API

```typescript
interface DragHandleProps {
  // Orientation of the bar
  orientation?: 'horizontal' | 'vertical'
  
  // Size variant
  size?: 'sm' | 'md' | 'lg'
  
  // Whether being actively dragged
  isDragging?: boolean
  
  // Whether handle should be visible (e.g., parent hover)
  isActive?: boolean
  
  // Whether handle itself is hovered
  isHovered?: boolean
  
  // Additional className for custom styling
  className?: string
}
```

## Implementation Details

### 1. **DragHandle Component** (`components/ui/drag-handle.tsx`)

Core implementation using class-variance-authority for type-safe variants.

#### Key Features:
- Single `<div>` element (no SVG, no nested components)
- State-driven background color and opacity
- Smooth transitions (150ms)
- Touch-action none for better mobile support
- Grab/grabbing cursor states

#### Usage Example:
```typescript
<DragHandle 
  orientation="horizontal"
  size="sm"
  isDragging={isDragging}
  isActive={bandHovered}
  isHovered={handleHovered}
/>
```

---

### 2. **SimplifiedBrush** (`components/SimplifiedBrush.tsx`)

Time range selection brush with left/right handles.

#### Configuration:
- **Orientation:** `horizontal`
- **Size:** `sm` (12 × 4px)
- **Active State:** When brush band is hovered OR any handle is interacted with
- **Hover State:** When specific handle is directly hovered

#### State Logic:
```typescript
<DragHandle 
  orientation="horizontal"
  size="sm"
  isDragging={dragging === "left"}
  isActive={hoverBand || anyHandleInteracted}
  isHovered={hoverLeft}
/>
```

#### Visual Behavior:
1. **Default:** Handles are invisible (opacity: 0)
2. **Band Hover:** Both handles become visible with tertiary color
3. **Handle Hover:** Specific handle changes to primary color
4. **Dragging:** Handle stays primary color, maintains visibility

---

### 3. **ResizeHandleVertical** (`components/ui/resize-handle-vertical.tsx`)

Chart height adjustment handle at the bottom of chart tiles.

#### Configuration:
- **Orientation:** `horizontal` (for vertical resizing)
- **Size:** `md` (24 × 4px)
- **Active State:** Not used (isActive: false)
- **Hover State:** When handle area is hovered

#### State Logic:
```typescript
<DragHandle 
  orientation="horizontal"
  size="md"
  isDragging={isDragging}
  isActive={false}
  isHovered={isHovered}
/>
```

#### Visual Behavior:
1. **Default:** Handle is invisible
2. **Hover:** Handle appears with tertiary color
3. **Direct Hover:** Changes to primary color
4. **Dragging:** Maintains primary color during resize

---

### 4. **ResizableHandle** (`components/ui/resizable.tsx`)

Drawer width adjustment handle at the left edge of the drawer.

#### Configuration:
- **Orientation:** `vertical` (for horizontal resizing)
- **Size:** `md` (4 × 24px)
- **Active State:** Not used (isActive: false)
- **Hover State:** When resize area is hovered

#### State Logic:
```typescript
<DragHandle 
  orientation="vertical"
  size="md"
  isDragging={isDragging}
  isActive={false}
  isHovered={isHovered}
/>
```

#### Visual Behavior:
1. **Default:** Handle is invisible
2. **Hover:** Handle appears with tertiary color
3. **Direct Hover:** Changes to primary color
4. **Dragging:** Maintains primary color during resize

---

## Applied Locations in CombinedLatencyPage

### 1. **Brush Controls** (Bottom of Drawer)
- **Component:** `SimplifiedBrush`
- **Handles:** Left and right brush handles
- **Orientation:** Horizontal
- **Size:** Small (`sm` - 12px)
- **Purpose:** Adjust time range selection
- **Unique Feature:** Context-aware activation (shows when band is hovered)

### 2. **Chart Height Resize** (Individual Charts)
- **Component:** `ResizeHandleVertical`
- **Location:** Bottom of each chart tile in drawer
- **Orientation:** Horizontal (for vertical resizing)
- **Size:** Medium (`md` - 24px)
- **Purpose:** Adjust individual chart heights (256-600px)
- **Behavior:** Appears only on hover

### 3. **Drawer Width Resize** (Drawer Left Edge)
- **Component:** `ResizableHandle`
- **Location:** Left edge of drawer
- **Orientation:** Vertical (for horizontal resizing)
- **Size:** Medium (`md` - 24px)
- **Purpose:** Adjust drawer width (30-80% of screen)
- **Behavior:** Appears only on hover

---

## Design System Benefits

1. **Minimal Visual Footprint:** Handles are invisible by default, reducing visual clutter
2. **Progressive Disclosure:** Handles appear only when relevant (hover context)
3. **Clear Affordance:** Color change to primary indicates direct interaction capability
4. **Consistent Language:** Same visual pattern across all drag interactions
5. **Type Safety:** CVA ensures valid variant combinations
6. **Accessibility:** Clear cursor states and sufficient interaction area

---

## Visual Feedback Hierarchy

### Color Semantics
- **content-tertiary:** "I'm available for interaction"
- **content-primary:** "I'm ready for your direct interaction"

### Opacity Semantics
- **0:** "I'm hidden until you need me"
- **1:** "I'm visible and ready"

### Transitions
- **Duration:** 150ms
- **Easing:** Default ease
- **Properties:** Background color, opacity
- **Purpose:** Smooth state changes without distraction

---

## Implementation Guidelines

### When to Use `isActive`
Use `isActive` when handle visibility should be triggered by related element interactions:
- Brush band hover → show brush handles
- Chart card hover → could show resize handle (if desired)
- Group interaction → show all group member handles

### When to Use `isHovered`
Use `isHovered` for direct handle interaction:
- Mouse enters handle hit area
- Touch begins on handle
- Focus arrives on handle (accessibility)

### Size Selection
- `sm` (12px): Tight spaces, dense UI, subtle affordances
- `md` (24px): Standard spacing, primary interactions, balanced visibility
- `lg` (32px): Prominent interactions, accessibility focus, larger touch targets

---

## Future Enhancements

Potential additions to the drag handle system:

1. **Accessibility Enhancements:**
   - Keyboard navigation support
   - ARIA labels and roles
   - Focus visible states

2. **Animation Options:**
   - Optional pulse on first appearance
   - Gentle shimmer for discovery
   - Bounce on interaction limits

3. **Additional Variants:**
   - `xs` (8px) for ultra-compact UI
   - `xl` (48px) for touch-primary interfaces
   - Custom size support via CSS variables

4. **Interaction Modes:**
   - Click-to-lock for precise adjustments
   - Double-click to reset
   - Keyboard increment/decrement

5. **Visual Options:**
   - Optional shadow for depth
   - Gradient fills for premium feel
   - Animated borders for active state

