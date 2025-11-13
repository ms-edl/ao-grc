# Implementation Plan: Enhanced Chart Dashboard

**Project:** AO - Graphical Representation Center  
**Date:** November 13, 2025  
**Estimated Timeline:** 5-7 hours total implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Dependencies & Installation](#dependencies--installation)
3. [Component Architecture](#component-architecture)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Feature Specifications](#feature-specifications)
7. [Bundle Impact Analysis](#bundle-impact-analysis)
8. [Testing Checklist](#testing-checklist)

---

## Overview

### Goals
- Enhance chart interactivity with synchronized tooltips
- Implement global brush for multi-chart time range control
- Add resizable chart tiles and drawer
- Integrate shadcn UI components (Combobox, Kbd, Tooltip, Resizable)
- Maintain minimal bundle size and performance
- Ensure full theme integration

### Key Features
1. **Global Tooltip Sync** - Hover one chart, see tooltip on all charts at same timestamp
2. **Global Brush** - One brush controls time range for all charts
3. **Resizable Components** - Adjustable drawer width and chart heights
4. **Keyboard Shortcuts** - Display shortcuts in tooltips using Kbd component
5. **Enhanced Filters** - Combobox for metric/device selection
6. **Drag & Drop** - Reorder charts in drawer view

---

## Dependencies & Installation

### Phase 1: Core Dependencies
```bash
# Shadcn UI Core Components
npm install @radix-ui/react-tooltip @radix-ui/react-popover @radix-ui/react-dialog

# Combobox (Command Palette)
npm install cmdk

# Resizable Panels
npm install react-resizable-panels

# Utilities
npm install clsx tailwind-merge

# Icons
npm install feather-icons

# Drag and Drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Bundle Impact
| Dependency | Size (gzipped) | Purpose |
|------------|----------------|---------|
| @radix-ui/react-* | ~15KB | Tooltip, Popover, Dialog |
| cmdk | ~8KB | Command palette for Combobox |
| react-resizable-panels | ~12KB | Resizable drawers/charts |
| @dnd-kit/* | ~15KB | Drag and drop charts |
| feather-icons | ~7KB | Icon library |
| clsx + tailwind-merge | ~2KB | Utility functions |
| **Total** | **~59KB** | **Acceptable for features gained** |

---

## Component Architecture

```
src/
├── lib/
│   └── utils.ts                      # cn() utility for className merging
│
├── styles.css                        # Theme variables + animations
│
components/
├── ui/                               # NEW: Shadcn UI components
│   ├── icons.tsx                    # Feather icon wrappers
│   ├── command.tsx                  # Command palette (for Combobox)
│   ├── popover.tsx                  # Popover wrapper
│   ├── combobox.tsx                 # Combobox component
│   ├── tooltip.tsx                  # Tooltip component
│   ├── kbd.tsx                      # Keyboard shortcut display
│   └── resizable.tsx                # Resizable panels wrapper
│
├── ChartTooltip.tsx                  # MODIFY: Add sync support
├── ExternalBrush.tsx                 # EXISTING: Already supports sync
├── ChartDrawer.tsx                   # MODIFY: Add resizable wrapper
├── MultiDeviceLatencyChart.tsx       # MODIFY: Add sync props
├── WanLatencyChart.tsx               # MODIFY: Add sync props
│
├── ResizableChartContainer.tsx       # NEW: Wrapper for resizable charts
├── SortableChartGrid.tsx             # NEW: Drag & drop chart layout
└── SyncedChartContext.tsx            # NEW: Context for tooltip/brush sync
```

---

## Implementation Phases

### Phase 1: Foundation (1-2 hours)
**Priority:** High  
**Risk:** Low  
**Status:** Completed ✓

#### Tasks
- [x] Install all dependencies ✓ (Completed: November 13, 2025)
- [x] Create `src/lib/utils.ts` with `cn()` utility ✓ (Completed: November 13, 2025)
- [x] Add animation keyframes to `src/styles.css` ✓ (Completed: November 13, 2025)
- [x] Create `components/ui/icons.tsx` with Feather icon wrappers ✓ (Completed: November 13, 2025)

#### Deliverables
- ✓ All dependencies installed (69 packages added)
- ✓ Utility functions ready (`cn()` for className merging)
- ✓ Icon system integrated (Generic Icon component with name/size props)
- ✓ Animation keyframes added (accordion, fadeIn, slideIn, spin)

---

### Phase 2: Shadcn UI Components (2-3 hours)
**Priority:** High  
**Risk:** Low

#### Tasks
- [ ] Create `components/ui/command.tsx` (themed for your design system)
- [ ] Create `components/ui/popover.tsx` (with gradient borders)
- [ ] Create `components/ui/combobox.tsx` (metric/device selector)
- [ ] Create `components/ui/tooltip.tsx` (with theme integration)
- [ ] Create `components/ui/kbd.tsx` (keyboard shortcut display)
- [ ] Create `components/ui/resizable.tsx` (resizable panel wrapper)

#### Deliverables
- 6 themed UI components
- Full integration with your CSS variables
- Gradient border system applied

#### Testing
- Test combobox with metric selection
- Test tooltip with Kbd shortcuts
- Test resizable panels (horizontal/vertical)

---

### Phase 3: Global Tooltip Sync (2-3 hours)
**Priority:** High  
**Risk:** Medium

#### Tasks
- [ ] Create `components/SyncedChartContext.tsx`
  - Context for shared `activeTimestamp` state
  - Optional: only sync when drawer is open
- [ ] Modify `MultiDeviceLatencyChart.tsx`
  - Add `syncedTimestamp` prop
  - Add `onTimestampHover` callback
  - Update CustomTooltip to respond to external timestamp
- [ ] Modify `WanLatencyChart.tsx`
  - Same modifications as above
- [ ] Add visual cursor line sync across charts

#### Implementation Pattern
```tsx
// SyncedChartContext.tsx
const SyncedChartContext = createContext({
  syncedTimestamp: null,
  setSyncedTimestamp: () => {},
  syncEnabled: true,
});

// In charts:
<LineChart
  onMouseMove={(state) => {
    if (state?.activeTooltipIndex !== undefined) {
      const timestamp = data[state.activeTooltipIndex]?.x;
      setSyncedTimestamp(timestamp);
    }
  }}
>
```

#### Deliverables
- Context provider for sync state
- Modified charts support external timestamp
- Cursor line appears on all charts simultaneously

#### Testing
- Hover one chart, verify tooltip appears on other
- Test with different data lengths (timestamp matching)
- Test performance with rapid mouse movement

---

### Phase 4: Global Brush (1 hour)
**Priority:** High  
**Risk:** Low (already mostly implemented)

#### Tasks
- [ ] Lift brush state to parent/drawer component
- [ ] Pass shared `range` prop to both charts
- [ ] Render single `ExternalBrush` below charts
- [ ] Test timestamp alignment between datasets

#### Implementation
```tsx
// In MultiChartDrawer:
const [sharedRange, setSharedRange] = useState({ left: 0, right: 167 });

<MultiDeviceLatencyChart range={sharedRange} />
<WanLatencyChart range={sharedRange} />
<ExternalBrush
  startIndex={sharedRange.left}
  endIndex={sharedRange.right}
  onChange={setSharedRange}
/>
```

#### Deliverables
- Single brush controls both charts
- Synchronized time range

#### Testing
- Drag brush, verify both charts update
- Test with different data lengths

---

### Phase 5: Resizable Components (2-3 hours)
**Priority:** High  
**Risk:** Medium

#### Tasks
- [ ] Create `components/ResizableChartContainer.tsx`
  - Vertical resize for individual chart height
  - Min/max height constraints
  - Persist to localStorage
- [ ] Modify `ChartDrawer.tsx` to use ResizablePanelGroup
  - Horizontal resize for drawer width
  - Persist width to localStorage
- [ ] Add resize handles with proper styling
- [ ] Add multi-chart vertical split in drawer

#### Implementation
```tsx
// Resizable drawer width
<ResizablePanelGroup direction="horizontal">
  <ResizablePanel defaultSize={60} minSize={20} />
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={40} minSize={30} maxSize={80}>
    {/* Drawer content */}
  </ResizablePanel>
</ResizablePanelGroup>

// Resizable charts in drawer
<ResizablePanelGroup direction="vertical">
  <ResizablePanel defaultSize={50} minSize={20}>
    <MultiDeviceLatencyChart />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50} minSize={20}>
    <WanLatencyChart />
  </ResizablePanel>
</ResizablePanelGroup>
```

#### Deliverables
- Resizable drawer width (drag from left edge)
- Resizable chart heights (drag handle between charts)
- Size persistence via localStorage
- Smooth animations

#### Testing
- Test resize handles responsiveness
- Verify localStorage persistence
- Test min/max constraints
- Test touch device support

---

### Phase 6: Drag & Drop Chart Reordering (2 hours)
**Priority:** Medium  
**Risk:** Medium

#### Tasks
- [ ] Create `components/SortableChartGrid.tsx`
- [ ] Implement dnd-kit sortable context
- [ ] Add drag handles to chart headers
- [ ] Add drop zone indicators
- [ ] Persist order to localStorage

#### Implementation
```tsx
// Using dnd-kit
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={charts}>
    {charts.map(chart => (
      <SortableChart key={chart.id} id={chart.id}>
        {chart.component}
      </SortableChart>
    ))}
  </SortableContext>
</DndContext>
```

#### Deliverables
- Drag handle on chart headers
- Smooth reordering animation
- Visual drop indicators
- Order persistence

#### Testing
- Test drag interactions
- Verify animations are smooth
- Test with 2-5 charts
- Test touch device support

---

### Phase 7: Keyboard Shortcuts & Polish (1 hour)
**Priority:** Low  
**Risk:** Low

#### Tasks
- [ ] Add keyboard shortcuts:
  - `Esc` - Close drawer
  - `Ctrl+B` - Toggle brush visibility
  - `Ctrl+R` - Reset chart zoom
  - `Ctrl+S` - Toggle sync mode
- [ ] Add Tooltip + Kbd components to show shortcuts
- [ ] Add keyboard hint UI in drawer header
- [ ] Add shortcut reference panel (optional)

#### Deliverables
- Working keyboard shortcuts
- Tooltip indicators showing shortcuts
- Help button showing all shortcuts

#### Testing
- Test all keyboard shortcuts
- Verify tooltip Kbd display
- Test accessibility (screen readers)

---

## File Structure

### New Files to Create

```
/Users/modestas/AO - Graphical Represntation Center/
├── src/
│   └── lib/
│       └── utils.ts                         # NEW
│
├── components/
│   ├── ui/                                  # NEW FOLDER
│   │   ├── icons.tsx                       # NEW
│   │   ├── command.tsx                     # NEW
│   │   ├── popover.tsx                     # NEW
│   │   ├── combobox.tsx                    # NEW
│   │   ├── tooltip.tsx                     # NEW
│   │   ├── kbd.tsx                         # NEW
│   │   └── resizable.tsx                   # NEW
│   │
│   ├── SyncedChartContext.tsx              # NEW
│   ├── ResizableChartContainer.tsx         # NEW
│   └── SortableChartGrid.tsx               # NEW
│
└── IMPLEMENTATION_PLAN.md                   # THIS FILE
```

### Files to Modify

```
├── src/
│   └── styles.css                          # MODIFY: Add animations
│
├── components/
│   ├── ChartTooltip.tsx                    # MODIFY: Add sync support
│   ├── ChartDrawer.tsx                     # MODIFY: Add resizable wrapper
│   ├── MultiDeviceLatencyChart.tsx         # MODIFY: Add sync props
│   └── WanLatencyChart.tsx                 # MODIFY: Add sync props
│
└── package.json                            # MODIFY: Add dependencies
```

---

## Feature Specifications

### 1. Global Tooltip Sync

**User Story:** As a user, I want to hover over one chart and see tooltips appear on all charts at the same timestamp, so I can compare metrics across different charts.

**Behavior:**
- Mouse hover on Chart A shows tooltip on Chart A
- Simultaneously, tooltip appears on Chart B/C at the same timestamp
- Cursor line appears on all charts
- Only active when drawer is open (optional flag)

**Edge Cases:**
- Different data lengths → find closest timestamp
- No data at timestamp → show "N/A" in tooltip
- Charts with different time ranges → show if in range

**Performance:**
- Debounce mouse events (16ms / 60fps)
- Use memo for timestamp matching
- No re-renders of chart data

---

### 2. Global Brush

**User Story:** As a user, I want to adjust the time range once and have it apply to all charts, so I don't have to adjust each chart individually.

**Behavior:**
- Single brush component below all charts
- Drag to change time range
- Both charts update simultaneously
- Brush state persists when closing/opening drawer

**Edge Cases:**
- Charts with different data lengths → use timestamps, not indices
- Empty datasets → disable brush or show warning

**Performance:**
- Already optimized in ExternalBrush
- State updates batched in React

---

### 3. Resizable Drawer Width

**User Story:** As a user, I want to adjust the drawer width so I can see more or less chart detail based on my needs.

**Behavior:**
- Drag left edge of drawer to resize
- Width persists to localStorage
- Min width: 30% of screen
- Max width: 80% of screen
- Smooth animation during resize

**Visual:**
- Visible drag handle on left edge
- Hover effect on handle
- Cursor changes to resize cursor

---

### 4. Resizable Chart Height

**User Story:** As a user, I want to adjust individual chart heights in the drawer so I can focus on the chart I'm analyzing.

**Behavior:**
- Drag handle between charts to resize
- Heights persist to localStorage per chart
- Min height: 200px
- Max height: 80% of drawer height
- Independent sizing for each chart

**Visual:**
- Horizontal drag handle between charts
- Hover effect with color change
- Smooth animation during resize

---

### 5. Drag & Drop Chart Reorder

**User Story:** As a user, I want to reorder charts by dragging them so I can organize my workspace.

**Behavior:**
- Drag handle visible on chart header
- Drag chart to reposition
- Other charts shift to make space
- Order persists to localStorage
- Smooth animations

**Visual:**
- Drag handle icon (6 dots)
- Semi-transparent preview while dragging
- Drop zone indicators
- Smooth FLIP animation

---

### 6. Keyboard Shortcuts

**Shortcuts:**
| Shortcut | Action |
|----------|--------|
| `Esc` | Close drawer |
| `Ctrl + B` | Toggle brush visibility |
| `Ctrl + R` | Reset zoom |
| `Ctrl + S` | Toggle sync mode |
| `?` | Show shortcuts help |

**Display:**
- Show in tooltips using Kbd component
- Show in drawer header as hints
- Optional: Shortcuts reference panel

---

## Bundle Impact Analysis

### Current Bundle
```
react: 42KB
react-dom: 130KB
recharts: 420KB
tailwindcss: ~20KB (runtime)
Total: ~612KB (gzipped: ~180KB)
```

### After Implementation
```
Current: ~612KB
New dependencies: +59KB
Total: ~671KB (gzipped: ~220KB)

Increase: +40KB gzipped (~9.6% increase)
```

### Justification
- **High value features** (sync, resize, drag-drop)
- **Professional UX** (matches enterprise tools)
- **User customization** (saves time for users)
- **Tree-shakeable** (only used code included)
- **One-time cost** (no ongoing performance hit)

---

## Testing Checklist

### Unit Tests (Optional but Recommended)
- [ ] SyncedChartContext provides correct state
- [ ] Timestamp matching algorithm works
- [ ] Resize constraints enforced
- [ ] LocalStorage persistence works
- [ ] Drag & drop order persistence

### Integration Tests
- [ ] Tooltip sync works with 2 charts
- [ ] Tooltip sync works with 3+ charts
- [ ] Global brush updates all charts
- [ ] Resize drawer width persists
- [ ] Resize chart height persists
- [ ] Drag & drop updates order
- [ ] Keyboard shortcuts trigger actions

### Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance Tests
- [ ] Tooltip sync at 60fps (no lag)
- [ ] Resize smooth at 60fps
- [ ] Drag & drop smooth animation
- [ ] No memory leaks after 5 min use
- [ ] Bundle size under 250KB gzipped

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus management correct
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Bundle size too large | Low | Medium | Use code splitting, lazy load |
| Performance degradation | Medium | High | Debounce events, use memo |
| Browser compatibility | Low | Medium | Test on all major browsers |
| State management complexity | Medium | Medium | Use context, clear separation |
| User confusion | Low | Low | Add onboarding tooltips |

---

## Success Metrics

### User Experience
- [ ] Users can sync tooltips across charts
- [ ] Users can resize drawer comfortably
- [ ] Users can resize charts to preference
- [ ] Users can reorder charts easily
- [ ] Keyboard shortcuts work intuitively

### Performance
- [ ] No frame drops during interactions
- [ ] Bundle size under 250KB gzipped
- [ ] Time to interactive < 2 seconds
- [ ] Memory usage stable over time

### Code Quality
- [ ] TypeScript types complete
- [ ] No console errors
- [ ] No React warnings
- [ ] ESLint passes
- [ ] Components reusable

---

## Timeline Summary

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Foundation | 1-2 hours | None |
| Phase 2: Shadcn Components | 2-3 hours | Phase 1 |
| Phase 3: Tooltip Sync | 2-3 hours | Phase 1, 2 |
| Phase 4: Global Brush | 1 hour | Phase 1 |
| Phase 5: Resizable | 2-3 hours | Phase 2 |
| Phase 6: Drag & Drop | 2 hours | Phase 2 |
| Phase 7: Shortcuts | 1 hour | Phase 2 |
| **Total** | **11-15 hours** | |

**Critical Path:** Phase 1 → Phase 2 → Phase 3/4/5 (parallel) → Phase 6 → Phase 7

**Recommended Order:**
1. Phase 1, 2 (foundation - do first)
2. Phase 4 (global brush - easiest, high value)
3. Phase 3 (tooltip sync - high value)
4. Phase 5 (resizable - high value)
5. Phase 6 (drag & drop - nice to have)
6. Phase 7 (shortcuts - polish)

---

## Notes & Considerations

### Theme Integration
- All components must use your CSS variables
- Gradient borders applied to popovers/tooltips
- SuisseIntl font inherited
- Smooth transitions match your system

### State Management
- Use React Context for sync state
- localStorage for persistence
- No Redux/Zustand needed (keep it simple)

### Future Enhancements (Post-MVP)
- Export chart as image
- Share chart configuration URL
- Multiple workspace layouts
- Chart presets/templates
- Collaborative features (multiple users)
- Real-time data updates

---

## Resources

### Documentation Links
- [Shadcn UI Docs](https://ui.shadcn.com/)
- [Recharts Docs](https://recharts.org/)
- [dnd-kit Docs](https://docs.dndkit.com/)
- [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)
- [Feather Icons](https://feathericons.com/)

### Design References
- Linear (resizable panels)
- Notion (drag & drop)
- Figma (multi-chart sync)
- Grafana (dashboard customization)

---

**Last Updated:** November 13, 2025  
**Status:** Ready for Implementation  
**Approved By:** _Pending_

