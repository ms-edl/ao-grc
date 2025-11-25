import React, { useState } from 'react';
import { ChartDrawerContent } from './ChartDrawerContent';
import ChartDrawerHeader from './ChartDrawerHeader';
import { ChartDrawerLegend, DrawerLegendItem, DrawerLegendSectionItem } from './ChartDrawerLegend';
import { MetricButton } from './ChartHeader';
import { AoBtnFilter } from './ui/ao-btn-filter';
import { Icon } from './ui/icons';

/**
 * Example integration showing how to use the new drawer layout components
 * 
 * This example demonstrates:
 * 1. ChartDrawerHeader with Min/Avg/Max toggles
 * 2. ChartDrawerContent with 2-column layout
 * 3. ChartDrawerLegend with styled items
 */
export function ChartDrawerExample() {
  const [selectedMetrics, setSelectedMetrics] = useState<('min' | 'avg' | 'max')[]>(['avg']);
  const [hiddenDevices, setHiddenDevices] = useState<Set<string>>(new Set());
  const [hiddenBands, setHiddenBands] = useState<Set<string>>(new Set());
  
  // Example data items
  const dataItems: DrawerLegendItem[] = [
    {
      id: 'device-1',
      label: 'WNC DT-EXT03A-WNC',
      color: '#D1EC1C',
      min: '18.1ms',
      avg: '24.5ms',
      max: '31.4ms',
      isHidden: hiddenDevices.has('device-1'),
    },
    {
      id: 'device-2',
      label: 'Lenovo',
      color: '#FF8A3D',
      min: '18.1ms',
      avg: '21.2ms',
      max: '31.4ms',
      isHidden: hiddenDevices.has('device-2'),
    },
  ];
  
  // Example section items (band types)
  const sectionItems: DrawerLegendSectionItem[] = [
    {
      id: 'band-24',
      label: '2.4GHz',
      isHidden: hiddenBands.has('band-24'),
    },
    {
      id: 'band-5',
      label: '5GHz',
      dashArray: '8 6',
      isHidden: hiddenBands.has('band-5'),
    },
  ];
  
  const handleToggleDevice = (id: string) => {
    const newHiddenDevices = new Set(hiddenDevices);
    if (newHiddenDevices.has(id)) {
      newHiddenDevices.delete(id);
    } else {
      newHiddenDevices.add(id);
    }
    setHiddenDevices(newHiddenDevices);
  };
  
  const handleToggleBand = (id: string) => {
    const newHiddenBands = new Set(hiddenBands);
    if (newHiddenBands.has(id)) {
      newHiddenBands.delete(id);
    } else {
      newHiddenBands.add(id);
    }
    setHiddenBands(newHiddenBands);
  };
  
  return (
    <ChartDrawerContent
      sidebar={
        <ChartDrawerLegend
          dataItems={dataItems}
          sectionItems={sectionItems}
          onToggleDataItem={handleToggleDevice}
          onToggleSectionItem={handleToggleBand}
        />
      }
    >
      {/* Header */}
      <ChartDrawerHeader
        title="Client history"
        metricButton={
          <MetricButton
            label="Latency"
            onClick={() => console.log('Open metric selector')}
          />
        }
        selectedMetrics={selectedMetrics}
        onMetricsChange={setSelectedMetrics}
        actions={
          <>
            <AoBtnFilter
              icon={<Icon name="wifi" size={16} />}
              label="3/3"
              isActive={false}
              onClick={() => console.log('Filter WiFi')}
            />
            <AoBtnFilter
              icon={<Icon name="monitor" size={16} />}
              label="2/11"
              isActive={false}
              onClick={() => console.log('Filter devices')}
            />
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-action hover:bg-surface-action-hover transition-colors text-content-primary"
              onClick={() => console.log('More options')}
            >
              <Icon name="more-vertical" size={16} />
            </button>
          </>
        }
      />
      
      {/* Chart Content */}
      <div className="flex-1 flex items-center justify-center mt-6 bg-surface-action rounded-lg">
        <span className="text-content-tertiary">Chart goes here</span>
      </div>
    </ChartDrawerContent>
  );
}

