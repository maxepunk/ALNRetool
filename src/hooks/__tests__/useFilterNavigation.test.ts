import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFilterNavigation } from '../useFilterNavigation';
import { RouteUtils } from '@/components/generated/RouteGenerator';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(),
}));

vi.mock('@/components/generated/RouteGenerator', () => ({
  RouteUtils: {
    generateNavUrl: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
const mockUseNavigate = useNavigate as any;
const mockUseLocation = useLocation as any;
const mockGenerateNavUrl = RouteUtils.generateNavUrl as any;

describe('useFilterNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockUseLocation.mockReturnValue({ pathname: '/current-path' });
  });

  describe('navigateToView', () => {
    it('should generate URL and navigate when URL is different from current', () => {
      mockGenerateNavUrl.mockReturnValue('/puzzle-focus/puzzle-123');

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToView('puzzle-focus', { puzzleId: 'puzzle-123' });
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('puzzle-focus', { puzzleId: 'puzzle-123' });
      expect(mockNavigate).toHaveBeenCalledWith('/puzzle-focus/puzzle-123');
    });

    it('should not navigate when generated URL is same as current path', () => {
      mockGenerateNavUrl.mockReturnValue('/current-path');

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToView('puzzle-focus', { puzzleId: 'puzzle-123' });
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('puzzle-focus', { puzzleId: 'puzzle-123' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should not navigate when generateNavUrl returns null', () => {
      mockGenerateNavUrl.mockReturnValue(null);

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToView('invalid-view', { id: 'test' });
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('invalid-view', { id: 'test' });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('convenience methods', () => {
    it('navigateToPuzzleFocus should call navigateToView with correct parameters', () => {
      mockGenerateNavUrl.mockReturnValue('/puzzle-focus/puzzle-123');

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToPuzzleFocus('puzzle-123');
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('puzzle-focus', { puzzleId: 'puzzle-123' });
      expect(mockNavigate).toHaveBeenCalledWith('/puzzle-focus/puzzle-123');
    });

    it('navigateToCharacterJourney should call navigateToView with correct parameters', () => {
      mockGenerateNavUrl.mockReturnValue('/character-journey/char-456');

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToCharacterJourney('char-456');
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('character-journey', { characterId: 'char-456' });
      expect(mockNavigate).toHaveBeenCalledWith('/character-journey/char-456');
    });

    it('navigateToNodeConnections should call navigateToView with correct parameters', () => {
      mockGenerateNavUrl.mockReturnValue('/node-connections/node-789');

      const { result } = renderHook(() => useFilterNavigation());

      act(() => {
        result.current.navigateToNodeConnections('node-789');
      });

      expect(mockGenerateNavUrl).toHaveBeenCalledWith('node-connections', { nodeId: 'node-789' });
      expect(mockNavigate).toHaveBeenCalledWith('/node-connections/node-789');
    });
  });
});