import type { Character, Element, Puzzle, TimelineEvent } from '@/types/notion/app';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate character entity fields
 */
export function validateCharacter(character: Partial<Character>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!character.name?.trim()) {
    errors.name = 'Character name is required';
  }

  if (!character.type) {
    errors.type = 'Character type is required';
  }

  // Business logic validation
  if (character.type === 'Player' && !character.primaryAction) {
    errors.primaryAction = 'Player characters must have a primary action';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate element entity fields
 */
export function validateElement(element: Partial<Element>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!element.name?.trim()) {
    errors.name = 'Element name is required';
  }

  if (!element.basicType) {
    errors.basicType = 'Element type is required';
  }

  // Business logic validation
  if (element.basicType === 'Document' && !element.contentLink) {
    errors.contentLink = 'Documents should have a content link';
  }

  // SF_ pattern validation
  if (element.descriptionText && element.descriptionText.includes('SF_')) {
    const sfPattern = /SF_[A-Z]+:[0-9]+|SF_[A-Z]+/g;
    const matches = element.descriptionText.match(sfPattern);
    if (matches) {
      // Validate SF_ patterns are well-formed
      matches.forEach((match: string) => {
        if (!match.match(/^SF_[A-Z_]+(:[\w]+)?$/)) {
          errors.descriptionText = 'Invalid SF_ pattern detected';
        }
      });
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate puzzle entity fields
 */
export function validatePuzzle(puzzle: Partial<Puzzle>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!puzzle.name?.trim()) {
    errors.name = 'Puzzle name is required';
  }

  if (!puzzle.descriptionSolution?.trim()) {
    errors.descriptionSolution = 'Puzzle description/solution is required';
  }

  // Business logic validation
  if (puzzle.subPuzzleIds?.length && puzzle.parentItemId) {
    errors.subPuzzleIds = 'A puzzle cannot be both a parent and child puzzle';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate timeline event entity fields
 */
export function validateTimelineEvent(event: Partial<TimelineEvent>): ValidationResult {
  const errors: Record<string, string> = {};

  // Required fields
  if (!event.name?.trim()) {
    errors.name = 'Event name is required';
  }

  if (!event.description?.trim()) {
    errors.description = 'Event description is required';
  }

  if (!event.date) {
    errors.date = 'Event date is required';
  }

  // Date format validation (should be ISO string)
  if (event.date) {
    try {
      new Date(event.date);
    } catch {
      errors.date = 'Invalid date format';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get validator for entity type
 */
export function getEntityValidator(entityType: string) {
  switch (entityType) {
    case 'character':
      return validateCharacter;
    case 'element':
      return validateElement;
    case 'puzzle':
      return validatePuzzle;
    case 'timeline':
      return validateTimelineEvent;
    default:
      return () => ({ isValid: true, errors: {} });
  }
}