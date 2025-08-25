/**
 * @module useDebounce
 * @description React hooks for debouncing values and callbacks
 * 
 * Provides utilities to prevent excessive updates and function calls by delaying
 * execution until a specified time has passed without new inputs. Essential for
 * optimizing performance in search fields, API calls, and real-time updates.
 * 
 * @example
 * ```typescript
 * // Debounce search input
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   // API call only fires 300ms after user stops typing
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Debounces a value to prevent excessive updates
 * 
 * @template T - The type of the value being debounced
 * @param {T} value - The value to debounce
 * @param {number} delay - The delay in milliseconds before updating
 * @returns {T} The debounced value
 * 
 * @complexity O(1) - Single timeout operation
 * 
 * @flow
 * 1. Value changes → Clear existing timeout
 * 2. Set new timeout for delay milliseconds
 * 3. When timeout fires → Update debounced value
 * 4. Component unmount → Clear pending timeout
 * 
 * @example
 * ```typescript
 * const [input, setInput] = useState('');
 * const debouncedInput = useDebounce(input, 500);
 * 
 * // debouncedInput updates 500ms after input stops changing
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounces a callback function to prevent excessive invocations
 * 
 * @template T - The function type being debounced
 * @param {T} callback - The function to debounce
 * @param {number} delay - The delay in milliseconds before execution
 * @returns {Function} A debounced version of the callback
 * 
 * @complexity O(1) - Single timeout operation per invocation
 * 
 * @flow
 * 1. Function called → Cancel any pending execution
 * 2. Schedule new execution after delay
 * 3. Delay passes → Execute callback with latest arguments
 * 4. Component unmount → Cancel pending execution
 * 
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback(
 *   async (query: string) => {
 *     const results = await searchAPI(query);
 *     setResults(results);
 *   },
 *   300
 * );
 * 
 * // Call repeatedly - only executes 300ms after last call
 * handleSearch('react');
 * handleSearch('react hooks');
 * handleSearch('react hooks debounce'); // Only this executes
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref on each render
  callbackRef.current = callback;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
    }, delay);
  };
}

/**
 * Combines useState with debouncing for optimized state management
 * 
 * @template T - The type of the state value
 * @param {T} initialValue - The initial state value
 * @param {number} delay - The delay in milliseconds before updating debounced value
 * @returns {[T, T, Function]} Tuple of [currentValue, debouncedValue, setValue]
 * 
 * @complexity O(1) - State update and timeout operations
 * 
 * @flow
 * 1. setValue called → Update immediate value instantly
 * 2. Start debounce timer for delayed value
 * 3. Additional setValue calls → Reset timer
 * 4. Timer expires → Update debounced value
 * 
 * @example
 * ```typescript
 * const [search, debouncedSearch, setSearch] = useDebouncedState('', 500);
 * 
 * // search updates immediately for UI responsiveness
 * // debouncedSearch updates 500ms later for API calls
 * 
 * return (
 *   <input value={search} onChange={e => setSearch(e.target.value)} />
 * );
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return [value, debouncedValue, setValue];
}

/**
 * Debounces a value with loading state indicator
 * 
 * Provides both the debounced value and a boolean flag indicating whether
 * debouncing is in progress. Essential for showing loading spinners or
 * skeleton states during the debounce delay period.
 * 
 * @template T - The type of the value being debounced
 * @param {T} value - The value to debounce
 * @param {number} delay - The delay in milliseconds before updating
 * @returns {Object} Object containing debouncedValue and isDebouncing flag
 * 
 * @complexity O(1) - State updates and timeout operations
 * 
 * @flow
 * 1. Value changes → Set isDebouncing to true
 * 2. Clear existing timeout, schedule new one
 * 3. During delay → isDebouncing remains true
 * 4. Timeout fires → Update debouncedValue, set isDebouncing to false
 * 5. Component unmount → Clear pending timeout
 * 
 * @example
 * ```typescript
 * const [query, setQuery] = useState('');
 * const { debouncedValue, isDebouncing } = useDebouncedSearch(query, 300);
 * 
 * useEffect(() => {
 *   if (!isDebouncing && debouncedValue) {
 *     fetchResults(debouncedValue);
 *   }
 * }, [debouncedValue, isDebouncing]);
 * 
 * return (
 *   <>
 *     <input value={query} onChange={e => setQuery(e.target.value)} />
 *     {isDebouncing && <Spinner />}
 *   </>
 * );
 * ```
 */
export function useDebouncedSearch<T>(
  value: T,
  delay: number
): {
  debouncedValue: T;
  isDebouncing: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
}