/**
 * Feature Flag System
 * 
 * Enables gradual rollout of refactored components
 * Flags can be controlled via environment variables or localStorage
 */

export interface FeatureFlags {
  // Phase 2: DetailPanel refactoring
  USE_REFACTORED_DETAIL_PANEL: boolean;
  USE_NEW_FIELD_EDITORS: boolean;
  USE_ENTITY_FORM_HOOK: boolean;
  
  // Phase 3: Hook consolidation
  USE_GENERIC_NOTION_HOOKS: boolean;
  
  // Phase 4: Backend improvements
  USE_CACHED_MIDDLEWARE: boolean;
  USE_ENDPOINT_FACTORY: boolean;
  
  // Phase 5: Animation improvements
  USE_REDUCER_ANIMATION: boolean;
  USE_SPLIT_ANIMATION_HOOKS: boolean;
  
  // Phase 6: Module splitting
  USE_SPLIT_EDGE_BUILDERS: boolean;
  USE_SPLIT_RELATIONSHIPS: boolean;
  
  // Phase 8: Performance optimizations
  USE_VIRTUAL_SCROLLING: boolean;
  USE_CODE_SPLITTING: boolean;
}

// Default flag values (all false for gradual rollout)
const defaultFlags: FeatureFlags = {
  USE_REFACTORED_DETAIL_PANEL: false,
  USE_NEW_FIELD_EDITORS: false,
  USE_ENTITY_FORM_HOOK: false,
  USE_GENERIC_NOTION_HOOKS: false,
  USE_CACHED_MIDDLEWARE: false,
  USE_ENDPOINT_FACTORY: false,
  USE_REDUCER_ANIMATION: false,
  USE_SPLIT_ANIMATION_HOOKS: false,
  USE_SPLIT_EDGE_BUILDERS: false,
  USE_SPLIT_RELATIONSHIPS: false,
  USE_VIRTUAL_SCROLLING: false,
  USE_CODE_SPLITTING: false,
};

/**
 * Get feature flag value
 * Priority: localStorage > environment variable > default
 */
export function getFeatureFlag(flag: keyof FeatureFlags): boolean {
  // Check localStorage first (for runtime toggles)
  if (typeof window !== 'undefined') {
    const localStorageKey = `feature_${flag}`;
    const localValue = localStorage.getItem(localStorageKey);
    if (localValue !== null) {
      return localValue === 'true';
    }
  }

  // Check environment variable
  if (typeof process !== 'undefined' && process.env) {
    const envKey = `VITE_FEATURE_${flag}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return envValue === 'true';
    }
  }

  // Return default value
  return defaultFlags[flag];
}

/**
 * Set feature flag value in localStorage
 */
export function setFeatureFlag(flag: keyof FeatureFlags, value: boolean): void {
  if (typeof window !== 'undefined') {
    const localStorageKey = `feature_${flag}`;
    localStorage.setItem(localStorageKey, String(value));
  }
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): FeatureFlags {
  const flags: FeatureFlags = { ...defaultFlags };
  
  for (const key in flags) {
    flags[key as keyof FeatureFlags] = getFeatureFlag(key as keyof FeatureFlags);
  }
  
  return flags;
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  if (typeof window !== 'undefined') {
    for (const key in defaultFlags) {
      const localStorageKey = `feature_${key}`;
      localStorage.removeItem(localStorageKey);
    }
  }
}

/**
 * Enable all feature flags (useful for testing)
 */
export function enableAllFeatureFlags(): void {
  for (const key in defaultFlags) {
    setFeatureFlag(key as keyof FeatureFlags, true);
  }
}

/**
 * Disable all feature flags (useful for rollback)
 */
export function disableAllFeatureFlags(): void {
  for (const key in defaultFlags) {
    setFeatureFlag(key as keyof FeatureFlags, false);
  }
}

/**
 * Hook for using feature flags in React components
 */
import { useState, useEffect } from 'react';

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const [value, setValue] = useState(() => getFeatureFlag(flag));

  useEffect(() => {
    // Check for changes periodically (for runtime toggles)
    const interval = setInterval(() => {
      const newValue = getFeatureFlag(flag);
      if (newValue !== value) {
        setValue(newValue);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [flag, value]);

  return value;
}

/**
 * Hook for getting all feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState(() => getAllFeatureFlags());

  useEffect(() => {
    // Check for changes periodically
    const interval = setInterval(() => {
      setFlags(getAllFeatureFlags());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return flags;
}

// Export type for use in other files
export type { FeatureFlags as FeatureFlagsType };