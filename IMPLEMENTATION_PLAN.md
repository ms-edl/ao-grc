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

### Implementation Status Summary (November 13, 2025)

**✅ Completed:**
- Phase 1: Foundation (dependencies, utilities, icons)
- Phase 2: Shadcn UI Components (13 components created)
- Phase 4: Brush Management (visible in main, hidden in drawer)
- Phase 5: Simplified Resizable Drawer (horizontal width only, fixed 256px chart heights)

**⏸️ Deferred:**
- Phase 3: Global Tooltip Sync (future enhancement)
- Phase 6: Drag & Drop Chart Reordering (future enhancement)
- Phase 7: Keyboard Shortcuts (future enhancement)

**Key Decisions:**
1. **Fixed Chart Heights**: All charts use 256px height for simplicity and consistency
2. **No Vertical Resize**: Removed complex chart height resizing - users don't need it
3. **Drawer-Only Brush**: Brush hidden in drawer views for cleaner UI
4. **Natural Tile Sizing**: ChartCard adapts to content without min-height constraints
5. **Horizontal Resize Only**: Drawer width adjustable (30-80% of screen)

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

### Phase 2: Shadcn UI Components ✅ COMPLETED
**Priority:** High  
**Risk:** Low  
**Status:** ✅ All components implemented and tested

#### Tasks
- [x] Create `components/ui/tooltip.tsx` (with theme integration and gradient borders)
- [x] Create `components/ui/kbd.tsx` (keyboard shortcut display with OS detection)
- [x] Create `components/ui/popover.tsx` (with gradient borders and animations)
- [x] Create `components/ui/command.tsx` (themed for your design system with keyboard navigation)
- [x] Create `components/ui/combobox.tsx` (metric/device selector combining Command + Popover)
- [x] Create `components/ui/resizable.tsx` (resizable panel wrapper with themed handles)

#### Deliverables ✅
- ✅ 6 themed UI components fully implemented
- ✅ Full integration with CSS variables (`--surface-*`, `--content-*`, `--gradient-border`)
- ✅ Gradient border system applied (`.button-gradient-border`, `.absolute-gradient-border`)
- ✅ SuisseIntl typography integration
- ✅ Light/dark theme support
- ✅ No additional dependencies required (uses existing packages)
- ✅ Comprehensive README with usage examples
- ✅ Added `aria-selected` CSS support to styles.css

#### Implementation Notes
- All components use existing dependencies (@radix-ui/react-popover, @radix-ui/react-tooltip, @radix-ui/react-dialog, cmdk, react-resizable-panels)
- Resizable component uses feather-icons instead of @radix-ui/react-icons (not installed)
- Command component includes full suite: CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut
- Combobox styled to match AoBtnFilter (32px height, gradient borders)

#### Testing
- ✅ Components respond to light/dark theme switching
- ✅ Gradient borders render correctly in both themes
- ✅ Hover/active states work properly
- ✅ Typography matches existing components (SuisseIntl font family)
- ✅ No linter errors

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

### Phase 4: Global Brush ✅ PARTIALLY COMPLETED
**Priority:** High  
**Risk:** Low (already mostly implemented)
**Status:** ✅ Brush functional in main views, hidden in drawer

#### Tasks Completed
- [x] ExternalBrush already supports range control
- [x] Each chart has its own brush in main view
- [x] Brush hidden in drawer views (simplified UX)
- [ ] Lift brush state to parent/drawer component (deferred)
- [ ] Pass shared `range` prop to both charts (deferred)

#### Implementation Notes
- Brush is visible and functional in main chart views
- Brush is hidden in drawer views (`display: none`) for cleaner UI
- Each chart maintains its own brush state independently
- Global brush synchronization deferred for future phase

#### Deliverables ✅
- ✅ Brush controls time range in main chart views
- ✅ Brush hidden in drawer for simplified UI
- ⏸️ Global brush synchronization (future enhancement)

#### Testing ✅
- ✅ Brush works in main chart view (WanLatencyChart)
- ✅ Brush works in main chart view (MultiDeviceLatencyChart)
- ✅ Brush properly hidden in drawer views
- ✅ Chart updates when brush range changes

---

### Phase 5: Resizable Components ✅ COMPLETED (Simplified Approach)
**Priority:** High  
**Risk:** Medium
**Status:** ✅ Completed with simplified implementation

#### Implementation Changes
Instead of complex resizable chart heights, we implemented:
- **Fixed chart height**: All charts use 256px height (main and drawer views)
- **Adaptive ChartCard**: Removed min-height constraints, tile adapts naturally to content
- **Drawer resize only**: ResizableChartDrawer allows horizontal width adjustment
- **No vertical resize**: Simplified UX by removing chart height adjustments

#### Tasks Completed
- [x] Create `components/ui/resizable-chart-drawer.tsx` (ResizableChartDrawer with Vaul + react-resizable-panels)
- [x] Set fixed 256px chart height for consistency
- [x] Remove brush from drawer views (hidden with `display: none`)
- [x] Keep brush visible in main chart views
- [x] Remove complex min-height logic from ChartCard
- [x] Clean up unused size toggle functionality

#### Deliverables ✅
- ✅ Resizable drawer width (drag from left edge)
- ✅ Fixed 256px chart height (no vertical resize needed)
- ✅ Smooth resize animations with react-resizable-panels
- ✅ Brush visible only in main views (not in drawer)
- ✅ Natural tile height adaptation
- ✅ Removed SizeToggleButton and related state

#### Implementation Notes
- Used Vaul library for drawer functionality (already installed)
- ResizablePanelGroup with horizontal direction for drawer width control
- Min width: 30%, Max width: 80%, Default: 50%
- Chart container uses simple fixed height: `height: 256` (no complex calculations)
- Brush component hidden in drawer with `style={{ display: 'none' }}`
- ChartCard no longer enforces min-height, adapts to content naturally

#### Testing ✅
- ✅ Drawer resizes smoothly with drag handle
- ✅ Chart height consistent across all views
- ✅ Brush visible in main charts, hidden in drawer
- ✅ No layout shifts or jumpiness
- ✅ ESC key closes drawer
- ✅ No linter errors

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

### New Files Created

```
/Users/modestas/AO - Graphical Represntation Center/
├── src/
│   └── lib/
│       └── utils.ts                         # ✅ CREATED (cn utility)
│
├── components/
│   ├── ui/                                  # ✅ NEW FOLDER CREATED
│   │   ├── README.md                       # ✅ CREATED (component documentation)
│   │   ├── icons.tsx                       # ✅ CREATED (Feather icon wrappers)
│   │   ├── command.tsx                     # ✅ CREATED (Command palette)
│   │   ├── popover.tsx                     # ✅ CREATED (Popover wrapper)
│   │   ├── combobox.tsx                    # ✅ CREATED (Combobox component)
│   │   ├── tooltip.tsx                     # ✅ CREATED (Tooltip component)
│   │   ├── tooltip-button.tsx              # ✅ CREATED (Button with tooltip)
│   │   ├── kbd.tsx                         # ✅ CREATED (Keyboard shortcut display)
│   │   ├── drawer.tsx                      # ✅ CREATED (Base drawer component)
│   │   ├── chart-drawer.tsx                # ✅ CREATED (Legacy drawer)
│   │   ├── resizable.tsx                   # ✅ CREATED (Resizable panels)
│   │   ├── resizable-chart-drawer.tsx      # ✅ CREATED (Main drawer implementation)
│   │   └── ao-btn-filter.tsx               # ✅ CREATED (Filter button component)
│   │
│   ├── SyncedChartContext.tsx              # ⏸️ NOT CREATED (deferred)
│   ├── ResizableChartContainer.tsx         # ⏸️ NOT CREATED (not needed - using fixed heights)
│   └── SortableChartGrid.tsx               # ⏸️ NOT CREATED (deferred)
│
├── BUG_FIXES_RESIZABLE.md                   # ✅ CREATED (bug tracking)
├── DRAWER_IMPLEMENTATION.md                 # ✅ CREATED (drawer docs)
├── RESIZABLE_DRAWER.md                      # ✅ CREATED (resizable docs)
└── IMPLEMENTATION_PLAN.md                   # ✅ THIS FILE (updated)
```

### Files Modified

```
├── src/
│   └── styles.css                          # ✅ MODIFIED: Added animations & tooltip styles
│
├── components/
│   ├── ChartCard.tsx                       # ✅ MODIFIED: Removed min-height, simplified
│   ├── ChartHeader.tsx                     # ✅ MODIFIED: Removed SizeToggleButton
│   ├── ChartLegend.tsx                     # ✅ MODIFIED: Removed showTooltipForItem
│   ├── ChartTooltip.tsx                    # ⏸️ NOT MODIFIED: Sync support deferred
│   ├── MultiDeviceLatencyChart.tsx         # ✅ MODIFIED: Fixed 256px height, removed size state
│   └── WanLatencyChart.tsx                 # ✅ MODIFIED: Fixed 256px height, removed size state
│
└── package.json                            # ✅ MODIFIED: Added vaul dependency
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
**Status:** Phase 1, 2, 4 (partial), 5 Complete | Phase 3, 6, 7 Deferred  
**Current State:**
- ✅ Foundation & Shadcn components complete
- ✅ Resizable drawer with fixed 256px chart heights
- ✅ Brush hidden in drawer, visible in main views
- ✅ Simplified ChartCard without min-height constraints
- ⏸️ Tooltip sync, drag & drop, keyboard shortcuts deferred

**Next Steps (if continuing):**
1. Implement Phase 3 (Global Tooltip Sync) for cross-chart coordination
2. Implement Phase 6 (Drag & Drop) for chart reordering
3. Implement Phase 7 (Keyboard Shortcuts) for power users
4. Consider localStorage persistence for drawer width

**Approved By:** In Progress

