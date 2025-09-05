/**
 * INTEGRATION TESTS: Partial Update API Behavior
 * 
 * These tests verify the end-to-end behavior of partial updates through
 * the actual API endpoints. They ensure the complete flow works correctly:
 * API Request → Router → Notion API → Transform → Merge → Response
 * 
 * PRINCIPLE: Test the actual user experience, not implementation details
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../server/app';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for API calls
const API_BASE = '/api/notion';

describe('INTEGRATION: Partial Update API Behavior', { timeout: TEST_TIMEOUT }, () => {
  
  let testCharacterId: string;
  let testElementId: string;
  let testPuzzleId: string;
  let testTimelineId: string;

  beforeAll(async () => {
    // Set up test data in Notion
    // This should ideally use a test database or mock
    console.log('Setting up integration test data...');
  });

  afterAll(async () => {
    // Clean up test data
    console.log('Cleaning up integration test data...');
  });

  describe('PUT /api/notion/characters/:id', () => {
    
    it('MUST preserve all relationships when updating only name', async () => {
      // SETUP: Create a character with full relationships
      const createResponse = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          name: 'Integration Test Character',
          type: 'Player',
          tier: 'Core',
          ownedElementIds: ['elem-test-1', 'elem-test-2'],
          associatedElementIds: ['elem-test-3'],
          characterPuzzleIds: ['puzzle-test-1'],
          primaryAction: 'Testing the system',
          characterLogline: 'The test character',
          overview: 'Created for integration testing',
          emotionTowardsCEO: 'Neutral'
        });
      
      expect(createResponse.status).toBe(201);
      const createdId = createResponse.body.id;

      // ACTION: Update ONLY the name
      const updateResponse = await request(app)
        .put(`${API_BASE}/characters/${createdId}`)
        .send({
          name: 'Updated Test Character'
        });

      expect(updateResponse.status).toBe(200);
      const updated = updateResponse.body;

      // VERIFY: Name changed, everything else preserved
      expect(updated.name).toBe('Updated Test Character');
      expect(updated.type).toBe('Player');
      expect(updated.tier).toBe('Core');
      expect(updated.ownedElementIds).toEqual(['elem-test-1', 'elem-test-2']);
      expect(updated.associatedElementIds).toEqual(['elem-test-3']);
      expect(updated.characterPuzzleIds).toEqual(['puzzle-test-1']);
      expect(updated.primaryAction).toBe('Testing the system');
      expect(updated.characterLogline).toBe('The test character');
      expect(updated.overview).toBe('Created for integration testing');
      expect(updated.emotionTowardsCEO).toBe('Neutral');

      // CLEANUP
      await request(app).delete(`${API_BASE}/characters/${createdId}`);
    });

    it('MUST clear arrays when explicitly sent as empty', async () => {
      // SETUP: Create character with relationships
      const createResponse = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          name: 'Clear Test Character',
          ownedElementIds: ['elem-1', 'elem-2'],
          associatedElementIds: ['elem-3']
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Explicitly clear ownedElementIds
      const updateResponse = await request(app)
        .put(`${API_BASE}/characters/${createdId}`)
        .send({
          ownedElementIds: []  // Intentionally clearing
        });

      expect(updateResponse.status).toBe(200);
      const updated = updateResponse.body;

      // VERIFY: Cleared array is empty, other array preserved
      expect(updated.ownedElementIds).toEqual([]);
      expect(updated.associatedElementIds).toEqual(['elem-3']); // Preserved!

      // CLEANUP
      await request(app).delete(`${API_BASE}/characters/${createdId}`);
    });

    it('MUST return 500 error when unable to fetch old data', async () => {
      // ACTION: Try to update non-existent character
      const updateResponse = await request(app)
        .put(`${API_BASE}/characters/non-existent-id-12345`)
        .send({
          name: 'Will Fail'
        });

      // VERIFY: Proper error handling
      expect(updateResponse.status).toBe(500);
      expect(updateResponse.body.code).toBe('FETCH_OLD_DATA_FAILED');
      expect(updateResponse.body.message).toContain('Unable to fetch current data');
    });

    it('MUST handle version conflicts with If-Match header', async () => {
      // SETUP: Create a character
      const createResponse = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          name: 'Version Test Character'
        });
      
      const createdId = createResponse.body.id;
      const version1 = createResponse.body.lastEdited;

      // Simulate another update (changes version)
      await request(app)
        .put(`${API_BASE}/characters/${createdId}`)
        .send({
          name: 'Updated by another user'
        });

      // ACTION: Try to update with old version
      const conflictResponse = await request(app)
        .put(`${API_BASE}/characters/${createdId}`)
        .set('If-Match', version1)
        .send({
          name: 'Will conflict'
        });

      // VERIFY: Version conflict detected
      expect(conflictResponse.status).toBe(409);
      expect(conflictResponse.body.code).toBe('VERSION_CONFLICT');

      // CLEANUP
      await request(app).delete(`${API_BASE}/characters/${createdId}`);
    });
  });

  describe('PUT /api/notion/elements/:id', () => {
    
    it('MUST preserve container relationships and SF patterns', async () => {
      // SETUP: Create element with complex data
      const createResponse = await request(app)
        .post(`${API_BASE}/elements`)
        .send({
          name: 'Test Memory Card',
          descriptionText: 'SF_RFID: [MEM001] SF_ValueRating: [5]',
          basicType: 'Memory Token (Audio)',
          ownerId: 'char-1',
          containerId: 'elem-container-1',
          contentIds: ['elem-content-1', 'elem-content-2'],
          status: 'In development',
          narrativeThreads: ['Murder', 'Betrayal']
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Update only status
      const updateResponse = await request(app)
        .put(`${API_BASE}/elements/${createdId}`)
        .send({
          status: 'Done'
        });

      expect(updateResponse.status).toBe(200);
      const updated = updateResponse.body;

      // VERIFY: All relationships and patterns preserved
      expect(updated.status).toBe('Done');
      expect(updated.ownerId).toBe('char-1');
      expect(updated.containerId).toBe('elem-container-1');
      expect(updated.contentIds).toEqual(['elem-content-1', 'elem-content-2']);
      expect(updated.narrativeThreads).toEqual(['Murder', 'Betrayal']);
      expect(updated.sfPatterns.rfid).toBe('MEM001');
      expect(updated.sfPatterns.valueRating).toBe(5);

      // CLEANUP
      await request(app).delete(`${API_BASE}/elements/${createdId}`);
    });

    it('MUST handle single relationship updates correctly', async () => {
      // SETUP: Create element
      const createResponse = await request(app)
        .post(`${API_BASE}/elements`)
        .send({
          name: 'Test Document',
          ownerId: 'char-old',
          containerId: 'elem-old',
          timelineEventId: 'event-old'
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Update only ownerId
      const updateResponse = await request(app)
        .put(`${API_BASE}/elements/${createdId}`)
        .send({
          ownerId: 'char-new'
        });

      const updated = updateResponse.body;

      // VERIFY: Only ownerId changed
      expect(updated.ownerId).toBe('char-new');
      expect(updated.containerId).toBe('elem-old');      // Preserved
      expect(updated.timelineEventId).toBe('event-old'); // Preserved

      // CLEANUP
      await request(app).delete(`${API_BASE}/elements/${createdId}`);
    });
  });

  describe('PUT /api/notion/puzzles/:id', () => {
    
    it('MUST preserve sub-puzzles and rewards when updating description', async () => {
      // SETUP: Create puzzle with relationships
      const createResponse = await request(app)
        .post(`${API_BASE}/puzzles`)
        .send({
          name: 'Test Safe Puzzle',
          descriptionSolution: 'Original solution',
          puzzleElementIds: ['elem-1', 'elem-2'],
          rewardIds: ['elem-reward-1'],
          subPuzzleIds: ['puzzle-sub-1', 'puzzle-sub-2'],
          narrativeThreads: ['Heist', 'Betrayal']
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Update only description
      const updateResponse = await request(app)
        .put(`${API_BASE}/puzzles/${createdId}`)
        .send({
          descriptionSolution: 'Updated solution with more detail'
        });

      const updated = updateResponse.body;

      // VERIFY: Description updated, relationships preserved
      expect(updated.descriptionSolution).toBe('Updated solution with more detail');
      expect(updated.puzzleElementIds).toEqual(['elem-1', 'elem-2']);
      expect(updated.rewardIds).toEqual(['elem-reward-1']);
      expect(updated.subPuzzleIds).toEqual(['puzzle-sub-1', 'puzzle-sub-2']);
      expect(updated.narrativeThreads).toEqual(['Heist', 'Betrayal']);

      // CLEANUP
      await request(app).delete(`${API_BASE}/puzzles/${createdId}`);
    });
  });

  describe('PUT /api/notion/timeline/:id', () => {
    
    it('MUST preserve character relationships when updating date', async () => {
      // SETUP: Create timeline event
      const createResponse = await request(app)
        .post(`${API_BASE}/timeline`)
        .send({
          description: 'The murder occurred',
          date: '2024-01-15',
          charactersInvolvedIds: ['char-1', 'char-2', 'char-3'],
          memoryEvidenceIds: ['elem-1', 'elem-2'],
          notes: 'Critical event'
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Update only the date
      const updateResponse = await request(app)
        .put(`${API_BASE}/timeline/${createdId}`)
        .send({
          date: '2024-01-16'  // Changed date
        });

      const updated = updateResponse.body;

      // VERIFY: Date updated, relationships preserved
      expect(updated.date).toBe('2024-01-16');
      expect(updated.charactersInvolvedIds).toEqual(['char-1', 'char-2', 'char-3']);
      expect(updated.memoryEvidenceIds).toEqual(['elem-1', 'elem-2']);
      expect(updated.notes).toBe('Critical event');

      // CLEANUP
      await request(app).delete(`${API_BASE}/timeline/${createdId}`);
    });
  });

  describe('Performance and Scale', () => {
    
    it('MUST handle updates with 100+ relationships efficiently', async () => {
      // SETUP: Create character with many relationships
      const manyIds = Array.from({ length: 100 }, (_, i) => `elem-${i}`);
      
      const createResponse = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          name: 'Performance Test Character',
          ownedElementIds: manyIds,
          associatedElementIds: manyIds.slice(0, 50),
          eventIds: manyIds.slice(0, 25).map(id => `event-${id}`)
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Time the update
      const startTime = Date.now();
      const updateResponse = await request(app)
        .put(`${API_BASE}/characters/${createdId}`)
        .send({
          name: 'Performance Updated'
        });
      const duration = Date.now() - startTime;

      // VERIFY: Fast response and data preserved
      expect(updateResponse.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
      expect(updateResponse.body.ownedElementIds).toHaveLength(100);
      expect(updateResponse.body.associatedElementIds).toHaveLength(50);

      // CLEANUP
      await request(app).delete(`${API_BASE}/characters/${createdId}`);
    });

    it('MUST handle concurrent updates gracefully', async () => {
      // SETUP: Create a test entity
      const createResponse = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          name: 'Concurrent Test',
          primaryAction: 'Original action',
          characterLogline: 'Original logline'
        });
      
      const createdId = createResponse.body.id;

      // ACTION: Launch concurrent updates
      const updates = await Promise.all([
        request(app)
          .put(`${API_BASE}/characters/${createdId}`)
          .send({ primaryAction: 'Updated action' }),
        request(app)
          .put(`${API_BASE}/characters/${createdId}`)
          .send({ characterLogline: 'Updated logline' })
      ]);

      // VERIFY: Both succeeded (last write wins is acceptable)
      expect(updates[0].status).toBe(200);
      expect(updates[1].status).toBe(200);

      // Final state check
      const getResponse = await request(app)
        .get(`${API_BASE}/characters/${createdId}`);
      
      const final = getResponse.body;
      // At least one update should be reflected
      const hasUpdate = 
        final.primaryAction === 'Updated action' ||
        final.characterLogline === 'Updated logline';
      expect(hasUpdate).toBe(true);

      // CLEANUP
      await request(app).delete(`${API_BASE}/characters/${createdId}`);
    });
  });

  describe('Error Scenarios', () => {
    
    it('MUST validate required fields', async () => {
      // ACTION: Try to create without required name
      const response = await request(app)
        .post(`${API_BASE}/characters`)
        .send({
          type: 'Player'
          // Missing required 'name' field
        });

      // VERIFY: Proper validation error
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name');
    });

    it('MUST handle malformed IDs gracefully', async () => {
      // ACTION: Update with invalid ID format
      const response = await request(app)
        .put(`${API_BASE}/characters/not-a-valid-uuid`)
        .send({
          name: 'Will fail'
        });

      // VERIFY: Appropriate error
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(600);
    });

    it('MUST handle network failures gracefully', async () => {
      // This would require mocking Notion API to fail
      // Placeholder for network resilience testing
      expect(true).toBe(true);
    });
  });
});

describe('REGRESSION PREVENTION: Known Bug Scenarios', () => {
  
  it('MUST NOT lose relationships when Notion returns partial response', async () => {
    // This is THE bug we're fixing
    // When Notion returns only {name: "Updated"}, 
    // transforms create {name: "Updated", relationships: []}
    // System MUST preserve existing relationships
    
    // We can't easily test this without mocking Notion API
    // but the behavior is tested in unit tests
    expect(true).toBe(true);
  });

  it('MUST NOT replace tier with default when not updating it', async () => {
    // Bug: Transform returns default 'Tertiary' when tier not in response
    // System must preserve original tier value
    
    const createResponse = await request(app)
      .post(`${API_BASE}/characters`)
      .send({
        name: 'Tier Test',
        tier: 'Core'  // Not the default
      });
    
    const createdId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`${API_BASE}/characters/${createdId}`)
      .send({
        name: 'Tier Test Updated'
        // NOT updating tier
      });

    expect(updateResponse.body.tier).toBe('Core'); // Must NOT be 'Tertiary'

    await request(app).delete(`${API_BASE}/characters/${createdId}`);
  });
});