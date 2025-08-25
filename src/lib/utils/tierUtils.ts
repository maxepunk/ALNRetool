/**
 * Utility functions for tier normalization and handling
 * Streamlined to only include functions actually used in the codebase
 */

export type NormalizedTier = 'Core' | 'Secondary' | 'Tertiary';

/**
 * Normalize tier values from various formats to standard format
 * Handles case-insensitive matching and aliases
 * 
 * @param tier - Raw tier value from Notion or other sources
 * @returns Normalized tier value
 */
export function normalizeTier(tier: string | undefined | null): NormalizedTier {
  if (!tier) return 'Tertiary'; // Default for missing tiers
  
  const lowerTier = tier.toLowerCase().trim();
  
  // Core tier aliases
  if (lowerTier === 'core' || lowerTier === 'tier 1' || lowerTier === '1') {
    return 'Core';
  }
  
  // Secondary tier aliases
  if (lowerTier === 'secondary' || lowerTier === 'tier 2' || lowerTier === '2') {
    return 'Secondary';
  }
  
  // Everything else is Tertiary
  return 'Tertiary';
}

/**
 * Get tier badge variant for UI components
 */
export function getTierBadgeVariant(tier: string | undefined | null): "default" | "secondary" | "outline" {
  const normalized = normalizeTier(tier);
  switch (normalized) {
    case 'Core':
      return 'default';
    case 'Secondary':
      return 'secondary';
    case 'Tertiary':
    default:
      return 'outline';
  }
}