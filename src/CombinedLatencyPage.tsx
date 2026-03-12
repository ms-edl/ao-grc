import { useState, useCallback, useEffect, useMemo } from 'react';
import MultiDeviceLatencyChart from '../components/MultiDeviceLatencyChart';
import WanLatencyChart from '../components/WanLatencyChart';
import CpeQoeHistoryChart from '../components/CpeQoeHistoryChart';
import { ResizableChartDrawer } from '../components/ui/resizable-chart-drawer';
import { AvailableWidget } from '../components/ui/chart-drawer';
import { SyncedChartProvider } from '../components/SyncedChartContext';
import { SharedAxisWidthProvider } from '../components/charts/context/SharedAxisWidthContext';
import { SimplifiedBrush } from '../components/SimplifiedBrush';
import { SortableChartContainer } from '../components/SortableChartContainer';
import { SortableChartItem } from '../components/SortableChartItem';
import { ChartItemConfig } from './types';

const KNOWN_CHART_IDS = ['multidevice', 'wan', 'cpe-qoe'] as const;

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
  const [cpeQoeDataLength, setCpeQoeDataLength] = useState(0);
  const [multiDeviceData, setMultiDeviceData] = useState<any[]>([]);
  const [wanData, setWanData] = useState<any[]>([]);
  const [cpeQoeData, setCpeQoeData] = useState<any[]>([]);
  
  // Chart order with localStorage persistence
  const [chartOrder, setChartOrder] = useState<string[]>(() => {
    const stored = localStorage.getItem('chartOrder');
    const defaultOrder = [...KNOWN_CHART_IDS];
    if (!stored) return defaultOrder;
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return defaultOrder;
      const sanitized = parsed.filter((id: string, index: number) =>
        KNOWN_CHART_IDS.includes(id as any) && parsed.indexOf(id) === index
      );
      KNOWN_CHART_IDS.forEach((id) => {
        if (!sanitized.includes(id)) sanitized.push(id);
      });
      return sanitized;
    } catch {
      return defaultOrder;
    }
  });

  // Available widgets for the sidebar
  const availableWidgets: AvailableWidget[] = useMemo(() => [
    {
      id: 'client-latency',
      label: 'Latency',
      category: 'CLIENT HISTORY',
      description: 'ms · Hourly',
    },
    {
      id: 'wan-latency',
      label: 'Latency',
      category: 'LAN&WLAN HISTORY',
      description: 'ms · Hourly',
    },
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
    const cpeQoeStored = localStorage.getItem('chartHeight_cpeQoe');
    return {
      multidevice: multiDeviceStored ? Math.min(Math.max(Number(multiDeviceStored), 256), 600) : 256,
      wan: wanStored ? Math.min(Math.max(Number(wanStored), 256), 600) : 256,
      'cpe-qoe': cpeQoeStored ? Math.min(Math.max(Number(cpeQoeStored), 256), 600) : 256,
    };
  });
  
  // Shared range state for drawer
  const maxDataLength = Math.max(multiDeviceDataLength, wanDataLength, cpeQoeDataLength);
  const [sharedRange, setSharedRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: Math.max(0, Math.min(24 * 7 - 1, maxDataLength - 1))
  });
  
  // Track if brush is being hovered
  const [isBrushHovered, setIsBrushHovered] = useState(false);

  // Update shared range when max data length changes
  useEffect(() => {
    if (maxDataLength > 0) {
      setSharedRange({
        startIndex: 0,
        endIndex: Math.max(0, Math.min(24 * 7 - 1, maxDataLength - 1))
      });
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

  const handleCpeQoeDataLoad = useCallback((length: number, data: any[]) => {
    setCpeQoeDataLength(length);
    setCpeQoeData(data);
  }, []);

  const handleMaximize = () => {
    setIsSharedDrawerOpen(true);
  };

  const handleBrushChange = useCallback((range: { startIndex: number; endIndex: number }) => {
    setSharedRange(range);
  }, []);

  const persistOrder = useCallback((order: string[]) => {
    setTimeout(() => {
      localStorage.setItem('chartOrder', JSON.stringify(order));
    }, 300);
  }, []);

  // Handle chart reordering with debounced localStorage write
  const handleChartReorder = useCallback((newOrder: string[]) => {
    setChartOrder(newOrder);
    persistOrder(newOrder);
  }, [persistOrder]);

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
      } else if (chartId === 'cpe-qoe') {
        localStorage.setItem('chartHeight_cpeQoe', String(newHeight));
      }
      
      return newHeights;
    });
  }, []);

  const removeChartById = useCallback((chartId: string) => {
    setChartOrder((prev) => {
      const next = prev.filter((id) => id !== chartId);
      persistOrder(next);
      return next;
    });
  }, [persistOrder]);

  const addChartById = useCallback((chartId: string) => {
    if (!KNOWN_CHART_IDS.includes(chartId as any)) return;
    setChartOrder((prev) => {
      if (prev.includes(chartId)) return prev;
      const next = [...prev, chartId];
      persistOrder(next);
      return next;
    });
  }, [persistOrder]);

  const moveChartByDirection = useCallback((chartId: string, direction: 'up' | 'down') => {
    setChartOrder((prev) => {
      const currentIndex = prev.indexOf(chartId);
      if (currentIndex === -1) return prev;
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const next = [...prev];
      [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
      persistOrder(next);
      return next;
    });
  }, [persistOrder]);

  // Handle widget selection from sidebar
  const handleWidgetSelect = useCallback((widgetId: string) => {
    if (widgetId === 'qoe') {
      addChartById('cpe-qoe');
      return;
    }
    if (widgetId === 'client-latency') {
      addChartById('multidevice');
      return;
    }
    if (widgetId === 'wan-latency') {
      addChartById('wan');
      return;
    }
    console.log('Widget selected (not yet mapped to chart):', widgetId);
  }, [addChartById]);

  // Use the longer dataset for brush visualization
  const brushData = useMemo(() => {
    const candidates = [
      { len: multiDeviceDataLength, data: multiDeviceData },
      { len: wanDataLength, data: wanData },
      { len: cpeQoeDataLength, data: cpeQoeData },
    ];
    return candidates.sort((a, b) => b.len - a.len)[0]?.data ?? [];
  }, [multiDeviceDataLength, wanDataLength, cpeQoeDataLength, multiDeviceData, wanData, cpeQoeData]);

  const chartTagConfigs = useMemo(
    () => ({
      multidevice: { id: 'client-latency', label: 'Client history · Latency' },
      wan: { id: 'wan-latency', label: 'WAN history · Latency' },
      'cpe-qoe': { id: 'cpe-qoe', label: 'CPE history · QoE' },
    }),
    [],
  );

  const chartTags = useMemo(() => {
    return chartOrder
      .map((chartId) => {
        const config = chartTagConfigs[chartId as keyof typeof chartTagConfigs];
        if (!config) return null;
        return {
          ...config,
          onRemove: () => removeChartById(chartId),
        };
      })
      .filter(Boolean) as Array<{ id: string; label: string; onRemove: (id: string) => void }>;
  }, [chartOrder, chartTagConfigs, removeChartById]);

  // Chart configurations
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
          sharedRange={sharedRange}
          isBrushAdjusting={isBrushHovered}
          height={chartHeights.multidevice}
          showResizeHandle={true}
          onHeightChange={(deltaY) => handleHeightChange('multidevice', deltaY)}
          onMoveUp={() => moveChartByDirection('multidevice', 'up')}
          onMoveDown={() => moveChartByDirection('multidevice', 'down')}
          onDelete={() => removeChartById('multidevice')}
          disableMoveUp={chartOrder.indexOf('multidevice') <= 0}
          disableMoveDown={chartOrder.indexOf('multidevice') >= chartOrder.length - 1}
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
          sharedRange={sharedRange}
          isBrushAdjusting={isBrushHovered}
          height={chartHeights.wan}
          showResizeHandle={true}
          onHeightChange={(deltaY) => handleHeightChange('wan', deltaY)}
          onMoveUp={() => moveChartByDirection('wan', 'up')}
          onMoveDown={() => moveChartByDirection('wan', 'down')}
          onDelete={() => removeChartById('wan')}
          disableMoveUp={chartOrder.indexOf('wan') <= 0}
          disableMoveDown={chartOrder.indexOf('wan') >= chartOrder.length - 1}
        />
      ),
    },
    'cpe-qoe': {
      id: 'cpe-qoe',
      type: 'cpe-qoe',
      order: chartOrder.indexOf('cpe-qoe'),
      component: (
        <CpeQoeHistoryChart
          hideDrawer={true}
          variant="drawer"
          enableSync={true}
          sharedRange={sharedRange}
          isBrushAdjusting={isBrushHovered}
          height={chartHeights['cpe-qoe']}
          showResizeHandle={true}
          onHeightChange={(deltaY) => handleHeightChange('cpe-qoe', deltaY)}
          onMoveUp={() => moveChartByDirection('cpe-qoe', 'up')}
          onMoveDown={() => moveChartByDirection('cpe-qoe', 'down')}
          onDelete={() => removeChartById('cpe-qoe')}
          disableMoveUp={chartOrder.indexOf('cpe-qoe') <= 0}
          disableMoveDown={chartOrder.indexOf('cpe-qoe') >= chartOrder.length - 1}
        />
      ),
    },
  }), [chartOrder, chartHeights, sharedRange, handleHeightChange, isBrushHovered, moveChartByDirection, removeChartById]);

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
          />
        </div>

        {/* WAN Latency Chart - Main View */}
        <div>
          <WanLatencyChart 
            onMaximize={handleMaximize} 
            hideDrawer={true}
            onDataLoad={handleWanDataLoad}
          />
        </div>

        {/* CPE QoE Chart - Main View */}
        <div>
          <CpeQoeHistoryChart
            onMaximize={handleMaximize}
            hideDrawer={true}
            onDataLoad={handleCpeQoeDataLoad}
          />
        </div>
      </div>

      {/* Shared Drawer with Both Charts */}
      <ResizableChartDrawer
        open={isSharedDrawerOpen}
        onOpenChange={setIsSharedDrawerOpen}
        deviceName="C4000LG2117813461"
        deviceType="Router"
        deviceStatus="Online since 3d ago"
        deviceAvatar="/Images/router.png"
        chartTags={chartTags}
        onAddChart={() => console.log('Add chart clicked')}
        availableWidgets={availableWidgets}
        onWidgetSelect={handleWidgetSelect}
        defaultSize={60}
        minSize={40}
        maxSize={90}
        bottomContent={
          brushData.length > 0 ? (
            <SimplifiedBrush
              data={brushData}
              xKey="x"
              startIndex={sharedRange.startIndex}
              endIndex={sharedRange.endIndex}
              minSelectionPoints={6}
              maxSelectionPoints={24 * 15}
              onChange={handleBrushChange}
              onHoverChange={setIsBrushHovered}
            />
          ) : null
        }
      >
        <SyncedChartProvider syncEnabled={true}>
          <SharedAxisWidthProvider>
            <SortableChartContainer chartIds={chartOrder} onReorder={handleChartReorder}>
              {orderedCharts.map(chart => (
                <SortableChartItem key={chart.id} id={chart.id}>
                  {chart.component}
                </SortableChartItem>
              ))}
            </SortableChartContainer>
          </SharedAxisWidthProvider>
        </SyncedChartProvider>
      </ResizableChartDrawer>
    </>
  );
}
