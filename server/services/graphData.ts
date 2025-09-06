import { fetchAllPages } from '../routes/notion/base.js';
import {
  transformCharacter,
  transformElement,
  transformPuzzle,
  transformTimelineEvent
} from '../../src/types/notion/transforms.js';
import { synthesizeBidirectionalRelationships } from './relationshipSynthesizer.js';
import { buildCompleteGraph } from './graphBuilder.js';
import config from '../config/index.js';
import { log } from '../utils/logger.js';
import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';

export async function getCompleteGraphData() {
  const startTime = Date.now();

  // Get database IDs from config
  const charactersDb = config.notionDatabaseIds.characters;
  const elementsDb = config.notionDatabaseIds.elements;
  const puzzlesDb = config.notionDatabaseIds.puzzles;
  const timelineDb = config.notionDatabaseIds.timeline;

  log.info('[Graph Data Service] Fetching all entities for complete graph');

  // Fetch ALL entities with proper pagination (no artificial limits)
  const allCharacters: Character[] = [];
  const allElements: Element[] = [];
  const allPuzzles: Puzzle[] = [];
  const allTimeline: TimelineEvent[] = [];

  // Helper function to fetch all entities of a specific type
  async function fetchAllEntities<T>(
    databaseId: string,
    transformFn: (page: any) => T,
    entityName: string,
    targetArray: T[]
  ): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchAllPages(databaseId, 100, cursor);
      targetArray.push(...result.pages.map(transformFn));
      cursor = result.nextCursor || undefined;
      hasMore = result.hasMore;

      if (cursor && result.pages.length === 100) {
        log.debug(`[Graph Data Service] Fetching next batch of ${entityName}`, {
          fetched: targetArray.length,
          cursor: cursor
        });
      }
    }
  }

  // Fetch all entity types using the helper function
  await fetchAllEntities(charactersDb, transformCharacter, 'characters', allCharacters);
  await fetchAllEntities(elementsDb, transformElement, 'elements', allElements);
  await fetchAllEntities(puzzlesDb, transformPuzzle, 'puzzles', allPuzzles);
  await fetchAllEntities(timelineDb, transformTimelineEvent, 'timeline', allTimeline);

  log.info('[Graph Data Service] All entities fetched', {
    characters: allCharacters.length,
    elements: allElements.length,
    puzzles: allPuzzles.length,
    timeline: allTimeline.length,
  });

  // Synthesize bidirectional relationships
  const synthesized = synthesizeBidirectionalRelationships(allElements, allPuzzles, allTimeline, allCharacters);

  // Build complete graph
  const graph = buildCompleteGraph({
    characters: synthesized.characters,
    elements: synthesized.elements,
    puzzles: synthesized.puzzles,
    timeline: synthesized.timeline,
  });

  const buildTime = Date.now() - startTime;

  return {
    graph,
    entityCounts: {
      characters: allCharacters.length,
      elements: allElements.length,
      puzzles: allPuzzles.length,
      timeline: allTimeline.length,
    },
    buildTime,
  };
}
