/**
 * SF_ Pattern validation utilities
 */

export interface SFPattern {
  type: string;
  value: string | undefined;
  raw: string;
}

/**
 * Parse SF_ patterns from text
 */
export function parseSFPatterns(text: string): SFPattern[] {
  const patterns: SFPattern[] = [];
  const regex = /SF_([A-Z_]+)(?::([^\s]+))?/g;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    patterns.push({
      type: match[1]!,
      value: match[2],
      raw: match[0],
    });
  }
  
  return patterns;
}

/**
 * Validate SF_ pattern format
 */
export function validateSFPattern(pattern: string): boolean {
  return /^SF_[A-Z_]+(?::[^\s]+)?$/.test(pattern);
}

/**
 * Known SF_ pattern types
 */
export const SF_PATTERN_TYPES = {
  RFID: 'RFID',
  VALUE: 'VALUE',
  LOCK: 'LOCK',
  KEY: 'KEY',
  QR: 'QR',
  NFC: 'NFC',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  IMAGE: 'IMAGE',
  DOC: 'DOC',
} as const;

/**
 * Validate known SF_ pattern type
 */
export function isKnownSFPattern(type: string): boolean {
  return Object.values(SF_PATTERN_TYPES).includes(type as any);
}

/**
 * Preserve SF_ patterns when updating text
 */
export function preserveSFPatterns(originalText: string, newText: string): string {
  const originalPatterns = parseSFPatterns(originalText);
  const newPatterns = parseSFPatterns(newText);
  
  // If patterns haven't changed, return new text as-is
  if (originalPatterns.length === newPatterns.length &&
      originalPatterns.every((p, i) => p.raw === newPatterns[i]?.raw)) {
    return newText;
  }
  
  // Otherwise, ensure original patterns are preserved
  let result = newText;
  originalPatterns.forEach(pattern => {
    if (!result.includes(pattern.raw)) {
      result += ` ${pattern.raw}`;
    }
  });
  
  return result;
}