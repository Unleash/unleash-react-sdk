import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useFlagContext } from './useFlagContext';
import useUnleashClientSubscription from './useUnleashClientSubscription';

const useFlag = (featureName: string): boolean => {
  const { isEnabled, client } = useFlagContext();

  const subscribe = useUnleashClientSubscription(client);

  const getSnapshot = () => isEnabled(featureName);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useFlag;
