import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from '../../../routes/notion/base.js';
import { notion } from '../../../services/notion.js';

vi.mock('../../../services/notion.js', () => ({
  notion: {
    databases: {
      query: vi.fn(),
    },
  },
}));

describe('Notion Base Utilities', () => {
  describe('fetchAllPages', () => {
    it('should fetch all pages with pagination', async () => {
      const dbId = 'test-db-id';
      const mockResponse1 = {
        results: [{ id: 'page1', properties: {} }, { id: 'page2', properties: {} }],
        has_more: true,
        next_cursor: 'cursor1',
      };
      const mockResponse2 = {
        results: [{ id: 'page3', properties: {} }],
        has_more: false,
        next_cursor: null,
      };

      vi.mocked(notion.databases.query)
        .mockResolvedValueOnce(mockResponse1 as any)
        .mockResolvedValueOnce(mockResponse2 as any);

      const result = await fetchAllPages(dbId);

      expect(notion.databases.query).toHaveBeenCalledTimes(2);
      expect(notion.databases.query).toHaveBeenCalledWith({
        database_id: dbId,
        page_size: 100,
        start_cursor: undefined,
      });
      expect(notion.databases.query).toHaveBeenCalledWith({
        database_id: dbId,
        page_size: 98,
        start_cursor: 'cursor1',
      });
      expect(result.pages).toHaveLength(3);
      expect(result.pages.map(p => p.id)).toEqual(['page1', 'page2', 'page3']);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should handle a single page of results', async () => {
      const dbId = 'test-db-id';
      const mockResponse = {
        results: [{ id: 'page1', properties: {} }],
        has_more: false,
        next_cursor: null,
      };

      vi.mocked(notion.databases.query).mockResolvedValue(mockResponse as any);

      const result = await fetchAllPages(dbId);

      expect(notion.databases.query).toHaveBeenCalledOnce();
      expect(result.pages).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });
  });
});
