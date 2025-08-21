import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppRouter from './router/AppRouter';
import { FeatureFlagAdmin } from './components/FeatureFlagAdmin';
import { cacheVersionManager } from '@/lib/cache/CacheVersionManager';

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes - aligned with server-side cache TTL for data consistency
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Initialize cache version manager with query client
cacheVersionManager.initialize(queryClient);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
      <FeatureFlagAdmin />
    </QueryClientProvider>
  );
}

export default App;