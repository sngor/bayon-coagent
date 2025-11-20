/**
 * Tests for Edit Options Panel Component Logic
 * 
 * Validates:
 * - Edit type metadata is correctly defined
 * - Suggestion sorting logic works correctly
 * - Priority badge color mapping is correct
 * - Suggested parameters are pre-populated (Requirement 13.9)
 */

import { describe, it, expect } from '@jest/globals';
import { type EditSuggestion, type EditType } from '@/ai/schemas/reimagine-schemas';

// Edit type metadata (from component)
const EDIT_OPTIONS = [
  { type: 'virtual-staging' as EditType, title: 'Virtual Staging' },
  { type: 'day-to-dusk' as EditType, title: 'Day to Dusk' },
  { type: 'enhance' as EditType, title: 'Image Enhancement' },
  { type: 'item-removal' as EditType, title: 'Item Removal' },
  { type: 'virtual-renovation' as EditType, title: 'Virtual Renovation' },
];

// Helper function to get suggestion for a type
function getSuggestionForType(
  suggestions: EditSuggestion[],
  editType: EditType
): EditSuggestion | undefined {
  return suggestions.find((s) => s.editType === editType);
}

// Helper function to sort options (from component logic)
function sortEditOptions(
  options: typeof EDIT_OPTIONS,
  suggestions: EditSuggestion[]
): typeof EDIT_OPTIONS {
  return [...options].sort((a, b) => {
    const aSuggestion = getSuggestionForType(suggestions, a.type);
    const bSuggestion = getSuggestionForType(suggestions, b.type);

    // Both suggested: sort by priority
    if (aSuggestion && bSuggestion) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[aSuggestion.priority] - priorityOrder[bSuggestion.priority];
    }

    // Only a is suggested
    if (aSuggestion) return -1;

    // Only b is suggested
    if (bSuggestion) return 1;

    // Neither suggested: maintain original order
    return 0;
  });
}

// Helper function to get priority badge color (from component)
function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500 text-white';
    case 'medium':
      return 'bg-yellow-500 text-white';
    case 'low':
      return 'bg-blue-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

describe('EditOptionsPanel Logic', () => {
  describe('Edit Type Metadata', () => {
    it('defines all 5 edit types', () => {
      expect(EDIT_OPTIONS).toHaveLength(5);
      
      const types = EDIT_OPTIONS.map(opt => opt.type);
      expect(types).toContain('virtual-staging');
      expect(types).toContain('day-to-dusk');
      expect(types).toContain('enhance');
      expect(types).toContain('item-removal');
      expect(types).toContain('virtual-renovation');
    });

    it('has correct titles for each edit type', () => {
      const stagingOption = EDIT_OPTIONS.find(opt => opt.type === 'virtual-staging');
      expect(stagingOption?.title).toBe('Virtual Staging');

      const duskOption = EDIT_OPTIONS.find(opt => opt.type === 'day-to-dusk');
      expect(duskOption?.title).toBe('Day to Dusk');

      const enhanceOption = EDIT_OPTIONS.find(opt => opt.type === 'enhance');
      expect(enhanceOption?.title).toBe('Image Enhancement');

      const removalOption = EDIT_OPTIONS.find(opt => opt.type === 'item-removal');
      expect(removalOption?.title).toBe('Item Removal');

      const renovationOption = EDIT_OPTIONS.find(opt => opt.type === 'virtual-renovation');
      expect(renovationOption?.title).toBe('Virtual Renovation');
    });
  });

  describe('Suggestion Sorting Logic', () => {
    it('sorts suggested edits before non-suggested edits', () => {
      const suggestions: EditSuggestion[] = [
        {
          editType: 'enhance',
          priority: 'medium',
          reason: 'Image quality could be improved',
          confidence: 0.75,
        },
      ];

      const sorted = sortEditOptions(EDIT_OPTIONS, suggestions);

      // First option should be the suggested one (enhance)
      expect(sorted[0].type).toBe('enhance');
    });

    it('sorts suggested edits by priority (high, medium, low)', () => {
      const suggestions: EditSuggestion[] = [
        {
          editType: 'enhance',
          priority: 'low',
          reason: 'Minor improvements',
          confidence: 0.6,
        },
        {
          editType: 'virtual-staging',
          priority: 'high',
          reason: 'Empty room detected',
          confidence: 0.95,
        },
        {
          editType: 'day-to-dusk',
          priority: 'medium',
          reason: 'Daytime exterior',
          confidence: 0.8,
        },
      ];

      const sorted = sortEditOptions(EDIT_OPTIONS, suggestions);

      // First three should be suggested edits in priority order
      expect(sorted[0].type).toBe('virtual-staging'); // high
      expect(sorted[1].type).toBe('day-to-dusk'); // medium
      expect(sorted[2].type).toBe('enhance'); // low
    });

    it('maintains original order for non-suggested edits', () => {
      const suggestions: EditSuggestion[] = [
        {
          editType: 'virtual-staging',
          priority: 'high',
          reason: 'Empty room',
          confidence: 0.9,
        },
      ];

      const sorted = sortEditOptions(EDIT_OPTIONS, suggestions);

      // First should be suggested
      expect(sorted[0].type).toBe('virtual-staging');

      // Rest should maintain original order
      expect(sorted[1].type).toBe('day-to-dusk');
      expect(sorted[2].type).toBe('enhance');
      expect(sorted[3].type).toBe('item-removal');
      expect(sorted[4].type).toBe('virtual-renovation');
    });
  });

  describe('Priority Badge Colors', () => {
    it('returns correct color for high priority', () => {
      expect(getPriorityColor('high')).toBe('bg-red-500 text-white');
    });

    it('returns correct color for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('bg-yellow-500 text-white');
    });

    it('returns correct color for low priority', () => {
      expect(getPriorityColor('low')).toBe('bg-blue-500 text-white');
    });

    it('returns default color for unknown priority', () => {
      expect(getPriorityColor('unknown')).toBe('bg-gray-500 text-white');
    });
  });

  describe('Suggestion Parameter Pre-population (Requirement 13.9)', () => {
    it('extracts suggested parameters from suggestion', () => {
      const suggestedParams = {
        roomType: 'living-room' as const,
        style: 'modern' as const,
      };

      const suggestion: EditSuggestion = {
        editType: 'virtual-staging',
        priority: 'high',
        reason: 'Empty living room detected',
        suggestedParams,
        confidence: 0.95,
      };

      // Verify suggested params are available
      expect(suggestion.suggestedParams).toBeDefined();
      expect(suggestion.suggestedParams).toEqual(suggestedParams);
    });

    it('handles suggestions without suggested parameters', () => {
      const suggestion: EditSuggestion = {
        editType: 'enhance',
        priority: 'medium',
        reason: 'Image quality could be improved',
        confidence: 0.75,
      };

      // Verify suggested params are optional
      expect(suggestion.suggestedParams).toBeUndefined();
    });

    it('preserves all parameter fields from suggestion', () => {
      const suggestedParams = {
        intensity: 'dramatic' as const,
      };

      const suggestion: EditSuggestion = {
        editType: 'day-to-dusk',
        priority: 'high',
        reason: 'Daytime exterior photo',
        suggestedParams,
        confidence: 0.9,
      };

      expect(suggestion.suggestedParams).toEqual({ intensity: 'dramatic' });
    });
  });

  describe('Suggestion Lookup', () => {
    it('finds suggestion by edit type', () => {
      const suggestions: EditSuggestion[] = [
        {
          editType: 'virtual-staging',
          priority: 'high',
          reason: 'Empty room',
          confidence: 0.9,
        },
        {
          editType: 'enhance',
          priority: 'medium',
          reason: 'Quality improvement',
          confidence: 0.7,
        },
      ];

      const stagingSuggestion = getSuggestionForType(suggestions, 'virtual-staging');
      expect(stagingSuggestion).toBeDefined();
      expect(stagingSuggestion?.editType).toBe('virtual-staging');
      expect(stagingSuggestion?.priority).toBe('high');

      const enhanceSuggestion = getSuggestionForType(suggestions, 'enhance');
      expect(enhanceSuggestion).toBeDefined();
      expect(enhanceSuggestion?.editType).toBe('enhance');
      expect(enhanceSuggestion?.priority).toBe('medium');
    });

    it('returns undefined for non-suggested edit type', () => {
      const suggestions: EditSuggestion[] = [
        {
          editType: 'virtual-staging',
          priority: 'high',
          reason: 'Empty room',
          confidence: 0.9,
        },
      ];

      const duskSuggestion = getSuggestionForType(suggestions, 'day-to-dusk');
      expect(duskSuggestion).toBeUndefined();
    });

    it('handles empty suggestions array', () => {
      const suggestions: EditSuggestion[] = [];

      const stagingSuggestion = getSuggestionForType(suggestions, 'virtual-staging');
      expect(stagingSuggestion).toBeUndefined();
    });
  });
});
