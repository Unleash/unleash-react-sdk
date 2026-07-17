import type { IVariant } from 'unleash-proxy-client';

const variantsAreEqual = (
  first?: IVariant,
  second?: IVariant
): boolean =>
  first?.name === second?.name &&
  first?.enabled === second?.enabled &&
  first?.feature_enabled === second?.feature_enabled &&
  first?.payload?.type === second?.payload?.type &&
  first?.payload?.value === second?.payload?.value;

export default variantsAreEqual;
