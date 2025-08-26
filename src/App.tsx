import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AppRouter from './router/AppRouter';
import { cacheVersionManager } from '@/lib/cache/CacheVersionManager';
import { ViewContextProvider } from '@/contexts/ViewContext';
// GraphContextProvider removed in Phase 3 cleanup

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
        <ViewContextProvider>
          <AppRouter />
        </ViewContextProvider>
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;