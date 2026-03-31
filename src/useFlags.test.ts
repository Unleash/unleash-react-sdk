import { renderHook } from '@testing-library/react-hooks/native';
import { useContext } from 'react';
import { act } from 'react-dom/test-utils';
import type { IToggle } from 'unleash-proxy-client';
import useFlags from './useFlags';

const toggles = [
  {
    name: 'string',
    enabled: true,
    variant: {
      name: 'string',
      enabled: false,
    },
    impressionData: false,
  },
  {
    name: 'string',
    enabled: true,
    variant: {
      name: 'string',
      enabled: false,
    },
    impressionData: false,
  },
];
vi.mock('react', async () => ({
  ...((await vi.importActual('react')) as any),
  useContext: vi.fn(),
}));

test('should return flags', () => {
  vi.mocked(useContext).mockReturnValue({
    client: {
      getAllToggles: () => toggles,
      on: vi.fn(),
    },
  });

  const { result } = renderHook(() => useFlags());
  expect(result.current).toEqual(toggles);
});

test('should update flags on update event', async () => {
  const updatedToggles: IToggle[] = [];
  const client = {
    getAllToggles: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  client.getAllToggles.mockReturnValue(toggles);

  vi.mocked(useContext).mockReturnValue({
    client,
  });

  const { result } = renderHook(() => useFlags());
  expect(result.current).toEqual(toggles);
  client.getAllToggles.mockReturnValue(updatedToggles);
  await act(async () => {
    client.on.mock.calls[0][1]();
  });
  expect(result.current).toEqual(updatedToggles);
});
