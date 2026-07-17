import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IVariant } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';
import variantsAreEqual from './variantsAreEqual';

const selectVariant = (variant: IVariant) => variant;

const useVariant = (featureName: string): Partial<IVariant> => {
  const { getVariant, client } = useFlagContext();

  const subscribeToUnleashClient = useUnleashClientSubscription(client);

  const getVariantSnapshot = useCallback(
    () => getVariant(featureName),
    [getVariant, featureName]
  );

  const variant = useSyncExternalStoreWithSelector(
    subscribeToUnleashClient,
    getVariantSnapshot,
    getVariantSnapshot,
    selectVariant,
    variantsAreEqual
  );

  return variant || {};
};

export default useVariant;
