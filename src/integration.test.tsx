import React, { useLayoutEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EVENTS, IToggle, UnleashClient } from 'unleash-proxy-client';
import FlagProvider from './FlagProvider';
import useFlagsStatus from './useFlagsStatus';
import { act } from 'react-dom/test-utils';
import useFlag from './useFlag';
import { useFlagContext } from './useFlagContext';
import useVariant from './useVariant';
import useFlags from './useFlags';

const fetchMock = vi.fn(async () => {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({}),
    json: () => {
      return Promise.resolve({
        toggles: [
          {
            name: 'test-flag',
            enabled: true,
            variant: {
              name: 'A',
              payload: { type: 'string', value: 'A' },
              enabled: true,
            },
          },
        ],
      });
    },
  });
});

test('should render toggles', async () => {
  const client = new UnleashClient({
    url: 'http://localhost:4242/api/frontend',
    appName: 'test',
    clientKey: 'test',
    fetch: fetchMock,
  });

  const TestComponent = () => {
    const { flagsReady } = useFlagsStatus();
    const state = useFlag('test-flag');
    const variant = useVariant('test-flag');

    return (
      <>
        <div data-testid="ready">{flagsReady.toString()}</div>
        <div data-testid="state">{state.toString()}</div>
        <div data-testid="variant">{JSON.stringify(variant)}</div>
      </>
    );
  };

  const ui = (
    <FlagProvider unleashClient={client}>
      <TestComponent />
    </FlagProvider>
  );

  const { rerender } = render(ui);

  // Before client initialization
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByTestId('ready')).toHaveTextContent('false');
  expect(screen.getByTestId('state')).toHaveTextContent('false');
  expect(screen.getByTestId('variant')).toHaveTextContent('false');

  // Wait for client initialization
  await act(
    () =>
      new Promise((resolve) => {
        client.on(EVENTS.READY, () => {
          setTimeout(resolve, 1);
        });
      })
  );

  // After client initialization
  expect(fetchMock).toHaveBeenCalled();
  rerender(ui);
  expect(screen.getByTestId('ready')).toHaveTextContent('true');
  expect(screen.getByTestId('state')).toHaveTextContent('true');
  expect(screen.getByTestId('variant')).toHaveTextContent(
    '{"name":"A","payload":{"type":"string","value":"A"},"enabled":true,"feature_enabled":true}'
  );
});

test('should be ready from the start if bootstrapped', () => {
  const Component = React.memo(() => {
    const { flagsReady } = useFlagContext();

    return <>{flagsReady ? 'ready' : ''}</>;
  });

  render(
    <FlagProvider
      config={{
        url: 'http://localhost:4242/api/frontend',
        appName: 'test',
        clientKey: 'test',
        bootstrap: [
          {
            name: 'test',
            enabled: true,
            variant: {
              name: 'A',
              enabled: true,
              payload: { type: 'string', value: 'A' },
            },
            impressionData: false,
          },
        ],
        fetch: fetchMock,
      }}
      startClient={false}
    >
      <Component />
    </FlagProvider>
  );

  expect(screen.getByText('ready')).toBeInTheDocument();
});

test('should immediately return value if boostrapped', () => {
  const Component = () => {
    const enabled = useFlag('test-flag');

    return <>{enabled ? 'enabled' : ''}</>;
  };

  render(
    <FlagProvider
      config={{
        url: 'http://localhost:4242/api/frontend',
        appName: 'test',
        clientKey: 'test',
        bootstrap: [
          {
            name: 'test-flag',
            enabled: true,
            variant: {
              name: 'A',
              enabled: true,
              payload: { type: 'string', value: 'A' },
            },
            impressionData: false,
          },
        ],
        fetch: fetchMock,
      }}
      startClient={false}
    >
      <Component />
    </FlagProvider>
  );

  expect(screen.queryByText('enabled')).toBeInTheDocument();
});

test('should render limited times when bootstrapped', async () => {
  let renders = 0;
  const config = {
    url: 'http://localhost:4242/api/frontend',
    appName: 'test',
    clientKey: 'test',
    bootstrap: [
      {
        name: 'test-flag',
        enabled: true,
        variant: {
          name: 'A',
          enabled: true,
          payload: { type: 'string', value: 'A' },
        },
        impressionData: false,
      },
    ],
    fetch: fetchMock,
  };
  const client = new UnleashClient(config);

  const Component = () => {
    const enabled = useFlag('test-flag');
    const { flagsReady } = useFlagContext();

    renders += 1;

    return (
      <>
        <span>{flagsReady ? 'flagsReady' : ''}</span>
        <span>{enabled ? 'enabled' : ''}</span>
      </>
    );
  };

  render(
    <FlagProvider unleashClient={client} config={config}>
      <Component />
    </FlagProvider>
  );

  expect(screen.queryByText('enabled')).toBeInTheDocument();
  expect(screen.queryByText('flagsReady')).toBeInTheDocument();
  expect(renders).toBe(1);

  // Wait for client initialization
  await act(
    () =>
      new Promise((resolve) => {
        client.on(EVENTS.READY, () => {
          setTimeout(resolve, 1);
        });
      })
  );

  expect(renders).toBe(1);
});

test('should resolve values before setting flagsReady', async () => {
  const client = new UnleashClient({
    url: 'http://localhost:4242/api/frontend',
    appName: 'test',
    clientKey: 'test',
    fetch: fetchMock,
  });
  let renders = 0;

  const Component = () => {
    const enabled = useFlag('test-flag');
    const { flagsReady } = useFlagContext();

    renders += 1;

    return (
      <>
        <span>{flagsReady ? 'flagsReady' : ''}</span>
        <span>{enabled ? 'enabled' : ''}</span>
      </>
    );
  };

  const ui = (
    <FlagProvider unleashClient={client}>
      <Component />
    </FlagProvider>
  );

  render(ui);
  expect(renders).toBe(1);
  expect(screen.queryByText('flagsReady')).not.toBeInTheDocument();
  expect(screen.queryByText('enabled')).not.toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText('enabled')).toBeInTheDocument();
    expect(screen.queryByText('flagsReady')).toBeNull();
    expect(renders).toBe(2);
  });
  await waitFor(() => {
    expect(screen.queryByText('flagsReady')).toBeInTheDocument();
    expect(screen.queryByText('enabled')).toBeInTheDocument();
    expect(renders).toBe(3);
  });
});

test('should update useFlag when ready/update fires between render and effect', () => {
  const client = createFakeClient();

  const Component = () => {
    const enabled = useFlag('test-flag');

    return <div data-testid="state">{enabled.toString()}</div>;
  };

  render(
    <FlagProvider
      unleashClient={client as unknown as UnleashClient}
      startClient={false}
    >
      <ResolveFetchDuringCommit client={client} />
      <Component />
    </FlagProvider>
  );

  expect(screen.getByTestId('state')).toHaveTextContent('true');
});

test('should update useVariant when ready/update fires between render and effect', () => {
  const client = createFakeClient();

  const Component = () => {
    const variant = useVariant('test-flag');

    return <div data-testid="variant">{variant.name}</div>;
  };

  render(
    <FlagProvider
      unleashClient={client as unknown as UnleashClient}
      startClient={false}
    >
      <ResolveFetchDuringCommit client={client} />
      <Component />
    </FlagProvider>
  );

  expect(screen.getByTestId('variant')).toHaveTextContent('A');
});

type FakeClient = Pick<
  UnleashClient,
  | 'isEnabled'
  | 'getVariant'
  | 'getAllToggles'
  | 'updateContext'
  | 'start'
  | 'stop'
  | 'isReady'
  | 'getError'
> & {
  // On the real client, these methods return `this`.
  // It is hard to simulate in this fake client, so we return `void` instead.
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
  // Test-only: allows us to simulate the client's first fetch resolving.
  resolveFirstFetch: () => void;
};

const testToggle: IToggle = {
  name: 'test-flag',
  enabled: true,
  variant: {
    name: 'A',
    enabled: true,
    feature_enabled: true,
    payload: { type: 'string', value: 'A' },
  },
  impressionData: false,
};

const createEventEmitter = () => {
  const callbacks: Record<string, Array<() => void>> = {};

  return {
    on(event: string, callback: () => void) {
      const current = callbacks[event] ?? [];
      callbacks[event] = [...current, callback];
    },
    off(event: string, callback: () => void) {
      const current = callbacks[event] ?? [];
      callbacks[event] = current.filter((cb) => cb !== callback);
    },
    emit(event: string) {
      const current = callbacks[event] ?? [];
      current.forEach((callback) => callback());
    },
  };
};

const createFakeClient = (): FakeClient => {
  const events = createEventEmitter();
  let toggles: IToggle[] = [];

  return {
    on: events.on,
    off: events.off,
    isEnabled: (name) => Boolean(toggles.find((t) => t.name === name)?.enabled),
    getVariant: (name) =>
      toggles.find((t) => t.name === name)?.variant ?? {
        name: 'disabled',
        enabled: false,
      },
    getAllToggles: () => toggles,
    updateContext: async () => {},
    start: async () => {},
    stop: () => {},
    isReady: () => false,
    getError: () => null,
    resolveFirstFetch: () => {
      // Set the toggles before emitting, so a listener that re-reads flag state
      // while handling the event sees them — the same order the real client uses.
      toggles = [testToggle];
      events.emit('update');
      events.emit('ready');
    },
  };
};

// Fires "first fetch resolved" from a layout effect, so the client emits
// ready/update after the hook has rendered but before its passive effect
// subscribes — the exact render-vs-effect gap that triggers the bug.
const ResolveFetchDuringCommit = ({ client }: { client: FakeClient }) => {
  useLayoutEffect(() => {
    client.resolveFirstFetch();
  }, [client]);
  return null;
};

test('should update useFlags when update fires between render and effect', () => {
  const client = createFakeClient();

  const Component = () => {
    const flags = useFlags();

    return <div data-testid="count">{flags.length.toString()}</div>;
  };

  render(
    <FlagProvider
      unleashClient={client as unknown as UnleashClient}
      startClient={false}
    >
      <ResolveFetchDuringCommit client={client} />
      <Component />
    </FlagProvider>
  );

  // The toggle arrived before the hook subscribed, so it must re-read to reach a
  // count of 1 rather than stay on its empty initial list.
  expect(screen.getByTestId('count')).toHaveTextContent('1');
});

test('should update useFlag when the featureName argument changes', () => {
  const client = new UnleashClient({
    url: 'http://localhost:4242/api/frontend',
    appName: 'test',
    clientKey: 'test',
    fetch: fetchMock,
    bootstrap: [
      {
        name: 'enabled-flag',
        enabled: true,
        variant: {
          name: 'A',
          enabled: true,
          payload: { type: 'string', value: 'A' },
        },
        impressionData: false,
      },
    ],
  });

  const Component = ({ name }: { name: string }) => {
    const enabled = useFlag(name);

    return <div data-testid="state">{enabled.toString()}</div>;
  };

  const { rerender } = render(
    <FlagProvider unleashClient={client} startClient={false}>
      <Component name="enabled-flag" />
    </FlagProvider>
  );
  expect(screen.getByTestId('state')).toHaveTextContent('true');

  // The prop now points at a different flag that is disabled.
  rerender(
    <FlagProvider unleashClient={client} startClient={false}>
      <Component name="some-other-flag" />
    </FlagProvider>
  );

  // Pointing the hook at a different, disabled flag must flip it to `false`
  // rather than keep showing the previous flag's `true`.
  expect(screen.getByTestId('state')).toHaveTextContent('false');
});
