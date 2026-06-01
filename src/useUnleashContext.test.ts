import { renderHook } from '@testing-library/react';
import useUnleashContext from './useUnleashContext';

const updateContextMock = vi.fn().mockName('updateContext');
vi.mock('react', async () => ({
  ...((await vi.importActual('react')) as any),
  useContext: vi.fn(() => ({ updateContext: updateContextMock })),
}));

test('should return the updateContext function from context', () => {
  const { result } = renderHook(() => useUnleashContext());

  expect(result.current).toBe(updateContextMock);
});
