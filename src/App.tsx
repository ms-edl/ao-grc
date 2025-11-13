import { useState } from 'react';
import LatencyPage from './LatencyPage';
import WanLatencyPage from './WanLatencyPage';
import { ThemeProvider } from './ThemeContext';
import { AnimatedThemeToggle } from './components/AnimatedThemeToggle';
import './styles.css';

export default function App() {
  const [activeChart, setActiveChart] = useState<'client' | 'wan'>('client');

  return (
    <ThemeProvider>
      <div className="bg-surface-section min-h-screen">
        <div className="p-4 max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-6">
            {/* Chart Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveChart('client')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeChart === 'client'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-surface-tile text-content-primary hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Client Latency
              </button>
              <button
                onClick={() => setActiveChart('wan')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeChart === 'wan'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-surface-tile text-content-primary hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                WAN Latency
              </button>
            </div>

            {/* Theme Toggle */}
            <AnimatedThemeToggle />
          </div>

          {/* Chart Display */}
          <div className="flex justify-center">
            {activeChart === 'client' ? <LatencyPage /> : <WanLatencyPage />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

