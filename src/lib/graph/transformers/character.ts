/**
 * Character Entity Transformer
 * Converts Character entities from Notion into React Flow nodes
 * Characters own elements and have tier-based importance
 */

import type { Character } from '@/types/notion/app';
import type { GraphNode, EntityTransformer, NodeMetadata } from '../types';

/**
 * Default position for character nodes (will be overridden by layout)
 */
const DEFAULT_POSITION = { x: 0, y: 0 };

/**
 * Tier to visual configuration mapping
 */
const TIER_CONFIG = {
  'Core': {
    color: '#dc2626',      // Red - most important
    size: 'large' as const,
    borderWidth: 3,
    priority: 1,
  },
  'Secondary': {
    color: '#2563eb',      // Blue - medium importance
    size: 'medium' as const,
    borderWidth: 2,
    priority: 2,
  },
  'Tertiary': {
    color: '#16a34a',      // Green - supporting characters
    size: 'small' as const,
    borderWidth: 2,
    priority: 3,
  },
} as const;

/**
 * Character type styling
 */
const TYPE_CONFIG = {
  'Player': {
    icon: 'user',
    borderStyle: 'solid',
  },
  'NPC': {
    icon: 'users',
    borderStyle: 'dashed',
  },
} as const;

/**
 * Validate character entity has required fields
 */
function validateCharacter(character: Character): string[] {
  const errors: string[] = [];
  
  if (!character.id) {
    errors.push('Missing character ID');
  }
  
  if (!character.name) {
    errors.push('Missing character name');
  }
  
  if (!character.tier) {
    errors.push('Missing character tier');
  }
  
  if (!character.type) {
    errors.push('Missing character type (Player/NPC)');
  }
  
  // Validate tier value
  if (character.tier && !TIER_CONFIG[character.tier]) {
    errors.push(`Invalid tier: ${character.tier}`);
  }
  
  return errors;
}

/**
 * Generate label for character node
 */
function generateLabel(character: Character): string {
  let label = character.name || 'Unknown Character';
  
  // Add type indicator
  if (character.type === 'NPC') {
    label = `[NPC] ${label}`;
  }
  
  // Add ownership count if significant
  const ownedCount = character.ownedElementIds?.length || 0;
  if (ownedCount > 5) {
    label += ` (${ownedCount} items)`;
  }
  
  return label;
}

/**
 * Calculate character importance score for sorting
 */
function calculateImportance(character: Character): number {
  let score = 0;
  
  // Tier importance
  const tierPriority = TIER_CONFIG[character.tier]?.priority || 999;
  score += (10 - tierPriority) * 1000; // Tier is most important
  
  // Player characters are more important than NPCs
  if (character.type === 'Player') {
    score += 100;
  }
  
  // Number of owned elements adds to importance
  score += (character.ownedElementIds?.length || 0);
  
  // Number of associated elements
  score += (character.associatedElementIds?.length || 0) * 0.5;
  
  // Number of puzzles they can access
  score += (character.characterPuzzleIds?.length || 0) * 2;
  
  return score;
}

/**
 * Transform a Character entity into a GraphNode
 */
export const transformCharacter: EntityTransformer<Character> = (
  character: Character,
  _index: number
): GraphNode<Character> | null => {
  // Validate required fields
  const errors = validateCharacter(character);
  
  // Get configurations
  const tierConfig = TIER_CONFIG[character.tier] || TIER_CONFIG['Tertiary'];
  const typeConfig = TYPE_CONFIG[character.type] || TYPE_CONFIG['NPC'];
  
  // Calculate importance score for tests
  const tierScore = character.tier === 'Core' ? 10 : 
                   character.tier === 'Secondary' ? 5 : 
                   character.tier === 'Tertiary' ? 2 : 0;
  const ownedScore = character.ownedElementIds.length;
  const puzzleScore = character.characterPuzzleIds.length * 2;
  const eventScore = character.eventIds.length;
  const importanceScore = tierScore + ownedScore + puzzleScore + eventScore;
  
  // Build metadata
  const metadata: NodeMetadata = {
    entityType: 'character',
    tier: character.tier,
    importanceScore,
    visualHints: {
      color: tierConfig.color,
      icon: typeConfig.icon,
      size: tierConfig.size,
    },
  };
  
  // Add error state if validation failed
  if (errors.length > 0) {
    metadata.errorState = {
      type: 'missing_data',
      message: errors.join('; '),
    };
    console.warn(`Character node ${character.id} has errors:`, errors);
  }
  
  // Create the node
  const node: GraphNode<Character> = {
    id: character.id,
    type: 'character', // Custom node type for React Flow
    position: DEFAULT_POSITION,
    data: {
      entity: character,
      label: generateLabel(character),
      metadata,
    },
  };
  
  return node;
}

/**
 * Transform multiple characters
 */
export function transformCharacters(
  characters: Character[]
): GraphNode<Character>[] {
  const nodes: GraphNode<Character>[] = [];
  
  characters.forEach((character, index) => {
    const node = transformCharacter(character, index);
    if (node) {
      nodes.push(node);
    } else {
      console.error(`Failed to transform character ${character.id}`);
    }
  });
  
  // Sort by importance (Core Players first, Tertiary NPCs last)
  nodes.sort((a, b) => {
    const aScore = calculateImportance(a.data.entity);
    const bScore = calculateImportance(b.data.entity);
    return bScore - aScore; // Higher score first
  });
  
  return nodes;
}

/**
 * Get character node display configuration
 */
export function getCharacterNodeStyle(node: GraphNode<Character>) {
  const hasError = node.data.metadata.errorState !== undefined;
  const character = node.data.entity;
  const tierConfig = TIER_CONFIG[character.tier] || TIER_CONFIG['Tertiary'];
  const typeConfig = TYPE_CONFIG[character.type] || TYPE_CONFIG['NPC'];
  
  // Size mapping
  const sizeMap = {
    small: { width: '150px', padding: '12px', fontSize: '13px' },
    medium: { width: '180px', padding: '14px', fontSize: '14px' },
    large: { width: '220px', padding: '16px', fontSize: '15px' },
  };
  
  const size = sizeMap[tierConfig.size];
  
  return {
    background: hasError ? '#fee2e2' : `${tierConfig.color}15`, // 15% opacity
    color: hasError ? '#991b1b' : tierConfig.color,
    border: `${tierConfig.borderWidth}px ${typeConfig.borderStyle} ${
      hasError ? '#dc2626' : tierConfig.color
    }`,
    borderRadius: '16px', // More rounded for characters
    padding: size.padding,
    fontSize: size.fontSize,
    fontWeight: '600',
    minWidth: size.width,
    maxWidth: '300px',
    textAlign: 'center' as const,
    // Add tier badge
    position: 'relative' as const,
    '&::before': character.tier ? {
      content: `"${character.tier}"`,
      position: 'absolute',
      top: '-10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: tierConfig.color,
      color: 'white',
      borderRadius: '12px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    } : undefined,
  };
}

/**
 * Get characters grouped by tier
 */
export function groupCharactersByTier(characters: Character[]) {
  return {
    core: characters.filter(c => c.tier === 'Core'),
    secondary: characters.filter(c => c.tier === 'Secondary'),
    tertiary: characters.filter(c => c.tier === 'Tertiary'),
    unknown: characters.filter(c => !c.tier || !TIER_CONFIG[c.tier]),
  };
}

/**
 * Get characters grouped by type
 */
export function groupCharactersByType(characters: Character[]) {
  return {
    players: characters.filter(c => c.type === 'Player'),
    npcs: characters.filter(c => c.type === 'NPC'),
    unknown: characters.filter(c => !c.type),
  };
}

/**
 * Find characters with the most owned elements
 */
export function getTopOwners(characters: Character[], limit = 5) {
  return [...characters]
    .sort((a, b) => {
      const aCount = a.ownedElementIds?.length || 0;
      const bCount = b.ownedElementIds?.length || 0;
      return bCount - aCount;
    })
    .slice(0, limit);
}