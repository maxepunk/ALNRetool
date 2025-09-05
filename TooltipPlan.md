Comprehensive Tooltip Implementation Plan

  Phase 0: Infrastructure Setup (2 hours)

  0.1 Create Entity Lookup Context

  File: src/contexts/GraphDataContext.tsx
  interface GraphDataContextValue {
    getEntityById: (id: string, type: EntityType) => Entity | undefined;
    getEntityName: (id: string, type: EntityType) => string;
    getEntityNames: (ids: string[], type: EntityType) => string[];
  }

  0.2 Create Tooltip Helper Utilities

  File: src/lib/graph/tooltipHelpers.ts
  export const truncateTooltip = (text: string, maxLength = 150): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  export const formatCountTooltip = (
    label: string,
    items: string[],
    maxItems = 5
  ): string => {
    if (items.length === 0) return `No ${label}`;
    const shown = items.slice(0, maxItems);
    const remaining = items.length - maxItems;
    return `${label} (${items.length}): ${shown.join(', ')}${
      remaining > 0 ? ` and ${remaining} more` : ''
    }`;
  };

  Phase 1: BaseNodeCard Core Tooltip (30 min)

  File: src/components/graph/nodes/BaseNodeCard.tsx
  - Line 219: Already has title tooltip ✓
  - Add: Conditional tooltip only when text is actually truncated
  const isTruncated = title.length > 20; // Approximate truncation point
  <h3 className="font-semibold truncate" title={isTruncated ? title : undefined}>

  Phase 2: CharacterNode Tooltips (1 hour)

  File: src/components/graph/nodes/CharacterNode.tsx

  2.1 Tier Badge Tooltip (Line 49-54)

  <Badge
    variant="outline"
    className="..."
    title={`Character Tier: ${entity.tier}${
      entity.tier === 'Core' ? ' - Main character essential to story' :
      entity.tier === 'Secondary' ? ' - Supporting character with significant role' : 
      ' - Background character for world-building'
    }`}
  >

  2.2 Element Count Tooltip (Line 60-64)

  const elementNames = useGraphData().getEntityNames(entity.ownedElementIds, 'element');
  <span 
    className="..."
    title={formatCountTooltip('Owned Elements', elementNames)}
  >

  2.3 Puzzle Count Tooltip (Line 66-70)

  const puzzleNames = useGraphData().getEntityNames(entity.characterPuzzleIds, 'puzzle');
  <span 
    className="..."
    title={formatCountTooltip('Associated Puzzles', puzzleNames)}
  >

  2.4 Character Logline Tooltip (Line 77)

  const isLoglineTruncated = entity.characterLogline?.length > 60;
  <div 
    className="text-xs text-teal-800 italic line-clamp-2 text-center"
    title={isLoglineTruncated ? entity.characterLogline : undefined}
  >

  2.5 Character Type Icon (Line 83)

  const icon = isNPC ?
    <Users className="h-5 w-5" title="Non-Player Character (NPC)" /> :
    <User className="h-5 w-5" title="Player Character" />;

  Phase 3: PuzzleNode Tooltips (1 hour)

  File: src/components/graph/nodes/PuzzleNode.tsx

  3.1 Owner Badge Tooltip (Line 63-67)

  const ownerName = useGraphData().getEntityName(entity.ownerId, 'character');
  <div 
    className="..."
    title={`Owner: ${ownerName || 'Unassigned'}`}
  >

  3.2 Complexity Tooltip

  const getComplexityTooltip = () => {
    const connections = (entity.puzzleElementIds?.length || 0) + (entity.rewardIds?.length || 0);
    return `Complexity: ${getComplexity()} (${connections} total connections)`;
  };

  3.3 Status Badge Tooltips

  const statusTooltips = {
    draft: 'Draft: Missing required elements',
    ready: 'Ready: All requirements configured',
    locked: 'Locked: Prerequisites not met',
    error: 'Error: Configuration issue detected'
  };

  3.4-3.5 Requirements/Rewards in DiamondCard

  Extend DiamondCard props to accept:
  interface DiamondCardProps {
    // ... existing
    requirementsTooltip?: string;
    rewardsTooltip?: string;
  }

  Phase 4: ElementNode Tooltips (1.5 hours)

  File: src/components/graph/nodes/ElementNode.tsx

  4.1 SF Badge Tooltip (Line 101-122)

  title={`SF Pattern${entity.sfPatterns?.valueRating ? 
    ` - Value: ${entity.sfPatterns.valueRating}/5` : ''
  }${entity.sfPatterns?.memoryType ? 
    ` - Type: ${entity.sfPatterns.memoryType}` : ''
  }`}

  4.2 Memory Type Badge (Line 124-131)

  const memoryTypeDescriptions = {
    Personal: 'Personal memory or emotional significance',
    Business: 'Professional or business-related memory',
    Technical: 'Technical or procedural memory'
  };
  title={memoryTypeDescriptions[entity.sfPatterns.memoryType]}

  4.3 RFID Tooltip (Line 188-193)

  title={`Radio Frequency ID: ${entity.sfPatterns.rfid}
  Used for tracking and identification in the SF system`}

  4.4 Narrative Threads (Line 212-228)

  title={`All narrative threads (${entity.narrativeThreads.length}):
  ${entity.narrativeThreads.join(', ')}`}

  4.5 Element Type (Line 176-184)

  title={`${entity.isContainer ? 'Container' : 'Prop'} - ${
    entity.basicType || 'Standard element'
  }`}

  4.6 Direction Indicators (Already done Lines 142, 152, 161) ✓

  Phase 5: TimelineNode Tooltips (45 min)

  File: src/components/graph/nodes/TimelineNode.tsx

  5.1 Date Badge (Line 53-57)

  const fullDate = new Date(entity.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  <Badge ... title={fullDate}>

  5.2 Character Count (Line 64-68)

  const characterNames = useGraphData().getEntityNames(entity.charactersInvolvedIds, 'character');
  <span ... title={formatCountTooltip('Characters Involved', characterNames)}>

  5.3 Evidence Count (Line 70-74)

  const evidenceNames = useGraphData().getEntityNames(entity.memoryEvidenceIds, 'element');
  <span ... title={formatCountTooltip('Related Evidence', evidenceNames)}>

  5.4 Description (Line 82)

  const isDescTruncated = entity.description?.length > 80;
  <div ... title={isDescTruncated ? entity.description : undefined}>

  Phase 6: Card Component Updates (1 hour)

  6.1 DiamondCard.tsx

  // Add to props interface
  requirementsTooltip?: string;
  rewardsTooltip?: string;
  statusTooltips?: Record<NodeStatus, string>;

  // In requirement dots
  <div title={requirementsTooltip}>
    {/* existing dots */}
  </div>

  // In status badges
  <Badge title={statusTooltips?.[status]}>

  6.2 HexagonCard.tsx

  // Similar pattern for any counts/badges

  Phase 7: Testing Protocol (2 hours)

  7.1 Manual Browser Testing

  1. Start dev server: npm run dev
  2. Load graph with test data
  3. For each node type:
    - Hover over each tooltip location
    - Verify tooltip appears
    - Check content accuracy
    - Test with long content
    - Test with empty/null values

  7.2 Create Visual Test Checklist

  ## CharacterNode Tooltips
  - [ ] Tier badge shows description
  - [ ] Element count lists elements (max 5)
  - [ ] Puzzle count lists puzzles (max 5)
  - [ ] Truncated logline shows full text
  - [ ] NPC icon explains character type

  ## PuzzleNode Tooltips
  - [ ] Owner badge shows character name
  - [ ] Complexity explains calculation
  - [ ] Status badges explain meaning
  - [ ] Requirements count lists elements
  - [ ] Rewards count lists rewards

  ## ElementNode Tooltips
  - [ ] SF badge shows value and type
  - [ ] Memory type explains category
  - [ ] RFID shows full ID and purpose
  - [ ] Narrative threads lists all
  - [ ] Element type explains container/prop

  ## TimelineNode Tooltips
  - [ ] Date shows full formatted date
  - [ ] Character count lists names
  - [ ] Evidence count lists items
  - [ ] Truncated description shows full

  Phase 8: Documentation (30 min)

  Create docs/TOOLTIP_PATTERNS.md:
  # Tooltip Implementation Patterns

  ## When to Add Tooltips
  1. **Truncated Text**: Any text with truncate/line-clamp
  2. **Counts/Aggregates**: Show first 5 items
  3. **Abbreviations**: Explain shortened forms
  4. **Status Indicators**: Explain meaning
  5. **Icons**: When not self-explanatory

  ## Standard Formats
  - Counts: "Label (N): Item1, Item2, Item3 and N more"
  - Status: "Status: Explanation"
  - Abbreviations: "Full Form: Description"

  ## Implementation Checklist
  - [ ] Only add tooltip if value exists
  - [ ] Limit tooltip length to ~150 chars
  - [ ] Use formatCountTooltip for lists
  - [ ] Test with null/empty values

  Risk Mitigation

  1. Data Access Issue: Implement GraphDataContext first
  2. Performance: Only add tooltips where valuable
  3. Null Safety: Always check for undefined before adding title
  4. Testing: Test each component after changes
  5. Consistency: Use helper functions for formatting

  Success Criteria

  ✅ All 26 tooltip opportunities implemented
  ✅ GraphDataContext provides entity lookups
  ✅ Helper functions ensure consistent formatting
  ✅ Manual testing confirms all tooltips work
  ✅ Documentation guides future additions
  ✅ No performance degradation
  ✅ No breaking changes to existing functionality

  Execution Timeline

  - Day 1: Phase 0-2 (Infrastructure + BaseNode + CharacterNode)
  - Day 2: Phase 3-5 (Puzzle + Element + Timeline)
  - Day 3: Phase 6-8 (Cards + Testing + Documentation)

  Total estimated time: ~10-12 hours