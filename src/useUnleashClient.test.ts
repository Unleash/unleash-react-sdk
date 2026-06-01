import { renderHook } from '@testing-library/react';
import useUnleashClient from './useUnleashClient';

const clientMock = vi.fn().mockReturnValue({});
vi.mock('react', async () => ({
  ...((await vi.importActual('react')) as any),
  useContext: vi.fn(() => ({ client: clientMock })),
}));

test('should return the client when calling useUnleashClient', () => {
  const { result } = renderHook(() => useUnleashClient());

  expect(result.current).toBe(clientMock);
});
