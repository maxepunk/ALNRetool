/**
 * SF_ Pattern Parser
 * Extracts game mechanic metadata from element descriptions
 * 
 * Pattern Format:
 * - SF_RFID: [unique identifier]
 * - SF_ValueRating: [1-5]
 * - SF_MemoryType: [Personal|Business|Technical]
 * - SF_Group: [{Group Name} (x2-10)]
 */

import type { SFMetadata } from './types';

// ============================================================================
// Regular Expressions
// ============================================================================

/**
 * Regex patterns for extracting SF_ metadata
 * Using non-greedy matching and proper escaping
 */
const SF_PATTERNS = {
  /** Matches SF_RFID: [anything] */
  rfid: /SF_RFID:\s*\[([^\]]+)\]/i,
  
  /** Matches SF_ValueRating: [1-5] */
  valueRating: /SF_ValueRating:\s*\[(\d+)\]/i,
  
  /** Matches SF_MemoryType: [Personal|Business|Technical] */
  memoryType: /SF_MemoryType:\s*\[(Personal|Business|Technical)\]/i,
  
  /** Matches SF_Group: [Group Name (xN)] where N is multiplier */
  group: /SF_Group:\s*\[([^\]]+?)(?:\s*\(x(\d+(?:\.\d+)?)\))?\]/i,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Memory type multipliers based on game rules
 */
const MEMORY_TYPE_MULTIPLIERS: Record<string, number> = {
  'Personal': 1,
  'Business': 3,
  'Technical': 5,
};

/**
 * Extraction result with debug information
 */
export interface ExtractionResult {
  metadata: SFMetadata;
  patternsFound: string[];
  warnings: string[];
}

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Extract RFID from text
 */
function extractRFID(text: string): string | undefined {
  const match = text.match(SF_PATTERNS.rfid);
  return match?.[1]?.trim();
}

/**
 * Extract value rating (1-5)
 */
function extractValueRating(text: string): number | undefined {
  const match = text.match(SF_PATTERNS.valueRating);
  if (!match?.[1]) return undefined;
  
  const value = parseInt(match[1], 10);
  
  // Validate range
  if (value < 1 || value > 5) {
    console.warn(`SF_ValueRating out of range (1-5): ${value}`);
    return undefined;
  }
  
  return value;
}

/**
 * Extract memory type and return normalized value
 */
function extractMemoryType(text: string): 'Personal' | 'Business' | 'Technical' | undefined {
  const match = text.match(SF_PATTERNS.memoryType);
  if (!match?.[1]) return undefined;
  
  // Normalize case
  const type = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  
  if (type === 'Personal' || type === 'Business' || type === 'Technical') {
    return type;
  }
  
  console.warn(`Unknown SF_MemoryType: ${match[1]}`);
  return undefined;
}

/**
 * Extract group name and optional multiplier
 */
function extractGroup(text: string): { name: string; multiplier?: number } | undefined {
  const match = text.match(SF_PATTERNS.group);
  if (!match?.[1]) return undefined;
  
  const result: { name: string; multiplier?: number } = {
    name: match[1].trim(),
  };
  
  // Extract multiplier if present (x2, x3.5, etc.)
  if (match[2]) {
    const multiplier = parseFloat(match[2]);
    if (!isNaN(multiplier) && multiplier >= 1 && multiplier <= 10) {
      result.multiplier = multiplier;
    } else {
      console.warn(`Invalid group multiplier: ${match[2]}`);
    }
  }
  
  return result;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Extract all SF_ patterns from a text string
 * @param text - The text to parse (typically from Element.description)
 * @returns Extracted metadata with patterns found and warnings
 */
export function extractSFMetadata(text: string | null | undefined): ExtractionResult {
  const result: ExtractionResult = {
    metadata: {},
    patternsFound: [],
    warnings: [],
  };
  
  // Handle null/undefined gracefully
  if (!text) {
    return result;
  }
  
  // Extract RFID
  const rfid = extractRFID(text);
  if (rfid) {
    result.metadata.rfid = rfid;
    result.patternsFound.push('SF_RFID');
  }
  
  // Extract Value Rating
  const valueRating = extractValueRating(text);
  if (valueRating !== undefined) {
    result.metadata.valueRating = valueRating;
    result.patternsFound.push('SF_ValueRating');
  }
  
  // Extract Memory Type
  const memoryType = extractMemoryType(text);
  if (memoryType) {
    result.metadata.memoryType = memoryType;
    result.patternsFound.push('SF_MemoryType');
  }
  
  // Extract Group
  const group = extractGroup(text);
  if (group) {
    result.metadata.group = group.name;
    if (group.multiplier) {
      result.metadata.multiplier = group.multiplier;
    }
    result.patternsFound.push('SF_Group');
  }
  
  // Calculate total multiplier if we have memory type but no explicit multiplier
  if (memoryType && !result.metadata.multiplier) {
    result.metadata.multiplier = MEMORY_TYPE_MULTIPLIERS[memoryType];
  }
  
  // Combine multipliers if we have both
  if (memoryType && group?.multiplier) {
    const typeMultiplier = MEMORY_TYPE_MULTIPLIERS[memoryType];
    if (typeMultiplier) {
      result.metadata.multiplier = typeMultiplier * group.multiplier;
    }
  }
  
  // Add warnings for incomplete patterns
  if (result.patternsFound.length > 0 && result.patternsFound.length < 4) {
    const missing = ['SF_RFID', 'SF_ValueRating', 'SF_MemoryType', 'SF_Group']
      .filter(p => !result.patternsFound.includes(p));
    result.warnings.push(`Missing patterns: ${missing.join(', ')}`);
  }
  
  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick check if text contains any SF_ patterns
 */
export function hasSFPatterns(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.includes('SF_');
}

/**
 * Format SF metadata for display
 */
export function formatSFMetadata(metadata: SFMetadata): string {
  const parts: string[] = [];
  
  if (metadata.rfid) {
    parts.push(`RFID: ${metadata.rfid}`);
  }
  
  if (metadata.valueRating !== undefined) {
    parts.push(`Value: ${metadata.valueRating}/5`);
  }
  
  if (metadata.memoryType) {
    parts.push(`Type: ${metadata.memoryType}`);
  }
  
  if (metadata.group) {
    parts.push(`Group: ${metadata.group}`);
  }
  
  if (metadata.multiplier !== undefined) {
    parts.push(`Multiplier: x${metadata.multiplier}`);
  }
  
  return parts.join(' | ');
}

