/** @format */

export type {
  IConfig,
  IContext,
  IMutableContext,
  IToggle,
  IVariant,
} from 'unleash-proxy-client';
export {
  InMemoryStorageProvider,
  type IStorageProvider,
  LocalStorageProvider,
  UnleashClient,
} from 'unleash-proxy-client';

import FlagContext from './FlagContext';
import FlagProvider, { type IFlagProvider } from './FlagProvider';
import useFlag from './useFlag';
import useFlags from './useFlags';
import useFlagsStatus from './useFlagsStatus';
import useUnleashClient from './useUnleashClient';
import useUnleashContext from './useUnleashContext';
import useVariant from './useVariant';

export type { IFlagProvider };
export {
  FlagContext,
  FlagProvider,
  useFlag,
  useFlags,
  useFlagsStatus,
  useUnleashClient,
  useUnleashContext,
  useVariant,
};

export default FlagProvider;
