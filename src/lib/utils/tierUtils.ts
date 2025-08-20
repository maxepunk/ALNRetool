/**
 * Utility functions for tier normalization and handling
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
 * Get tier display name for UI
 */
export function getTierDisplayName(tier: NormalizedTier): string {
  return tier; // Already in display format
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

/**
 * Get tier color classes for styling
 */
export function getTierColorClasses(tier: string | undefined | null): string {
  const normalized = normalizeTier(tier);
  switch (normalized) {
    case 'Core':
      return 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-400';
    case 'Secondary':
      return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400';
    case 'Tertiary':
    default:
      return 'bg-gradient-to-br from-gray-500/20 to-slate-500/20 border-gray-400';
  }
}

/**
 * Get tier icon name for Lucide icons
 */
export function getTierIconName(tier: string | undefined | null): 'Crown' | 'Star' | 'Circle' {
  const normalized = normalizeTier(tier);
  switch (normalized) {
    case 'Core':
      return 'Crown';
    case 'Secondary':
      return 'Star';
    case 'Tertiary':
    default:
      return 'Circle';
  }
}

/**
 * Check if a character's tier matches the filter criteria
 */
export function matchesTierFilter(
  characterTier: string | undefined | null,
  selectedTiers: Set<NormalizedTier>
): boolean {
  if (selectedTiers.size === 0) return true; // No filter applied
  const normalized = normalizeTier(characterTier);
  return selectedTiers.has(normalized);
}