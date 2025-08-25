/**
 * PostCSS configuration for ALNRetool
 * 
 * PostCSS is a tool for transforming CSS with JavaScript plugins.
 * This configuration sets up the CSS processing pipeline for the application,
 * handling Tailwind CSS compilation and browser compatibility.
 * 
 * Processing pipeline:
 * 1. Tailwind CSS v4 plugin processes utility classes and custom styles
 * 2. Autoprefixer adds vendor prefixes for browser compatibility
 * 
 * The configuration is minimal and focused on production-ready CSS output
 * with optimal browser support and Tailwind utility class generation.
 * 
 * Dependencies:
 * - @tailwindcss/postcss: Tailwind v4 PostCSS plugin for CSS generation
 * - autoprefixer: Adds vendor prefixes based on browserslist config
 * 
 * Called by:
 * - Vite during development (via vite.config.ts)
 * - Vite during production build
 * - Any CSS processing in the build pipeline
 * 
 * Reads configuration from:
 * - tailwind.config.js for Tailwind settings
 * - browserslist in package.json for autoprefixer targets
 */
export default {
  /**
   * PostCSS plugins configuration
   * Plugins are processed in the order they are defined
   */
  plugins: {
    /**
     * Tailwind CSS v4 PostCSS plugin
     * Processes Tailwind directives (@tailwind, @apply, etc.)
     * Generates utility classes based on tailwind.config.js
     * Handles JIT (Just-In-Time) compilation for optimal CSS size
     * 
     * Empty object uses default configuration from tailwind.config.js
     */
    '@tailwindcss/postcss': {},
    
    /**
     * Autoprefixer plugin
     * Automatically adds vendor prefixes to CSS rules
     * Uses Can I Use database to determine necessary prefixes
     * Targets browsers defined in package.json browserslist
     * 
     * Examples of prefixes added:
     * - display: flex → display: -webkit-box; display: -ms-flexbox; display: flex
     * - user-select: none → -webkit-user-select: none; -moz-user-select: none; user-select: none
     * 
     * Empty object uses default configuration and browserslist targets
     */
    autoprefixer: {},
  },
}