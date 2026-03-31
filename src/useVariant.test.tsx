import { renderHook } from '@testing-library/react-hooks/native';
import { useContext } from 'react';
import { vi } from 'vitest';
import useVariant, { variantHasChanged } from './useVariant';

vi.mock('react', async () => {
  const react = (await vi.importActual('react')) as any;
  return {
    ...react,
    useContext: vi.fn(react.useContext),
  };
});

const getVariantMock = vi.fn();
const givenFlagName: string = 'Test';
const clientMock: any = {
  on: vi.fn(),
  off: vi.fn(),
};
const givenVariantA = { name: 'A', enabled: true };
const givenVariantB = { name: 'B', enabled: true };
const givenVariantA_disabled = { name: 'A', enabled: false };

beforeEach(() => {
  getVariantMock.mockClear();
  clientMock.on.mockClear();
  clientMock.off.mockClear();
});

test('should return false when the flag is NOT enabled in context', () => {
  getVariantMock.mockReturnValue(givenVariantA);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(givenVariantA);
  expect(getVariantMock).toHaveBeenCalledTimes(1);
});

test('should return variant when the client is ready and re-call getVariant', () => {
  getVariantMock.mockReturnValue(givenVariantA);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'ready') {
      cb();
    }
  });

  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
  expect(result.current).toBe(givenVariantA);
  expect(getVariantMock).toHaveBeenCalledTimes(2);
});

test('should return `B` when the variant is first `A` and is updated with `B`', () => {
  getVariantMock.mockReturnValueOnce(givenVariantA);
  getVariantMock.mockReturnValueOnce(givenVariantB);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(getVariantMock).toHaveBeenCalledTimes(3);
  expect(result.current).toBe(givenVariantB);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should return `A` when the variant is first `A` and is updated with `A` disabled', () => {
  getVariantMock.mockReturnValueOnce(givenVariantA);
  getVariantMock.mockReturnValueOnce(givenVariantA_disabled);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(getVariantMock).toHaveBeenCalledTimes(3);
  expect(result.current).toBe(givenVariantA_disabled);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should return `A` and update the local state just once when the variant is the same', () => {
  getVariantMock.mockReturnValueOnce(givenVariantA);
  getVariantMock.mockReturnValueOnce(givenVariantA);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(getVariantMock).toHaveBeenCalledTimes(2);
  expect(result.current).toBe(givenVariantA);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should NOT subscribe to ready or update if client does NOT exist', () => {
  getVariantMock.mockReturnValueOnce(false);
  vi.mocked(useContext).mockReturnValue({
    client: undefined,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  const { result } = renderHook(() => useVariant(givenFlagName));

  expect(result.current).toStrictEqual({});
  expect(clientMock.on).not.toHaveBeenCalled();
  expect(clientMock.on).not.toHaveBeenCalled();
  expect(getVariantMock).toHaveBeenCalledTimes(1);
});

test('should remove event listeners when unmounted', () => {
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });

  const { unmount } = renderHook(() => useVariant(givenFlagName));

  unmount();

  expect(clientMock.off).toHaveBeenCalledTimes(2);
  expect(clientMock.off).nthCalledWith(1, ...clientMock.on.mock.calls[0]);
  expect(clientMock.off).nthCalledWith(2, ...clientMock.on.mock.calls[1]);
});

describe('Variant change detection', () => {
  test('If the variants are identical, it returns `false`', () => {
    const a = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'string',
        value: 'data',
      },
    };
    const b = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'string',
        value: 'data',
      },
    };

    expect(variantHasChanged(a, b)).toBeFalsy();
  });

  test('If the new variant is undefined, it counts as a change', () => {
    const a = { name: 'a', enabled: true };

    expect(variantHasChanged(a, undefined)).toBeTruthy();
  });

  test('Name change is detected', () => {
    const a = { name: 'a', enabled: true };
    const b = { name: 'b', enabled: true };

    expect(variantHasChanged(a, b)).toBeTruthy();
  });

  test('Enabled state change is detected', () => {
    const enabled = { name: 'a', enabled: true };
    const disabled = { name: 'a', enabled: false };

    expect(variantHasChanged(enabled, disabled)).toBeTruthy();
  });
  test('Payload type change is detected', () => {
    const a = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'string',
        value: '{}',
      },
    };
    const b = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'json',
        value: '{}',
      },
    };

    expect(variantHasChanged(a, b)).toBeTruthy();
  });

  test('Payload value change is detected', () => {
    const a = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'string',
        value: '1',
      },
    };
    const b = {
      name: 'a',
      enabled: true,
      payload: {
        type: 'string',
        value: '2',
      },
    };

    expect(variantHasChanged(a, b)).toBeTruthy();
  });
});
