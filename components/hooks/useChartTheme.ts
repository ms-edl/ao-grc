import { useEffect, useState } from 'react';

export type ChartTheme = 'light' | 'dark';

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>('light');
  
  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark') || 
                     root.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'dark' : 'light');
    };
    
    // Initial theme
    updateTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    });
    
    return () => observer.disconnect();
  }, []);

  return theme;
}

