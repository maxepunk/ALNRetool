/**
 * Tests for SF_ Pattern Parser
 */

import { describe, it, expect } from 'vitest';
import { extractSFMetadata, hasSFPatterns, formatSFMetadata } from '../patterns';

describe('SF_ Pattern Parser', () => {
  describe('hasSFPatterns', () => {
    it('should detect SF_ patterns in text', () => {
      expect(hasSFPatterns('SF_RFID: [test]')).toBe(true);
      expect(hasSFPatterns('Regular text')).toBe(false);
      expect(hasSFPatterns(null)).toBe(false);
      expect(hasSFPatterns(undefined)).toBe(false);
    });
  });

  describe('extractSFMetadata', () => {
    it('should extract complete SF_ patterns', () => {
      const text = `
        This is a memory token.
        SF_RFID: [MEM-001]
        SF_ValueRating: [3]
        SF_MemoryType: [Business]
        SF_Group: [CEO Memories (x2)]
      `;
      
      const result = extractSFMetadata(text);
      
      expect(result.metadata).toEqual({
        rfid: 'MEM-001',
        valueRating: 3,
        memoryType: 'Business',
        group: 'CEO Memories',
        multiplier: 6, // Business (x3) * Group (x2)
      });
      
      expect(result.patternsFound).toEqual([
        'SF_RFID',
        'SF_ValueRating',
        'SF_MemoryType',
        'SF_Group',
      ]);
      
      expect(result.warnings).toEqual([]);
    });

    it('should handle partial patterns', () => {
      const text = 'SF_RFID: [TEST-002] SF_ValueRating: [5]';
      const result = extractSFMetadata(text);
      
      expect(result.metadata).toEqual({
        rfid: 'TEST-002',
        valueRating: 5,
      });
      
      expect(result.patternsFound).toEqual(['SF_RFID', 'SF_ValueRating']);
      expect(result.warnings).toContain('Missing patterns: SF_MemoryType, SF_Group');
    });

    it('should handle invalid value ratings', () => {
      const text = 'SF_ValueRating: [10]'; // Out of range
      const result = extractSFMetadata(text);
      
      expect(result.metadata.valueRating).toBeUndefined();
      expect(result.patternsFound).toEqual([]);
    });

    it('should handle all memory types', () => {
      expect(extractSFMetadata('SF_MemoryType: [Personal]').metadata.memoryType).toBe('Personal');
      expect(extractSFMetadata('SF_MemoryType: [Business]').metadata.memoryType).toBe('Business');
      expect(extractSFMetadata('SF_MemoryType: [Technical]').metadata.memoryType).toBe('Technical');
      expect(extractSFMetadata('SF_MemoryType: [Unknown]').metadata.memoryType).toBeUndefined();
    });

    it('should calculate memory type multipliers', () => {
      expect(extractSFMetadata('SF_MemoryType: [Personal]').metadata.multiplier).toBe(1);
      expect(extractSFMetadata('SF_MemoryType: [Business]').metadata.multiplier).toBe(3);
      expect(extractSFMetadata('SF_MemoryType: [Technical]').metadata.multiplier).toBe(5);
    });

    it('should parse group multipliers', () => {
      const text1 = 'SF_Group: [Test Group (x2)]';
      const result1 = extractSFMetadata(text1);
      expect(result1.metadata.group).toBe('Test Group');
      expect(result1.metadata.multiplier).toBe(2);

      const text2 = 'SF_Group: [Test Group (x3.5)]';
      const result2 = extractSFMetadata(text2);
      expect(result2.metadata.group).toBe('Test Group');
      expect(result2.metadata.multiplier).toBe(3.5);

      const text3 = 'SF_Group: [Test Group]'; // No multiplier
      const result3 = extractSFMetadata(text3);
      expect(result3.metadata.group).toBe('Test Group');
      expect(result3.metadata.multiplier).toBeUndefined();
    });

    it('should combine memory type and group multipliers', () => {
      const text = 'SF_MemoryType: [Technical] SF_Group: [Test (x2)]';
      const result = extractSFMetadata(text);
      expect(result.metadata.multiplier).toBe(10); // Technical (x5) * Group (x2)
    });

    it('should handle null and undefined gracefully', () => {
      expect(extractSFMetadata(null)).toEqual({
        metadata: {},
        patternsFound: [],
        warnings: [],
      });
      
      expect(extractSFMetadata(undefined)).toEqual({
        metadata: {},
        patternsFound: [],
        warnings: [],
      });
    });
  });

  describe('formatSFMetadata', () => {
    it('should format complete metadata', () => {
      const metadata = {
        rfid: 'TEST-001',
        valueRating: 4,
        memoryType: 'Business' as const,
        group: 'Test Group',
        multiplier: 6,
      };
      
      const formatted = formatSFMetadata(metadata);
      expect(formatted).toBe('RFID: TEST-001 | Value: 4/5 | Type: Business | Group: Test Group | Multiplier: x6');
    });

    it('should format partial metadata', () => {
      const metadata = {
        rfid: 'TEST-002',
        valueRating: 5,
      };
      
      const formatted = formatSFMetadata(metadata);
      expect(formatted).toBe('RFID: TEST-002 | Value: 5/5');
    });

    it('should format empty metadata', () => {
      const formatted = formatSFMetadata({});
      expect(formatted).toBe('');
    });
  });
});