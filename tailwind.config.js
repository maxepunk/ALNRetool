/**
 * Tailwind CSS configuration for ALNRetool
 * 
 * This configuration extends Tailwind's default theme to support:
 * - Dark mode via class-based toggle (controlled by React state)
 * - Custom color schemes for graph node types (puzzle, character, element, timeline)
 * - Integration with CSS variables for theme consistency
 * - Content scanning for optimal CSS generation
 * 
 * The configuration uses Tailwind v4 with PostCSS plugin architecture.
 * All custom colors are designed to work in both light and dark modes
 * with appropriate contrast ratios for accessibility.
 * 
 * Dependencies:
 * - tailwindcss: Core Tailwind CSS framework
 * - @tailwindcss/postcss: PostCSS plugin for Tailwind v4
 * 
 * Called by:
 * - postcss.config.js during build process
 * - Vite's CSS processing pipeline
 * 
 * @type {import('tailwindcss').Config}
 */
export default {
  /**
   * Dark mode strategy: 'class' based
   * Toggles dark mode when 'dark' class is added to <html> element
   * Controlled by ThemeToggle component in the UI
   */
  darkMode: 'class',
  
  /**
   * Content paths for Tailwind to scan for class usage
   * This determines which files are analyzed to generate the final CSS
   */
  content: [
    /** HTML entry point for the application */
    "./index.html",
    /** All JavaScript and TypeScript files in src directory */
    "./src/**/*.{js,ts,jsx,tsx}",
    /** EXCLUSION: Skip CSS Module files to avoid conflicts with module styles */
    "!./src/**/*.module.css"
  ],
  
  /**
   * Theme customization - extends Tailwind's default theme
   */
  theme: {
    extend: {
      /**
       * Custom color palette for ALNRetool
       * Organized by purpose and entity type
       */
      /**
       * Custom animations for UI components
       */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      },
      colors: {
        /**
         * Base theme colors - mapped to CSS variables
         * These adapt automatically to light/dark mode changes
         */
        /** Primary background color from CSS variable */
        background: 'var(--background-primary)',
        /** Primary text color from CSS variable */
        foreground: 'var(--text-primary)',
        /** Primary border color from CSS variable */
        border: 'var(--border-primary)',
        
        /**
         * Puzzle node colors - amber/orange theme
         * Used for puzzle nodes in the graph visualization
         */
        puzzle: {
          /** Default puzzle color - amber-500 */
          DEFAULT: '#f59e0b',
          /** Light variant for hover/active states - amber-400 */
          light: '#fbbf24',
          /** Dark variant for emphasis - amber-600 */
          dark: '#d97706',
        },
        
        /**
         * Character node colors - green theme
         * Used for character nodes in the graph visualization
         */
        character: {
          /** Default character color - emerald-500 */
          DEFAULT: '#10b981',
          /** Light variant for hover/active states - emerald-400 */
          light: '#34d399',
          /** Dark variant for emphasis - emerald-600 */
          dark: '#059669',
        },
        
        /**
         * Element node colors - purple theme
         * Used for story element nodes in the graph visualization
         */
        element: {
          /** Default element color - violet-500 */
          DEFAULT: '#8b5cf6',
          /** Light variant for hover/active states - violet-400 */
          light: '#a78bfa',
          /** Dark variant for emphasis - violet-600 */
          dark: '#7c3aed',
        },
        
        /**
         * Timeline node colors - orange theme
         * Used for timeline event nodes in the graph visualization
         */
        timeline: {
          /** Default timeline color - orange-500 */
          DEFAULT: '#f97316',
          /** Light variant for hover/active states - orange-400 */
          light: '#fb923c',
          /** Dark variant for emphasis - orange-600 */
          dark: '#ea580c',
        },
      },
    },
  },
  
  /**
   * Tailwind plugins array
   * - tailwindcss-animate: Provides animation utilities for shadcn/ui components
   * Potential future plugins: forms, typography, aspect-ratio
   */
  plugins: [require("tailwindcss-animate")],
}