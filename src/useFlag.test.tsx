import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import useFlag from './useFlag';

const isEnabledMock = vi.fn();
const givenFlagName: string = 'Test';
const clientMock: any = {
  on: vi.fn(),
  off: vi.fn(),
};

vi.mock('react', async () => ({
  ...((await vi.importActual('react')) as any),
  useContext: vi.fn(() => ({
    client: clientMock,
    isEnabled: isEnabledMock,
  })),
}));

afterEach(() => {
  isEnabledMock.mockClear();
  clientMock.on.mockClear();
  clientMock.off.mockClear();
});

test('should return false when the flag is NOT enabled in context', () => {
  isEnabledMock.mockReturnValue(false);
  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(false);
});

test('should return true when the flag is enabled in context', () => {
  isEnabledMock.mockReturnValue(true);
  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(true);
});

test('should return true when the client becomes ready', () => {
  isEnabledMock.mockReturnValue(true);
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'ready') {
      cb();
    }
  });

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(true);
});

test('should return true when the client is first false and is updated with true', () => {
  isEnabledMock.mockReturnValueOnce(false);
  isEnabledMock.mockReturnValue(true);
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(result.current).toBe(true);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should not re-render when an update leaves the value unchanged', () => {
  isEnabledMock.mockReturnValue(true);
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  let renders = 0;
  const { result } = renderHook(() => {
    renders += 1;
    return useFlag(givenFlagName);
  });

  expect(result.current).toBe(true);
  expect(renders).toBe(1);
});

test('should NOT subscribe to ready or update if client does NOT exist', () => {
  isEnabledMock.mockReturnValue(false);
  vi.mocked(useContext).mockImplementationOnce(() => ({
    client: undefined,
    isEnabled: isEnabledMock,
  }));

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(result.current).toBe(false);
  expect(clientMock.on).not.toHaveBeenCalled();
});

test('should remove event listeners when unmounted', () => {
  const { unmount } = renderHook(() => useFlag(givenFlagName));

  unmount();

  expect(clientMock.off).toHaveBeenCalledTimes(2);
  expect(clientMock.off).nthCalledWith(1, ...clientMock.on.mock.calls[0]);
  expect(clientMock.off).nthCalledWith(2, ...clientMock.on.mock.calls[1]);
});

test('reconciles the flag when ready/update fired before the effect subscribed', () => {
  // Seeded false at render, but the client is actually enabled — the one-shot
  // ready/update already fired, so `on` never invokes the handlers we register.
  isEnabledMock.mockReturnValueOnce(false);
  isEnabledMock.mockReturnValue(true);
  clientMock.on.mockImplementation(() => {});

  const { result } = renderHook(() => useFlag(givenFlagName));

  // A correct hook re-reads once it subscribes and reports `true`. The buggy
  // version stays stuck on its initial `false`.
  expect(result.current).toBe(true);
});

test('re-reads when the featureName argument changes', () => {
  isEnabledMock.mockImplementation((name: string) => name === 'enabled-flag');
  clientMock.on.mockImplementation(() => {});

  const { result, rerender } = renderHook(({ name }) => useFlag(name), {
    initialProps: { name: 'enabled-flag' },
  });
  expect(result.current).toBe(true);

  // Pointing the hook at a different, disabled flag should flip it to `false`.
  // The buggy version keeps the old value because `featureName` is missing from
  // the effect deps, so it never re-reads.
  rerender({ name: 'some-other-flag' });
  expect(result.current).toBe(false);
});
