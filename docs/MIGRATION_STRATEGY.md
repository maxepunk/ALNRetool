# CSS to Tailwind Migration Strategy

## Executive Summary
Migrating from hybrid CSS Modules + Tailwind to pure Tailwind v4 + shadcn/ui architecture.

## Current State Analysis

### Dependencies Status
- ✅ Tailwind v4 installed (`tailwindcss: ^4.1.12`)
- ✅ `tw-animate-css` installed (for Tailwind v4 animations)
- ❌ `tailwindcss-animate` installed but not needed (legacy)
- ❌ Neither animation library is imported in index.css

### Animation Classes Currently Broken
- `animate-in` classes in PuzzleFocusView and OwnerBadge aren't working
- `slide-in-from-right` directive has no effect
- Need to import `tw-animate-css` to enable these

## Migration Strategy

### Step 1: Fix Animation Infrastructure
1. Import `tw-animate-css` in index.css
2. Remove `tailwindcss-animate` from package.json
3. Add custom animations to Tailwind config for:
   - slideInFromRight (for details panel)
   - fadeIn (for overlays)
   - slideUp (for mobile panels)

### Step 2: Complete PuzzleFocusView Migration
1. Migrate remaining CSS Module classes to Tailwind
2. Convert animation classes to use tw-animate-css utilities
3. Delete PuzzleFocusView.module.css

### Step 3: Clean Up Remaining CSS Modules
1. Migrate LoadingSpinner.module.css to Tailwind
2. Remove all CSS Module imports
3. Delete all .module.css files

### Step 4: Add shadcn Components as Needed
- Tabs (for view switching)
- ScrollArea (for scrollable panels)
- Dialog (for modals)

### Step 5: Validation & Testing
1. Run build to verify no broken imports
2. Run type checking and linting
3. Visual regression testing
4. Document changes and metrics

## Implementation Order

### Immediate Actions
1. ✅ Import tw-animate-css in index.css
2. ⏳ Remove tailwindcss-animate dependency
3. ⏳ Fix animate-in classes in components

### Short-term (Today)
1. ⏳ Complete PuzzleFocusView migration
2. ⏳ Delete PuzzleFocusView.module.css
3. ⏳ Migrate LoadingSpinner styles

### Medium-term (This Sprint)
1. ⏳ Install needed shadcn components
2. ⏳ Update component styles for consistency
3. ⏳ Full testing and validation

## Success Metrics
- Zero CSS Module imports
- All animations working with Tailwind utilities
- Reduced CSS footprint by ~500+ lines
- Consistent shadcn/ui component usage
- Clean, maintainable codebase