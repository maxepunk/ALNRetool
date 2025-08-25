/**
 * CSRF Token Hook
 * Manages CSRF token fetching and inclusion in API requests
 */

import { useQuery } from '@tanstack/react-query';

interface CSRFTokenResponse {
  token: string;
}

/**
 * Fetch CSRF token from the server
 */
async function fetchCSRFToken(): Promise<string> {
  const response = await fetch('/api/csrf-token', {
    method: 'GET',
    credentials: 'include', // Include cookies
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  const data: CSRFTokenResponse = await response.json();
  return data.token;
}

/**
 * Hook to manage CSRF token
 */
export function useCSRFToken() {
  const { data: token, isLoading, error, refetch } = useQuery({
    queryKey: ['csrf-token'],
    queryFn: fetchCSRFToken,
    staleTime: 30 * 60 * 1000, // Token is fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  return {
    token,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Add CSRF token to fetch headers
 */
export function addCSRFToken(headers: HeadersInit, token: string | undefined): HeadersInit {
  if (!token) return headers;
  
  if (headers instanceof Headers) {
    headers.set('X-CSRF-Token', token);
    return headers;
  }
  
  if (Array.isArray(headers)) {
    return [...headers, ['X-CSRF-Token', token]];
  }
  
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

/**
 * Enhanced fetch with automatic CSRF token inclusion
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  // Only add CSRF token for state-changing methods
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    options.method?.toUpperCase() || 'GET'
  );
  
  if (needsCSRF && token) {
    options.headers = addCSRFToken(options.headers || {}, token);
  }
  
  // Always include credentials for cookie-based sessions
  options.credentials = options.credentials || 'include';
  
  return fetch(url, options);
}