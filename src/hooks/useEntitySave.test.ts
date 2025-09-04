import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntitySave } from './useEntitySave';
import type { Character, Puzzle } from '@/types/notion/app';

// Create mock functions that will be accessible in tests
const mockUpdateCharacter = vi.fn();
const mockUpdateElement = vi.fn();
const mockUpdatePuzzle = vi.fn();
const mockUpdateTimeline = vi.fn();

// Mock the mutation hooks module
vi.mock('@/hooks/mutations', () => ({
  createEntityMutation: vi.fn((entityType) => {
    // Return a hook function that returns mutation object
    return () => {
      const mockMap: Record<string, any> = {
        'character': mockUpdateCharacter,
        'element': mockUpdateElement,
        'puzzle': mockUpdatePuzzle,
        'timeline': mockUpdateTimeline
      };
      
      return {
        mutateAsync: mockMap[entityType] || vi.fn(),
        isPending: false,
        error: null
      };
    };
  })
}));

// Import the mocked factory for dynamic testing
import { createEntityMutation } from '@/hooks/mutations';

describe('useEntitySave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Version Extraction', () => {
    const mockCharacter: Character = {
      id: 'char_abc',
      name: 'Alice',
      tier: 'Core',
      type: 'Player',
      version: 5, // The version to be tested
      ownedElementIds: [],
      associatedElementIds: [],
      characterPuzzleIds: [],
      eventIds: [],
      connections: [],
      primaryAction: 'Test action',
      characterLogline: 'Test logline',
      overview: 'Test overview',
      emotionTowardsCEO: 'Neutral',
    } as Character;

    it('should extract version from the entity and pass it to the mutation', async () => {
      // Arrange
      mockUpdateCharacter.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());
      const updates = { name: 'Alice Updated' };

      // Act
      await act(async () => {
        await result.current.handleEntitySave(updates, mockCharacter);
      });

      // Assert - Version extraction from original entity (line 120)
      expect(mockUpdateCharacter).toHaveBeenCalledTimes(1);
      expect(mockUpdateCharacter).toHaveBeenCalledWith({
        id: 'char_abc',
        name: 'Alice Updated',
        version: 5, // Crucially, the version from the original entity is passed
      });
    });

    it('should proceed without a version if the original entity does not have one', async () => {
      // Arrange
      mockUpdateCharacter.mockResolvedValue(undefined);
      const characterWithoutVersion = { ...mockCharacter };
      delete (characterWithoutVersion as any).version;

      const { result } = renderHook(() => useEntitySave());
      const updates = { name: 'Alice Updated Again' };

      // Act
      await act(async () => {
        await result.current.handleEntitySave(updates, characterWithoutVersion);
      });

      // Assert
      expect(mockUpdateCharacter).toHaveBeenCalledWith({
        id: 'char_abc',
        name: 'Alice Updated Again',
        version: undefined, // Version is correctly undefined
      });
    });

    it('should pass version to correct mutation based on entity type', async () => {
      // Test with Puzzle
      const mockPuzzle: Puzzle = {
        id: 'puzzle_123',
        name: 'Test Puzzle',
        descriptionSolution: 'Solution text',
        timing: ['Act 1'],
        version: 3,
      } as Puzzle;

      mockUpdatePuzzle.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());

      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated Puzzle' }, mockPuzzle);
      });

      expect(mockUpdatePuzzle).toHaveBeenCalledWith({
        id: 'puzzle_123',
        name: 'Updated Puzzle',
        version: 3, // Version passed to puzzle mutation
      });
    });
  });

  describe('Entity Type Detection', () => {
    it('should correctly identify character by tier property', async () => {
      // Arrange
      const character = {
        id: 'char_1',
        name: 'Test Character',
        tier: 'Secondary', // Identifying property
        version: 1,
      };

      mockUpdateCharacter.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());

      // Act
      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated' }, character as any);
      });

      // Assert
      expect(mockUpdateCharacter).toHaveBeenCalled();
      expect(mockUpdatePuzzle).not.toHaveBeenCalled();
      expect(mockUpdateElement).not.toHaveBeenCalled();
      expect(mockUpdateTimeline).not.toHaveBeenCalled();
    });

    it('should correctly identify puzzle by descriptionSolution property', async () => {
      // Arrange
      const puzzle = {
        id: 'puzzle_1',
        name: 'Test Puzzle',
        descriptionSolution: 'Solution', // Identifying property
        version: 2,
      };

      mockUpdatePuzzle.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());

      // Act
      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated' }, puzzle as any);
      });

      // Assert
      expect(mockUpdatePuzzle).toHaveBeenCalled();
      expect(mockUpdateCharacter).not.toHaveBeenCalled();
      expect(mockUpdateElement).not.toHaveBeenCalled();
      expect(mockUpdateTimeline).not.toHaveBeenCalled();
    });

    it('should correctly identify element by descriptionText property', async () => {
      // Arrange
      const element = {
        id: 'elem_1',
        name: 'Test Element',
        descriptionText: 'Description', // Identifying property (no descriptionSolution)
        version: 1,
      };

      mockUpdateElement.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());

      // Act
      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated' }, element as any);
      });

      // Assert
      expect(mockUpdateElement).toHaveBeenCalled();
      expect(mockUpdateCharacter).not.toHaveBeenCalled();
      expect(mockUpdatePuzzle).not.toHaveBeenCalled();
      expect(mockUpdateTimeline).not.toHaveBeenCalled();
    });

    it('should correctly identify timeline by date and charactersInvolvedIds', async () => {
      // Arrange
      const timeline = {
        id: 'timeline_1',
        description: 'Test Event',
        date: '2024-01-01', // Identifying property 1
        charactersInvolvedIds: [], // Identifying property 2
        version: 1,
      };

      mockUpdateTimeline.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());

      // Act
      await act(async () => {
        await result.current.handleEntitySave({ description: 'Updated' }, timeline as any);
      });

      // Assert
      expect(mockUpdateTimeline).toHaveBeenCalled();
      expect(mockUpdateCharacter).not.toHaveBeenCalled();
      expect(mockUpdatePuzzle).not.toHaveBeenCalled();
      expect(mockUpdateElement).not.toHaveBeenCalled();
    });

    it('should throw an error if entity type cannot be determined', async () => {
      // Arrange
      const { result } = renderHook(() => useEntitySave());
      const updates = { id: 'some_id', name: 'Unknown Type' };
      const unknownEntity = { id: 'some_id' }; // No discriminating properties

      // Act & Assert - Error handling (lines 115-116)
      await expect(
        result.current.handleEntitySave(updates, unknownEntity as any)
      ).rejects.toThrow('Could not determine entity type');
    });
  });

  describe('Error Handling', () => {
    it('should throw an error if entity ID is missing', async () => {
      // Arrange
      const { result } = renderHook(() => useEntitySave());
      const updates = { name: 'No ID Here' };
      const entityWithoutId = { 
        tier: 'Core', // Has type identifier
        name: 'Test'
      };

      // Act & Assert - ID validation (lines 109-111)
      await expect(
        result.current.handleEntitySave(updates, entityWithoutId as any)
      ).rejects.toThrow('Entity ID is required for updates');
    });

    it('should provide clear error messages for failures', async () => {
      // Arrange
      const error = new Error('API Error');
      mockUpdateCharacter.mockRejectedValue(error);
      
      const character = {
        id: 'char_1',
        name: 'Test',
        tier: 'Core',
        version: 1,
      };

      const { result } = renderHook(() => useEntitySave());

      // Act & Assert
      await expect(
        result.current.handleEntitySave({ name: 'Updated' }, character as any)
      ).rejects.toThrow('API Error');
    });

    it('should handle entity ID from updates if not in entity', async () => {
      // Arrange
      mockUpdateCharacter.mockResolvedValue(undefined);
      const { result } = renderHook(() => useEntitySave());
      
      // Updates contain the ID
      const updates = { 
        id: 'char_from_updates',
        name: 'Updated Name' 
      };
      
      // Entity has type but no ID
      const entity = {
        tier: 'Core',
        version: 2,
      };

      // Act
      await act(async () => {
        await result.current.handleEntitySave(updates, entity as any);
      });

      // Assert - Should use ID from updates
      expect(mockUpdateCharacter).toHaveBeenCalledWith({
        id: 'char_from_updates',
        name: 'Updated Name',
        version: 2,
      });
    });
  });

  describe('Loading States', () => {
    it('should aggregate loading states from all mutations', () => {
      // Update the mock to return pending state
      (createEntityMutation as any).mockImplementationOnce((entityType: string) => {
        return () => ({
          mutateAsync: vi.fn(),
          isPending: entityType === 'character' ? true : false,
          error: null
        });
      });

      const { result } = renderHook(() => useEntitySave());
      
      // Should be true if any mutation is pending
      expect(result.current.isSaving).toBe(true);
    });

    it('should aggregate errors from all mutations', () => {
      // Update the mock to return error state
      const testError = new Error('Test error');
      (createEntityMutation as any).mockImplementation((entityType: string) => {
        return () => ({
          mutateAsync: vi.fn(),
          isPending: false,
          error: entityType === 'element' ? testError : null
        });
      });

      const { result } = renderHook(() => useEntitySave());
      
      // Should return first error found
      expect(result.current.error).toBe(testError);
      
      // Reset mock back to original implementation
      vi.clearAllMocks();
      (createEntityMutation as any).mockImplementation((entityType: string) => {
        return () => {
          const mockMap: Record<string, any> = {
            'character': mockUpdateCharacter,
            'element': mockUpdateElement,
            'puzzle': mockUpdatePuzzle,
            'timeline': mockUpdateTimeline
          };
          
          return {
            mutateAsync: mockMap[entityType] || vi.fn(),
            isPending: false,
            error: null
          };
        };
      });
    });
  });

  describe('Version Lifecycle Integration', () => {
    it('should work with entities that receive version on first save', async () => {
      // Arrange - New entity without version
      const newCharacter = {
        id: 'new_char',
        name: 'New Character',
        tier: 'Core',
        // No version property
      };

      // Server returns entity with version after create
      const savedCharacter = {
        ...newCharacter,
        version: 1,
      };

      mockUpdateCharacter.mockResolvedValue(savedCharacter);
      const { result } = renderHook(() => useEntitySave());

      // Act - First save without version
      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated New' }, newCharacter as any);
      });

      // Assert - Should pass undefined version
      expect(mockUpdateCharacter).toHaveBeenCalledWith({
        id: 'new_char',
        name: 'Updated New',
        version: undefined,
      });

      // Act - Second save with version from server response
      await act(async () => {
        await result.current.handleEntitySave({ name: 'Updated Again' }, savedCharacter as any);
      });

      // Assert - Should now pass version 1
      expect(mockUpdateCharacter).toHaveBeenLastCalledWith({
        id: 'new_char',
        name: 'Updated Again',
        version: 1,
      });
    });
  });
});