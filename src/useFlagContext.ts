import { useContext } from 'react';
import type { UnleashClient } from 'unleash-proxy-client';
import FlagContext, { type IFlagContextValue } from './FlagContext';

const methods = {
  on: (_event: string, _callback: Function, _ctx?: any): UnleashClient => {
    console.error('on() must be used within a FlagProvider');
    return mockUnleashClient;
  },
  off: (_event: string, _callback?: Function): UnleashClient => {
    console.error('off() must be used within a FlagProvider');
    return mockUnleashClient;
  },
  updateContext: async () => {
    console.error('updateContext() must be used within a FlagProvider');
    return undefined;
  },
  isEnabled: () => {
    console.error('isEnabled() must be used within a FlagProvider');
    return false;
  },
  getVariant: () => {
    console.error('getVariant() must be used within a FlagProvider');
    return { name: 'disabled', enabled: false };
  },
};

const mockUnleashClient = {
  ...methods,
  toggles: [],
  impressionDataAll: {},
  context: {},
  storage: {},
  start: () => {},
  stop: () => {},
  isReady: () => false,
  getError: () => null,
  getAllToggles: () => [],
} as unknown as UnleashClient;

const defaultContextValue: IFlagContextValue = {
  ...methods,
  client: mockUnleashClient,
  flagsReady: false,
  setFlagsReady: () => {
    console.error('setFlagsReady() must be used within a FlagProvider');
  },
  flagsError: null,
  setFlagsError: () => {
    console.error('setFlagsError() must be used within a FlagProvider');
  },
};

export function useFlagContext() {
  const context = useContext(FlagContext);
  if (!context) {
    console.error('useFlagContext() must be used within a FlagProvider');
    return defaultContextValue;
  }
  return context;
}
