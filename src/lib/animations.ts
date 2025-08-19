/**
 * Animation utilities for ALNRetool
 * Provides consistent animation classes and timing across the application
 * Designed to work with our Tailwind + global CSS architecture
 */

import { cn } from '@/lib/utils';

/**
 * Animation class constants mapping to our global keyframes
 * These map to the @keyframes defined in src/index.css
 */
export const ANIMATION_CLASSES = {
  // Edge animations
  flow: 'animate-flow',
  pulse: 'animate-pulse-glow',
  ripple: 'animate-ripple',
  highlight: 'animate-highlight',
  fade: 'animate-fade-soft',
  
  // General animations
  spin: 'animate-spin',
  fadeIn: 'animate-fade-in',
  slideInRight: 'animate-slide-in-right',
  bounce: 'animate-bounce',
} as const;

/**
 * Animation timing classes for consistent durations
 */
export const ANIMATION_TIMING = {
  instant: 'duration-75',
  fast: 'duration-200',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-700',
  slowest: 'duration-1000',
} as const;

/**
 * Animation easing functions for smooth transitions
 */
export const ANIMATION_EASING = {
  linear: 'ease-linear',
  smooth: 'ease-in-out',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  bounce: 'ease-bounce',
} as const;

/**
 * Animation delay classes for staggered effects
 */
export const ANIMATION_DELAY = {
  none: 'delay-0',
  short: 'delay-75',
  medium: 'delay-150',
  long: 'delay-300',
  longer: 'delay-500',
  longest: 'delay-1000',
} as const;

/**
 * Hover transition classes for interactive elements
 */
export const HOVER_TRANSITIONS = {
  scale: 'transition-transform hover:scale-110',
  scaleSmall: 'transition-transform hover:scale-105',
  scaleLarge: 'transition-transform hover:scale-125',
  glow: 'transition-shadow hover:shadow-lg',
  glowColor: (color: string) => `transition-shadow hover:shadow-[0_0_20px_${color}]`,
  lift: 'transition-all hover:-translate-y-1 hover:shadow-lg',
  opacity: 'transition-opacity hover:opacity-80',
} as const;

/**
 * Group hover patterns for coordinated animations
 */
export const GROUP_HOVER = {
  childScale: 'group-hover:scale-110',
  childGlow: 'group-hover:shadow-lg',
  childOpacity: 'group-hover:opacity-100',
  childTranslate: 'group-hover:translate-x-1',
} as const;

/**
 * Get animation classes for specific edge types
 */
export function getEdgeAnimationClasses(relationshipType: string, isHovered: boolean = false) {
  const baseClasses = ['transition-all', ANIMATION_TIMING.normal];
  
  switch (relationshipType) {
    case 'requirement':
      return cn(
        ...baseClasses,
        isHovered && ANIMATION_CLASSES.pulse,
        'stroke-gray-500 hover:stroke-blue-500'
      );
    
    case 'reward':
      return cn(
        ...baseClasses,
        ANIMATION_CLASSES.flow,
        'stroke-gray-400 hover:stroke-emerald-500',
        isHovered && ANIMATION_TIMING.fast
      );
    
    case 'chain':
    case 'puzzle-grouping':
      return cn(
        ...baseClasses,
        isHovered && ANIMATION_CLASSES.highlight,
        'stroke-gray-700 hover:stroke-amber-500'
      );
    
    case 'virtual-dependency':
      return cn(
        ...baseClasses,
        ANIMATION_CLASSES.fade,
        'stroke-gray-300 hover:stroke-sky-400'
      );
    
    case 'collaboration':
    case 'ownership':
    case 'owner':
      return cn(
        ...baseClasses,
        ANIMATION_CLASSES.ripple,
        'stroke-gray-300 hover:stroke-violet-500'
      );
    
    default:
      return cn(...baseClasses);
  }
}

/**
 * Get animation classes for node types
 */
export function getNodeAnimationClasses(nodeType: string, isHovered: boolean = false) {
  const baseClasses = ['transition-all', ANIMATION_TIMING.normal, ANIMATION_EASING.smooth];
  
  switch (nodeType) {
    case 'puzzle':
      return cn(
        ...baseClasses,
        isHovered && HOVER_TRANSITIONS.lift,
        GROUP_HOVER.childScale
      );
    
    case 'character':
      return cn(
        ...baseClasses,
        isHovered && HOVER_TRANSITIONS.scale,
        GROUP_HOVER.childGlow
      );
    
    case 'element':
      return cn(
        ...baseClasses,
        isHovered && HOVER_TRANSITIONS.glow,
        GROUP_HOVER.childOpacity
      );
    
    case 'timeline':
      return cn(
        ...baseClasses,
        isHovered && HOVER_TRANSITIONS.scaleSmall,
        ANIMATION_CLASSES.fadeIn
      );
    
    default:
      return cn(...baseClasses);
  }
}

/**
 * Performance optimization: Debounce animation state changes
 */
export function debounceAnimation(callback: Function, delay: number = 100) {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get safe animation classes (respects reduced motion preference)
 */
export function getSafeAnimationClasses(classes: string): string {
  if (prefersReducedMotion()) {
    // Remove animation classes but keep transitions for essential feedback
    return classes.replace(/animate-\S+/g, '').trim();
  }
  return classes;
}