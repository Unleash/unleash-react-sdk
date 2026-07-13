import { useCallback } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';
import { IVariant } from 'unleash-proxy-client';
import { useFlagContext } from './useFlagContext';

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
