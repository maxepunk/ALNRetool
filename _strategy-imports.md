# Strategy Import Analysis

## Executive Summary

Based on comprehensive codebase analysis, **only ONE file** directly imports the old strategy classes:
- `/home/spide/projects/GitHub/ALNRetool/src/lib/graph/GraphContext.ts`

All other references are:
- Self-declarations in the strategy files themselves (export statements)
- Documentation/planning references in WIP.md and docs

## Detailed Import Analysis

### Critical Dependencies (1 file)

#### 1. GraphContext.ts - PRIMARY CONSUMER
- **File**: `/home/spide/projects/GitHub/ALNRetool/src/lib/graph/GraphContext.ts`
- **Lines**: 16-19, 63-66
- **Import Type**: Direct ES6 imports + instantiation
- **Usage**: Strategy registration in ViewStrategyRegistry
- **Critical Path**: YES - This is the dependency injection root

```typescript
// IMPORTS (lines 16-19)
import { PuzzleFocusStrategy } from './strategies/PuzzleFocusStrategy';
import { CharacterJourneyStrategy } from './strategies/CharacterJourneyStrategy';
import { TimelineStrategy } from './strategies/TimelineStrategy';
import { NodeConnectionsStrategy } from './strategies/NodeConnectionsStrategy';

// USAGE (lines 63-66)
registry.register('puzzle-focus', new PuzzleFocusStrategy());
registry.register('character-journey', new CharacterJourneyStrategy());
registry.register('timeline', new TimelineStrategy());
registry.register('node-connections', new NodeConnectionsStrategy());
```

### Self-Export References (4 files)

These are the strategy files themselves and should be deleted:

1. **PuzzleFocusStrategy.ts**
   - Line 15: `export class PuzzleFocusStrategy implements ViewStrategy {`

2. **CharacterJourneyStrategy.ts** 
   - Line 15: `export class CharacterJourneyStrategy implements ViewStrategy {`

3. **NodeConnectionsStrategy.ts**
   - Line 15: `export class NodeConnectionsStrategy implements ViewStrategy {`

4. **TimelineStrategy.ts**
   - Line 14: `export class TimelineStrategy implements ViewStrategy {`

### Documentation References (Non-Critical)

#### WIP.md
- Multiple planning references discussing migration strategy
- Not code dependencies - safe to ignore

#### docs/DEVELOPER_HANDBOOK.md  
- Contains one reference pattern match
- Documentation only - not a code dependency

### Search Results Summary

#### Import Statement Search
```bash
# Pattern: import.*from.*strategies.*(?:Strategy names)
# Results: 4 imports in GraphContext.ts only
```

#### Export Statement Search  
```bash
# Pattern: export.*(?:Strategy names)
# Results: 4 self-exports in strategy files themselves
```

#### Instantiation Search
```bash
# Pattern: new (?:Strategy names)
# Results: 4 instantiations in GraphContext.ts only  
```

#### String Reference Search
```bash
# Pattern: '(?:Strategy names)'|"(?:Strategy names)"
# Results: None (no hardcoded string references)
```

#### Dynamic Import Search
```bash
# Pattern: require(...)|import(...)
# Results: None (no dynamic imports)
```

## Fix Priority Matrix

### CRITICAL (Must Fix Before Deletion)
1. **GraphContext.ts** - Remove 4 imports + 4 registrations
   - High Priority: This will break the entire graph system if not fixed
   - Replace with: Declarative configuration registration

### SAFE TO DELETE
1. **Strategy Files** (4 files)
   - PuzzleFocusStrategy.ts
   - CharacterJourneyStrategy.ts  
   - NodeConnectionsStrategy.ts
   - TimelineStrategy.ts

### NO ACTION REQUIRED
1. **WIP.md** - Planning documentation, will be cleaned up
2. **docs/DEVELOPER_HANDBOOK.md** - Documentation reference only

## Recommended Deletion Order

1. **First**: Fix GraphContext.ts imports and registrations
2. **Then**: Delete all 4 strategy files in any order
3. **Finally**: Clean up documentation references (optional)

## Verification Commands

After fixes, verify no orphaned imports remain:

```bash
# Should return empty after successful migration
grep -r "PuzzleFocusStrategy\|CharacterJourneyStrategy\|NodeConnectionsStrategy\|TimelineStrategy" src/ --exclude-dir=node_modules
```

## Impact Assessment

- **Low Risk**: Only one file needs modification
- **High Impact**: That file is the dependency injection root
- **Clean Architecture**: No circular dependencies or complex import chains
- **Test Coverage**: No test files importing strategies directly