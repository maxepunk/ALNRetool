# React Query v5 (TanStack Query) & React 18 Documentation

## Version Information
- **TanStack Query**: v5.85.0 (installed as @tanstack/react-query)
- **React**: v18.3.1
- **React DOM**: v18.3.1
- **Document Updated**: 2025-09-02
- **Purpose**: AI-friendly reference for ALNRetool development

## Table of Contents
1. [Quick Start & Setup](#quick-start--setup)
2. [Core Concepts](#core-concepts)
3. [TypeScript with TanStack Query](#typescript-with-tanstack-query)
4. [Queries](#queries)
5. [Mutations](#mutations)
6. [Optimistic Updates](#optimistic-updates)
7. [Cache Management](#cache-management)
8. [React 18 Integration](#react-18-integration)
9. [ALNRetool Patterns](#alnretool-patterns)
10. [Testing Strategies](#testing-strategies)
11. [Performance Optimization](#performance-optimization)
12. [Common Pitfalls](#common-pitfalls)

## Quick Start & Setup

### Installation
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Basic Setup with React 18
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRoot } from 'react-dom/client';

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,        // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// React 18 root API
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

## Core Concepts

### Key Terminology Changes (v5)
- `cacheTime` → `gcTime` (garbage collection time)
- `useQuery` requires object syntax (no more array arguments)
- `useMutation` callbacks (`onSuccess`, `onError`) now async-aware
- React 18+ required (uses `useSyncExternalStore`)

### Query States
```typescript
type QueryStatus = 'pending' | 'error' | 'success';
type FetchStatus = 'fetching' | 'paused' | 'idle';

// Combined states for comprehensive status handling
interface QueryState {
  isLoading: boolean;    // status === 'pending' && fetchStatus === 'fetching'
  isError: boolean;      // status === 'error'
  isSuccess: boolean;    // status === 'success'
  isPending: boolean;    // status === 'pending'
  isFetching: boolean;   // fetchStatus === 'fetching'
  isPaused: boolean;     // fetchStatus === 'paused'
  isIdle: boolean;       // fetchStatus === 'idle'
}
```

## TypeScript with TanStack Query

### Type-Safe Query Keys
```typescript
// Define a query key factory for type safety
const queryKeys = {
  all: ['entities'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: string) => [...queryKeys.lists(), { filters }] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
} as const;

// Usage
const todoQuery = useQuery({
  queryKey: queryKeys.detail('todo-1'),
  queryFn: () => fetchTodoById('todo-1'),
});
```

### Generic Hook Pattern
```typescript
interface UseEntityDataOptions<TData> extends PaginationParams {
  enabled?: boolean;
  staleTime?: number;
  select?: (data: APIResponse<TData>) => TData;
}

function useEntityData<TEntity>(
  queryKey: readonly unknown[],
  fetchFn: (params: PaginationParams) => Promise<APIResponse<TEntity>>,
  options?: UseEntityDataOptions<TEntity>
): UseQueryResult<APIResponse<TEntity>, Error> {
  return useQuery({
    queryKey,
    queryFn: () => fetchFn(options || {}),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? QUERY_STALE_TIME,
    select: options?.select,
  });
}
```

### Register Global Types
```typescript
// In a global.d.ts file
import '@tanstack/react-query';

interface MyMeta extends Record<string, unknown> {
  requestId: string;
  timestamp: number;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: MyMeta;
    mutationMeta: MyMeta;
  }
}
```

## Queries

### Basic Query
```typescript
import { useQuery } from '@tanstack/react-query';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function useTodos() {
  return useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    // v5 specific options
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,  // renamed from cacheTime
  });
}
```

### Query with Parameters
```typescript
function useTodo(id: string) {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: async ({ queryKey }) => {
      const [, todoId] = queryKey;
      const response = await fetch(`/api/todos/${todoId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    enabled: !!id, // Don't run if no ID
  });
}
```

### Paginated Queries
```typescript
interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

function usePaginatedTodos(cursor?: string) {
  return useQuery<PaginatedResponse<Todo>, Error>({
    queryKey: ['todos', 'paginated', cursor],
    queryFn: () => fetchTodos({ cursor }),
    keepPreviousData: true, // Smooth pagination
  });
}
```

### Infinite Queries
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function useInfiniteTodos() {
  return useInfiniteQuery({
    queryKey: ['todos', 'infinite'],
    queryFn: ({ pageParam }) => fetchTodos({ cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor,
  });
}
```

## Mutations

### Basic Mutation
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateTodoInput {
  title: string;
  description?: string;
}

function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, CreateTodoInput>({
    mutationFn: async (newTodo) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      // Or update cache directly
      queryClient.setQueryData<Todo[]>(['todos'], (old) => 
        old ? [...old, data] : [data]
      );
    },
    onError: (error) => {
      console.error('Mutation failed:', error);
    },
  });
}
```

### Mutation with Async Callbacks (v5 Feature)
```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onSuccess: async (data) => {
    // v5: Callbacks can be async and will be awaited
    await analytics.track('todo_updated', data);
    console.log('Analytics tracked');
  },
  onSettled: async () => {
    // This runs after onSuccess/onError completes
    await queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

### Mutation Factory Pattern
```typescript
// Factory for creating typed mutations
function createEntityMutation<TEntity, TInput>(
  entityType: string,
  apiModule: { create: (data: TInput) => Promise<TEntity> }
) {
  return function useEntityMutation() {
    const queryClient = useQueryClient();
    
    return useMutation<TEntity, Error, TInput>({
      mutationFn: apiModule.create,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: [entityType] });
        queryClient.setQueryData([entityType, data.id], data);
      },
    });
  };
}

// Usage
const useCreateCharacter = createEntityMutation('characters', charactersApi);
```

## Optimistic Updates

### Method 1: Using Variables (Simpler, v5 Recommended)
```tsx
function TodoList() {
  const { data: todos } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
  const addTodoMutation = useMutation({
    mutationFn: (newTodo: string) => 
      axios.post('/api/todos', { text: newTodo }),
    onSettled: () => 
      queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.text}</li>
      ))}
      {addTodoMutation.isPending && (
        <li style={{ opacity: 0.5 }}>
          {addTodoMutation.variables}
        </li>
      )}
      {addTodoMutation.isError && (
        <li style={{ color: 'red' }}>
          {addTodoMutation.variables}
          <button onClick={() => addTodoMutation.mutate(addTodoMutation.variables)}>
            Retry
          </button>
        </li>
      )}
    </ul>
  );
}
```

### Method 2: Manual Cache Updates with Rollback
```typescript
const updateTodoMutation = useMutation({
  mutationFn: updateTodo,
  // When mutation starts
  onMutate: async (newTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });
    
    // Snapshot previous value
    const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);
    
    // Optimistically update
    queryClient.setQueryData(['todos', newTodo.id], newTodo);
    
    // Return context for rollback
    return { previousTodo, newTodo };
  },
  // On error, rollback
  onError: (err, newTodo, context) => {
    if (context?.previousTodo) {
      queryClient.setQueryData(
        ['todos', context.newTodo.id],
        context.previousTodo
      );
    }
  },
  // Always refetch after error or success
  onSettled: (newTodo) => {
    queryClient.invalidateQueries({ queryKey: ['todos', newTodo?.id] });
  },
});
```

### Method 3: Multiple Optimistic Updates
```typescript
const mutation = useMutation({
  mutationFn: updateMultiple,
  onMutate: async (updates) => {
    // Cancel all related queries
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    
    // Store snapshots
    const snapshots = updates.map(update => ({
      id: update.id,
      previous: queryClient.getQueryData(['todos', update.id]),
    }));
    
    // Apply all optimistic updates
    updates.forEach(update => {
      queryClient.setQueryData(['todos', update.id], update);
    });
    
    return { snapshots };
  },
  onError: (err, updates, context) => {
    // Rollback all
    context?.snapshots.forEach(({ id, previous }) => {
      queryClient.setQueryData(['todos', id], previous);
    });
  },
});
```

## Cache Management

### Query Client Methods (v5 Syntax)
```typescript
// v5 uses object syntax for all methods
queryClient.isFetching({ queryKey: ['todos'] });
queryClient.getQueryData(['todos']);
queryClient.setQueryData(['todos'], newData);
queryClient.removeQueries({ queryKey: ['todos'] });
queryClient.resetQueries({ queryKey: ['todos'] });
queryClient.cancelQueries({ queryKey: ['todos'] });
queryClient.invalidateQueries({ queryKey: ['todos'] });
queryClient.refetchQueries({ queryKey: ['todos'] });
queryClient.fetchQuery({ queryKey: ['todos'], queryFn: fetchTodos });
queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos });
```

### Cache Update Strategies
```typescript
// 1. Direct cache update
queryClient.setQueryData(['todo', id], (oldData) => ({
  ...oldData,
  completed: true,
}));

// 2. Partial invalidation
queryClient.invalidateQueries({ 
  queryKey: ['todos'],
  exact: false, // Invalidate all queries starting with ['todos']
});

// 3. Selective refetch
queryClient.refetchQueries({
  queryKey: ['todos'],
  type: 'active', // Only refetch if query is active
});

// 4. Set query defaults
queryClient.setQueryDefaults(['todos'], {
  staleTime: 10 * 60 * 1000,
  gcTime: 15 * 60 * 1000,
});
```

### Mutation Cache Subscription
```typescript
const mutationCache = new MutationCache({
  onSuccess: (data, variables, context, mutation) => {
    // Global success handler
    toast.success('Operation successful');
  },
  onError: (error, variables, context, mutation) => {
    // Global error handler
    toast.error(error.message);
  },
});

// Subscribe to all mutations
const unsubscribe = mutationCache.subscribe((event) => {
  if (event.type === 'updated') {
    console.log('Mutation updated:', event.mutation);
  }
});
```

## React 18 Integration

### Concurrent Features with Suspense
```tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function TodoDetails({ id }: { id: string }) {
  // This will suspend until data is available
  const { data } = useSuspenseQuery({
    queryKey: ['todo', id],
    queryFn: () => fetchTodo(id),
  });
  
  return <div>{data.title}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TodoDetails id="1" />
    </Suspense>
  );
}
```

### React 18 StrictMode Compatibility
```tsx
// TanStack Query v5 is fully compatible with React 18 StrictMode
// It handles double-mounting and cleanup properly

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <YourApp />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
```

### useTransition with Mutations
```tsx
import { useTransition } from 'react';

function TodoForm() {
  const [isPending, startTransition] = useTransition();
  const mutation = useMutation({ mutationFn: createTodo });
  
  const handleSubmit = (data: TodoInput) => {
    startTransition(() => {
      mutation.mutate(data);
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <button disabled={isPending || mutation.isPending}>
        {isPending ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
}
```

### Server Components Integration (Experimental)
```tsx
// In Server Component
async function TodoList() {
  const todos = await fetchTodos();
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TodoListClient initialData={todos} />
    </HydrationBoundary>
  );
}

// In Client Component
'use client';

function TodoListClient({ initialData }) {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    initialData,
  });
  
  return <>{/* render todos */}</>;
}
```

## ALNRetool Patterns

### Entity Mutation Factory (from entityMutations.ts)
```typescript
export function createEntityMutation<TEntity extends Entity>(
  entityType: EntityType,
  mutationType: MutationType
): UseMutationResult<MutationResponse<TEntity>, MutationError, any> {
  const queryClient = useQueryClient();
  const viewStore = useViewStore();
  
  const apiModule = getApiModule(entityType);
  
  return useMutation({
    mutationFn: async (payload) => {
      switch (mutationType) {
        case 'create':
          return apiModule.create(payload);
        case 'update':
          return apiModule.update(payload.id, payload);
        case 'delete':
          return apiModule.delete(payload.id);
      }
    },
    onMutate: async (payload) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: [entityType] });
      
      // Get cache updater for this operation
      const updater = getCacheUpdater(entityType, mutationType);
      const context = updater.onMutate(queryClient, payload, viewStore.currentView);
      
      return context;
    },
    onError: (error, payload, context) => {
      // Rollback optimistic updates
      if (context) {
        const updater = getCacheUpdater(entityType, mutationType);
        updater.onError(queryClient, context);
      }
      toast.error(error.message);
    },
    onSuccess: (data, payload, context) => {
      // Update with server response
      const updater = getCacheUpdater(entityType, mutationType);
      updater.onSuccess(queryClient, data, context);
      toast.success(`${entityType} ${mutationType}d successfully`);
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [entityType] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
    },
  });
}
```

### Generic Entity Data Hook (from useEntityData.ts)
```typescript
export function useEntityData<T>(
  queryKey: readonly unknown[],
  fetchFn: () => Promise<T>,
  options?: UseEntityDataOptions
): UseQueryResult<T, Error> {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? QUERY_STALE_TIME,
    retry: (failureCount, error) => {
      // Custom retry logic
      if (error instanceof ApiError) {
        if (error.status === 404) return false;
        if (error.status >= 500) return failureCount < 3;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => 
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### Query Client Configuration (from queryClient.ts)
```typescript
export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_CACHE_TIME = 10 * 60 * 1000; // 10 minutes

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('Query error:', {
        queryKey: query.queryKey,
        error,
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error('Mutation error:', {
        mutationKey: mutation.options.mutationKey,
        error,
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_CACHE_TIME,
      retry: 3,
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});
```

## Testing Strategies

### Testing Queries
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('useTodos returns todo list', async () => {
  const { result } = renderHook(() => useTodos(), {
    wrapper: createWrapper(),
  });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toHaveLength(3);
});
```

### Testing Mutations
```typescript
test('createTodo mutation', async () => {
  const { result } = renderHook(() => useCreateTodo(), {
    wrapper: createWrapper(),
  });
  
  act(() => {
    result.current.mutate({ title: 'New Todo' });
  });
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  
  expect(result.current.data).toMatchObject({
    title: 'New Todo',
  });
});
```

### Mock Server Setup (MSW)
```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/todos', () => {
    return HttpResponse.json([
      { id: '1', title: 'Todo 1' },
      { id: '2', title: 'Todo 2' },
    ]);
  }),
  http.post('/api/todos', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: '3',
      ...body,
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Performance Optimization

### Query Optimization
```typescript
// 1. Use select to transform and limit data
const { data } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.slice(0, 10), // Only take first 10
});

// 2. Use placeholderData for instant UI
const { data } = useQuery({
  queryKey: ['todo', id],
  queryFn: () => fetchTodo(id),
  placeholderData: () => {
    // Use data from todos list as placeholder
    return queryClient
      .getQueryData<Todo[]>(['todos'])
      ?.find(todo => todo.id === id);
  },
});

// 3. Prefetch on hover
function TodoLink({ id }: { id: string }) {
  const queryClient = useQueryClient();
  
  const prefetchTodo = () => {
    queryClient.prefetchQuery({
      queryKey: ['todo', id],
      queryFn: () => fetchTodo(id),
      staleTime: 10 * 1000, // Only prefetch if older than 10s
    });
  };
  
  return (
    <Link to={`/todos/${id}`} onMouseEnter={prefetchTodo}>
      View Todo
    </Link>
  );
}
```

### Bundle Size Optimization
```typescript
// Import only what you need
import { useQuery } from '@tanstack/react-query';
// Not: import * as ReactQuery from '@tanstack/react-query';

// Use dynamic imports for DevTools
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(module => ({
    default: module.ReactQueryDevtools,
  }))
);
```

## Common Pitfalls

### 1. Not Handling Loading States
```typescript
// ❌ Bad
function TodoList() {
  const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
  return <ul>{data.map(todo => <li>{todo.title}</li>)}</ul>; // Error if data is undefined
}

// ✅ Good
function TodoList() {
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['todos'], 
    queryFn: fetchTodos 
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <ul>{data?.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>;
}
```

### 2. Mutating Cache Data
```typescript
// ❌ Bad - Direct mutation
queryClient.setQueryData(['todos'], (old) => {
  old.push(newTodo); // Mutating!
  return old;
});

// ✅ Good - Return new object
queryClient.setQueryData(['todos'], (old) => 
  old ? [...old, newTodo] : [newTodo]
);
```

### 3. Not Cancelling Queries in onMutate
```typescript
// ❌ Bad
onMutate: async (newData) => {
  // Not cancelling - may cause race conditions
  queryClient.setQueryData(['todos'], newData);
}

// ✅ Good
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ['todos'] });
  queryClient.setQueryData(['todos'], newData);
}
```

### 4. Using Array Syntax (Deprecated)
```typescript
// ❌ Bad - Array syntax removed in v5
const { data } = useQuery(['todos'], fetchTodos);

// ✅ Good - Object syntax required
const { data } = useQuery({ 
  queryKey: ['todos'], 
  queryFn: fetchTodos 
});
```

### 5. Not Awaiting Async Callbacks
```typescript
// ❌ Bad - Not returning promise
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['todos'] });
}

// ✅ Good - Return promise for proper pending state
onSettled: async () => {
  return await queryClient.invalidateQueries({ queryKey: ['todos'] });
}
```

## Advanced Patterns

### Dependent Queries
```typescript
function useUserTodos(userId: string) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  const { data: todos } = useQuery({
    queryKey: ['todos', { userId }],
    queryFn: () => fetchUserTodos(userId),
    enabled: !!user, // Only run when user is loaded
  });
  
  return { user, todos };
}
```

### Query Invalidation Strategies
```typescript
// Invalidate everything
queryClient.invalidateQueries();

// Invalidate by prefix
queryClient.invalidateQueries({ queryKey: ['todos'] });

// Invalidate exact
queryClient.invalidateQueries({ 
  queryKey: ['todos', { filter: 'completed' }],
  exact: true,
});

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => 
    query.queryKey[0] === 'todos' && query.state.dataUpdatedAt < Date.now() - 60000,
});
```

### Custom Hooks with Error Boundaries
```typescript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function MyApp() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              There was an error!
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          <TodoList />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Migration Notes

### From React Query v4 to TanStack Query v5
1. **Package name**: `react-query` → `@tanstack/react-query`
2. **cacheTime** → **gcTime**
3. **useQuery** requires object syntax
4. **Status checks**: No more `QueryStatus` enum, use strings
5. **Minimum React version**: 18.0
6. **New features**: Async mutation callbacks, improved TypeScript

### React 17 to React 18
1. **Root API**: `ReactDOM.render` → `createRoot().render()`
2. **Strict Mode**: Double-mounting in development
3. **Concurrent Features**: `useTransition`, `useDeferredValue`
4. **Suspense**: Better support for data fetching

## Debugging Tips

### Enable Query DevTools
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// In your app
<QueryClientProvider client={queryClient}>
  <App />
  {process.env.NODE_ENV === 'development' && (
    <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
  )}
</QueryClientProvider>
```

### Debug Cache State
```typescript
// Log all queries
console.log(queryClient.getQueryCache().getAll());

// Log specific query
console.log(queryClient.getQueryState(['todos']));

// Monitor cache changes
queryClient.getQueryCache().subscribe((event) => {
  console.log('Cache event:', event);
});
```

### Track Mutation States
```typescript
import { useMutationState } from '@tanstack/react-query';

function MutationMonitor() {
  const mutations = useMutationState({
    filters: { status: 'pending' },
  });
  
  return <div>Pending mutations: {mutations.length}</div>;
}
```

## Best Practices Summary

1. **Always use TypeScript** for type safety
2. **Configure staleTime and gcTime** appropriately for your use case
3. **Use query key factories** for consistent key management
4. **Implement proper error handling** with error boundaries
5. **Cancel queries in onMutate** to prevent race conditions
6. **Return promises from callbacks** for proper loading states
7. **Use select** to transform data and optimize re-renders
8. **Prefetch data** for better perceived performance
9. **Test with proper wrappers** and mock servers
10. **Monitor with DevTools** in development

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React 18 Docs](https://react.dev)
- [ALNRetool Codebase Examples](./src/hooks/mutations/entityMutations.ts)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)
- [Testing React Query](https://tkdodo.eu/blog/testing-react-query)