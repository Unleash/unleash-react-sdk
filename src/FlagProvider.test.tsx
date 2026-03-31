import { render, screen } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { EVENTS, type IVariant, UnleashClient } from 'unleash-proxy-client';
import FlagProvider from './FlagProvider';
import { useFlagContext } from './useFlagContext';
import '@testing-library/jest-dom';

const getVariantMock = vi.fn().mockReturnValue('A');
const updateContextMock = vi.fn();
const startClientMock = vi.fn();
const stopClientMock = vi.fn();
const onMock = vi.fn().mockReturnValue('subscribed');
const offMock = vi.fn();
const isEnabledMock = vi.fn().mockReturnValue(true);

const givenConfig = {
  appName: 'my-app',
  clientKey: 'my-secret',
  url: 'https://my-unleash-proxy',
};
const givenFlagName = 'test';
const givenContext = { session: 'context' };

const createClientMock = (overrides = {}) => ({
  getVariant: getVariantMock,
  updateContext: updateContextMock,
  start: startClientMock,
  stop: stopClientMock,
  isEnabled: isEnabledMock,
  on: onMock,
  off: offMock,
  ...overrides,
});

const { UnleashClientSpy } = vi.hoisted(() => ({
  UnleashClientSpy: vi.fn(),
}));

vi.mock('unleash-proxy-client', async (importOriginal) => {
  const mod = await importOriginal();

  return {
    ...(mod as any),
    UnleashClient: UnleashClientSpy,
  };
});

const noop = () => {};

const FlagConsumerAfterClientInit = () => {
  const { updateContext, isEnabled, getVariant, client, on } = useFlagContext();
  const [enabled, setIsEnabled] = useState(false);
  const [variant, setVariant] = useState<IVariant | null>(null);
  const [context, setContext] = useState<any>('nothing');
  const [currentOn, setCurrentOn] = useState<UnleashClient | null>(null);

  useEffect(() => {
    if (client) {
      setIsEnabled(isEnabled(givenFlagName));
      setVariant(getVariant(givenFlagName));
      setContext(updateContext(givenContext as any));
      setCurrentOn(on('someEvent', noop, 'someArgument'));
    }
  }, [client]);

  return (
    <>
      <div>{`consuming value isEnabled ${enabled}`}</div>
      <div>{`consuming value updateContext ${context}`}</div>
      <div>{`consuming value getVariant ${variant}`}</div>
      <div>{`consuming value on ${currentOn}`}</div>
    </>
  );
};

const FlagConsumerBeforeClientInit = () => {
  const { updateContext, isEnabled, getVariant, client, on } = useFlagContext();
  const [_enabled, setIsEnabled] = useState(false);
  const [_variant, setVariant] = useState<IVariant | null>(null);
  const [_context, setContext] = useState<any>('nothing');
  const [_currentOn, setCurrentOn] = useState<UnleashClient | null>(null);

  useEffect(() => {
    if (!client) {
      setIsEnabled(isEnabled(givenFlagName));
      setVariant(getVariant(givenFlagName));
      setContext(updateContext(givenContext as any));
      setCurrentOn(on('someEvent', noop, 'someArgument'));
    }
  }, []);

  return <></>;
};

beforeEach(() => {
  onMock.mockClear();
  UnleashClientSpy.mockImplementation(function MockUnleashClient() {
    return createClientMock();
  });
});

test('A consumer that subscribes AFTER client init shows values from provider and calls all the functions', () => {
  render(
    <FlagProvider config={givenConfig}>
      <FlagConsumerAfterClientInit />
    </FlagProvider>,
    {},
  );

  expect(getVariantMock).toHaveBeenCalledWith(givenFlagName);
  expect(isEnabledMock).toHaveBeenCalledWith(givenFlagName);
  expect(updateContextMock).toHaveBeenCalledWith(givenContext);
  expect(screen.getByText(/consuming value isEnabled/)).toHaveTextContent(
    'consuming value isEnabled true',
  );
  expect(screen.getByText(/consuming value updateContext/)).toHaveTextContent(
    'consuming value updateContext [object Promise]',
  );
  expect(screen.getByText(/consuming value getVariant/)).toHaveTextContent(
    'consuming value getVariant A',
  );
  expect(screen.getByText(/consuming value on/)).toHaveTextContent(
    'consuming value on subscribed',
  );
});

test('A consumer that subscribes BEFORE client init shows values from provider and calls all the functions', () => {
  render(
    <FlagProvider config={givenConfig}>
      <FlagConsumerBeforeClientInit />
    </FlagProvider>,
    {},
  );

  expect(getVariantMock).toHaveBeenCalledWith(givenFlagName);
  expect(isEnabledMock).toHaveBeenCalledWith(givenFlagName);
  expect(updateContextMock).toHaveBeenCalledWith(givenContext);
});

test('A consumer should be able to get a variant when the client is passed into the provider as props', () => {
  render(
    <FlagProvider unleashClient={new UnleashClient(givenConfig)}>
      <FlagConsumerAfterClientInit />
    </FlagProvider>,
    {},
  );

  expect(getVariantMock).toHaveBeenCalledWith(givenFlagName);
  expect(isEnabledMock).toHaveBeenCalledWith(givenFlagName);
  expect(updateContextMock).toHaveBeenCalledWith(givenContext);
  expect(screen.getByText(/consuming value isEnabled/)).toHaveTextContent(
    'consuming value isEnabled true',
  );
  expect(screen.getByText(/consuming value updateContext/)).toHaveTextContent(
    'consuming value updateContext [object Promise]',
  );
  expect(screen.getByText(/consuming value getVariant/)).toHaveTextContent(
    'consuming value getVariant A',
  );
  expect(screen.getByText(/consuming value on/)).toHaveTextContent(
    'consuming value on subscribed',
  );
});

test('A memoized consumer should not rerender when the context provider values are the same', () => {
  const renderCounter = vi.fn();

  const MemoizedConsumer = React.memo(() => {
    const { updateContext, isEnabled, getVariant, client, on } =
      useFlagContext();

    renderCounter();

    return <></>;
  });

  expect(renderCounter).toHaveBeenCalledTimes(0);

  const { rerender } = render(
    <FlagProvider config={givenConfig}>
      <MemoizedConsumer />
    </FlagProvider>,
  );

  expect(renderCounter).toHaveBeenCalledTimes(1);

  rerender(
    <FlagProvider config={givenConfig}>
      <MemoizedConsumer />
    </FlagProvider>,
  );

  expect(renderCounter).toHaveBeenCalledTimes(1);
});

test('should update when ready event is sent', () => {
  const localMock = vi.fn();
  UnleashClientSpy.mockImplementation(function MockUnleashClient() {
    return createClientMock({
      on: localMock,
    });
  });

  const client = new UnleashClient(givenConfig);

  render(
    <FlagProvider unleashClient={client}>
      <div>Hi</div>
    </FlagProvider>,
  );

  localMock.mockImplementation((event, cb) => {
    if (event === EVENTS.READY) {
      cb();
    }
  });

  expect(localMock).toHaveBeenCalledWith(EVENTS.READY, expect.any(Function));
});

test('should register error when error event is sent', () => {
  const localMock = vi.fn();
  UnleashClientSpy.mockImplementation(function MockUnleashClient() {
    return createClientMock({
      on: localMock,
    });
  });

  const client = new UnleashClient(givenConfig);

  render(
    <FlagProvider unleashClient={client}>
      <div>Hi</div>
    </FlagProvider>,
  );

  localMock.mockImplementation((event, cb) => {
    if (event === EVENTS.ERROR) {
      cb('Error');
    }
  });

  expect(localMock).toHaveBeenCalledWith(EVENTS.ERROR, expect.any(Function));
});

test('should not start client if startClient is false', () => {
  const localMock = vi.fn();
  const stopMock = vi.fn();
  UnleashClientSpy.mockImplementation(function MockUnleashClient() {
    return createClientMock({
      start: localMock,
      stop: stopMock,
    });
  });

  const client = new UnleashClient(givenConfig);

  render(
    <FlagProvider unleashClient={client} startClient={false}>
      <div>Hi</div>
    </FlagProvider>,
  );

  expect(localMock).not.toHaveBeenCalled();
  expect(stopMock).not.toHaveBeenCalled();
});

test('should not start client if startClient is false when passing config', () => {
  const localMock = vi.fn();
  const stopMock = vi.fn();
  UnleashClientSpy.mockImplementation(function MockUnleashClient() {
    return createClientMock({
      start: localMock,
      stop: stopMock,
    });
  });

  render(
    <FlagProvider config={givenConfig} startClient={false}>
      <div>Hi</div>
    </FlagProvider>,
  );

  expect(localMock).not.toHaveBeenCalled();
  expect(stopMock).not.toHaveBeenCalled();
});
