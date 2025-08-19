# Animation Audit - ALNRetool

## Current Animation Patterns

### 1. CSS Keyframe Animations (in index.css)
- **dashdraw**: Animates stroke-dashoffset for animated edges
- **spin**: Rotates elements 360 degrees
- **fadeIn**: Fades opacity from 0 to 1
- **slideInFromRight**: Slides from translateX(100%) to 0
- **pulse**: Opacity animation between 0.5 and 1

### 2. CSS Module Animations (in PuzzleFocusView.module.css)
- **slideIn**: Slides from translateX(100%) with opacity fade
- **fadeIn**: Simple opacity fade from 0 to 1  
- **slideUp**: Slides from translateY(100%) with opacity fade

### 3. Tailwind Animation Classes Currently Used

#### Core Animations:
- `animate-spin` - LoadingSpinner, LoadingSkeleton, ConnectionStatus
- `animate-pulse` - OwnerBadge, ConnectionStatus, LoadingSkeleton
- `animate-in` - PuzzleFocusView details panel (with slide-in-from-right)

#### Transition Classes:
- `transition-all` - AppLayout sidebar, header elements
- `transition-colors` - Button, Badge, navigation links
- `transition-transform` - GroupNode collapse button
- `transition` - Progress indicator

#### Duration Classes:
- `duration-200` - BaseNodeCard, GroupNode, edges
- `duration-300` - AppLayout transitions, PuzzleFocusView, OwnerBadge
- `duration-500` - PuzzleFocusView instructions overlay

#### Easing Classes:
- `ease-in-out` - AppLayout sidebar, CSS module animations

### 4. React Flow Edge Animations
- Custom animated prop on edges
- Uses stroke-dasharray with dashdraw keyframe

### 5. Components Using Animations

#### Using CSS Modules:
- PuzzleFocusView (slideIn, fadeIn animations)
- LoadingSpinner.module.css (spin animation)

#### Using Tailwind:
- LoadingSpinner (animate-spin)
- LoadingSkeleton (animate-pulse)
- OwnerBadge (animate-in with duration-300)
- ConnectionStatus (animate-pulse)
- All graph edges (transition-all duration-200)
- BaseNodeCard (transition-all duration-200)
- GroupNode (transition-transform)
- AppLayout (transition-all duration-300)
- Button (transition-colors)
- Badge (transition-colors)
- Progress (transition-all)
- Tooltip (animate-in)
- Skeleton (animate-pulse)

## Migration Strategy

### Phase 1: Assess Native Tailwind v4 Support
- ✅ animate-spin: Native support
- ✅ animate-pulse: Native support  
- ✅ animate-bounce: Native support (not used)
- ✅ animate-ping: Native support (not used)

### Phase 2: Custom Animations Needed
1. **slideInFromRight** - For details panel
2. **fadeIn** - For overlays and panels
3. **dashdraw** - For React Flow animated edges
4. **slideUp** - For mobile panels

### Phase 3: Decision Points
1. **tailwindcss-animate vs Tailwind v4 native**:
   - We already have `animate-in` classes working
   - Need to verify if tailwindcss-animate is still needed
   
2. **React Flow animations**:
   - Keep in index.css as they're specific to React Flow
   - These work with the library's animation system

3. **Custom keyframes**:
   - Can be added to Tailwind config
   - Or kept in index.css for React Flow specific ones

## Recommendations

1. **Remove tailwindcss-animate**: Appears to be unnecessary with Tailwind v4
2. **Keep React Flow animations**: In index.css as they're library-specific
3. **Migrate PuzzleFocusView animations**: Use Tailwind's animation utilities
4. **Delete CSS Module animation files**: After migration complete