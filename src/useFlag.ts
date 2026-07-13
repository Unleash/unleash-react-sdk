import { useCallback } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useFlagContext } from './useFlagContext';

const useFlag = (featureName: string): boolean => {
  const { isEnabled, client } = useFlagContext();

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

  const getSnapshot = () => isEnabled(featureName);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useFlag;
