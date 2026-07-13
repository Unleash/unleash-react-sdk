import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IToggle } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';

const togglesAreEqual = (a: IToggle[], b: IToggle[]): boolean =>
  a.length === b.length &&
  a.every((toggle, index) => {
    const other = b[index];
    return (
      Boolean(other) &&
      toggle.name === other.name &&
      toggle.enabled === other.enabled &&
      toggle.variant?.name === other.variant?.name &&
      toggle.variant?.enabled === other.variant?.enabled &&
      toggle.variant?.feature_enabled === other.variant?.feature_enabled &&
      toggle.variant?.payload?.type === other.variant?.payload?.type &&
      toggle.variant?.payload?.value === other.variant?.payload?.value
    );
  });

const useFlags = (): IToggle[] => {
  const { client } = useFlagContext();

  const subscribe = useCallback(
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

  const getSnapshot = useCallback(
    () => client?.getAllToggles() ?? [],
    [client]
  );

  return useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    (toggles) => toggles,
    togglesAreEqual
  );
};

export default useFlags;
