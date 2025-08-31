# Fix: React Key Warning in Select Components

## Problem
React was showing a key warning in the browser console:
```
Warning: Each child in a list should have a unique "key" prop.
Check the render method of `RelationFieldEditor`. 
```

This occurred at `RelationFieldEditor.tsx:248` (the Select component) during entity creation.

## Root Causes
1. **Duplicate entity IDs**: During optimistic updates, the same entity could appear twice in `availableEntities`
2. **Unnecessary wrapper complexity**: `SelectItem` component was a no-op wrapper that added no value
3. **Key preservation at component boundary**: The Select component wasn't properly preserving keys when passing children array to native select element

## Solution

### 1. Deduplication Fix
Added Map-based deduplication in `RelationFieldEditor.tsx`:
```typescript
const unselectedEntities = useMemo(() => {
  const byId = new Map<string, any>();
  for (const entity of availableEntities) {
    if (!selectedIds.includes(entity.id) && !byId.has(entity.id)) {
      byId.set(entity.id, entity);
    }
  }
  return Array.from(byId.values());
}, [availableEntities, selectedIds]);
```

### 2. Removed Wrapper Complexity
- Replaced all 22 `SelectItem` uses with native `<option>` elements
- Removed dead code: `SelectItem`, `SelectGroup`, `SelectLabel` components
- Converted `SelectGroup` to native `<optgroup>` elements

### 3. Fixed Key Preservation in Select Component
Updated `select.tsx` to use `React.Children.map` for proper key preservation:
```typescript
// Before:
{children}

// After:
{React.Children.map(children, child => child)}
```

This ensures React properly tracks keys when children (array of options) pass through the component boundary.

## Files Modified
1. `src/components/field-editors/RelationFieldEditor.tsx` - 6 replacements + deduplication
2. `src/components/field-editors/FieldEditor.tsx` - 4 replacements
3. `src/components/CreatePanel.tsx` - 4 replacements  
4. `src/components/CharacterSelector.tsx` - 8 replacements + optgroup conversion
5. `src/components/ui/select.tsx` - Removed dead code + fixed key preservation

## Testing
- TypeScript compilation: ✅ Pass
- ESLint: ✅ No new errors
- React key warnings: ✅ Resolved

## Benefits
- Eliminates React reconciliation warnings
- Reduces code complexity
- Improves performance (fewer component layers)
- Better semantic HTML with native elements
- Proper React key handling at component boundaries