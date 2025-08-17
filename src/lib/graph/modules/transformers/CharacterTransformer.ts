/**
 * Character Transformer using Base Transformer
 * Reduces duplication through inheritance
 */

import type { Character } from '@/types/notion/app';
import type { GraphNode, NodeMetadata, VisualHints } from '../../types';
import { 
  BaseTransformer, 
  TransformationUtils
} from '../BaseTransformer';

/**
 * Tier to visual configuration mapping
 */
const TIER_CONFIG = {
  'Core': { color: '#dc2626', size: 'large' as const, priority: 1 },
  'Secondary': { color: '#2563eb', size: 'medium' as const, priority: 2 },
  'Tertiary': { color: '#16a34a', size: 'small' as const, priority: 3 },
} as const;

/**
 * Character type configuration
 */
const TYPE_CONFIG = {
  'Player': { icon: 'user', borderStyle: 'solid' },
  'NPC': { icon: 'users', borderStyle: 'dashed' },
} as const;

export class CharacterTransformer extends BaseTransformer<Character> {
  protected entityType = 'character' as const;
  protected nodeType = 'character';

  /**
   * Override validation to add character-specific checks
   */
  protected validateEntity(character: Character): string[] {
    const errors = super.validateEntity(character);
    
    if (!character.tier) {
      errors.push('Missing character tier');
    } else if (!TIER_CONFIG[character.tier]) {
      errors.push(`Invalid tier: ${character.tier}`);
    }
    
    if (!character.type) {
      errors.push('Missing character type (Player/NPC)');
    }
    
    return errors;
  }

  /**
   * Override label generation for characters
   */
  protected generateLabel(character: Character): string {
    let label = character.name || 'Unknown Character';
    
    // Add type indicator for NPCs
    if (character.type === 'NPC') {
      label = `[NPC] ${label}`;
    }
    
    // Add ownership count if significant
    const ownedCount = TransformationUtils.getArrayLength(character.ownedElementIds);
    label = TransformationUtils.createLabelWithCount(label, ownedCount, 5, 'items');
    
    return label;
  }

  /**
   * Create character-specific metadata
   */
  protected createMetadata(character: Character, errors: string[]): NodeMetadata {
    const tierConfig = TIER_CONFIG[character.tier] || TIER_CONFIG['Tertiary'];
    const typeConfig = TYPE_CONFIG[character.type] || TYPE_CONFIG['NPC'];
    
    // Calculate importance score
    const importanceScore = this.calculateCharacterImportance(character);
    
    // Create visual hints
    const visualHints: VisualHints = {
      color: tierConfig.color,
      size: tierConfig.size,
      icon: typeConfig.icon,
    };
    
    // Create base metadata
    const metadata = super.createBaseMetadata(character, errors, visualHints);
    
    // Add character-specific metadata
    if (character.tier) {
      metadata.ownerTier = character.tier;
    }
    
    // Store importance for sorting
    (metadata as any).importanceScore = importanceScore;
    
    return metadata;
  }

  /**
   * Override sorting to use importance score
   */
  protected sortNodes(nodes: GraphNode<Character>[]): GraphNode<Character>[] {
    return nodes.sort((a, b) => {
      const aScore = (a.data.metadata as any).importanceScore || 0;
      const bScore = (b.data.metadata as any).importanceScore || 0;
      return bScore - aScore; // Higher score first
    });
  }

  /**
   * Calculate character importance score
   */
  private calculateCharacterImportance(character: Character): number {
    let score = 0;
    
    // Tier importance - if no tier, treat as lowest priority but don't go negative
    if (character.tier && TIER_CONFIG[character.tier]) {
      const tierPriority = TIER_CONFIG[character.tier].priority;
      score += (10 - tierPriority) * 1000;
    }
    
    // Player characters are more important
    if (character.type === 'Player') {
      score += 100;
    }
    
    // Connection counts
    score += TransformationUtils.calculateImportanceScore(
      TransformationUtils.getArrayLength(character.characterPuzzleIds),
      TransformationUtils.getArrayLength(character.ownedElementIds),
      TransformationUtils.getArrayLength(character.associatedElementIds)
    );
    
    return score;
  }
}

// Export singleton instance
export const characterTransformer = new CharacterTransformer();