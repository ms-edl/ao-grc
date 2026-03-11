import { useState, useCallback, useEffect, useMemo } from 'react';
import MultiDeviceLatencyChart from '../components/MultiDeviceLatencyChart';
import WanLatencyChart from '../components/WanLatencyChart';
import { ResizableChartDrawer } from '../components/ui/resizable-chart-drawer';
import { AvailableWidget } from '../components/ui/chart-drawer';
import { SyncedChartProvider } from '../components/SyncedChartContext';
import { SharedAxisWidthProvider } from '../components/charts/context/SharedAxisWidthContext';
import { SharedTimeDomainProvider, TimeDomain } from '../components/charts/context/SharedTimeDomainContext';
import { SharedTimeAxis } from '../components/charts/SharedTimeAxis';
import { SimplifiedBrush } from '../components/SimplifiedBrush';
import { SortableChartContainer } from '../components/SortableChartContainer';
import { SortableChartItem } from '../components/SortableChartItem';
import { Icon } from '../components/ui/icons';
import { ChartItemConfig } from './types';

/**
 * CombinedLatencyPage
 * 
 * Displays both the Client Latency (MultiDevice) and WAN Latency charts
 * in a single page with a shared resizable drawer.
 * 
 * When the maximize button is clicked on either chart, a shared drawer
 * opens displaying both charts together with a unified brush control.
 * 
 * Features:
 * - Drag & drop chart reordering in drawer
 * - Individual chart height adjustment
 * - Chart order persistence to localStorage
 */
export default function CombinedLatencyPage() {
  const [isSharedDrawerOpen, setIsSharedDrawerOpen] = useState(false);
  
  // Track data lengths for global brush
  const [multiDeviceDataLength, setMultiDeviceDataLength] = useState(0);
  const [wanDataLength, setWanDataLength] = useState(0);
  const [multiDeviceData, setMultiDeviceData] = useState<any[]>([]);
  const [wanData, setWanData] = useState<any[]>([]);
  
  // Chart order with localStorage persistence
  const [chartOrder, setChartOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('chartOrder');
    return stored ? JSON.parse(stored) : ['multidevice', 'wan'];
  });

  // Available widgets for the sidebar
  const availableWidgets: AvailableWidget[] = useMemo(() => [
    {
      id: 'qoe',
      label: 'QoE',
      category: 'CPE HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'cpu-usage',
      label: 'CPU usage/Load',
      category: 'CPE HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'cpu-memory',
      label: 'CPU free memory',
      category: 'CPE HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'cpu-temperature',
      label: 'CPU temperature',
      category: 'CPE HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'reboots',
      label: 'Reboots',
      category: 'CPE HISTORY',
      description: 'Amount · Hourly',
    },
    {
      id: 'client-qoe',
      label: 'QoE',
      category: 'CLIENT HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'client-cpu-usage',
      label: 'CPU usage/Load',
      category: 'CLIENT HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'client-cpu-memory',
      label: 'CPU free memory',
      category: 'CLIENT HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'client-cpu-temperature',
      label: 'CPU temperature',
      category: 'CLIENT HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'client-reboots',
      label: 'Reboots',
      category: 'CLIENT HISTORY',
      description: 'Amount · Hourly',
    },
    {
      id: 'wan-qoe',
      label: 'QoE',
      category: 'LAN&WLAN HISTORY',
      description: 'Score · Hourly',
    },
    {
      id: 'wan-cpu-usage',
      label: 'CPU usage/Load',
      category: 'LAN&WLAN HISTORY',
      description: 'Score · Hourly',
    },
  ], []);
  
  // Chart heights with localStorage persistence (min: 256px, max: 600px)
  const [chartHeights, setChartHeights] = useState<Record<string, number>>(() => {
    const multiDeviceStored = localStorage.getItem('chartHeight_multiDevice');
    const wanStored = localStorage.getItem('chartHeight_wan');
    return {
      multidevice: multiDeviceStored ? Math.min(Math.max(Number(multiDeviceStored), 256), 600) : 256,
      wan: wanStored ? Math.min(Math.max(Number(wanStored), 256), 600) : 256,
    };
  });
  
  // Shared range state for drawer
  const maxDataLength = Math.max(multiDeviceDataLength, wanDataLength);
  const initialRange = { startIndex: 0, endIndex: Math.max(0, Math.min(24 * 7 - 1, maxDataLength - 1)) };

  // displayRange: what drawer charts render
  const [displayRange, setDisplayRange] = useState<{ startIndex: number; endIndex: number }>(initialRange);
  // Transition state: idle ↔ loading (loading while brush is dragged)
  const [transitionState, setTransitionState] = useState<'idle' | 'loading'>('idle');
  
  // Track if brush is being hovered
  const [isBrushHovered, setIsBrushHovered] = useState(false);
  // Track if shared X-axis area is being hovered
  const [isAxisHovered, setIsAxisHovered] = useState(false);

  // Update ranges when max data length changes (initial load)
  useEffect(() => {
    if (maxDataLength > 0) {
      const range = {
        startIndex: 0,
        endIndex: Math.max(0, Math.min(24 * 7 - 1, maxDataLength - 1))
      };
      setDisplayRange(range);
    }
  }, [maxDataLength]);

  const handleMultiDeviceDataLoad = useCallback((length: number, data: any[]) => {
    setMultiDeviceDataLength(length);
    setMultiDeviceData(data);
  }, []);

  const handleWanDataLoad = useCallback((length: number, data: any[]) => {
    setWanDataLength(length);
    setWanData(data);
  }, []);

  const handleMaximize = () => {
    setIsSharedDrawerOpen(true);
  };

  // Called continuously during brush drag.
  // Keep brush interaction local and avoid chart rerenders until commit.
  const handleBrushDrag = useCallback((_range: { startIndex: number; endIndex: number }) => {
    setTransitionState(prev => (prev === 'loading' ? prev : 'loading'));
  }, []);

  // Called once on brush release — commit final range immediately.
  const handleBrushCommit = useCallback((range: { startIndex: number; endIndex: number }) => {
    setDisplayRange(prev => (
      prev.startIndex === range.startIndex && prev.endIndex === range.endIndex
        ? prev
        : range
    ));
    setTransitionState('idle');
  }, []);

  // Handle chart reordering with debounced localStorage write
  const handleChartReorder = useCallback((newOrder: string[]) => {
    setChartOrder(newOrder);
    // Debounced localStorage write
    setTimeout(() => {
      localStorage.setItem('chartOrder', JSON.stringify(newOrder));
    }, 300);
  }, []);

  // Handle chart height changes with clamping (min: 256px, max: 600px)
  const handleHeightChange = useCallback((chartId: string, deltaY: number) => {
    setChartHeights(prevHeights => {
      const newHeight = Math.min(Math.max(prevHeights[chartId] + deltaY, 256), 600);
      const newHeights = { ...prevHeights, [chartId]: newHeight };
      
      // Persist to localStorage with legacy key names
      if (chartId === 'multidevice') {
        localStorage.setItem('chartHeight_multiDevice', String(newHeight));
      } else if (chartId === 'wan') {
        localStorage.setItem('chartHeight_wan', String(newHeight));
      }
      
      return newHeights;
    });
  }, []);

  // Handle widget selection from sidebar
  const handleWidgetSelect = useCallback((widgetId: string) => {
    console.log('Widget selected:', widgetId);
    // TODO: Add logic to add the selected widget/chart to the drawer
  }, []);

  // Use the longer dataset for brush visualization
  const brushData = multiDeviceDataLength >= wanDataLength ? multiDeviceData : wanData;

  // Shared time domain so all drawer charts generate identical X-axis ticks
  const sharedTimeDomain = useMemo<TimeDomain | null>(() => {
    if (brushData.length === 0) return null;
    const startRow = brushData[displayRange.startIndex];
    const endRow = brushData[displayRange.endIndex];
    if (!startRow || !endRow) return null;
    return { start: new Date(startRow.x), end: new Date(endRow.x) };
  }, [brushData, displayRange]);

  // Chart configurations
  const isLoading = transitionState === 'loading';
  const isBrushVisible = isAxisHovered || isBrushHovered;
  const chartConfigs: Record<string, ChartItemConfig & { component: JSX.Element }> = useMemo(() => ({
    multidevice: {
      id: 'multidevice',
      type: 'multidevice',
      order: chartOrder.indexOf('multidevice'),
      component: (
        <MultiDeviceLatencyChart 
          hideDrawer={true} 
          variant="drawer" 
          enableSync={true}
          sharedRange={displayRange}
          isBrushAdjusting={isBrushHovered || isLoading}
          height={chartHeights.multidevice}
          tileBorderRadius={20}
          showResizeHandle={true}
          onHeightChange={(deltaY) => handleHeightChange('multidevice', deltaY)}
          hideXAxisLabels={true}
        />
      ),
    },
    wan: {
      id: 'wan',
      type: 'wan',
      order: chartOrder.indexOf('wan'),
      component: (
        <WanLatencyChart 
          hideDrawer={true} 
          variant="drawer" 
          enableSync={true}
          sharedRange={displayRange}
          isBrushAdjusting={isBrushHovered || isLoading}
          height={chartHeights.wan}
          tileBorderRadius={20}
          showResizeHandle={true}
          onHeightChange={(deltaY) => handleHeightChange('wan', deltaY)}
          hideXAxisLabels={true}
        />
      ),
    },
  }), [chartOrder, chartHeights, displayRange, handleHeightChange, isBrushHovered, isLoading]);

  // Render charts in order
  const orderedCharts = useMemo(() => {
    return chartOrder.map(id => chartConfigs[id]).filter(Boolean);
  }, [chartOrder, chartConfigs]);

  return (
    <>
      <div className="flex flex-col items-center space-y-6">
        {/* Client Latency Chart - Main View */}
        <div>
          <MultiDeviceLatencyChart 
            onMaximize={handleMaximize} 
            hideDrawer={true}
            onDataLoad={handleMultiDeviceDataLoad}
            tileBorderRadius={20}
          />
        </div>

        {/* WAN Latency Chart - Main View */}
        <div>
          <WanLatencyChart 
            onMaximize={handleMaximize} 
            hideDrawer={true}
            onDataLoad={handleWanDataLoad}
            tileBorderRadius={20}
          />
        </div>
      </div>

      {/* Shared Drawer with Both Charts */}
      <SyncedChartProvider syncEnabled={true}>
        <SharedTimeDomainProvider value={sharedTimeDomain}>
          <SharedAxisWidthProvider>
            <ResizableChartDrawer
              open={isSharedDrawerOpen}
              onOpenChange={setIsSharedDrawerOpen}
              deviceName="C4000LG2117813461"
              deviceType="Router"
              deviceStatus="Online since 3d ago"
              deviceAvatar="/Images/router.png"
              chartTags={[
                { id: 'client-latency', label: 'Client history · Latency' },
                { id: 'wan-latency', label: 'WAN history · Latency' },
              ]}
              onAddChart={() => console.log('Add chart clicked')}
              availableWidgets={availableWidgets}
              onWidgetSelect={handleWidgetSelect}
              defaultSize={60}
              minSize={40}
              maxSize={90}
              bottomContent={
                brushData.length > 0 ? (
                  <div className="drawer-footer-inner">
                    <div className="drawer-footer-brush">
                      {isBrushVisible && (
                        <SimplifiedBrush
                          data={brushData}
                          xKey="x"
                          startIndex={displayRange.startIndex}
                          endIndex={displayRange.endIndex}
                          minSelectionPoints={6}
                          maxSelectionPoints={24 * 15}
                          onChange={handleBrushDrag}
                          onCommit={handleBrushCommit}
                          onHoverChange={setIsBrushHovered}
                        />
                      )}
                    </div>
                    <div className="drawer-footer-axis-row">
                      <div
                        className="drawer-footer-axis"
                        onMouseEnter={() => setIsAxisHovered(true)}
                        onMouseLeave={() => setIsAxisHovered(false)}
                      >
                        <SharedTimeAxis
                          data={brushData}
                          xKey="x"
                          startIndex={displayRange.startIndex}
                          endIndex={displayRange.endIndex}
                        />
                      </div>
                      <div className="drawer-footer-time-range">
                        <button type="button" className="drawer-action-button">
                          <Icon name="clock" size={16} />
                          <span className="ui-12-book">Last 14 days</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null
              }
            >
              <div className="relative" style={{ ['--drawer-chart-overlay-radius' as any]: '20px' }}>
                <SortableChartContainer chartIds={chartOrder} onReorder={handleChartReorder}>
                  {orderedCharts.map(chart => (
                    <SortableChartItem key={chart.id} id={chart.id}>
                      {chart.component}
                    </SortableChartItem>
                  ))}
                </SortableChartContainer>

                {/* Loading overlay during brush drag — keeps old chart visible underneath */}
                <div
                  className="chart-transition-overlay"
                  data-visible={transitionState === 'loading' || undefined}
                >
                  <div className="chart-transition-spinner" />
                </div>
              </div>
            </ResizableChartDrawer>
          </SharedAxisWidthProvider>
        </SharedTimeDomainProvider>
      </SyncedChartProvider>
    </>
  );
}
