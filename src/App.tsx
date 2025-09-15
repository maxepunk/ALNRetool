/**
 * @fileoverview Main application entry component for ALNRetool
 * @module App
 * 
 * This is the root component that sets up all providers and global configuration
 * for the About Last Night visualization tool.
 * 
 * @dependencies
 * - react-router-dom: Client-side routing
 * - @tanstack/react-query: Server state management
 * - react-hot-toast: Toast notifications
 * - AppRouter: Main routing component
 * - ViewContext: Global view state provider
 * - CreatePanelPortal: Portal for entity creation panels
 * 
 * @calledBy main.tsx
 * @calls AppRouter, ViewContextProvider, CreatePanelPortal
 */

import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import AppRouter from './router/AppRouter';
import { ViewContextProvider } from '@/contexts/ViewContext';
import { CreatePanelPortal } from '@/components/CreatePanelPortal';
import { TooltipProvider } from '@/components/ui/tooltip';
// GraphContextProvider removed in Phase 3 cleanup

/**
 * Global QueryClient instance configuration
 * 
 * @constant
 * @type {QueryClient}
 * 
 * Configuration details:
 * - staleTime: 5 minutes (matches server-side cache TTL)
 * - gcTime: 10 minutes (garbage collection)
 * - retry: 3 attempts on failure
 * - refetchOnWindowFocus: disabled for performance
 * 
 * @complexity O(1) - singleton initialization
 */
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


/**
 * Root application component that provides the provider hierarchy
 * 
 * @function App
 * @returns {JSX.Element} The application root with all providers
 * 
 * Provider hierarchy (order matters):
 * 1. QueryClientProvider - Server state management
 * 2. BrowserRouter - Client-side routing
 * 3. ViewContextProvider - View state management
 * 4. AppRouter - Route definitions
 * 5. Toaster - Global toast notifications
 * 6. CreatePanelPortal - Entity creation modals
 * 
 * @complexity O(1) - Component render
 * @performance Initial mount triggers provider initialization
 * 
 * @example
 * // Usage in main.tsx
 * ReactDOM.createRoot(document.getElementById('root')).render(
 *   <App />
 * )
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <ViewContextProvider>
            <AppRouter />
          </ViewContextProvider>
        </BrowserRouter>
        {/* Global toast notification configuration */}
        <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000, // Toast display duration in milliseconds
          style: {
            // Default toast styling - dark theme
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              // Success toast - green background
              background: '#10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              // Error toast - red background
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
        <CreatePanelPortal />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;