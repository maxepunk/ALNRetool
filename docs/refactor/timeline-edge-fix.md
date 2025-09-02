# Timeline Node Edge Connection Fix

**Date:** 2025-08-30  
**Issue:** Timeline nodes appearing isolated without edges in the graph visualization  
**Root Cause:** Missing edge creation for Timeline entity relationships in the graph builder  

## Problem Analysis

### Initial Symptoms
- Timeline nodes (orange/yellow colored) displayed on the right side of the graph
- Timeline nodes appeared completely isolated without any connecting edges
- Other node types (puzzles, characters, elements) properly connected
- Timeline nodes stacked vertically in a disconnected column

### Investigation Process

#### 1. Screenshot Review
Examined the provided screenshot showing isolated timeline nodes, confirming the visual issue where timeline nodes had no edges connecting them to the rest of the graph.

#### 2. Data Flow Analysis
Traced the complete data pipeline from Notion to React Flow:
- Notion API → Backend Transform → Relationship Synthesis → Graph Builder → Frontend Rendering

#### 3. Edge Creation Logic Discovery
Found that `server/services/graphBuilder.ts` was only creating:
- Sequential timeline-to-timeline edges
- Timeline-to-puzzle edges (via synthesized `associatedPuzzles`)

But was **missing**:
- Timeline → Character edges (via `charactersInvolvedIds`)
- Timeline → Element edges (via `memoryEvidenceIds`)

#### 4. Field Type Analysis
Critical discovery about Notion field types:

**RELATION Fields** (bidirectional, editable):
- `Timeline.charactersInvolvedIds` → `Character.eventIds`
- `Timeline.memoryEvidenceIds` → `Element.timelineEventId`
- These require inverse relationship handling

**ROLLUP Fields** (computed, read-only):
- `Puzzle.storyReveals` - pulls Timeline IDs through Element relations
- `Character.connections` - computed from Events relation
- `Element.associatedCharacters` - computed from Timeline relation
- These cannot be directly set, only read

#### 5. Relationship Flow Discovery
Discovered that `Puzzle.storyReveals` is a rollup that follows:
- Puzzle → Elements (via rewards) → Timeline Events
- This means Timeline doesn't directly connect to Puzzles
- The `associatedPuzzles` synthesis might be redundant since connections flow through Elements

## Solution Implementation

### Files Modified

#### 1. `server/services/graphBuilder.ts`
Added edge creation for Timeline's direct relationships:

```typescript
// Process Timeline relationships
entities.timeline.forEach((event, index) => {
  // [EXISTING] Sequential timeline connections
  if (index < entities.timeline.length - 1) {
    const nextEvent = entities.timeline[index + 1];
    createEdge(event.id, nextEvent.id, 'timeline', 3);
  }
  
  // [NEW] Connect to involved characters (RELATION field)
  if (event.charactersInvolvedIds?.length) {
    event.charactersInvolvedIds.forEach(characterId => {
      ensureNode(characterId, 'character', `timeline:${event.id}`);
      createEdge(event.id, characterId, 'relationship', 6);
    });
  }
  
  // [NEW] Connect to memory/evidence elements (RELATION field)
  if (event.memoryEvidenceIds?.length) {
    event.memoryEvidenceIds.forEach(elementId => {
      ensureNode(elementId, 'element', `timeline:${event.id}`);
      createEdge(event.id, elementId, 'relationship', 6);
    });
  }
  
  // [EXISTING] Puzzle connections via synthesized field
  if (event.associatedPuzzles?.length) {
    event.associatedPuzzles.forEach(puzzleId => {
      ensureNode(puzzleId, 'puzzle', `timeline:${event.id}`);
      createEdge(event.id, puzzleId, 'relationship', 5);
    });
  }
});
```

#### 2. `server/services/relationshipSynthesizer.ts`
Enhanced to handle Timeline ↔ Character/Element bidirectional relationships:

**Updated function signature:**
```typescript
export function synthesizeBidirectionalRelationships(
  elements: Element[],
  puzzles: Puzzle[],
  timeline: TimelineEvent[] = [],
  characters: Character[] = []  // Added characters parameter
): { elements: Element[], puzzles: Puzzle[], timeline: TimelineEvent[], characters: Character[] }
```

**Added bidirectional synthesis:**
```typescript
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
        if (!element.timelineEventId) {
          element.timelineEventId = timelineEvent.id;
        }
      }
    }
  }
}

// Ensure reverse: Character -> Timeline
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
```

#### 3. `server/routes/graph.ts`
Updated to pass characters to the synthesizer:

```typescript
// Synthesize bidirectional relationships
const synthesized = synthesizeBidirectionalRelationships(
  allElements, 
  allPuzzles, 
  allTimeline, 
  allCharacters  // Added characters
);

// Build complete graph
const fullGraph = buildCompleteGraph({
  characters: synthesized.characters,  // Use synthesized characters
  elements: synthesized.elements,
  puzzles: synthesized.puzzles,
  timeline: synthesized.timeline,
});
```

## Verification Testing

### Test Results
After implementing the fix, verified edge creation:

1. **Timeline Sequential Edges**: ✅ Working
   - Timeline nodes connect to next timeline event in sequence

2. **Timeline → Character Edges**: ✅ Fixed
   - Example: Timeline `2052f33d-583f-81f9-9719-d076bcaea78d` connects to:
     - Character `1b62f33d-583f-8063-bc0c-fa0195863eb9` (Sofia Francisco)
     - Character `18c2f33d-583f-80c8-83b4-ef43b7c9c4b1`

3. **Timeline → Element Edges**: ✅ Fixed
   - Example: Timeline `2052f33d-583f-81f9-9719-d076bcaea78d` connects to:
     - Element `2052f33d-583f-8177-9ef1-cf83eb762f15` (Sofia's Memory)

4. **Timeline → Puzzle Edges**: ✅ Working (via associatedPuzzles synthesis)

### API Response Verification
```bash
# Verified edges exist in graph API response:
curl -s http://localhost:3001/api/graph/complete | jq '.edges[] | select(.source == "TIMELINE_ID")'

# Confirmed proper edge types:
- "timeline" for sequential connections
- "relationship" for character/element/puzzle connections
```

## Key Insights

### 1. Notion Field Type Distinctions
- **Relations**: Direct references that need bidirectional handling
- **Rollups**: Computed fields that aggregate data through relations (read-only)
- Critical to understand which fields are which when implementing edge creation

### 2. Edge Direction Philosophy
- Graph builder creates edges in one direction to avoid duplicates
- React Flow and Dagre treat edges as bidirectional for layout purposes
- No need to create reverse edges (e.g., Character → Timeline) in the graph builder

### 3. Data Flow Architecture
The complete connection flow for Timeline nodes:
```
Timeline → Character (direct relation)
Timeline → Element (direct relation)
Element → Puzzle (existing relation)
```

This creates a fully connected graph where Timeline nodes integrate properly with the rest of the visualization.

## Impact

### Before Fix
- Timeline nodes isolated
- No visual connection between timeline events and other game elements
- Difficult to understand temporal relationships in the murder mystery

### After Fix
- Timeline nodes properly connected to characters and elements
- Clear visualization of which characters are involved in which events
- Memory/evidence elements properly linked to their timeline context
- Maintains sequential timeline flow while showing cross-entity relationships

## Lessons Learned

1. **Always trace bidirectional relationships** - Notion's relation fields require explicit handling in both directions
2. **Distinguish between relation and rollup fields** - Rollups can't be set directly, only read
3. **Test with actual data** - Empty timeline events (no characters/elements) won't show the issue
4. **Consider the complete data flow** - From Notion API through transforms, synthesis, and graph building
5. **Edge creation should be comprehensive** - Missing edge types can isolate entire node categories

## Future Considerations

1. **Cache Invalidation**: Timeline updates should invalidate related character and element caches
2. **Performance**: With many timeline events, consider optimizing the bidirectional synthesis loops
3. **Validation**: Add tests to ensure Timeline relationships are always properly synthesized
4. **Documentation**: Update API documentation to reflect the new character parameter in synthesizeBidirectionalRelationships

---

## Timeline Node Default Visibility Change

**Date:** 2025-01-30  
**Issue:** Timeline nodes should be hidden by default to reduce visual clutter  
**Solution:** Modified default entity visibility settings to hide timeline nodes until explicitly enabled  

### Problem Statement
Timeline nodes were visible by default when the application loaded, adding visual complexity to the graph. Users requested that timeline nodes be hidden by default and only shown when explicitly enabled through the UI checkbox.

### Analysis

#### Current State Investigation
Analyzed the filtering architecture to understand how entity visibility is controlled:

1. **Filter Store Structure** (`src/stores/filterStore.ts`):
   - Uses Zustand with sessionStorage persistence
   - Contains `entityVisibility` object with boolean flags for each entity type
   - Timeline was set to `true` by default in three locations

2. **UI Component** (`src/components/filters/EntityTypeToggle.tsx`):
   - Provides checkboxes for toggling entity visibility
   - Includes "Show All" and "Hide All" quick actions
   - Works correctly with the store

3. **Graph Filtering** (`src/hooks/useGraphLayout.ts`):
   - Filters nodes based on `entityVisibility` state
   - Properly excludes nodes when visibility is false

### Solution Implementation

#### Design Decision
Created a single source of truth for default entity visibility to improve maintainability and reduce the risk of inconsistent behavior.

#### Changes Made

1. **Added `DEFAULT_ENTITY_VISIBILITY` constant** (`src/stores/filterStore.ts`, lines 49-54):
```typescript
/**
 * Default entity visibility configuration.
 * Single source of truth for initial state and filter resets.
 * Timeline is hidden by default to reduce visual clutter.
 */
const DEFAULT_ENTITY_VISIBILITY = {
  character: true,
  puzzle: true,
  element: true,
  timeline: false,  // Hidden by default until user explicitly enables
};
```

2. **Updated initial state** (line 278):
```typescript
// Before:
entityVisibility: {
  character: true,
  puzzle: true,
  element: true,
  timeline: true,
},

// After:
entityVisibility: DEFAULT_ENTITY_VISIBILITY,
```

3. **Updated `clearAllFilters` function** (line 448):
```typescript
// Before:
entityVisibility: {
  character: true,
  puzzle: true,
  element: true,
  timeline: true,
},

// After:
entityVisibility: DEFAULT_ENTITY_VISIBILITY,
```

4. **Preserved `showAllEntities` behavior** (lines 322-329):
   - Intentionally left unchanged
   - Still shows all entity types including timeline when "Show All" is clicked
   - This is the expected behavior for an explicit "show all" action

### Verification

Created test script (`scripts/test-timeline-filter.ts`) to verify the behavior:

```typescript
// Test Results:
✅ Timeline should be hidden by default
✅ Character should be visible by default
✅ Puzzle should be visible by default
✅ Element should be visible by default
✅ Timeline remains hidden after clearing filters
✅ Timeline becomes visible after showAllEntities
```

### User Experience Impact

#### Before Change
- Timeline nodes visible on initial load
- Added visual complexity for users who don't need timeline information
- Required manual hiding of timeline nodes each session

#### After Change
- Timeline nodes hidden by default
- Cleaner initial graph visualization
- Timeline can be enabled when needed via checkbox
- User preference persists during session (sessionStorage)
- "Show All" button still reveals timeline nodes

### Architecture Benefits

1. **Single Source of Truth**: The `DEFAULT_ENTITY_VISIBILITY` constant eliminates duplicate default definitions
2. **Maintainability**: Future changes to defaults only require updating one location
3. **Consistency**: Ensures initial state and filter reset behavior remain synchronized
4. **Extensibility**: Easy to add new entity types with appropriate defaults

### Testing Considerations

1. **Session Persistence**: The visibility preference persists in sessionStorage during the user's session
2. **Page Refresh**: After refresh, timeline returns to hidden state (unless sessionStorage has user's preference)
3. **Clear Filters**: Properly resets timeline to hidden state
4. **Show All Override**: Correctly shows timeline when explicitly requested

### Related Components

- **EntityTypeToggle**: UI component remains unchanged, correctly reflects new default
- **useGraphLayout**: Filtering logic unchanged, properly respects visibility settings
- **GraphView**: Rendering unchanged, receives filtered nodes from layout hook

This change complements the timeline edge fix by providing users control over when to display the now properly-connected timeline nodes, reducing visual complexity while maintaining full functionality when needed.