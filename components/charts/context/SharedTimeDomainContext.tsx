import { createContext, useContext } from 'react';

export interface TimeDomain {
  start: Date;
  end: Date;
}

const SharedTimeDomainContext = createContext<TimeDomain | null>(null);

/**
 * Provides a shared time domain so all child charts generate
 * X-axis ticks with identical density and range.
 */
export const SharedTimeDomainProvider = SharedTimeDomainContext.Provider;

export function useSharedTimeDomain(): TimeDomain | null {
  return useContext(SharedTimeDomainContext);
}
