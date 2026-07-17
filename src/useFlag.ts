import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';

const useFlag = (featureName: string): boolean => {
  const { isEnabled, client } = useFlagContext();

  const subscribeToUnleashClient = useUnleashClientSubscription(client);

  const getFlagSnapshot = () => isEnabled(featureName);

  return useSyncExternalStore(
    subscribeToUnleashClient,
    getFlagSnapshot,
    getFlagSnapshot
  );
};

export default useFlag;
