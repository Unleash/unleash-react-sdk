import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import useFlags from './useFlags';

vi.mock('react', async () => {
  const react = (await vi.importActual('react')) as any;
  return {
    ...react,
    useContext: vi.fn(react.useContext),
  };
});

const getAllTogglesMock = vi.fn();
const clientMock: any = {
  on: vi.fn(),
  off: vi.fn(),
  getAllToggles: getAllTogglesMock,
};

beforeEach(() => {
  getAllTogglesMock.mockClear();
  clientMock.on.mockClear();
  clientMock.off.mockClear();
});

test('returns the toggles the client already has and subscribes for updates', () => {
  const toggles = [{ name: 'a', enabled: true }];
  getAllTogglesMock.mockReturnValue(toggles);
  vi.mocked(useContext).mockReturnValue({ client: clientMock });

  const { result } = renderHook(() => useFlags());

  expect(result.current).toBe(toggles);
  expect(clientMock.on).toHaveBeenCalledWith('update', expect.any(Function));
});

test('subscribes to ready so it can recover from a missed first fetch', () => {
  getAllTogglesMock.mockReturnValue([]);
  vi.mocked(useContext).mockReturnValue({ client: clientMock });

  renderHook(() => useFlags());

  // Without a `ready` listener the hook can never recover a first fetch it missed,
  // since `ready` is emitted once and won't repeat.
  expect(clientMock.on).toHaveBeenCalledWith('ready', expect.any(Function));
});

test('reconciles toggles that arrived before the effect subscribed', () => {
  const toggles = [{ name: 'a', enabled: true }];
  // Empty at render, but the client received its toggles before we subscribed —
  // the update/ready fired first, so `on` never invokes our handler.
  getAllTogglesMock.mockReturnValueOnce([]);
  getAllTogglesMock.mockReturnValue(toggles);
  vi.mocked(useContext).mockReturnValue({ client: clientMock });
  clientMock.on.mockImplementation(() => {});

  const { result } = renderHook(() => useFlags());

  // A correct hook re-reads once it subscribes and returns the toggles. The buggy
  // version stays on its empty initial list.
  expect(result.current).toBe(toggles);
});

test('should remove event listeners when unmounted', () => {
  getAllTogglesMock.mockReturnValue([]);
  vi.mocked(useContext).mockReturnValue({ client: clientMock });

  const { unmount } = renderHook(() => useFlags());

  unmount();

  clientMock.on.mock.calls.forEach((call: unknown[]) => {
    expect(clientMock.off).toHaveBeenCalledWith(...call);
  });
});
