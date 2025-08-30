import type { Character, Element, Puzzle, TimelineEvent } from '../../src/types/notion/app.js';

/**
 * Synthesizes bidirectional relationships between puzzles, elements, timeline events, and characters.
 * Since Notion doesn't maintain bidirectional relations automatically,
 * we need to compute the reverse relationships from the forward ones.
 */
export function synthesizeBidirectionalRelationships(
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[] = [],
  characters: Character[] = []
): { elements: Element[], puzzles: Puzzle[], timeline: TimelineEvent[], characters: Character[] } {
  // Create a map for quick lookup
  const elementMap = new Map(elements.map(e => [e.id, e]));
  const puzzleMap = new Map(puzzles.map(p => [p.id, p]));
  
  // Clone arrays to avoid mutating originals
  const synthesizedElements = elements.map(e => ({ ...e }));
  const synthesizedPuzzles = puzzles.map(p => ({ ...p }));
  const synthesizedTimeline = timeline.map(t => ({ ...t }));
  const synthesizedCharacters = characters.map(c => ({ ...c }));
  
  // Build reverse relationships from puzzles to elements
  for (const puzzle of synthesizedPuzzles) {
    // Process puzzle elements (these are the elements required for the puzzle)
    // Note: Puzzles use 'puzzleElementIds' not 'requiredElementIds'
    if (puzzle.puzzleElementIds && puzzle.puzzleElementIds.length > 0) {
      for (const elementId of puzzle.puzzleElementIds) {
        const element = synthesizedElements.find(e => e.id === elementId);
        if (element) {
          // Ensure the array exists
          if (!element.requiredForPuzzleIds) {
            element.requiredForPuzzleIds = [];
          }
          // Add puzzle ID if not already present
          if (!element.requiredForPuzzleIds.includes(puzzle.id)) {
            element.requiredForPuzzleIds.push(puzzle.id);
          }
        }
      }
    }
    
    // Process reward elements (puzzle -> element)
    if (puzzle.rewardIds && puzzle.rewardIds.length > 0) {
      for (const elementId of puzzle.rewardIds) {
        const element = synthesizedElements.find(e => e.id === elementId);
        if (element) {
          // Ensure the array exists
          if (!element.rewardedByPuzzleIds) {
            element.rewardedByPuzzleIds = [];
          }
          // Add puzzle ID if not already present
          if (!element.rewardedByPuzzleIds.includes(puzzle.id)) {
            element.rewardedByPuzzleIds.push(puzzle.id);
          }
        }
      }
    }
  }
  
  // Also ensure that if elements reference puzzles, puzzles reference them back
  // (in case some relations are only stored on the element side)
  for (const element of synthesizedElements) {
    // Process required for puzzles (element -> puzzle)
    if (element.requiredForPuzzleIds && element.requiredForPuzzleIds.length > 0) {
      for (const puzzleId of element.requiredForPuzzleIds) {
        const puzzle = synthesizedPuzzles.find(p => p.id === puzzleId);
        if (puzzle) {
          // Ensure the array exists (puzzles use puzzleElementIds)
          if (!puzzle.puzzleElementIds) {
            puzzle.puzzleElementIds = [];
          }
          // Add element ID if not already present
          if (!puzzle.puzzleElementIds.includes(element.id)) {
            puzzle.puzzleElementIds.push(element.id);
          }
        }
      }
    }
    
    // Process rewarded by puzzles (element -> puzzle)
    if (element.rewardedByPuzzleIds && element.rewardedByPuzzleIds.length > 0) {
      for (const puzzleId of element.rewardedByPuzzleIds) {
        const puzzle = synthesizedPuzzles.find(p => p.id === puzzleId);
        if (puzzle) {
          // Ensure the array exists
          if (!puzzle.rewardIds) {
            puzzle.rewardIds = [];
          }
          // Add element ID if not already present
          if (!puzzle.rewardIds.includes(element.id)) {
            puzzle.rewardIds.push(element.id);
          }
        }
      }
    }
  }
  
  // Synthesize container-contents relationships
  for (const element of synthesizedElements) {
    // If this element has a container, ensure the container knows about it
    if (element.containerId) {
      const container = synthesizedElements.find(e => e.id === element.containerId);
      if (container) {
        if (!container.contentIds) {
          container.contentIds = [];
        }
        if (!container.contentIds.includes(element.id)) {
          container.contentIds.push(element.id);
        }
      }
    }
    
    // If this element has contents, ensure each content item knows its container
    if (element.contentIds && element.contentIds.length > 0) {
      for (const contentId of element.contentIds) {
        const content = synthesizedElements.find(e => e.id === contentId);
        if (content && !content.containerId) {
          content.containerId = element.id;
        }
      }
    }
  }
  
  // Synthesize parent-sub puzzle relationships
  for (const puzzle of synthesizedPuzzles) {
    // If this puzzle has sub-puzzles, ensure each sub-puzzle knows its parent
    if (puzzle.subPuzzleIds && puzzle.subPuzzleIds.length > 0) {
      for (const subPuzzleId of puzzle.subPuzzleIds) {
        const subPuzzle = synthesizedPuzzles.find(p => p.id === subPuzzleId);
        if (subPuzzle && !subPuzzle.parentItemId) {
          subPuzzle.parentItemId = puzzle.id;
        }
      }
    }
    
    // If this puzzle has a parent, ensure the parent knows about it
    if (puzzle.parentItemId) {
      const parent = synthesizedPuzzles.find(p => p.id === puzzle.parentItemId);
      if (parent) {
        if (!parent.subPuzzleIds) {
          parent.subPuzzleIds = [];
        }
        if (!parent.subPuzzleIds.includes(puzzle.id)) {
          parent.subPuzzleIds.push(puzzle.id);
        }
      }
    }
  }
  
  // Synthesize puzzle -> timeline relationships
  for (const puzzle of synthesizedPuzzles) {
    // If this puzzle has story reveals (timeline events), create inverse relationship
    if (puzzle.storyReveals && puzzle.storyReveals.length > 0) {
      for (const timelineId of puzzle.storyReveals) {
        const timelineEvent = synthesizedTimeline.find(t => t.id === timelineId);
        if (timelineEvent) {
          // Ensure the array exists
          if (!timelineEvent.associatedPuzzles) {
            timelineEvent.associatedPuzzles = [];
          }
          // Add puzzle ID if not already present
          if (!timelineEvent.associatedPuzzles.includes(puzzle.id)) {
            timelineEvent.associatedPuzzles.push(puzzle.id);
          }
        }
      }
    }
  }
  
  // Synthesize Timeline -> Character bidirectional relationships
  for (const timelineEvent of synthesizedTimeline) {
    // Process characters involved
    if (timelineEvent.charactersInvolvedIds?.length) {
      for (const characterId of timelineEvent.charactersInvolvedIds) {
        const character = synthesizedCharacters.find(c => c.id === characterId);
        if (character) {
          if (!character.eventIds) {
            character.eventIds = [];
          }
          if (!character.eventIds.includes(timelineEvent.id)) {
            character.eventIds.push(timelineEvent.id);
          }
        }
      }
    }
    
    // Process memory/evidence elements
    if (timelineEvent.memoryEvidenceIds?.length) {
      for (const elementId of timelineEvent.memoryEvidenceIds) {
        const element = synthesizedElements.find(e => e.id === elementId);
        if (element) {
          // Element.timelineEventId is single value, not array
          // Only set if not already set (preserve existing)
          if (!element.timelineEventId) {
            element.timelineEventId = timelineEvent.id;
          }
        }
      }
    }
  }
  
  // Also ensure reverse: Character -> Timeline
  for (const character of synthesizedCharacters) {
    if (character.eventIds?.length) {
      for (const eventId of character.eventIds) {
        const timeline = synthesizedTimeline.find(t => t.id === eventId);
        if (timeline) {
          if (!timeline.charactersInvolvedIds) {
            timeline.charactersInvolvedIds = [];
          }
          if (!timeline.charactersInvolvedIds.includes(character.id)) {
            timeline.charactersInvolvedIds.push(character.id);
          }
        }
      }
    }
  }
  
  // And Element -> Timeline
  for (const element of synthesizedElements) {
    if (element.timelineEventId) {
      const timeline = synthesizedTimeline.find(t => t.id === element.timelineEventId);
      if (timeline) {
        if (!timeline.memoryEvidenceIds) {
          timeline.memoryEvidenceIds = [];
        }
        if (!timeline.memoryEvidenceIds.includes(element.id)) {
          timeline.memoryEvidenceIds.push(element.id);
        }
      }
    }
  }
  
  return {
    elements: synthesizedElements,
    puzzles: synthesizedPuzzles,
    timeline: synthesizedTimeline,
    characters: synthesizedCharacters  // Now returning modified characters too
  };
}