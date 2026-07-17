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

const selectToggles = (toggles: IToggle[]) => toggles;

const useFlags = (): IToggle[] => {
  const { client } = useFlagContext();

  const subscribeToUnleashClient = useUnleashClientSubscription(client);

  const getTogglesSnapshot = useCallback(
    () => client?.getAllToggles() ?? [],
    [client]
  );

  return useSyncExternalStoreWithSelector(
    subscribeToUnleashClient,
    getTogglesSnapshot,
    getTogglesSnapshot,
    selectToggles,
    togglesAreEqual
  );
};

export default useFlags;
