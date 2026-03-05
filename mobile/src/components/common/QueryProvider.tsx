import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 60_000, // 1 minute default
    },
    mutations: {
      retry: 0,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps the app with React Query's QueryClientProvider.
 * Import and use in App.tsx or the root layout.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
