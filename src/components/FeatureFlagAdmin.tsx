import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  useFeatureFlags, 
  setFeatureFlag, 
  enableAllFeatureFlags,
  disableAllFeatureFlags,
  resetFeatureFlags,
  type FeatureFlagsType
} from '@/lib/featureFlags';

/**
 * Admin component for managing feature flags
 * Only visible in development mode
 */
export function FeatureFlagAdmin() {
  const flags = useFeatureFlags();
  const [showPanel, setShowPanel] = React.useState(false);

  // Only show in development
  if (import.meta.env?.PROD === true) {
    return null;
  }

  const handleToggle = (flag: keyof FeatureFlagsType) => {
    setFeatureFlag(flag, !flags[flag]);
    // Force re-render
    window.location.reload();
  };

  const handleEnableAll = () => {
    enableAllFeatureFlags();
    window.location.reload();
  };

  const handleDisableAll = () => {
    disableAllFeatureFlags();
    window.location.reload();
  };

  const handleReset = () => {
    resetFeatureFlags();
    window.location.reload();
  };

  const flagGroups = {
    'Phase 2: DetailPanel': [
      'USE_NEW_FIELD_EDITORS',
      'USE_ENTITY_FORM_HOOK',
    ],
    'Phase 3: Hooks': [
      'USE_GENERIC_NOTION_HOOKS',
    ],
    'Phase 4: Backend': [
      'USE_CACHED_MIDDLEWARE',
      'USE_ENDPOINT_FACTORY',
    ],
    'Phase 5: Animation': [
      'USE_REDUCER_ANIMATION',
      'USE_SPLIT_ANIMATION_HOOKS',
    ],
    'Phase 6: Modules': [
      'USE_SPLIT_EDGE_BUILDERS',
      'USE_SPLIT_RELATIONSHIPS',
    ],
    'Phase 8: Performance': [
      'USE_VIRTUAL_SCROLLING',
      'USE_CODE_SPLITTING',
    ],
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowPanel(!showPanel)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          {showPanel ? 'Hide' : 'Show'} Feature Flags
        </Button>
      </div>

      {/* Feature Flag Panel */}
      {showPanel && (
        <Card className="fixed bottom-16 right-4 z-50 w-96 max-h-[600px] overflow-y-auto bg-white shadow-xl p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Feature Flags</h3>
              <p className="text-sm text-gray-600 mb-4">
                Toggle refactored components for testing
              </p>
            </div>

            {/* Global Controls */}
            <div className="flex gap-2 pb-2 border-b">
              <Button
                onClick={handleEnableAll}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Enable All
              </Button>
              <Button
                onClick={handleDisableAll}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Disable All
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reset
              </Button>
            </div>

            {/* Grouped Flags */}
            {Object.entries(flagGroups).map(([group, groupFlags]) => (
              <div key={group} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">{group}</h4>
                <div className="space-y-1 pl-2">
                  {groupFlags.map((flag) => (
                    <div key={flag} className="flex items-center justify-between py-1">
                      <Label
                        htmlFor={flag}
                        className="text-xs cursor-pointer flex-1"
                      >
                        {flag.replace(/_/g, ' ').toLowerCase()}
                      </Label>
                      <button
                        id={flag}
                        onClick={() => handleToggle(flag as keyof FeatureFlagsType)}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full
                          transition-colors focus:outline-none focus:ring-2 
                          focus:ring-blue-500 focus:ring-offset-2
                          ${flags[flag as keyof FeatureFlagsType] 
                            ? 'bg-blue-600' 
                            : 'bg-gray-200'
                          }
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full 
                            bg-white transition-transform
                            ${flags[flag as keyof FeatureFlagsType] 
                              ? 'translate-x-5' 
                              : 'translate-x-0.5'
                            }
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Status Summary */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                {Object.values(flags).filter(Boolean).length} of{' '}
                {Object.keys(flags).length} flags enabled
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}