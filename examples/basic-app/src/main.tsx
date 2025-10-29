import React from 'react';
import ReactDOM from 'react-dom/client';
import FlagProvider from '@unleash/proxy-client-react';
import type { IConfig } from 'unleash-proxy-client';

import App from './App';

const requiredOption = (value: string | undefined, envKey: string): string => {
  if (!value) {
    throw new Error(
      `Missing configuration: set ${envKey} in your .env file.`
    );
  }
  return value;
};

const refreshInterval = Number(import.meta.env.VITE_UNLEASH_REFRESH_INTERVAL ?? 15);
const defaultUserId = import.meta.env.VITE_EXAMPLE_DEFAULT_USER ?? 'guest';

const config: IConfig = {
  url: requiredOption(import.meta.env.VITE_UNLEASH_URL, 'VITE_UNLEASH_URL'),
  clientKey: requiredOption(import.meta.env.VITE_UNLEASH_CLIENT_KEY, 'VITE_UNLEASH_CLIENT_KEY'),
  appName: import.meta.env.VITE_UNLEASH_APP_NAME ?? 'react-example-app',
  refreshInterval: Number.isFinite(refreshInterval) ? refreshInterval : 15,
  environment: import.meta.env.VITE_UNLEASH_ENVIRONMENT,
  context: { userId: defaultUserId }
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element with id "root" was not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <FlagProvider config={config}>
      <App />
    </FlagProvider>
  </React.StrictMode>
);
