# Character Selection Conflict Resolution

## Problem
The character journey page was showing duplicate character selectors:
1. One in the sidebar filters
2. One in the main page header  
3. One in the empty state

This caused conflicts where:
- Different selectors could have different values
- URL params and Zustand store were out of sync
- Only one-way sync from URL to store
- No single source of truth for character selection

## Solution Implemented

### 1. Removed Duplicate Selectors
- ✅ Removed CharacterSelector from header (line 174 in CharacterJourneyView.tsx)
- ✅ Removed CharacterSelector from empty state (line 144)
- ✅ Added prompt to use sidebar selector instead

### 2. Updated CharacterSelector Component
- ✅ Now uses filter store as primary data source
- ✅ Implements bidirectional sync between store and URL
- ✅ Updates both store and navigation on selection change

### 3. Updated CharacterJourneyView
- ✅ Uses store's `selectedCharacterId` as primary source
- ✅ Falls back to URL parameter if store is empty
- ✅ Syncs URL with store when store changes
- ✅ Syncs store with URL on mount

## Code Changes

### CharacterSelector.tsx
```typescript
// Added bidirectional sync
useEffect(() => {
  if (characterId && characterId !== selectedCharacterId) {
    selectCharacter(characterId);
  }
}, [characterId, selectedCharacterId, selectCharacter]);

const handleCharacterChange = (newCharacterId: string) => {
  if (newCharacterId) {
    selectCharacter(newCharacterId);  // Update store
    navigate(`/character-journey/${newCharacterId}`);  // Update URL
  }
};

// Use store as source of truth
const activeCharacterId = selectedCharacterId || characterId;
```

### CharacterJourneyView.tsx
```typescript
// Use store as primary source
const characterId = characterFilters.selectedCharacterId || urlCharacterId;

// Sync URL with store
useEffect(() => {
  if (characterFilters.selectedCharacterId && 
      characterFilters.selectedCharacterId !== urlCharacterId) {
    navigate(`/character-journey/${characterFilters.selectedCharacterId}`, 
             { replace: true });
  }
}, [characterFilters.selectedCharacterId, urlCharacterId, navigate]);
```

## Result
- Single character selector in sidebar
- Bidirectional sync between URL and store
- Filter store is the single source of truth
- No more conflicting states
- Clean, unified user experience

## Testing
1. Navigate to `/character-journey` - shows prompt to use sidebar
2. Select character from sidebar - updates both URL and view
3. Navigate directly to `/character-journey/{id}` - syncs with store
4. Switch characters - updates both URL and view correctly