import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IVariant } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';
import variantsAreEqual from './variantsAreEqual';

const useVariant = (featureName: string): Partial<IVariant> => {
  const { getVariant, client } = useFlagContext();

  const subscribe = useUnleashClientSubscription(client);

  const getSnapshot = useCallback(
    () => getVariant(featureName),
    [getVariant, featureName]
  );

  const variant = useSyncExternalStoreWithSelector(
    subscribe,
    getSnapshot,
    getSnapshot,
    (variant) => variant,
    variantsAreEqual
  );

  return variant || {};
};

export default useVariant;
