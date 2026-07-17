import { useCallback } from 'react';
import type { UnleashClient } from 'unleash-proxy-client';

const useUnleashClientSubscription = (client?: UnleashClient) =>
  useCallback(
    (onStoreChange: () => void) => {
      if (!client) return () => {};

      client.on('update', onStoreChange);
      client.on('ready', onStoreChange);

      return () => {
        client.off('update', onStoreChange);
        client.off('ready', onStoreChange);
      };
    },
    [client]
  );

export default useUnleashClientSubscription;
