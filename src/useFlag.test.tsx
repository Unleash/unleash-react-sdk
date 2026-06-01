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
  expect(isEnabledMock).toHaveBeenCalledTimes(1);
});

test('should return true when the flag is enabled in context', () => {
  isEnabledMock.mockReturnValue(true);
  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(true);
  expect(isEnabledMock).toHaveBeenCalledTimes(1);
});

test('should return true when the client is ready and re-call isEnabled', () => {
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
  expect(isEnabledMock).toHaveBeenCalledTimes(2);
});

test('should return true when the client is first false and is updated with true', () => {
  isEnabledMock.mockReturnValueOnce(false);
  isEnabledMock.mockReturnValueOnce(true);
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(result.current).toBe(true);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(isEnabledMock).toHaveBeenCalledTimes(3);
});

test('should set the local state only once', () => {
  isEnabledMock.mockReturnValueOnce(true);
  isEnabledMock.mockReturnValueOnce(true);
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(result.current).toBe(true);
  expect(isEnabledMock).toHaveBeenCalledTimes(2);
});

test('should NOT subscribe to ready or update if client does NOT exist', () => {
  isEnabledMock.mockReturnValueOnce(false);
  vi.mocked(useContext).mockImplementationOnce(() => ({
    client: undefined,
    isEnabled: isEnabledMock,
  }));

  const { result } = renderHook(() => useFlag(givenFlagName));

  expect(result.current).toBe(false);
  expect(clientMock.on).not.toHaveBeenCalled();
  expect(clientMock.on).not.toHaveBeenCalled();
  expect(isEnabledMock).toHaveBeenCalledTimes(1);
});

test('should remove event listeners when unmounted', () => {
  const { unmount } = renderHook(() => useFlag(givenFlagName));

  unmount();

  expect(clientMock.off).toHaveBeenCalledTimes(2);
  expect(clientMock.off).nthCalledWith(1, ...clientMock.on.mock.calls[0]);
  expect(clientMock.off).nthCalledWith(2, ...clientMock.on.mock.calls[1]);
});
