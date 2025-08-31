/**
 * @fileoverview Application entry point for ALNRetool
 * @module main
 * 
 * This is the main entry point that bootstraps the React application
 * into the DOM. It sets up React 18's concurrent features with createRoot
 * and enables StrictMode for development debugging.
 * 
 * @dependencies
 * - react: Core React library
 * - react-dom/client: React 18 DOM rendering
 * - index.css: Global styles and Tailwind directives
 * - App: Root application component
 * 
 * @calledBy index.html (via Vite)
 * @calls App component
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Bootstrap the React application into the DOM
 * 
 * Uses React 18's createRoot API for concurrent features:
 * - Automatic batching of state updates
 * - Concurrent rendering capabilities
 * - Improved hydration performance
 * 
 * StrictMode enables:
 * - Double-invocation of components in development
 * - Warnings about deprecated lifecycle methods
 * - Detection of unexpected side effects
 * 
 * @complexity O(n) where n is the component tree size
 * @performance Initial render triggers full component tree mount
 * 
 * @throws {Error} If root element is not found in DOM
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
