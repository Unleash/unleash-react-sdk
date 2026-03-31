import { useEffect, useState } from 'react';
import { useFlagContext } from './useFlagContext';

const useFlags = () => {
  const { client } = useFlagContext();
  const [flags, setFlags] = useState(client.getAllToggles());

  useEffect(() => {
    const onUpdate = () => {
      setFlags(client.getAllToggles());
    };

    client.on('update', onUpdate);

    return () => {
      client.off('update', onUpdate);
    };
  }, [client.getAllToggles]);

  return flags;
};

export default useFlags;
