import { useState } from 'react';
import MultiDeviceLatencyChart from '../components/MultiDeviceLatencyChart';
import WanLatencyChart from '../components/WanLatencyChart';
import { ResizableChartDrawer } from '../components/ui/resizable-chart-drawer';

/**
 * CombinedLatencyPage
 * 
 * Displays both the Client Latency (MultiDevice) and WAN Latency charts
 * in a single page with a shared resizable drawer.
 * 
 * When the maximize button is clicked on either chart, a shared drawer
 * opens displaying both charts together.
 */
export default function CombinedLatencyPage() {
  const [isSharedDrawerOpen, setIsSharedDrawerOpen] = useState(false);

  const handleMaximize = () => {
    setIsSharedDrawerOpen(true);
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-6">
        {/* Client Latency Chart - Main View */}
        <div>
          <MultiDeviceLatencyChart onMaximize={handleMaximize} hideDrawer={true} />
        </div>

        {/* WAN Latency Chart - Main View */}
        <div>
          <WanLatencyChart onMaximize={handleMaximize} hideDrawer={true} />
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
      >
        <div className="space-y-8 p-6">
          {/* Client Latency Chart in Drawer */}
          <div>
            <MultiDeviceLatencyChart hideDrawer={true} variant="drawer" />
          </div>

          {/* WAN Latency Chart in Drawer */}
          <div>
            <WanLatencyChart hideDrawer={true} variant="drawer" />
          </div>
        </div>
      </ResizableChartDrawer>
    </>
  );
}
