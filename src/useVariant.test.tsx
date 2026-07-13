import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
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
});

test('should return variant when the client becomes ready', () => {
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
});

test('should return `B` when the variant is first `A` and is updated with `B`', () => {
  getVariantMock.mockReturnValueOnce(givenVariantA);
  getVariantMock.mockReturnValue(givenVariantB);
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

  expect(result.current).toBe(givenVariantB);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should return `A` when the variant is first `A` and is updated with `A` disabled', () => {
  getVariantMock.mockReturnValueOnce(givenVariantA);
  getVariantMock.mockReturnValue(givenVariantA_disabled);
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

  expect(result.current).toBe(givenVariantA_disabled);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('should not re-render when an update yields an equal variant', () => {
  getVariantMock.mockImplementation(() => ({ name: 'A', enabled: true }));
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation((eventName: string, cb: Function) => {
    if (eventName === 'update') {
      cb();
    }
  });

  let renders = 0;
  const { result } = renderHook(() => {
    renders += 1;
    return useVariant(givenFlagName);
  });

  expect(result.current).toEqual({ name: 'A', enabled: true });
  expect(renders).toBe(1);
});

test('should NOT subscribe to ready or update if client does NOT exist', () => {
  getVariantMock.mockReturnValue(false);
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

test('reconciles the variant when ready/update fired before the effect subscribed', () => {
  // Seeded with the disabled variant at render, but the client already resolved
  // the enabled one — the ready/update fired before we subscribed, so `on` never
  // invokes our handlers.
  getVariantMock.mockReturnValueOnce(givenVariantA_disabled);
  getVariantMock.mockReturnValue(givenVariantA);
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation(() => {});

  const { result } = renderHook(() => useVariant(givenFlagName));

  // A correct hook re-reads on subscribe and reports the enabled variant. The
  // buggy version stays on the disabled one.
  expect(result.current).toBe(givenVariantA);
});

test('re-reads when the featureName argument changes', () => {
  getVariantMock.mockImplementation((name: string) =>
    name === 'flag-a' ? givenVariantA : givenVariantB
  );
  vi.mocked(useContext).mockReturnValue({
    client: clientMock,
    getVariant: getVariantMock,
  });
  clientMock.on.mockImplementation(() => {});

  const { result, rerender } = renderHook(({ name }) => useVariant(name), {
    initialProps: { name: 'flag-a' },
  });
  expect(result.current).toBe(givenVariantA);

  // Pointing the hook at a different flag should return that flag's variant. The
  // buggy version keeps the old one because `featureName` is missing from the
  // effect deps.
  rerender({ name: 'flag-b' });
  expect(result.current).toBe(givenVariantB);
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
