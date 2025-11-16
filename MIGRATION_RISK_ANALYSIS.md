# Chart Migration Risk Analysis

## Executive Summary

**Overall Risk Level: MEDIUM-HIGH** ⚠️

The migration carries moderate risk due to complexity and critical user-facing functionality. However, with proper testing and incremental approach, risks can be managed effectively.

---

## 1. Impact Radius

### Files Using the Charts
- **`src/CombinedLatencyPage.tsx`** ⭐ CRITICAL - Main production page
  - Uses both charts in default and drawer variants
  - Complex interactions: drag-drop, resize, sync, global brush
  - 4 instances total (2 default + 2 drawer)

- **`src/LatencyPage.tsx`** - Individual MultiDevice page
  - Single simple usage
  - Low complexity

- **`src/WanLatencyPage.tsx`** - Individual WAN page
  - Single simple usage
  - Low complexity

- **`src/App.tsx`** - Imports CombinedLatencyPage
  - Indirect dependency
  - High visibility (main entry point)

**Verdict**: Charts are used in 3 pages, but CombinedLatencyPage is the critical one with complex usage patterns.

---

## 2. Risk Categories

### 2.1 Functional Risks ⚠️ HIGH

**What Could Break:**

1. **Tooltip Synchronization**
   - Current: Complex cross-chart sync via SyncedChartContext
   - Risk: Timing issues, index mismatches, null states
   - Impact: Users can't compare data across charts

2. **Drag & Drop Reordering**
   - Current: Charts wrapped in SortableChartItem with dnd-kit
   - Risk: Drag handle props not passed correctly
   - Impact: Can't reorder charts in drawer

3. **Chart Resizing**
   - Current: ResizeHandleVertical with height callbacks
   - Risk: Height state not persisting, constraints not enforced
   - Impact: Can't adjust chart sizes, localStorage breaks

4. **Global Brush Control**
   - Current: SimplifiedBrush controls both charts via sharedRange
   - Risk: Range sync breaks, index out of bounds
   - Impact: Can't control time range, charts show wrong data

5. **Focus Mode**
   - Current: Alt+click to isolate device/metric
   - Risk: Focus state not managed correctly
   - Impact: Users can't isolate specific data series

6. **Legend Interactions**
   - Current: Click to toggle, hover to highlight, Alt+click to focus
   - Risk: Event handlers not wired correctly
   - Impact: Can't hide/show data series

7. **Filters (MultiDevice Only)**
   - Current: Complex filter panel for bands and clients
   - Risk: Filter state disconnected from base components
   - Impact: Can't filter by WiFi band or client device

8. **Data Loading**
   - Current: CSV parsing, synthetic data augmentation (MultiDevice)
   - Risk: Data transformation broken, callbacks not triggered
   - Impact: Charts show no data or incorrect data

### 2.2 Visual Risks ⚠️ MEDIUM

**What Could Look Different:**

1. **Layout Shifts**
   - Current drawer: Custom layouts differ between charts
   - Risk: BaseChartLayout enforces consistency, may change appearance
   - Impact: Users notice visual changes

2. **Spacing & Padding**
   - Current: Hardcoded padding in multiple places
   - Risk: BaseChartLayout uses different spacing
   - Impact: Charts look cramped or too spacious

3. **Legend Positioning**
   - Current: Inline for default, sidebar for drawer
   - Risk: BaseChartLayout may position differently
   - Impact: Legend in unexpected location

4. **Chart Heights**
   - Current: Stored in localStorage, clamped 256-600px
   - Risk: Height management changes, constraints not preserved
   - Impact: Charts wrong size after migration

### 2.3 Performance Risks ⚠️ LOW

**What Could Get Slower:**

1. **Re-renders**
   - Current: Optimized with useMemo/useCallback
   - Risk: Base hooks may cause extra renders
   - Impact: Chart updates feel sluggish

2. **Data Processing**
   - Current: Efficient rolling window calculations
   - Risk: useBrushRange may slice data differently
   - Impact: Slight performance degradation

**Verdict**: Performance risks are low, React is fast enough.

### 2.4 State Management Risks ⚠️ MEDIUM

**What Could Get Lost:**

1. **LocalStorage Persistence**
   - Current: Chart heights, order stored in localStorage
   - Risk: Keys change, data not migrated
   - Impact: Users lose saved preferences

2. **Focus Mode State**
   - Current: preFocusHiddenItems preserves state before focus
   - Risk: useBaseChartState may not handle this correctly
   - Impact: Can't exit focus mode properly

3. **Hover State**
   - Current: hoveredDevice/hoveredMetric with debounced tooltips
   - Risk: State conflicts between base hooks and chart logic
   - Impact: Hover effects broken or flickering

### 2.5 Integration Risks ⚠️ MEDIUM

**What Could Not Work Together:**

1. **SyncedChartProvider**
   - Current: Both charts wrapped, share timestamp
   - Risk: BaseChartCore may break sync mechanism
   - Impact: Tooltips not synchronized

2. **SimplifiedBrush**
   - Current: Controls both charts via sharedRange
   - Risk: useBrushRange may conflict with external brush
   - Impact: Brush doesn't update charts

3. **Drag-Drop Context**
   - Current: SortableChartContainer + SortableChartItem
   - Risk: BaseChartLayout may not pass props correctly
   - Impact: Drag-drop broken

---

## 3. Complexity Analysis

### WanLatencyChart (935 lines)

**Complexity: MEDIUM** 🟡

- 3 metrics (simpler than MultiDevice's N devices)
- Dual Y-axes (adds complexity)
- Focus mode (moderate complexity)
- No filters (simpler than MultiDevice)
- No synthetic data (simpler)

**Refactoring Effort**: 2-3 days  
**Testing Effort**: 2 days  
**Total**: ~1 week

### MultiDeviceLatencyChart (2,281 lines)

**Complexity: VERY HIGH** 🔴

- N devices (dynamic, complex)
- 3 band types with different line styles
- Filter panel with 2 sub-panels
- Synthetic data augmentation for sparse devices
- Outage detection with hatched overlays
- Focus mode per device
- Complex device name parsing
- TSV and CSV parsing
- Two completely different layouts for variants

**Refactoring Effort**: 1-2 weeks  
**Testing Effort**: 3-5 days  
**Total**: ~2-3 weeks

---

## 4. Testing Requirements

### Must Test (Critical Paths)

#### Default Variant
- [ ] Chart renders at 864px width
- [ ] Data loads from CSV/TSV
- [ ] Legend shows all items correctly
- [ ] Click legend to toggle visibility
- [ ] Alt+click legend for focus mode
- [ ] Hover legend highlights series
- [ ] Maximize button opens drawer
- [ ] ExternalBrush controls time range
- [ ] Brush persists selection
- [ ] Chart responds to theme changes

#### Drawer Variant
- [ ] Chart renders at full width
- [ ] Sidebar shows with min/avg/max stats
- [ ] Stats calculate correctly
- [ ] Drag handle appears and works
- [ ] Can reorder charts via drag-drop
- [ ] Resize handle appears and works
- [ ] Can adjust height 256-600px
- [ ] Height persists to localStorage
- [ ] SharedRange controls chart
- [ ] Global brush updates both charts

#### Synchronization
- [ ] Hover one chart, tooltip shows in both
- [ ] Tooltip shows correct data for timestamp
- [ ] Mouse leave clears both tooltips
- [ ] Sync works with different data lengths

#### MultiDevice Specific
- [ ] WiFi band filter works
- [ ] Client device filter works
- [ ] Synthetic data appears for sparse devices
- [ ] Outage detection works
- [ ] Band styles render correctly (solid/dashed/dotted)

#### Edge Cases
- [ ] Empty data shows correct message
- [ ] All items hidden shows "Show all"
- [ ] Focus mode with all others hidden
- [ ] Very short time range (< 6 hours)
- [ ] Very long time range (> 30 days)
- [ ] Single data point
- [ ] Missing CSV file

---

## 5. Rollback Strategy

### If Migration Fails

**Easy Rollback**: ✅ YES

```bash
# Restore from backup
cp components/WanLatencyChart.tsx.backup components/WanLatencyChart.tsx
cp components/MultiDeviceLatencyChart.tsx.backup components/MultiDeviceLatencyChart.tsx

# Or revert commit
git revert <migration-commit-sha>
```

**Recovery Time**: < 5 minutes  
**Data Loss**: None (charts read-only from CSV)  
**User Impact**: None if caught before deployment

---

## 6. Mitigation Strategies

### Strategy 1: Feature Branch + Staging

```bash
# Create feature branch
git checkout -b feat/migrate-wan-chart

# Migrate WAN chart
# Test thoroughly
# Deploy to staging
# Get user feedback

# Merge only if successful
git checkout main
git merge feat/migrate-wan-chart
```

**Reduces Risk By**: 80%  
**Allows**: Safe testing, easy rollback, user validation

### Strategy 2: Incremental Migration

```bash
# Week 1: Migrate WAN chart only
# Test for 3-5 days in production
# Monitor for issues

# Week 2: Migrate MultiDevice chart if WAN successful
# Test for 3-5 days in production
```

**Reduces Risk By**: 60%  
**Allows**: Learning from first migration, catching issues early

### Strategy 3: A/B Testing

```typescript
// Add feature flag
const useNewChartArchitecture = localStorage.getItem('newCharts') === 'true';

{useNewChartArchitecture ? (
  <NewWanLatencyChart {...props} />
) : (
  <WanLatencyChart {...props} />
)}
```

**Reduces Risk By**: 90%  
**Allows**: Side-by-side comparison, gradual rollout, instant rollback

### Strategy 4: Comprehensive E2E Tests

```typescript
// Add Playwright/Cypress tests
describe('WanLatencyChart Migration', () => {
  it('should render chart correctly', ...);
  it('should sync tooltips between charts', ...);
  it('should handle drag and drop', ...);
  // ... 20+ more tests
});
```

**Reduces Risk By**: 70%  
**Allows**: Automated regression testing, confidence before deploy

---

## 7. Risk Summary Table

| Risk Category | Level | Likelihood | Impact | Mitigation |
|---------------|-------|------------|--------|------------|
| Tooltip sync breaks | HIGH | Medium | High | E2E tests, staging |
| Drag-drop breaks | HIGH | Medium | High | Manual testing |
| Data loading fails | MEDIUM | Low | Critical | Unit tests |
| Visual regression | MEDIUM | High | Low | Visual comparison |
| Performance degrades | LOW | Low | Medium | Benchmarking |
| LocalStorage breaks | MEDIUM | Medium | Medium | Migration script |
| Focus mode breaks | MEDIUM | Medium | High | E2E tests |
| Filters break (MD) | HIGH | Medium | High | E2E tests |

---

## 8. Recommendation

### 🟢 GO / NO-GO Decision

**If you have:**
- ✅ 2-3 weeks of dedicated development time
- ✅ Staging environment for testing
- ✅ Users who can validate in staging
- ✅ Ability to rollback quickly
- ✅ E2E testing infrastructure

**Then**: 🟢 **GO** - Migration is manageable

**If you don't have:**
- ❌ Time for thorough testing
- ❌ Staging environment
- ❌ Rollback plan

**Then**: 🔴 **NO-GO** - Keep current implementation

### Safest Approach

1. **Start with WAN** (simpler, 935 lines)
2. **Feature branch** + **staging deployment**
3. **3-5 days of testing** (both automated and manual)
4. **User validation** before production
5. **Monitor for 1 week** in production
6. **Then tackle MultiDevice** if WAN successful

---

## 9. Alternative: Zero-Risk Approach

**Use base components for NEW charts only**

- ✅ Zero risk to existing functionality
- ✅ Immediate benefit for new development
- ✅ Gradual adoption as charts need updates
- ✅ No pressure, no deadlines

**When to migrate:**
- Chart needs new features anyway
- Major bug requires refactor
- Never (if charts work fine as-is)

---

## Conclusion

**Migration Risk: MEDIUM-HIGH** ⚠️

The migration is **technically safe but requires careful execution**. With proper testing, staging, and incremental approach, risks are manageable. However, the effort is significant (2-3 weeks total) for limited functional benefit.

**Recommended**: Use base components for new charts, migrate existing charts only when they need major updates anyway.

