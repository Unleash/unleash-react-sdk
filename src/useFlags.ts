import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IToggle } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';
import variantsAreEqual from './variantsAreEqual';

const togglesAreEqual = (a: IToggle[], b: IToggle[]): boolean =>
  a.length === b.length &&
  a.every((toggle, index) => {
    const other = b[index];
    return (
      Boolean(other) &&
      toggle.name === other.name &&
      toggle.enabled === other.enabled &&
      variantsAreEqual(toggle.variant, other.variant)
    );
  });

const useFlags = (): IToggle[] => {
  const { client } = useFlagContext();

  const subscribe = useUnleashClientSubscription(client);

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
