import { useState, useCallback, useEffect } from 'react';
import MultiDeviceLatencyChart from '../components/MultiDeviceLatencyChart';
import WanLatencyChart from '../components/WanLatencyChart';
import { ResizableChartDrawer } from '../components/ui/resizable-chart-drawer';
import { SyncedChartProvider } from '../components/SyncedChartContext';
import { SimplifiedBrush } from '../components/SimplifiedBrush';

/**
 * CombinedLatencyPage
 * 
 * Displays both the Client Latency (MultiDevice) and WAN Latency charts
 * in a single page with a shared resizable drawer.
 * 
 * When the maximize button is clicked on either chart, a shared drawer
 * opens displaying both charts together with a unified brush control.
 */
export default function CombinedLatencyPage() {
  const [isSharedDrawerOpen, setIsSharedDrawerOpen] = useState(false);
  
  // Track data lengths for global brush
  const [multiDeviceDataLength, setMultiDeviceDataLength] = useState(0);
  const [wanDataLength, setWanDataLength] = useState(0);
  const [multiDeviceData, setMultiDeviceData] = useState<any[]>([]);
  const [wanData, setWanData] = useState<any[]>([]);
  
  // Shared range state for drawer
  const maxDataLength = Math.max(multiDeviceDataLength, wanDataLength);
  const [sharedRange, setSharedRange] = useState<{ startIndex: number; endIndex: number }>({
    startIndex: 0,
    endIndex: Math.max(0, Math.min(24 * 7 - 1, maxDataLength - 1))
  });

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

  const handleMaximize = () => {
    setIsSharedDrawerOpen(true);
  };

  const handleBrushChange = useCallback((range: { startIndex: number; endIndex: number }) => {
    setSharedRange(range);
  }, []);

  // Use the longer dataset for brush visualization
  const brushData = multiDeviceDataLength >= wanDataLength ? multiDeviceData : wanData;

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
      </div>

      {/* Shared Drawer with Both Charts */}
      <ResizableChartDrawer
        open={isSharedDrawerOpen}
        onOpenChange={setIsSharedDrawerOpen}
        title="Graph Studio"
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
            />
          ) : null
        }
      >
        <SyncedChartProvider syncEnabled={true}>
          <div className="space-y-8">
            {/* Client Latency Chart in Drawer */}
            <div>
              <MultiDeviceLatencyChart 
                hideDrawer={true} 
                variant="drawer" 
                enableSync={true}
                sharedRange={sharedRange}
              />
            </div>

            {/* WAN Latency Chart in Drawer */}
            <div>
              <WanLatencyChart 
                hideDrawer={true} 
                variant="drawer" 
                enableSync={true}
                sharedRange={sharedRange}
              />
            </div>
          </div>
        </SyncedChartProvider>
      </ResizableChartDrawer>
    </>
  );
}
