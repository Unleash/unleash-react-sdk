import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IVariant } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';

export const variantHasChanged = (
    oldVariant: IVariant,
    newVariant?: IVariant,
): boolean => {
    const variantsAreEqual =
        oldVariant.name === newVariant?.name &&
        oldVariant.enabled === newVariant?.enabled &&
        oldVariant.feature_enabled === newVariant?.feature_enabled &&
        oldVariant.payload?.type === newVariant?.payload?.type &&
        oldVariant.payload?.value === newVariant?.payload?.value;

    return !variantsAreEqual;
};

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
    (value) => value,
    (a, b) => !variantHasChanged(a, b)
  );

  return variant || {};
};

export default useVariant;
