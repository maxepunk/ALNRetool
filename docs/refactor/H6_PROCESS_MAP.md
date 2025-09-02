# H6 Implementation Process Map
## 26 Tasks with Exact Process Requirements

### Phase 1 Implementation Tasks (1-5): Type-Aware Refactor

**ITERATION CYCLE**:
```
For each helper function (charactersEqual, elementsEqual, puzzlesEqual, timelinesEqual):

COGNITIVE PREPARATION (5-10 min):
1. THINK: What specific problem does this helper solve?
2. List assumptions about properties and their behavior
3. zen challenge key assumptions if uncertain
4. Identify knowledge gaps [CRITICAL/IMPORTANT/MINOR]
5. Craft approach with complete context

THREE UNDERSTANDINGS (document in CHANGELOG):
   - WHAT gap: Long unmaintainable function
   - HOW: Extract type-specific helper  
   - WHY: Maintainability, prevent property mistakes

IMPLEMENTATION:
2. Implement (~20-30 lines each)
3. zen chat review IMMEDIATELY (not after all 4!)
4. Fix issues (max 3 iterations)
5. Update CHANGELOG with decision
```

**CYCLE ENDS**: When zen chat returns all PASS

### Phase 1 Testing Tasks (6-8): Unit/Integration Tests

**COGNITIVE PREPARATION** (before EACH test):
```
1. THINK: What behavior am I validating?
2. List assumptions about expected outcomes
3. Identify edge cases to test
4. Knowledge gaps about test coverage
5. Craft test approach
```

**PROCESS**:
1. Write test
2. Run test
3. Fix until passing (make sure you are testing behavior and not specific implementation)
4. Zen chat review (ensure the tests are well designed for long-term useability)
5. Fix issues (max 3 iterations)
4. Document in CHANGELOG

**CYCLE ENDS**: When zen chat returns all PASS

### Phase 1 Documentation Tasks (9-10): Rollup docs, tech debt ticket

**COGNITIVE PREPARATION**:
```
1. THINK: What knowledge needs preserving?
2. List assumptions about future maintainers
3. Identify critical warnings to document
4. Knowledge gaps in current docs
5. Craft documentation approach
```

**PROCESS**:
1. Document rollup vs relation properties
2. Create tech debt ticket with context
3. Update CHANGELOG

**NO zen tools** - Pure documentation
**CYCLE ENDS**: When documented

### Phase 1 Validation (11-12): zen codereview + precommit

**COGNITIVE PREPARATION**:
```
1. THINK: What quality criteria matter most?
2. List assumptions about completeness
3. Identify risk areas to highlight
4. Knowledge gaps in review coverage
5. Craft comprehensive review context
```

**PROCESS**:
```
zen codereview with ALL Phase 1 changes
If PARTIAL/FAIL → Fix → Re-review (max 3 iterations)
When PASS → zen precommit
```

**CYCLE ENDS**: zen precommit returns PASS

### Phase 2 Design Task (13): Transactional Pattern

**COGNITIVE PREPARATION**:
```
1. THINK: What makes a transaction "atomic" in our context?
2. List assumptions about:
   - Notion API transactional capabilities
   - Failure modes and recovery
   - Rollback possibilities
3. zen challenge: "Can we truly rollback Notion changes?"
4. Knowledge gaps:
   - [CRITICAL]: Notion API transaction support
   - [CRITICAL]: Error recovery patterns
5. Craft complete context for planner
```

**THEN zen planner**:
```
zen planner "Design transactional delta pattern
Context: [findings from cognitive prep]
Constraints: [no breaking changes, atomic operations]
Goal: [prevent partial updates]"
```

**CYCLE ENDS**: Plan approved

### Phase 2 Implementation Tasks (14-17): Transaction wrapper

**ITERATION CYCLE**:
```
For EACH component (manager, PUT wrapper, DELETE wrapper):

COGNITIVE PREPARATION:
1. THINK: What failure modes must this handle?
2. List assumptions about error propagation
3. zen challenge critical assumptions
4. Knowledge gaps about transaction semantics
5. Craft approach

THREE UNDERSTANDINGS:
- WHAT gap: Partial updates on failure
- HOW: Wrap in transaction context
- WHY: Atomic operations required

IMPLEMENTATION:
1. Implement component
2. zen chat review with gemini-2.5-pro
3. Fix (max 3 iterations)
```

**CYCLE ENDS**: Each zen chat PASS

### Phase 2 Testing (18-19): Failure & Concurrent tests

**COGNITIVE PREPARATION** (before EACH test):
```
1. THINK: What failure mode am I simulating?
2. List assumptions about error propagation
3. Identify race conditions to test
4. Knowledge gaps about concurrent behavior
5. Craft failure scenario approach
```

**PROCESS**: Same as Phase 1 tests - no zen review needed

### Phase 2 Validation (20): zen precommit

**COGNITIVE PREPARATION**:
```
1. THINK: Are transactions truly atomic now?
2. List assumptions about rollback completeness
3. Identify remaining partial update risks
4. Knowledge gaps in error handling
5. Craft validation context
```

**PROCESS**: zen precommit

**CYCLE ENDS**: zen precommit PASS

### Phase 3 Bug Fixes (21-23): Bugs 6-8

**EACH BUG needs**:
```
COGNITIVE PREPARATION:
1. THINK: What observable behavior indicates this bug?
2. List assumptions about root cause
3. zen challenge most likely assumption
4. Identify knowledge gaps about bug domain
5. Craft hypothesis with evidence

THEN:
1. zen debug "Bug X: [description], hypothesis: [from cognitive prep]"
2. Three Understandings based on debug findings
3. Implementation
4. zen chat review (if >50 lines)
5. Test to verify fix
```

**CYCLE ENDS**: Bug verified fixed

### Phase 3 Registry (24): Entity relation registry

**COGNITIVE PREPARATION**:
```
1. THINK: What makes a registry maintainable?
2. List assumptions about usage patterns
3. Identify extensibility requirements
4. Knowledge gaps about type safety needs
5. Craft decision criteria
```

**PROCESS**:
```
1. zen consensus "Single source of truth: 
   Option A: [config object]
   Option B: [type registry]
   Criteria: [maintainability, type safety]"
2. Implement chosen approach
3. zen chat review
```

**CYCLE ENDS**: zen chat PASS

### Phase 3 Final (25-26): Integration test + precommit

**COGNITIVE PREPARATION**:
```
1. THINK: What end-to-end scenarios validate success?
2. List assumptions about system behavior
3. Identify integration points to verify
4. Knowledge gaps in coverage
5. Craft comprehensive test strategy
```

**PROCESS**:
```
1. Comprehensive integration test
2. COGNITIVE PREPARATION for final review:
   - THINK: Have we met all H6 objectives?
   - List remaining risks
   - Identify technical debt created
   - Craft complete review context
3. zen codereview of ENTIRE H6 implementation
4. zen precommit for final validation
```

**CYCLE ENDS**: Ready to merge

## Critical Process Points

**FUNDAMENTAL RULE**: Cognitive Preparation is REQUIRED at the beginning of EVERY cycle and before any critical/complex step. No exceptions.

1. **Different tools for different tasks**:
   - Implementation → zen chat review
   - Design → zen planner
   - Bugs → zen debug
   - Decisions → zen consensus
   - Tests → NO zen tools

2. **Review frequency**:
   - Every helper function separately (not all 4 at once)
   - Every 50 lines or significant change
   - NOT for tests or documentation

3. **Iteration limits**:
   - Max 3 per issue before escalating approach
   - Must change approach each iteration

4. **Observable execution**:
   - CHANGELOG updates at EVERY decision point
   - Not just at phase end

## Estimated zen tool calls: ~40 across all 26 tasks

## Current Status
- Phase 1 Task 1 (Refactor nodesEqual) is IN PROGRESS
- Next: Create individual helper functions with zen chat review after each