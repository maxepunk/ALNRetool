/**
 * Professional SF_ pattern parser for ALNRetool murder mystery game mechanics.
 * 
 * Provides comprehensive extraction and parsing of Science Fiction (SF_) metadata patterns
 * embedded within element descriptions, enabling advanced game mechanic processing,
 * investigation weighting, and relationship analysis for "About Last Night" gameplay.
 * 
 * **SF_ Pattern System:**
 * The "About Last Night" murder mystery incorporates Science Fiction elements through
 * structured metadata patterns that define game mechanics, evidence importance,
 * and investigation multipliers for enhanced puzzle-solving experiences.
 * 
 * **Supported Pattern Formats:**
 * - **SF_RFID**: `[unique-identifier-string]` - Unique element identification
 * - **SF_ValueRating**: `[1-5]` - Evidence importance rating (1=minor, 5=critical)
 * - **SF_MemoryType**: `[Personal|Business|Technical]` - Memory category with multipliers
 * - **SF_Group**: `[{Group Name} (x2-10)]` - Group affiliation with optional multipliers
 * 
 * **Memory Type Multiplier System:**
 * - **Personal**: 1x multiplier - Personal memories and relationships
 * - **Business**: 3x multiplier - Professional and business-related evidence  
 * - **Technical**: 5x multiplier - Technical evidence and specialized knowledge
 * 
 * **Key Features:**
 * - Robust regex-based pattern extraction with validation
 * - Automatic multiplier calculation and combination
 * - Comprehensive error handling and logging
 * - Pattern completeness analysis with warnings
 * - Debug-friendly extraction results with metadata tracking
 * - Case-insensitive pattern matching with normalization
 * 
 * **Investigation Integration:**
 * - Evidence weighting for graph layout algorithms
 * - Importance scoring for investigation prioritization  
 * - Group-based clustering for related evidence analysis
 * - Multiplier stacking for complex evidence relationships
 * 
 * @example
 * ```typescript
 * // Extract SF_ metadata from element description
 * const description = `
 *   This mysterious device contains:
 *   SF_RFID: [DEVICE_MARCUS_001]
 *   SF_ValueRating: [4]
 *   SF_MemoryType: [Technical]
 *   SF_Group: [Security Systems (x2.5)]
 * `;
 * 
 * const result = extractSFMetadata(description);
 * console.log('Extracted metadata:', result.metadata);
 * // Output: {
 * //   rfid: 'DEVICE_MARCUS_001',
 * //   valueRating: 4,
 * //   memoryType: 'Technical', 
 * //   group: 'Security Systems',
 * //   multiplier: 12.5  // Technical (5x) * Group (2.5x)
 * // }
 * 
 * // Check for patterns in evidence descriptions
 * const hasPatterns = hasSFPatterns(evidenceDescription);
 * if (hasPatterns) {
 *   const metadata = extractSFMetadata(evidenceDescription);
 *   applyEvidenceWeighting(evidence, metadata.metadata.multiplier);
 * }
 * 
 * // Format metadata for investigation display
 * const displayText = formatSFMetadata(result.metadata);
 * console.log('Evidence details:', displayText);
 * // Output: "RFID: DEVICE_MARCUS_001 | Value: 4/5 | Type: Technical | Group: Security Systems | Multiplier: x12.5"
 * ```
 * 
 * @see {@link SFMetadata} For metadata structure definitions
 * @see {@link ExtractionResult} For extraction result interface
 * 
 * @author ALNRetool Development Team
 * @since 1.0.0
 * @module patterns
 */

import type { SFMetadata } from './types';



// ============================================================================
// Regular Expressions
// ============================================================================

/**
 * Professional regex patterns for extracting SF_ metadata from element descriptions.
 * 
 * Implements comprehensive pattern matching for "About Last Night" murder mystery
 * Science Fiction elements, using optimized non-greedy matching and proper escaping
 * for robust text parsing and metadata extraction.
 * 
 * **Pattern Design Principles:**
 * - **Non-greedy Matching**: Uses `+?` and `*?` to prevent over-matching
 * - **Proper Escaping**: Escaped brackets `\[` and `\]` for literal matching
 * - **Case Insensitivity**: All patterns use `/i` flag for flexible input
 * - **Validation Ready**: Designed for downstream validation and error handling
 * 
 * **Pattern Categories:**
 * - **Identifiers**: RFID patterns for unique element identification
 * - **Ratings**: Numeric value patterns with range validation (1-5)
 * - **Types**: Enumerated memory type patterns with exact matching
 * - **Groups**: Complex group patterns with optional multiplier extraction
 * 
 * @example
 * ```typescript
 * // RFID pattern matching
 * const rfidMatch = 'SF_RFID: [EVIDENCE_001]'.match(SF_PATTERNS.rfid);
 * console.log('RFID:', rfidMatch?.[1]); // 'EVIDENCE_001'
 * 
 * // Value rating with validation
 * const ratingMatch = 'SF_ValueRating: [4]'.match(SF_PATTERNS.valueRating);
 * console.log('Rating:', ratingMatch?.[1]); // '4'
 * 
 * // Memory type classification
 * const typeMatch = 'SF_MemoryType: [Technical]'.match(SF_PATTERNS.memoryType);
 * console.log('Type:', typeMatch?.[1]); // 'Technical'
 * 
 * // Group with multiplier extraction
 * const groupMatch = 'SF_Group: [Security Team (x3.5)]'.match(SF_PATTERNS.group);
 * console.log('Group:', groupMatch?.[1]); // 'Security Team'
 * console.log('Multiplier:', groupMatch?.[2]); // '3.5'
 * ```
 * 
 * @see {@link extractSFMetadata} For pattern usage in extraction
 * @see {@link ExtractionResult} For extraction result structure
 * 
 * @remarks
 * **Regex Performance Optimization:**
 * - Compiled once at module load for efficiency
 * - Non-capturing groups where possible to reduce memory
 * - Specific character classes for better performance than generic patterns
 * - Optimized for typical SF_ pattern lengths and structures
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
 * Memory type multipliers based on "About Last Night" investigation game rules.
 * 
 * Defines evidence weighting multipliers for different memory categories within
 * the murder mystery investigation system, enabling sophisticated evidence 
 * importance calculation and investigation priority scoring.
 * 
 * **Multiplier Rationale:**
 * - **Personal (1x)**: Basic personal memories, relationships, everyday interactions
 * - **Business (3x)**: Professional evidence, work relationships, business dealings
 * - **Technical (5x)**: Specialized technical knowledge, expert evidence, complex systems
 * 
 * **Investigation Applications:**
 * - Evidence prioritization in graph layout algorithms
 * - Witness testimony importance weighting
 * - Technical evidence emphasis in investigation workflows
 * - Automatic evidence clustering by importance tier
 * 
 * **Game Balance Design:**
 * The progressive multiplier system (1x → 3x → 5x) ensures that technical
 * evidence receives appropriate emphasis while maintaining investigation balance
 * and preventing over-emphasis on any single evidence category.
 * 
 * @example
 * ```typescript
 * // Calculate evidence importance
 * const getEvidenceWeight = (memoryType: string, baseValue: number = 1) => {
 *   const multiplier = MEMORY_TYPE_MULTIPLIERS[memoryType] || 1;
 *   return baseValue * multiplier;
 * };
 * 
 * // Evidence weighting examples
 * console.log('Personal evidence:', getEvidenceWeight('Personal', 10)); // 10
 * console.log('Business evidence:', getEvidenceWeight('Business', 10)); // 30  
 * console.log('Technical evidence:', getEvidenceWeight('Technical', 10)); // 50
 * 
 * // Investigation priority calculation
 * const prioritizeEvidence = (evidence: Evidence[]) => {
 *   return evidence.sort((a, b) => {
 *     const aWeight = getEvidenceWeight(a.memoryType, a.valueRating);
 *     const bWeight = getEvidenceWeight(b.memoryType, b.valueRating);
 *     return bWeight - aWeight; // Highest priority first
 *   });
 * };
 * ```
 * 
 * @see {@link extractSFMetadata} For memory type extraction
 * @see {@link SFMetadata} For metadata structure
 * 
 * @readonly Immutable game balance constants
 */
const MEMORY_TYPE_MULTIPLIERS: Record<string, number> = {
  'Personal': 1,
  'Business': 3,
  'Technical': 5,
};

/**
 * Comprehensive extraction result with metadata and debug information.
 * 
 * Provides detailed results from SF_ pattern extraction including successfully
 * parsed metadata, pattern discovery tracking, and validation warnings for
 * comprehensive debugging and investigation workflow integration.
 * 
 * **Result Components:**
 * - **metadata**: Successfully extracted and validated SF_ data
 * - **patternsFound**: Tracking of which patterns were successfully matched
 * - **warnings**: Validation issues and missing pattern notifications
 * 
 * **Debug Integration:**
 * - Pattern completeness analysis for quality assurance
 * - Warning system for incomplete or malformed patterns
 * - Extraction tracking for investigation workflow debugging
 * - Metadata validation results for error handling
 * 
 * @interface ExtractionResult
 * 
 * @example
 * ```typescript
 * // Complete extraction with all patterns
 * const fullResult: ExtractionResult = {
 *   metadata: {
 *     rfid: 'EVIDENCE_MARCUS_001',
 *     valueRating: 4,
 *     memoryType: 'Technical',
 *     group: 'Security Systems',
 *     multiplier: 12.5
 *   },
 *   patternsFound: ['SF_RFID', 'SF_ValueRating', 'SF_MemoryType', 'SF_Group'],
 *   warnings: [] // No warnings for complete extraction
 * };
 * 
 * // Partial extraction with warnings
 * const partialResult: ExtractionResult = {
 *   metadata: {
 *     rfid: 'PARTIAL_001',
 *     valueRating: 3
 *   },
 *   patternsFound: ['SF_RFID', 'SF_ValueRating'],
 *   warnings: ['Missing patterns: SF_MemoryType, SF_Group']
 * };
 * 
 * // Debug extraction results
 * const debugExtraction = (result: ExtractionResult) => {
 *   console.log('Patterns found:', result.patternsFound.length + '/4');
 *   if (result.warnings.length > 0) {
 *     console.warn('Extraction warnings:', result.warnings);
 *   }
 *   return result.metadata;
 * };
 * ```
 * 
 * @see {@link SFMetadata} For metadata structure
 * @see {@link extractSFMetadata} For extraction function
 */
export interface ExtractionResult {
  /** Successfully extracted and validated SF_ metadata */
  metadata: SFMetadata;
  /** Array of pattern names that were successfully found and parsed */
  patternsFound: string[];
  /** Validation warnings and missing pattern notifications */
  warnings: string[];
}

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Extract RFID (unique identifier) from SF_ pattern text.
 * 
 * Parses SF_RFID pattern to extract unique element identifiers for evidence
 * tracking, investigation organization, and cross-reference analysis within
 * the "About Last Night" murder mystery investigation system.
 * 
 * **Pattern Format**: `SF_RFID: [unique-identifier]`
 * **Use Cases**: Evidence tracking, element cross-referencing, investigation organization
 * 
 * @param text Text containing potential SF_RFID pattern
 * @returns Extracted RFID string or undefined if pattern not found
 * 
 * @complexity O(n) - single regex match operation
 * 
 * @example
 * ```typescript
 * // Standard RFID extraction
 * const rfid1 = extractRFID('SF_RFID: [EVIDENCE_MARCUS_001]');
 * console.log(rfid1); // 'EVIDENCE_MARCUS_001'
 * 
 * // Case insensitive matching
 * const rfid2 = extractRFID('sf_rfid: [witness_statement_001]');
 * console.log(rfid2); // 'witness_statement_001'
 * 
 * // No pattern found
 * const rfid3 = extractRFID('No SF patterns here');
 * console.log(rfid3); // undefined
 * 
 * // Complex identifier with special characters
 * const rfid4 = extractRFID('SF_RFID: [DEVICE_SECURITY_2024-03-15_v2.1]');
 * console.log(rfid4); // 'DEVICE_SECURITY_2024-03-15_v2.1'
 * ```
 * 
 * @see {@link SF_PATTERNS.rfid} For regex pattern definition
 * @see {@link extractSFMetadata} For complete metadata extraction
 * 
 * @internal Private extraction function for RFID processing
 */
function extractRFID(text: string): string | undefined {
  const match = text.match(SF_PATTERNS.rfid);
  return match?.[1]?.trim();
}

/**
 * Extract and validate value rating from SF_ pattern text.
 * 
 * Parses SF_ValueRating pattern to extract evidence importance ratings (1-5 scale)
 * with comprehensive validation, enabling investigation priority scoring and
 * evidence weighting for murder mystery analysis workflows.
 * 
 * **Pattern Format**: `SF_ValueRating: [1-5]`
 * **Rating Scale**: 1=Minor evidence, 3=Important evidence, 5=Critical evidence
 * **Validation**: Automatic range checking with logging for invalid values
 * 
 * @param text Text containing potential SF_ValueRating pattern
 * @returns Validated rating number (1-5) or undefined if invalid/not found
 * 
 * @complexity O(n) - single regex match with validation
 * 
 * @example
 * ```typescript
 * // Valid rating extraction
 * const rating1 = extractValueRating('SF_ValueRating: [4]');
 * console.log(rating1); // 4
 * 
 * // Minimum valid rating
 * const rating2 = extractValueRating('SF_ValueRating: [1]');
 * console.log(rating2); // 1
 * 
 * // Maximum valid rating  
 * const rating3 = extractValueRating('SF_ValueRating: [5]');
 * console.log(rating3); // 5
 * 
 * // Invalid rating (out of range) - logs warning
 * const rating4 = extractValueRating('SF_ValueRating: [7]');
 * console.log(rating4); // undefined (warning logged)
 * 
 * // Invalid rating (zero) - logs warning
 * const rating5 = extractValueRating('SF_ValueRating: [0]');
 * console.log(rating5); // undefined (warning logged)
 * 
 * // No pattern found
 * const rating6 = extractValueRating('No rating pattern');
 * console.log(rating6); // undefined
 * ```
 * 
 * @see {@link SF_PATTERNS.valueRating} For regex pattern definition
 * @see {@link logger} For validation warning logging
 * 
 * @internal Private extraction function with range validation
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
 * Extract and normalize memory type from SF_ pattern text.
 * 
 * Parses SF_MemoryType pattern to extract evidence category classification
 * with automatic case normalization and validation, enabling proper multiplier
 * application and evidence categorization in investigation workflows.
 * 
 * **Pattern Format**: `SF_MemoryType: [Personal|Business|Technical]`
 * **Valid Types**: Personal (1x), Business (3x), Technical (5x)
 * **Normalization**: Automatic case correction for consistent processing
 * 
 * @param text Text containing potential SF_MemoryType pattern
 * @returns Normalized memory type or undefined if invalid/not found
 * 
 * @complexity O(n) - single regex match with case normalization
 * 
 * @example
 * ```typescript
 * // Standard memory type extraction
 * const type1 = extractMemoryType('SF_MemoryType: [Technical]');
 * console.log(type1); // 'Technical'
 * 
 * // Case normalization (lowercase input)
 * const type2 = extractMemoryType('SF_MemoryType: [personal]');
 * console.log(type2); // 'Personal'
 * 
 * // Case normalization (mixed case input)
 * const type3 = extractMemoryType('SF_MemoryType: [bUsInEsS]');
 * console.log(type3); // 'Business'
 * 
 * // Invalid memory type - logs warning
 * const type4 = extractMemoryType('SF_MemoryType: [Unknown]');
 * console.log(type4); // undefined (warning logged)
 * 
 * // No pattern found
 * const type5 = extractMemoryType('No memory type pattern');
 * console.log(type5); // undefined
 * 
 * // Integration with multipliers
 * const applyMultiplier = (type: string) => {
 *   const memType = extractMemoryType(`SF_MemoryType: [${type}]`);
 *   return memType ? MEMORY_TYPE_MULTIPLIERS[memType] : 1;
 * };
 * console.log(applyMultiplier('Technical')); // 5
 * ```
 * 
 * @see {@link SF_PATTERNS.memoryType} For regex pattern definition
 * @see {@link MEMORY_TYPE_MULTIPLIERS} For multiplier values
 * @see {@link logger} For validation warning logging
 * 
 * @internal Private extraction function with normalization and validation
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
 * Extract group name and optional multiplier from SF_ pattern text.
 * 
 * Parses SF_Group pattern to extract evidence group affiliation and associated
 * multipliers, enabling group-based evidence clustering and advanced weighting
 * calculations for murder mystery investigation analysis.
 * 
 * **Pattern Format**: `SF_Group: [Group Name (xN.N)]` where N.N is optional multiplier
 * **Multiplier Range**: 1.0 to 10.0 (validated with logging for invalid values)
 * **Group Applications**: Evidence clustering, relationship analysis, investigation organization
 * 
 * @param text Text containing potential SF_Group pattern
 * @returns Group object with name and optional multiplier or undefined if not found
 * 
 * @complexity O(n) - single regex match with multiplier parsing and validation
 * 
 * @example
 * ```typescript
 * // Group with multiplier
 * const group1 = extractGroup('SF_Group: [Security Team (x2.5)]');
 * console.log(group1); // { name: 'Security Team', multiplier: 2.5 }
 * 
 * // Group without multiplier
 * const group2 = extractGroup('SF_Group: [Witnesses]');
 * console.log(group2); // { name: 'Witnesses' }
 * 
 * // Integer multiplier
 * const group3 = extractGroup('SF_Group: [IT Department (x3)]');
 * console.log(group3); // { name: 'IT Department', multiplier: 3 }
 * 
 * // Maximum valid multiplier
 * const group4 = extractGroup('SF_Group: [Critical Evidence (x10)]');
 * console.log(group4); // { name: 'Critical Evidence', multiplier: 10 }
 * 
 * // Invalid multiplier (out of range) - logs warning
 * const group5 = extractGroup('SF_Group: [Invalid (x15)]');
 * console.log(group5); // { name: 'Invalid' } (no multiplier, warning logged)
 * 
 * // Complex group name with spaces and punctuation
 * const group6 = extractGroup('SF_Group: [Marcus\'s Personal Items (x1.8)]');
 * console.log(group6); // { name: 'Marcus\'s Personal Items', multiplier: 1.8 }
 * 
 * // No pattern found
 * const group7 = extractGroup('No group pattern');
 * console.log(group7); // undefined
 * ```
 * 
 * @see {@link SF_PATTERNS.group} For regex pattern definition
 * @see {@link logger} For validation warning logging
 * 
 * @internal Private extraction function with multiplier validation
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
 * Extract comprehensive SF_ metadata from element description text.
 * 
 * Performs complete parsing of all supported SF_ patterns within murder mystery
 * element descriptions, combining individual pattern extraction with automatic
 * multiplier calculation, validation, and comprehensive debug information.
 * 
 * **Complete Processing Pipeline:**
 * 1. **Null Safety**: Graceful handling of null/undefined input
 * 2. **Pattern Extraction**: Individual parsing of all four SF_ pattern types
 * 3. **Multiplier Calculation**: Automatic combination of memory type and group multipliers
 * 4. **Validation & Warnings**: Pattern completeness analysis and missing pattern detection
 * 5. **Result Assembly**: Comprehensive extraction result with metadata and debug info
 * 
 * **Multiplier Combination Logic:**
 * - Memory type only: Uses MEMORY_TYPE_MULTIPLIERS value
 * - Group multiplier only: Uses group-specified multiplier
 * - Both present: Multiplies memory type multiplier × group multiplier
 * - Neither present: No multiplier in result
 * 
 * **Pattern Completeness Analysis:**
 * - Tracks successfully found patterns for debugging
 * - Generates warnings for incomplete pattern sets
 * - Enables investigation quality assessment and data validation
 * 
 * @param text Element description text to parse (typically from Element.description)
 * @returns Comprehensive extraction result with metadata, patterns found, and warnings
 * 
 * @complexity O(n) - single pass through text with multiple regex operations
 * 
 * @example
 * ```typescript
 * // Complete metadata extraction
 * const description = `
 *   Evidence from Marcus's office:
 *   SF_RFID: [DEVICE_MARCUS_001]
 *   SF_ValueRating: [4]
 *   SF_MemoryType: [Technical]
 *   SF_Group: [Security Systems (x2.5)]
 *   Investigation notes...
 * `;
 * 
 * const result = extractSFMetadata(description);
 * console.log('Complete extraction:', result);
 * // Output: {
 * //   metadata: {
 * //     rfid: 'DEVICE_MARCUS_001',
 * //     valueRating: 4,
 * //     memoryType: 'Technical',
 * //     group: 'Security Systems',
 * //     multiplier: 12.5  // Technical (5x) * Group (2.5x)
 * //   },
 * //   patternsFound: ['SF_RFID', 'SF_ValueRating', 'SF_MemoryType', 'SF_Group'],
 * //   warnings: []
 * // }
 * 
 * // Partial extraction with warnings
 * const partialDescription = `
 *   Basic evidence: SF_RFID: [BASIC_001] SF_ValueRating: [2]
 * `;
 * 
 * const partialResult = extractSFMetadata(partialDescription);
 * console.log('Partial extraction:', partialResult);
 * // Output: {
 * //   metadata: { rfid: 'BASIC_001', valueRating: 2 },
 * //   patternsFound: ['SF_RFID', 'SF_ValueRating'],
 * //   warnings: ['Missing patterns: SF_MemoryType, SF_Group']
 * // }
 * 
 * // Null safety handling
 * const emptyResult = extractSFMetadata(null);
 * console.log('Empty result:', emptyResult);
 * // Output: { metadata: {}, patternsFound: [], warnings: [] }
 * 
 * // Investigation workflow integration
 * const processEvidence = (evidence: Element) => {
 *   const sfData = extractSFMetadata(evidence.description);
 *   
 *   if (sfData.patternsFound.length > 0) {
 *     console.log(`Evidence ${evidence.id} has SF patterns:`, sfData.patternsFound);
 *     
 *     if (sfData.warnings.length > 0) {
 *       console.warn(`Incomplete SF data for ${evidence.id}:`, sfData.warnings);
 *     }
 *     
 *     // Apply evidence weighting based on extracted metadata
 *     const weight = calculateEvidenceWeight(sfData.metadata);
 *     return { ...evidence, sfMetadata: sfData.metadata, weight };
 *   }
 *   
 *   return evidence; // No SF patterns found
 * };
 * ```
 * 
 * @see {@link ExtractionResult} For result structure
 * @see {@link SFMetadata} For metadata interface
 * @see {@link MEMORY_TYPE_MULTIPLIERS} For memory type multiplier values
 * @see {@link hasSFPatterns} For quick pattern detection
 * @see {@link formatSFMetadata} For display formatting
 * 
 * @remarks
 * **Error Handling Strategy:**
 * - Graceful degradation for missing or malformed patterns
 * - Individual pattern failures don't affect other pattern extraction
 * - Comprehensive logging for validation issues and debugging
 * - Null/undefined input safety for robust integration
 * 
 * **Performance Characteristics:**
 * - Single-pass text processing for efficiency
 * - Regex compilation happens once at module load
 * - Memory-efficient result object construction
 * - Suitable for batch processing of element descriptions
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
 * Quick check if text contains any SF_ patterns for performance optimization.
 * 
 * Provides fast pre-screening of element descriptions to determine if full
 * SF_ metadata extraction is warranted, enabling performance optimization
 * in investigation workflows with large numbers of elements.
 * 
 * **Performance Benefits:**
 * - O(n) simple substring search vs O(n×4) regex operations
 * - Early exit capability for batch processing workflows
 * - Memory efficient - no pattern extraction or object creation
 * - Ideal for filtering operations before expensive processing
 * 
 * **Use Cases:**
 * - Pre-filtering elements before metadata extraction
 * - Batch processing optimization for large element sets
 * - Investigation workflow performance enhancement
 * - Evidence classification pipeline efficiency
 * 
 * @param text Element description text to check for SF_ pattern presence
 * @returns True if text contains 'SF_' substring, false if not found or null/undefined
 * 
 * @complexity O(n) - simple substring search operation
 * 
 * @example
 * ```typescript
 * // Quick pattern detection
 * const hasPatterns1 = hasSFPatterns('SF_RFID: [TEST_001] normal text');
 * console.log(hasPatterns1); // true
 * 
 * // No patterns found
 * const hasPatterns2 = hasSFPatterns('Just normal description text');
 * console.log(hasPatterns2); // false
 * 
 * // Null safety
 * const hasPatterns3 = hasSFPatterns(null);
 * console.log(hasPatterns3); // false
 * 
 * // Batch processing optimization
 * const processElements = (elements: Element[]) => {
 *   // Fast pre-filtering
 *   const elementsWithSF = elements.filter(e => hasSFPatterns(e.description));
 *   console.log(`Found ${elementsWithSF.length}/${elements.length} elements with SF patterns`);
 *   
 *   // Expensive extraction only on relevant elements
 *   const processedElements = elementsWithSF.map(element => {
 *     const sfData = extractSFMetadata(element.description);
 *     return { ...element, sfMetadata: sfData.metadata };
 *   });
 *   
 *   return processedElements;
 * };
 * 
 * // Investigation workflow optimization
 * const analyzeEvidence = (evidence: Element[]) => {
 *   const sfEvidence = evidence.filter(hasSFPatterns);
 *   const regularEvidence = evidence.filter(e => !hasSFPatterns(e.description));
 *   
 *   console.log('SF evidence count:', sfEvidence.length);
 *   console.log('Regular evidence count:', regularEvidence.length);
 *   
 *   return {
 *     sfEvidence: sfEvidence.map(e => extractSFMetadata(e.description)),
 *     regularEvidence
 *   };
 * };
 * 
 * // Performance monitoring
 * const timedPatternCheck = (descriptions: string[]) => {
 *   const start = performance.now();
 *   const withPatterns = descriptions.filter(hasSFPatterns);
 *   const end = performance.now();
 *   
 *   console.log(`Checked ${descriptions.length} descriptions in ${end - start}ms`);
 *   console.log(`Found ${withPatterns.length} with SF patterns`);
 * };
 * ```
 * 
 * @see {@link extractSFMetadata} For full metadata extraction
 * @see {@link SF_PATTERNS} For specific pattern definitions
 * 
 * @remarks
 * **Optimization Strategy:**
 * - Use this function before extractSFMetadata for performance gains
 * - Particularly effective for large element datasets (>100 elements)
 * - Reduces unnecessary regex operations and object allocations
 * - Essential for real-time investigation workflow responsiveness
 * 
 * **False Positive Handling:**
 * - May return true for text containing 'SF_' in other contexts
 * - Acceptable trade-off for performance optimization
 * - Full extraction will properly validate actual patterns
 * - Designed for pre-filtering, not definitive pattern validation
 */
export function hasSFPatterns(text: string | null | undefined): boolean {
  if (!text) return false;
  return text.includes('SF_');
}

/**
 * Format SF_ metadata for investigation display and reporting.
 * 
 * Converts structured SF_ metadata into human-readable display format for
 * investigation interfaces, evidence reports, and debugging output within
 * the "About Last Night" murder mystery investigation workflows.
 * 
 * **Display Format**: Pipe-separated fields with descriptive labels
 * **Field Order**: RFID → Value → Type → Group → Multiplier (logical priority)
 * **Conditional Display**: Only shows fields that have values (no empty entries)
 * 
 * **Field Formatting:**
 * - **RFID**: `RFID: {identifier}` - Unique evidence identification
 * - **Value**: `Value: {rating}/5` - Evidence importance with scale context
 * - **Type**: `Type: {memoryType}` - Memory category classification
 * - **Group**: `Group: {groupName}` - Evidence group affiliation
 * - **Multiplier**: `Multiplier: x{value}` - Combined weighting factor
 * 
 * @param metadata Extracted SF_ metadata to format for display
 * @returns Formatted display string with pipe-separated fields
 * 
 * @complexity O(1) - constant time string construction
 * 
 * @example
 * ```typescript
 * // Complete metadata formatting
 * const completeMetadata: SFMetadata = {
 *   rfid: 'EVIDENCE_MARCUS_001',
 *   valueRating: 4,
 *   memoryType: 'Technical',
 *   group: 'Security Systems',
 *   multiplier: 12.5
 * };
 * 
 * const formatted1 = formatSFMetadata(completeMetadata);
 * console.log(formatted1);
 * // Output: "RFID: EVIDENCE_MARCUS_001 | Value: 4/5 | Type: Technical | Group: Security Systems | Multiplier: x12.5"
 * 
 * // Partial metadata formatting
 * const partialMetadata: SFMetadata = {
 *   rfid: 'BASIC_001',
 *   valueRating: 2
 * };
 * 
 * const formatted2 = formatSFMetadata(partialMetadata);
 * console.log(formatted2);
 * // Output: "RFID: BASIC_001 | Value: 2/5"
 * 
 * // Empty metadata handling
 * const emptyMetadata: SFMetadata = {};
 * const formatted3 = formatSFMetadata(emptyMetadata);
 * console.log(formatted3); // Output: "" (empty string)
 * 
 * // Investigation display integration
 * const displayEvidence = (evidence: Element) => {
 *   const sfResult = extractSFMetadata(evidence.description);
 *   const displayText = formatSFMetadata(sfResult.metadata);
 *   
 *   if (displayText) {
 *     console.log(`${evidence.name}: ${displayText}`);
 *   } else {
 *     console.log(`${evidence.name}: No SF metadata`);
 *   }
 * };
 * 
 * // Evidence report generation
 * const generateEvidenceReport = (elements: Element[]) => {
 *   const report = elements
 *     .map(element => {
 *       const sfData = extractSFMetadata(element.description);
 *       const formatted = formatSFMetadata(sfData.metadata);
 *       return {
 *         name: element.name,
 *         sfData: formatted || 'No SF metadata',
 *         warnings: sfData.warnings
 *       };
 *     })
 *     .filter(item => item.sfData !== 'No SF metadata');
 *   
 *   console.log('Evidence with SF patterns:');
 *   report.forEach(item => {
 *     console.log(`  ${item.name}: ${item.sfData}`);
 *     if (item.warnings.length > 0) {
 *       console.warn(`    Warnings: ${item.warnings.join(', ')}`);
 *     }
 *   });
 * };
 * 
 * // Debug output formatting
 * const debugMetadata = (metadata: SFMetadata, context: string) => {
 *   const formatted = formatSFMetadata(metadata);
 *   console.log(`[DEBUG] ${context}: ${formatted || 'No metadata'}`);
 * };
 * ```
 * 
 * @see {@link SFMetadata} For metadata structure
 * @see {@link extractSFMetadata} For metadata extraction
 * 
 * @remarks
 * **Display Design Principles:**
 * - Human-readable format for investigation interfaces
 * - Consistent field ordering for easy scanning
 * - Pipe separation for clear field distinction
 * - Conditional display prevents empty or null entries
 * 
 * **Integration Benefits:**
 * - Ready for UI tooltip display
 * - Suitable for investigation reports
 * - Debugging-friendly format
 * - Consistent formatting across investigation workflows
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

