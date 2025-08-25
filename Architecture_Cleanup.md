RADICAL SIMPLIFICATION IMPLEMENTATION PLAN

     Overview

     Complete architectural overhaul to transform a massively over-engineered codebase (300+ files) into a lean, rapidly-modifiable tool (~90 files) optimized for 2-3 game designers creating bespoke graph views.

     ---
     PHASE 1: SAFETY INVENTORY & PREPARATION

     Objective

     Create comprehensive inventory before any deletion to prevent breaking critical functionality.

     Tasks

     1. Create Safety Backup
       - Create branch: pre-simplification-backup
       - Document current working features
       - Run full test suite and note passing tests
     2. Map Active Components
       - Trace all active routes and rendered components
       - Map data flow: Notion API → Transform → React Flow
       - Identify hooks/components with active references
     3. Document Critical Logic
       - List business logic that must survive
       - Create "DO NOT DELETE" list of critical files
       - Identify the ONE true path (config-based architecture)

     Key Decision

     → Commit to CONFIG-BASED architecture (ViewBuilder/ViewConfiguration)
     → All module-based code will be removed

     ---
     PHASE 2: DEAD CODE ELIMINATION

     Objective

     Remove all confirmed dead code with zero functionality loss.

     Deletion Targets

     src/views/
       - CharacterJourneyView.tsx [DELETE]
       - PuzzleFocusView.tsx [DELETE] 
       - NodeConnectionsView.tsx [DELETE]

     src/hooks/
       - useCharacterJourneyData.ts [DELETE]
       - usePuzzleFocusData.ts [DELETE]
       - useNodeConnectionsData.ts [DELETE]

     scripts/ (Keep only 10 essential)
       - 60+ redundant debug/test scripts [DELETE]
       
     tests/
       - Tests for deleted components [DELETE]
       - Unused test utilities [DELETE]

     Verification Checklist

     - npm run build succeeds
     - npm run dev starts
     - GraphView renders
     - Notion API works

     Expected: ~100 files removed

     ---
     PHASE 3: OLD ARCHITECTURE REMOVAL

     Objective

     Remove competing module-based architecture entirely.

     Major Deletions

     src/lib/graph/
       GraphOrchestrator.ts [DELETE - keep ViewBuilder]
       EdgeBuilder.ts (1494 lines) [DELETE]
       BaseTransformer.ts [DELETE]
       EntityTransformer.ts [DELETE]
       GraphContext.ts (11+ deps) [DELETE]
       TraversalEngine.ts [DELETE]
       MetricsCalculator.ts [DELETE]
       
       layout/
         - All except dagre.ts [DELETE]

     What Stays (Config-Based)

     KEEP:
       - ViewBuilder
       - ViewConfiguration
       - ViewRegistry (simplified)
       - dagre.ts (only layout)

     Migration During Deletion

     - Extract unique business logic
     - Move to simplified modules
     - Test after each major deletion

     ---
     PHASE 4: CONSOLIDATION OF DUPLICATES

     Objective

     Merge duplicate implementations into single modules.

     Consolidation Map

     Before                          After
     ------                          -----
     EdgeBuilder (1494)     }
     EdgeResolver (1023)    } →      edges.ts (~300 lines)
     RelationshipProcessor  }

     CharacterTransformer   }
     ElementTransformer     } →      transformers.ts (~400 lines)
     PuzzleTransformer      }
     TimelineTransformer    }

     GraphOrchestrator      }
     GraphBuilder           } →      ViewBuilder (enhanced)
     ViewBuilder            }

     Final Graph Structure

     src/lib/graph/
       ├── config/          [ViewBuilder, ViewConfiguration]
       ├── edges.ts         [All edge logic]
       ├── transformers.ts  [All node transforms]
       ├── dagre.ts         [Only layout]
       └── types.ts         [Type definitions]

     ---
     PHASE 5: HOOK SIMPLIFICATION

     Objective

     Replace 25 specialized hooks with 3 generic ones.

     New Generic Hooks

     1. useEntityData(type, filters)

     // Replaces all entity-specific hooks
     const { data } = useEntityData('characters', { tier: 'S' });

     2. useGraphData(viewType, params)

     // Replaces all view-specific data hooks
     const graph = useGraphData('node-connections', { nodeId, depth });

     3. useMutation(entity, operation)

     // Replaces all mutation hooks
     const { mutate } = useMutation('elements', 'update');

     Deletion: 22 hooks → Keep: 3 hooks

     ---
     PHASE 6: COMPONENT SIMPLIFICATION

     Objective

     Single configurable GraphView component.

     New Component Architecture

     src/components/
       ├── GraphView.tsx       [Main component - handles all views]
       ├── DetailPanel.tsx     [Node details]
       ├── FilterPanel.tsx     [Filter controls]
       ├── common/             [Utilities]
       └── ui/                 [Keep shadcn]

     Usage Pattern

     <GraphView 
       viewType="node-connections"
       config={viewConfig}
       filters={filters}
     />

     Backend Parallel Simplification

     - Remove inverse relation handler
     - Single cache layer
     - Consolidate 29 files → ~10 files

     Reduction: 92 components → 20 components

     ---
     PHASE 7: CONFIG-BASED VIEW REFINEMENT

     Objective

     Make new view creation trivial (<2 hours).

     Simplified View Creation Process

     Step 1: Define Config

     const MyView: ViewConfiguration = {
       id: 'my-view',
       filters: { entityTypes: ['puzzles'] },
       transformOptions: { includeRelationships: true },
       layoutOptions: { direction: 'LR' }
     };

     Step 2: Register

     ViewRegistry.register(MyView);

     Step 3: Use

     <GraphView viewType="my-view" />

     Documentation

     - Create CREATING_VIEWS.md
     - Provide 3-4 templates
     - Simple filter examples

     ---
     PHASE 8: VALIDATION & TESTING

     Objective

     Verify system works and supports rapid development.

     Test Checklist

     - Core features work (GraphView, Notion API, Filters)
     - Build time decreased >50%
     - Bundle size decreased >60%
     - New view creation <2 hours
     - No TypeScript errors
     - File count <100

     Success Metrics

     Before: 300+ files, Days to add view
     After:  <90 files,  <2 hours to add view

     ---
     PHASE 9: FINAL OPTIMIZATION

     Objective

     Complete transformation and prepare for ongoing development.

     Final Tasks

     1. Code Splitting
       - Lazy load GraphView
       - Dynamic view config imports
     2. TypeScript Cleanup
       - Consolidate types
       - Remove unused definitions
     3. Developer Experience
       - View templates
       - Scaffolding scripts
       - Quick start guide

     Final Structure

     ALNRetool/
     ├── server/ (10 files)
     ├── src/
     │   ├── components/ (20 files)
     │   ├── hooks/ (3 files)
     │   └── lib/graph/ (10 files)

     ---
     SUCCESS CRITERIA

     Achieved Goals

     - 70% code reduction
     - Single architecture (config-based)
     - No duplicate implementations
     - New view creation <2 hours
     - Clean, maintainable codebase

     Priority Order

     1. FIRST: Remove all dead code and old architecture
     2. THEN: Consolidate duplicates
     3. FINALLY: Optimize and document

     This ensures no confusion from old files corrupting the new clean architecture.