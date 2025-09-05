/**
 * Tooltip Helper Utilities
 * 
 * Provides consistent formatting functions for tooltips across the application.
 * Ensures uniform tooltip patterns and proper text truncation.
 * 
 * @module lib/graph/tooltipHelpers
 */

/**
 * Truncate long text for tooltips with ellipsis
 * @param text - Text to potentially truncate
 * @param maxLength - Maximum length before truncation (default: 150)
 * @returns Truncated text with ellipsis or original if under limit
 */
export const truncateTooltip = (text: string, maxLength = 150): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format a list of items for tooltip display with count and preview
 * @param label - Label for the list (e.g., "Owned Elements")
 * @param items - Array of item names to display
 * @param maxItems - Maximum number of items to show before "and X more" (default: 5)
 * @returns Formatted string with count and preview of items
 * 
 * @example
 * formatCountTooltip('Owned Elements', ['Sword', 'Shield', 'Potion', 'Map', 'Key', 'Ring'])
 * // Returns: "Owned Elements (6): Sword, Shield, Potion, Map, Key and 1 more"
 */
export const formatCountTooltip = (
  label: string,
  items: string[],
  maxItems = 5
): string => {
  if (!items || items.length === 0) {
    return `No ${label.toLowerCase()}`;
  }
  
  const validItems = items.filter(item => item && item !== 'Unknown');
  if (validItems.length === 0) {
    return `No ${label.toLowerCase()}`;
  }
  
  const shown = validItems.slice(0, maxItems);
  const remaining = validItems.length - maxItems;
  
  let result = `${label} (${validItems.length}): ${shown.join(', ')}`;
  if (remaining > 0) {
    result += ` and ${remaining} more`;
  }
  
  return result;
};

/**
 * Check if text would be truncated at given length
 * Useful for conditionally adding tooltips only when needed
 * @param text - Text to check
 * @param maxLength - Length at which truncation would occur
 * @returns True if text exceeds maxLength
 */
export const isTruncated = (text: string | undefined | null, maxLength: number): boolean => {
  if (!text) return false;
  return text.length > maxLength;
};

/**
 * Format a date for tooltip display
 * @param date - Date string or Date object
 * @returns Formatted date string for tooltip
 */
export const formatDateTooltip = (date: string | Date): string => {
  if (!date) return 'No date';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check for invalid date
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Build a multi-line tooltip string
 * @param lines - Array of lines to join
 * @returns Multi-line string suitable for title attribute
 */
export const buildMultilineTooltip = (lines: string[]): string => {
  return lines.filter(line => line && line.trim()).join('\n');
};

/**
 * Format a status with description for tooltip
 * @param status - Status identifier
 * @param description - Description of what the status means
 * @returns Formatted status tooltip
 */
export const formatStatusTooltip = (status: string, description: string): string => {
  return `${status}: ${description}`;
};

/**
 * Standard tier descriptions for character tooltips
 */
export const characterTierDescriptions = {
  'Core': 'Main character essential to story',
  'Secondary': 'Supporting character with significant role',
  'Tertiary': 'Background character for world-building'
} as const;

/**
 * Standard status descriptions for puzzle tooltips
 */
export const puzzleStatusDescriptions = {
  'draft': 'Draft: Missing required elements',
  'ready': 'Ready: All requirements configured',
  'locked': 'Locked: Prerequisites not met',
  'error': 'Error: Configuration issue detected'
} as const;

/**
 * Standard memory type descriptions for element tooltips
 */
export const memoryTypeDescriptions = {
  'Personal': 'Personal memory or emotional significance',
  'Business': 'Professional or business-related memory',
  'Technical': 'Technical or procedural memory'
} as const;