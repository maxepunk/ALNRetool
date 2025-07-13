# ALNRetool Design Intelligence System
## Product Requirements Document v4.0

**Version**: 4.0  
**Date**: January 2025  
**Status**: Pragmatic MVP with 2-Way Sync  
**Purpose**: Visual design support with in-tool editing for "About Last Night" creative team

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Definition](#problem-definition)
3. [Solution Overview](#solution-overview)
4. [Notion Data Documentation](#notion-data-documentation)
5. [Core MVP Features](#core-mvp-features)
6. [2-Way Sync Implementation](#2-way-sync-implementation)
7. [Technical Architecture](#technical-architecture)
8. [Implementation Plan](#implementation-plan)
9. [Success Metrics](#success-metrics)
10. [Future Roadmap](#future-roadmap)

---

## Executive Summary

ALNRetool is a focused visualization and editing tool that helps a puzzle designer and narrative designer/writer see and modify the connections in their work on "About Last Night," a 20-40 player murder mystery experience. The MVP delivers three simple views that reveal how puzzles create character interactions, what content needs writing, and how players discover the story - all with the ability to make quick edits without switching to Notion.

**Core Value**: Transform Notion's databases into simple, filterable graphs with inline editing that keeps designers in their flow state while maintaining data integrity.

---

## Problem Definition

### The Design Challenge

Two designers working in parallel tracks need to:

**Puzzle Designer**:
- Design puzzles with specific mechanical requirements
- Understand which characters will interact through puzzle dependencies
- See narrative implications of mechanical choices
- Request specific content needs from narrative designer
- **NEW**: Quickly adjust puzzle requirements without context switching

**Narrative Designer/Writer**:
- Write requested content for puzzle mechanics
- Build narrative elements around puzzle flow
- Track what needs writing vs what's complete
- Ensure character connections support roleplay opportunities
- **NEW**: Update content and status in the same tool where they visualize it

### The Visualization Gap

Notion excels at data storage but cannot show:
- How a puzzle creates character interactions
- Which timeline events are revealed through which gameplay paths
- The narrative weight of mechanical decisions
- Content completion status across interconnected elements

### The Context Switching Problem

**NEW**: Current workflow requires constant switching between visualization tool and Notion for simple updates like:
- Marking content as complete
- Adjusting element ownership
- Adding narrative thread tags
- Updating puzzle requirements

---

## Solution Overview

### Simple Visualizations with Smart Editing

ALNRetool provides **three focused views** that answer one question well, with inline editing:

1. **Puzzle Focus View**: "Who needs to interact to solve this puzzle?" + edit requirements
2. **Character Journey View**: "What content can this character access?" + reassign ownership
3. **Content Status View**: "What needs writing next?" + update status inline

### Design Principles

- **Ship in 8 Weeks**: Including 2-way sync adds only 2-3 days
- **Edit in Context**: Make changes where you see them
- **Notion is Truth**: All edits sync immediately to Notion
- **Fail Gracefully**: If sync fails, show clear errors and fallback options

---

## Notion Data Documentation

### Database Structure

#### Characters Database (`18c2f33d-583f-8060-a6ab-de32ff06bca2`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Name** | Title | Character identifier | Display name in graphs |
| **Type** | Select (NPC/Player) | Playable vs non-playable | Filter option, visual distinction |
| **Tier** | Select (Core/Secondary/Tertiary) | Narrative importance; Core=5 minimum players | Node importance/size, filter priority |
| **Owned Elements** | Relation (synced with Elements.Owner) | Items character starts with or POV memories | Primary puzzle access paths |
| **Associated Elements** | Relation | Narratively connected items | Secondary connections |
| **Character Puzzles** | Relation | Puzzles this character can access | Direct puzzle connections |
| **Events** | Relation (synced with Timeline.Characters Involved) | Backstory moments involving character | Narrative depth |
| **Connections** | Rollup (Events → Characters, function: unique) | Shared timeline events with others | Social interaction potential |
| **Primary Action** | Rich Text | Core character behavior | Future: personality modeling |
| **Character Logline** | Rich Text | One-line description | Tooltip/summary display |
| **Overview & Key Relationships** | Rich Text | Detailed background | Future: relationship mapping |
| **Emotion towards CEO & others** | Rich Text | Relationship dynamics | Future: emotion network |

**Design Intent**: Ownership is probabilistic - "most likely to possess first." Core tier includes both Players and NPCs critical to the narrative (e.g., Detective).

#### Elements Database (`18c2f33d-583f-8020-91bc-d84c7dd94306`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Name** | Title | Element identifier | Node labels |
| **Description/Text** | Rich Text | Content + SF_ patterns | Parse for memory values, display content |
| **Basic Type** | Select | Physical manifestation | Icon/color coding |
| | | Options: Set Dressing, Prop, Memory Token (Audio/Video/Image/Audio+Image), Document | Memory tokens are RFID scannable |
| **Owner** | Relation (synced with Characters.Owned Elements) | Who likely possesses first | Access path visualization |
| **Container** | Relation (synced with Elements.Contents) | Physical containment | Nesting visualization |
| **Contents** | Relation (synced with Elements.Container) | What's inside containers | Unlock flow display |
| **Timeline Event** | Relation (synced with Timeline.Memory/Evidence) | What backstory this reveals | Narrative discovery paths |
| **Status** | Status (8 options, 3 groups) | Production readiness | Filter by completion |
| | | **To-do**: Idea/Placeholder | Not started |
| | | **In progress**: in space playtest ready, In development, Writing Complete, Design Complete, Source Prop/print, Ready for Playtest | Active work |
| | | **Complete**: Done | Finished |
| **First Available** | Select (Act 0/1/2/null) | When physically accessible | Temporal filtering |
| **Required For** | Relation (synced with Puzzles.Puzzle Elements) | Puzzles needing this element | Dependency chains |
| **Rewarded By** | Relation (synced with Puzzles.Rewards) | Puzzles that unlock this | Reward paths |
| **Container Puzzle** | Relation (synced with Puzzles.Locked Item) | Puzzle that opens this container | Unlock mechanics |
| **Narrative Threads** | Multi-select (26 options) | Story categories | Future: thread following |
| **Associated Characters** | Rollup (Timeline Event → Characters) | Characters in related events | Connection discovery |
| **Puzzle Chain** | Rollup (Container → Container Puzzle) | Puzzle dependencies | Chain visualization |
| **Production/Puzzle Notes** | Rich Text | Design/fabrication notes | Context for status |
| **Files & media** | Files | Digital assets | Production reference |
| **Content Link** | URL | External resources | Asset management |
| **Container?** | Formula | Whether element is a container | Container identification |
| | | Formula: `not empty(Contents) OR not empty(Container Puzzle)` | True if has contents or is locked |

**SF_ Pattern Structure** (embedded in Description/Text):
```
SF_RFID: [unique identifier]
SF_ValueRating: [1-5] // Narrative importance AND monetary multiplier
SF_MemoryType: [Personal(x1)|Business(x3)|Technical(x5)]
SF_Group: [{Group Name} (x2-10)] // Collection bonuses
```

Currently all are templates marked "Template (Needs to be filled out)"

#### Puzzles Database (`1b62f33d-583f-80cc-87cf-d7d6c4b0b265`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Puzzle** | Title | Puzzle identifier | Node labels |
| **Description/Solution** | Rich Text | How to solve | Mechanic documentation |
| **Puzzle Elements** | Relation (synced with Elements.Required For) | Required elements | Dependency visualization |
| **Locked Item** | Relation (synced with Elements.Container Puzzle) | Container this opens | Ownership derivation |
| **Owner** | Rollup (Locked Item → Owner, function: show_unique) | Character who "owns" puzzle | Access paths |
| **Rewards** | Relation (synced with Elements.Rewarded By) | Elements gained | Outcome flows |
| **Parent item** | Relation (synced with Puzzles.Sub-Puzzles) | Parent in puzzle chain | Hierarchy display |
| **Sub-Puzzles** | Relation (synced with Puzzles.Parent item) | Children in puzzle chain | Sub-puzzle navigation |
| **Story Reveals** | Rollup (Rewards → Timeline Event, function: show_unique) | Timeline events uncovered | Narrative impact |
| **Timing** | Rollup (Puzzle Elements → First Available, function: show_unique) | When solvable (Act availability) | Temporal constraints |
| **Narrative Threads** | Rollup (Rewards → Narrative Threads, function: show_unique) | Story categories touched | Thread connections |
| **Asset Link** | URL | External documentation | Design reference |

**Key Insight**: Puzzle "ownership" derives from who owns the locked container - creating natural starting points for puzzle chains. No difficulty field exists in the schema.

#### Timeline Database (`1b52f33d-583f-80de-ae5a-d20020c120dd`)

| Field | Type | Purpose | Design Implications |
|-------|------|---------|-------------------|
| **Description** | Title | Event summary | Event labels |
| **Date** | Date | When it happened | Timeline ordering |
| **Characters Involved** | Relation (synced with Characters.Events) | Who was present | Connection building |
| **Memory/Evidence** | Relation (synced with Elements.Timeline Event) | How players learn this | Discovery paths |
| **mem type** | Rollup (Memory/Evidence → Basic Type, function: show_unique) | Type of evidence | Discovery medium |
| **Notes** | Rich Text | Design notes | Context |
| **Last edited time** | Last Edited Time | Modification tracking | Version awareness |

**Design Intent**: Timeline events ARE the backstory. Players experience collective amnesia and rediscover these through elements. The murder is one thread among many mysteries.

### Game Flow Structure

**Act 0**: Lobby check-in, character sheets (2-3 key timeline events), escort to play space

**Act 1**: 
- Detective intro, reinforce amnesia, distribute coat check items
- Puzzle solving to gather evidence, murder wall assembly
- Unlock key items leading to video memory token
- Black market introduction

**Act 2**:
- Resolution paths introduced (Black Market, Detective, Social)
- Limited scanners (3 for 20 players) force grouping
- Time pressure - memory corruption countdown
- Puzzle buffet across both rooms
- Final resolution and rewards

**Physical Constraints**:
- Two rooms with gate between (Act 1 vs Act 2 availability)
- Limited memory scanners force collaboration even in competition
- Video memory token requires special detective scanner

### Resolution Path Design Philosophy

Three non-exclusive player choices for memory tokens:

1. **Black Market** (Economic): Sell for points, requires grouping, competitive
2. **Detective** (Narrative): Contribute to final report, collective story reward
3. **Social** (Roleplay): Return to owners, character interaction opportunities

Elements are designed to create "motivational landscapes" - not forcing paths but making certain choices more appealing based on narrative content, character connections, and value propositions.

---

## Core MVP Features

### 1. Puzzle Focus View

**Purpose**: Answer "Who needs to interact to solve this puzzle?" + edit puzzle design

**Simple Left-to-Right Flow**:
```
[Required Elements] → [PUZZLE] → [Rewards] → [Timeline Events]
    (with owners)                             (story revealed)
```

**Visual Design**:
- Standard React Flow horizontal layout (`layoutDirection: 'LR'`)
- Color-coded nodes by type (character=blue, element=green, etc.)
- Status borders: dashed=placeholder, solid=ready
- Owner portraits appear as small badges on element nodes
- **NEW**: Edit indicators on hover (pencil icon)

**Interactions**:
- Click any node → Details panel slides in from right
- **NEW**: Details panel includes editable fields
- Search box filters to specific puzzles
- Act filter shows/hides elements by availability

**Editable in This View**:
- Puzzle name and description
- Add/remove required elements
- Change locked container
- Modify rewards
- Update element status inline

### 2. Character Journey View

**Purpose**: Answer "What content can this character access?" + manage ownership

**Hierarchical Game Flow Layout**:
```
        [CHARACTER]
             |
    [Owned Puzzles]  ← Starting puzzles
         /    \
   [Elements] [Elements] ← Unlocked content
       |         |
  [Timeline] [Timeline] ← Story discovered
```

**Visual Design**:
- React Flow hierarchical layout (`dagre` with `rankdir: 'TB'`)
- Tiers indicated by node size (Core=large, Tertiary=small)
- Act progression shown by vertical position
- Line style indicates relationship strength
- **NEW**: Ownership can be dragged between characters

**Interactions**:
- Select character from dropdown
- Toggle "Show only owned content" vs "Show accessible content"
- Highlight shared connections with other characters
- **NEW**: Drag elements to reassign ownership

**Editable in This View**:
- Character name and notes
- Element ownership (drag and drop)
- Character-timeline connections
- Character logline and relationships

### 3. Content Status View

**Purpose**: Answer "What needs writing next?" + update status inline

**Prioritized Work Queue**:
```
NEEDS CONTENT (12)
├─ 🎵 Memory Token - "Sofia's Pitch" [✏️ Edit] [Show Context ↓]
│   Status: [Idea/Placeholder ▼] Owner: [Sofia ▼]
├─ 📄 Document - "Contract Draft" [✏️ Edit] [Show Context ↓]
│   Status: [Idea/Placeholder ▼] Owner: [Victoria ▼]
└─ 🎵 Memory Token - "Kai's Test" [✏️ Edit] [Show Context ↓]

IN PROGRESS (5)
├─ 🧩 Puzzle - "Hidden Safe" [✏️ Edit]
│   Status: [Writing Complete ▼]
└─ ...
```

**Context Mini-Graph** (shown on expand):
```
Sofia → Owns → "Sofia's Pitch" → Reveals → "CEO Meeting"
                     ↑
               Required by "Hidden Safe Puzzle"
```

**Visual Design**:
- Grouped list with status counts
- Icons indicate element type
- **NEW**: Inline dropdowns for quick edits
- **NEW**: Edit button opens inline form
- Expand button shows mini dependency graph
- Progress indicators for multi-element puzzles

**Editable in This View**:
- Status (dropdown in place)
- Owner (dropdown in place)
- Narrative threads (tag selector)
- Description/content (inline text area on edit click)
- First Available act

### 4. Minimal Filtering System

**Global Filters** (appear on all views):
```
Act: [All | 0 | 1 | 2]  Hide Complete: ☐  Search: [___________]
```

**View-Specific Filters**:
- **Puzzle View**: Show Timeline Events ☐
- **Character View**: Tier [All | Core | Secondary | Tertiary]
- **Status View**: Group by [Status | Type]

---

## 2-Way Sync Implementation

### Editable Fields by Database

#### Characters (in Character Journey View)
| Field | Editable | UI Component |
|-------|----------|--------------|
| Name | ✅ | Inline text in details panel |
| Type | ❌ | Core design decision |
| Tier | ❌ | Affects game balance |
| Owned Elements | ✅ | Drag & drop or relation picker |
| Associated Elements | ✅ | Multi-select modal |
| Events | ✅ | Multi-select modal |
| Primary Action | ✅ | Text area |
| Character Logline | ✅ | Text field |
| Overview & Key Relationships | ✅ | Text area |
| Emotion towards CEO & others | ✅ | Text area |

#### Elements (in all views)
| Field | Editable | UI Component |
|-------|----------|--------------|
| Name | ✅ | Inline text |
| Description/Text | ✅ | Text area (preserves SF_ patterns) |
| Basic Type | ✅ | Dropdown |
| Owner | ✅ | Character picker dropdown |
| Container | ✅ | Element picker |
| Timeline Event | ✅ | Timeline multi-select |
| Status | ✅ | Status dropdown (most used!) |
| First Available | ✅ | Act dropdown |
| Required For | ✅ | Puzzle multi-select |
| Rewarded By | ✅ | Puzzle multi-select |
| Narrative Threads | ✅ | Tag selector |
| Production/Puzzle Notes | ✅ | Text area |
| Content Link | ✅ | URL input |

#### Puzzles (in Puzzle Focus View)
| Field | Editable | UI Component |
|-------|----------|--------------|
| Puzzle (name) | ✅ | Inline text |
| Description/Solution | ✅ | Text area |
| Puzzle Elements | ✅ | Element multi-picker |
| Locked Item | ✅ | Container picker |
| Rewards | ✅ | Element multi-picker |
| Parent item | ✅ | Puzzle picker |
| Sub-Puzzles | ✅ | Puzzle multi-picker |
| Asset Link | ✅ | URL input |

#### Timeline (in details panel)
| Field | Editable | UI Component |
|-------|----------|--------------|
| Description | ✅ | Inline text |
| Date | ✅ | Date picker |
| Characters Involved | ✅ | Character multi-picker |
| Memory/Evidence | ✅ | Element multi-picker |
| Notes | ✅ | Text area |

### Sync Architecture

```typescript
// Generic update handler for all field types
const updateNotionField = async (
  database: DatabaseType,
  pageId: string,
  fieldName: string,
  value: any
) => {
  const mutation = useMutation(
    async () => {
      const properties = formatPropertyUpdate(fieldName, value, database);
      return notion.pages.update({
        page_id: pageId,
        properties
      });
    },
    {
      // Optimistic update
      onMutate: async () => {
        await queryClient.cancelQueries([database, pageId]);
        const previous = queryClient.getQueryData([database, pageId]);
        queryClient.setQueryData([database, pageId], (old) => ({
          ...old,
          properties: {
            ...old.properties,
            [fieldName]: value
          }
        }));
        return { previous };
      },
      // Rollback on error
      onError: (err, vars, context) => {
        queryClient.setQueryData([database, pageId], context.previous);
        toast.error(`Failed to update ${fieldName}. Please try again.`);
      },
      // Refetch on success
      onSettled: () => {
        queryClient.invalidateQueries([database, pageId]);
      }
    }
  );
  
  return mutation.mutate();
};
```

### UI Components

```typescript
// Reusable field editor component
const FieldEditor = ({ entity, field, schema }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(entity.properties[field]);
  
  const handleSave = async () => {
    await updateNotionField(entity.database, entity.id, field, value);
    setIsEditing(false);
  };
  
  if (!isEditing) {
    return (
      <div className="field-display" onClick={() => setIsEditing(true)}>
        {formatFieldValue(value, schema)}
        <EditIcon className="edit-icon" />
      </div>
    );
  }
  
  // Render appropriate input based on field type
  switch (schema.type) {
    case 'select':
    case 'status':
      return <SelectDropdown {...props} />;
    case 'multi_select':
      return <MultiSelectTags {...props} />;
    case 'relation':
      return <RelationPicker {...props} />;
    case 'rich_text':
      return <TextArea {...props} />;
    case 'title':
      return <TextInput {...props} />;
    case 'date':
      return <DatePicker {...props} />;
    case 'url':
      return <UrlInput {...props} />;
  }
};
```

### Conflict Resolution

```typescript
// Simple last-write-wins with user notification
const handleConflict = (localValue, remoteValue, field) => {
  if (localValue !== remoteValue) {
    toast.warning(
      `${field} was updated by another user. Your changes may overwrite theirs.`,
      {
        action: {
          label: 'View their changes',
          onClick: () => showDiff(localValue, remoteValue)
        }
      }
    );
  }
};
```

---

## Technical Architecture

### Enhanced Stack for 2-Way Sync

```
Notion API ↔ Data Sync Layer → Graph Builder → React Flow Views
                    ↓
              SF_ Parser (for future use)
```

### Core Components

#### Data Sync Layer
```typescript
// Handles all Notion read/write operations
class NotionSyncService {
  // Read operations (cached)
  async fetchDatabases() { /* existing */ }
  
  // Write operations (new)
  async updateField(database, pageId, field, value) {
    const properties = this.formatProperties(field, value);
    return this.notion.pages.update({ page_id: pageId, properties });
  }
  
  // Batch operations for efficiency
  async updateMultipleFields(database, pageId, updates) {
    const properties = Object.entries(updates).reduce((acc, [field, value]) => {
      return { ...acc, ...this.formatProperties(field, value) };
    }, {});
    return this.notion.pages.update({ page_id: pageId, properties });
  }
}
```

#### Enhanced Graph Builder
```typescript
// Now includes edit capabilities
export const buildEditableGraph = (data, viewType) => {
  const baseGraph = buildGraph(data, viewType);
  
  // Add edit metadata to nodes
  return {
    ...baseGraph,
    nodes: baseGraph.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        editable: getEditableFields(node.type),
        onEdit: (field, value) => updateNotionField(
          node.data.database,
          node.id,
          field,
          value
        )
      }
    }))
  };
};
```

### Technology Stack

```json
{
  "dependencies": {
    "@notionhq/client": "^2.2.0",      // Notion API
    "react": "^18.0.0",                // UI framework
    "react-flow-renderer": "^10.0.0",  // Graph library
    "react-query": "^3.39.0",          // Data fetching + mutations
    "dagre": "^0.8.5",                 // Graph layouts
    "react-hot-toast": "^2.4.0",       // User notifications
    "express": "^4.18.0"               // API proxy
  }
}
```

---

## Implementation Plan

### Week 1: Foundation (5 days)
- Set up project structure
- Notion API connection (read + write permissions)
- Basic data fetching
- SF_ parser stub (for future)

### Week 2: Data Processing (5 days)
- Relationship mapping
- Graph data structures
- Basic caching with React Query
- **NEW**: Mutation setup for writes

### Week 3-4: First View + Basic Editing (10 days)
- Puzzle Focus View complete
- React Flow integration
- Basic filtering
- Details panel
- **NEW**: Status dropdown editing
- **NEW**: Simple field updates

### Week 5-6: Remaining Views + Full Editing (10 days)
- Character Journey View
- Content Status View with inline editing
- Cross-view navigation
- **NEW**: All field type editors
- **NEW**: Drag-and-drop for ownership

### Week 7: Polish + Sync Testing (5 days)
- UI cleanup
- Performance check
- **NEW**: Sync error handling
- **NEW**: Conflict notifications
- Bug fixes

### Week 8: Buffer & Launch (5 days)
- User testing with designers
- Documentation
- Final fixes
- Deploy to production

---

## Success Metrics

### Week 1 Post-Launch
- Both designers using the tool daily
- Zero data loss from sync issues
- 90% of edits succeed on first try
- Sub-2-second sync times

### Month 1
- 50+ puzzles reviewed and edited
- 100+ content items tracked and updated
- 75% reduction in Notion tab switching
- Designers report significant time savings

### Month 3
- Tool is primary interface for design work
- Notion accessed only for complex operations
- Measurable reduction in design conflicts
- Workflow efficiency improved by 40%+

---

## Future Roadmap

### Phase 2: Enhanced Editing (Month 4)
- Bulk operations (update multiple items)
- Undo/redo for all edits
- Change history view
- Collaborative cursors

### Phase 3: Advanced Features (Month 5-6)
- Create new entities from tool
- SF_ pattern parsing and validation
- Auto-save drafts
- Offline edit queue

### Phase 4: Intelligence Layer (Month 7+)
- Smart suggestions while editing
- Validation warnings (missing requirements)
- Balance analysis across characters
- Automated status progression

### Long-term Vision
- Full Notion replacement for game design
- Version control for design changes
- Branching for experimental designs
- AI-assisted content generation

---

## Conclusion

This enhanced MVP delivers immediate value through both visualization and editing capabilities while maintaining our pragmatic 8-week timeline. By adding 2-way sync, we eliminate the constant context switching that breaks designer flow, while Notion remains the source of truth for data integrity.

The key insight is that editing doesn't add significant complexity when we focus on simple field updates rather than complex operations. By keeping creation and deletion in Notion while enabling quick edits in our tool, we maintain simplicity while dramatically improving the designer experience.