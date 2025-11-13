/**
 * Calculate a "nice" number for axis scaling
 * Uses a smart algorithm to find numbers that provide even intervals
 * Based on the "nice numbers" algorithm used in D3.js and other charting libraries
 * 
 * @param value - The value to round up to a nice number
 * @param desiredTicks - Desired number of tick marks (default: 5)
 * @returns A nice number that's >= value
 */
export function niceNumber(value: number, desiredTicks: number = 5): number {
  if (value <= 0) return 10;
  
  // Calculate rough step size for desired number of ticks
  const roughStep = value / desiredTicks;
  
  // Find the order of magnitude
  // Handle very small values (less than 1) by using negative magnitudes
  const magnitude = Math.floor(Math.log10(roughStep));
  const magnitudeFactor = Math.pow(10, magnitude);
  
  // Expanded nice step values for better interval options
  // Includes: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
  // This allows for more flexible intervals like 7, 8, etc.
  // We use a more nuanced approach: try to find the step that gives us
  // the closest result to the desired number of ticks
  const niceSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  let bestMax = Infinity;
  let bestTickCount = 0;
  
  // Try each nice step and find the one that gives us the best result
  for (const step of niceSteps) {
    const stepSize = step * magnitudeFactor;
    const max = Math.ceil(value / stepSize) * stepSize;
    const tickCount = max / stepSize;
    
    // Prefer steps that:
    // 1. Are >= value (must be above)
    // 2. Give us close to desiredTicks (within reason)
    // 3. Minimize wasted space (smaller max is better)
    if (max >= value) {
      const tickDiff = Math.abs(tickCount - desiredTicks);
      const bestTickDiff = Math.abs(bestTickCount - desiredTicks);
      
      // If this gives us a better tick count match, or same match but smaller max
      if (tickDiff < bestTickDiff || (tickDiff === bestTickDiff && max < bestMax)) {
        bestMax = max;
        bestTickCount = tickCount;
      }
    }
  }
  
  return bestMax;
}

/**
 * Calculate Y-axis domain from data, filtering by visible items
 * Uses smart "nice numbers" algorithm for optimal space usage with even intervals
 * 
 * @param data - Full dataset
 * @param visibleKeys - Array of data keys that are currently visible (e.g., only visible metrics/devices)
 * @param roundUpToNice - Optional function to round up to nice numbers (defaults to niceNumber algorithm)
 * @param desiredTicks - Desired number of tick marks for nice number calculation (default: 5)
 * @returns Domain tuple [min, max]
 */
export function calculateYAxisDomain(
  data: any[],
  visibleKeys: string[],
  roundUpToNice?: (val: number) => number,
  desiredTicks: number = 5
): [number, number] {
  let max = 0;
  let min = Infinity;
  
  for (const row of data) {
    for (const key of visibleKeys) {
      const val = row[key];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        max = Math.max(max, val);
        min = Math.min(min, val);
      }
    }
  }
  
  // If no valid data, return default domain
  if (min === Infinity || max === 0) {
    return [0, 10];
  }
  
  // Use nice number algorithm by default
  const roundFn = roundUpToNice || ((val: number) => niceNumber(val, desiredTicks));
  max = roundFn(max);
  
  // If minimum is >= 10, don't start from 0 - start from a nice number below the minimum
  let domainMin = 0;
  if (min >= 10) {
    // Calculate a nice minimum value below the actual minimum
    // Round down to a nice number (e.g., if min is 15, start from 10; if min is 25, start from 20)
    const roughStep = (max - min) / desiredTicks;
    const magnitude = Math.floor(Math.log10(roughStep));
    const magnitudeFactor = Math.pow(10, magnitude);
    const normalizedStep = roughStep / magnitudeFactor;
    
    // Choose a nice step size
    let niceStep = 1;
    if (normalizedStep <= 1) niceStep = 1;
    else if (normalizedStep <= 2) niceStep = 2;
    else if (normalizedStep <= 5) niceStep = 5;
    else niceStep = 10;
    
    const stepSize = niceStep * magnitudeFactor;
    // Round down to the nearest step below the minimum
    domainMin = Math.floor(min / stepSize) * stepSize;
    // Ensure we don't go below 0, but if min is >= 10, we can safely go below it
    domainMin = Math.max(0, domainMin);
  } else {
    // For values < 10, use 0 as minimum
    domainMin = 0;
  }
  
  // For very small values (less than 1), use a smaller minimum
  // This allows decimal-level precision for metrics like packet loss
  if (max < 1) {
    domainMin = 0;
  } else if (max < 10) {
    domainMin = Math.max(0, Math.min(domainMin, max * 0.1));
  }
  
  return [domainMin, Math.max(domainMin + 1, max)];
}

/**
 * Calculate Y-axis domain from data, using device IDs directly
 * Useful for client chart where devices are stored as direct keys in rows
 * Uses smart "nice numbers" algorithm for optimal space usage with even intervals
 * 
 * @param data - Full dataset
 * @param visibleDeviceIds - Array of device IDs that are currently visible
 * @param roundUpToNice - Optional function to round up to nice numbers (defaults to niceNumber algorithm)
 * @param desiredTicks - Desired number of tick marks for nice number calculation (default: 5)
 * @returns Domain tuple [min, max]
 */
export function calculateYAxisDomainFromDevices(
  data: any[],
  visibleDeviceIds: string[],
  roundUpToNice?: (val: number) => number,
  desiredTicks: number = 4
): [number, number] {
  let max = 0;
  let min = Infinity;
  
  for (const row of data) {
    for (const deviceId of visibleDeviceIds) {
      const val = (row as any)[deviceId];
      if (typeof val === 'number' && !Number.isNaN(val)) {
        max = Math.max(max, val);
        min = Math.min(min, val);
      }
    }
  }
  
  // If no valid data, return default domain
  if (min === Infinity || max === 0) {
    return [0, 10];
  }
  
  // Use nice number algorithm by default
  const roundFn = roundUpToNice || ((val: number) => niceNumber(val, desiredTicks));
  max = roundFn(max);
  
  // If minimum is >= 10, don't start from 0 - start from a nice number below the minimum
  let domainMin = 0;
  if (min >= 10) {
    // Calculate a nice minimum value below the actual minimum
    // Round down to a nice number (e.g., if min is 15, start from 10; if min is 25, start from 20)
    const roughStep = (max - min) / desiredTicks;
    const magnitude = Math.floor(Math.log10(roughStep));
    const magnitudeFactor = Math.pow(10, magnitude);
    const normalizedStep = roughStep / magnitudeFactor;
    
    // Choose a nice step size
    let niceStep = 1;
    if (normalizedStep <= 1) niceStep = 1;
    else if (normalizedStep <= 2) niceStep = 2;
    else if (normalizedStep <= 5) niceStep = 5;
    else niceStep = 10;
    
    const stepSize = niceStep * magnitudeFactor;
    // Round down to the nearest step below the minimum
    domainMin = Math.floor(min / stepSize) * stepSize;
    // Ensure we don't go below 0, but if min is >= 10, we can safely go below it
    domainMin = Math.max(0, domainMin);
  } else {
    // For values < 10, use 0 as minimum
    domainMin = 0;
  }
  
  // For very small values (less than 1), use a smaller minimum
  // This allows decimal-level precision for metrics like packet loss
  if (max < 1) {
    domainMin = 0;
  } else if (max < 10) {
    domainMin = Math.max(0, Math.min(domainMin, max * 0.1));
  }
  
  return [domainMin, Math.max(domainMin + 1, max)];
}

/**
 * Calculate nice tick values for a Y-axis domain
 * Generates evenly spaced tick values based on the domain
 * 
 * @param domain - Domain tuple [min, max]
 * @param desiredTicks - Desired number of tick marks (default: 5)
 * @returns Array of tick values
 */
export function calculateNiceTicks(domain: [number, number], desiredTicks: number = 5): number[] {
  const [min, max] = domain;
  const range = max - min;
  
  if (range <= 0) {
    return [min, max];
  }
  
  // Calculate rough step size
  const roughStep = range / desiredTicks;
  
  // Find the order of magnitude
  const magnitude = Math.floor(Math.log10(roughStep));
  const magnitudeFactor = Math.pow(10, magnitude);
  const normalizedStep = roughStep / magnitudeFactor;
  
  // Choose a nice step size
  let niceStep = 1;
  if (normalizedStep <= 1) niceStep = 1;
  else if (normalizedStep <= 2) niceStep = 2;
  else if (normalizedStep <= 5) niceStep = 5;
  else niceStep = 10;
  
  const stepSize = niceStep * magnitudeFactor;
  
  // Generate ticks starting from a nice number >= min
  const startTick = Math.ceil(min / stepSize) * stepSize;
  const ticks: number[] = [];
  
  // Add min if it's not already included
  if (min < startTick - stepSize * 0.01) {
    ticks.push(min);
  }
  
  // Generate ticks at even intervals
  for (let tick = startTick; tick <= max + stepSize * 0.01; tick += stepSize) {
    ticks.push(tick);
  }
  
  // Add max if it's not already included
  if (max > ticks[ticks.length - 1] + stepSize * 0.01) {
    ticks.push(max);
  }
  
  // Remove duplicates and sort
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}
