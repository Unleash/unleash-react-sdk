import { useEffect, useRef, useState } from 'react';
import { useFlagContext } from './useFlagContext';

const useFlag = (featureName: string) => {
  const { isEnabled, client } = useFlagContext();
  const [flag, setFlag] = useState(!!isEnabled(featureName));
  const flagRef = useRef<typeof flag>();
  flagRef.current = flag;

  useEffect(() => {
    if (!client) return;

    const updateHandler = () => {
      const enabled = isEnabled(featureName);
      if (enabled !== flagRef.current) {
        flagRef.current = enabled;
        setFlag(!!enabled);
      }
    };

    const readyHandler = () => {
      const enabled = isEnabled(featureName);
      flagRef.current = enabled;
      setFlag(enabled);
    };

    client.on('update', updateHandler);
    client.on('ready', readyHandler);

    return () => {
      client.off('update', updateHandler);
      client.off('ready', readyHandler);
    };
  }, [client]);

  return flag;
};

export default useFlag;
