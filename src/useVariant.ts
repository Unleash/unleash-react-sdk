import { useEffect, useRef, useState } from 'react';
import type { IVariant } from 'unleash-proxy-client';
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

  const [variant, setVariant] = useState(getVariant(featureName));
  const variantRef = useRef<typeof variant>({
    name: variant.name,
    enabled: variant.enabled,
  });
  variantRef.current = variant;

  useEffect(() => {
    if (!client) return;

    const updateHandler = () => {
      const newVariant = getVariant(featureName);
      if (variantHasChanged(variantRef.current, newVariant)) {
        setVariant(newVariant);
        variantRef.current = newVariant;
      }
    };

    const readyHandler = () => {
      const variant = getVariant(featureName);
      variantRef.current.name = variant?.name;
      variantRef.current.enabled = variant?.enabled;
      setVariant(variant);
    };

    client.on('update', updateHandler);
    client.on('ready', readyHandler);

    return () => {
      client.off('update', updateHandler);
      client.off('ready', readyHandler);
    };
  }, [client]);

  return variant || {};
};

export default useVariant;
