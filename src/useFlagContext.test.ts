import React from 'react';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { vi, test, expect } from 'vitest';
import FlagProvider from "./FlagProvider";
import { useFlagContext } from "./useFlagContext";

const { mockClient } = vi.hoisted(() => ({
    mockClient: {
        on: vi.fn(),
        off: vi.fn(),
        updateContext: vi.fn(),
        isEnabled: vi.fn(),
        getVariant: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        isReady: vi.fn(() => false),
        getError: vi.fn(() => null),
    },
}));

vi.mock('unleash-proxy-client', async (importOriginal) => {
    const mod = await importOriginal();

    return {
        ...(mod as object),
        UnleashClient: vi.fn(function MockUnleashClient() {
            return mockClient;
        }),
    };
});

const givenConfig = {
    appName: 'my-app',
    clientKey: 'my-secret',
    url: 'https://my-unleash-proxy',
};

const FlagProviderWrapper = ({ children }: PropsWithChildren) =>
    React.createElement(FlagProvider, { config: givenConfig }, children);

test("logs an error if used outside of a FlagProvider", () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    renderHook(() => useFlagContext());
    expect(consoleSpy).toHaveBeenCalledWith("useFlagContext() must be used within a FlagProvider");
    
    consoleSpy.mockRestore();
});

test("does not log an error if used inside of a FlagProvider", () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useFlagContext(), { wrapper: FlagProviderWrapper });
    
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(result.current).not.toBeNull();
    
    consoleSpy.mockRestore();
});
