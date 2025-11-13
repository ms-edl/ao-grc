import CombinedLatencyPage from './CombinedLatencyPage';
import { ThemeProvider } from './ThemeContext';
import { AnimatedThemeToggle } from './components/AnimatedThemeToggle';
import './styles.css';

export default function App() {
  return (
    <ThemeProvider>
      <div className="bg-surface-section min-h-screen">
        <div className="p-4 max-w-[1600px] mx-auto">
          <div className="flex justify-end items-center mb-6">
            {/* Theme Toggle */}
            <AnimatedThemeToggle />
          </div>

          {/* Chart Display - Centered */}
          <div className="flex justify-center">
            <CombinedLatencyPage />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

