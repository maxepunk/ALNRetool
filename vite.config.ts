/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vite configuration for ALNRetool - A visualization and editing tool for "About Last Night" murder mystery game.
 * 
 * This configuration handles:
 * - React 18 + TypeScript build setup with path alias support
 * - Development server with Express.js proxy for backend API
 * - Optimized production builds with tree-shaking and code splitting
 * - Vitest test runner configuration with parallel execution
 * - Code coverage thresholds enforcement (80% minimum)
 * 
 * @see https://vite.dev/config/
 * 
 * Dependencies:
 * - vite: Build tool and dev server
 * - @vitejs/plugin-react: React Fast Refresh and JSX runtime
 * - vite-tsconfig-paths: TypeScript path mapping support (@/* aliases)
 * 
 * Called by:
 * - npm scripts in package.json (dev, build, test commands)
 * - CI/CD pipeline for production builds
 */
export default defineConfig({
  /** Vite plugins configuration */
  plugins: [
    /** React plugin for Fast Refresh and automatic JSX runtime */
    react(), 
    /** TypeScript path mapping plugin to resolve @/* imports to src/* */
    tsconfigPaths()
  ],
  
  /** Production build configuration */
  build: {
    /** Output directory for client-side build artifacts */
    outDir: 'dist/client',
    /** Generate source maps for debugging production issues */
    sourcemap: true,
    /** Rollup-specific build optimizations */
    rollupOptions: {
      /** Tree-shaking configuration for smaller bundle sizes */
      treeshake: {
        /** Use recommended tree-shaking preset for optimal dead code elimination */
        preset: 'recommended',
        /** Assume property reads have no side effects for better tree-shaking */
        propertyReadSideEffects: false,
        /** Don't deoptimize try-catch blocks for better tree-shaking */
        tryCatchDeoptimization: false
      },
      /**
       * Custom warning handler to suppress known non-critical warnings
       * @param warning - Rollup warning object
       * @param warn - Default warning handler
       */
      onwarn(warning, warn) {
        // Suppress circular dependency warnings from React Flow internals
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },
  /** Dependency optimization configuration for faster cold starts */
  optimizeDeps: {
    /** 
     * Exclude React Flow from pre-bundling to avoid issues with its internal structure
     * React Flow handles its own bundling optimizations
     */
    exclude: ['@xyflow/react'],
    /** 
     * Explicitly include these dependencies for pre-bundling to improve dev server startup
     * These are commonly used dependencies that benefit from pre-optimization
     */
    include: [
      'use-sync-external-store',         // React 18 concurrent features support
      'use-sync-external-store/shim/with-selector', // Selector optimization
      'zustand',                         // State management library
      'zustand/traditional',             // Traditional API for Zustand
      'dagre',                          // Graph layout algorithm library
      'dagre/lib/graphlib',             // Graph data structure utilities
      'd3-force'                        // Force-directed graph layout
    ]
  },
  
  /** Development server configuration */
  server: {
    /** API proxy configuration to forward requests to Express backend */
    proxy: {
      '/api': {
        /** Target Express server running on port 3001 */
        target: 'http://localhost:3001',
        /** Rewrite the Origin header to match the target for CORS */
        changeOrigin: true,
      },
    },
  },
  /** Vitest test runner configuration */
  test: {
    /** Enable global test APIs (describe, it, expect) without imports */
    globals: true,
    /** Use happy-dom for fast DOM simulation in tests */
    environment: 'happy-dom',
    /** Setup file executed before each test file */
    setupFiles: './src/test/setup.ts',
    /** Test timeout in milliseconds (10 seconds) */
    testTimeout: 10000,
    /** Use fork-based process pool for test isolation */
    pool: 'forks',
    /** Fork pool configuration for parallel test execution */
    poolOptions: {
      forks: {
        /** Allow parallel execution across multiple forks */
        singleFork: false,
        /** Maximum 4 parallel test processes to balance speed and memory */
        maxForks: 4,
        /** Minimum 1 fork to ensure tests always run */
        minForks: 1,
        /** Isolate each test file in its own process for safety */
        isolate: true,
      }
    },
    /** CSS modules configuration for tests */
    css: {
      modules: {
        /** Use non-scoped class names for simpler test selectors */
        classNameStrategy: 'non-scoped'
      }
    },
    /** Exclude E2E tests that should run with Playwright */
    exclude: [
      'node_modules/**',      // Don't test dependencies
      'dist/**',              // Don't test build output
      'tests/e2e/**',         // E2E tests use Playwright, not Vitest
      '**/*.spec.ts',         // Playwright spec files
    ],
    /** Code coverage configuration with c8 */
    coverage: {
      /** Coverage report formats: console, JSON for CI, HTML for browsing */
      reporter: ['text', 'json', 'html'],
      /** Files to exclude from coverage analysis */
      exclude: [
        'node_modules/',       // Third-party dependencies
        'src/test/',          // Test utilities and setup
        '*.config.ts',        // Configuration files
        '**/*.d.ts',          // TypeScript declaration files
        '**/*.test.ts',       // Test files themselves
        '**/*.test.tsx',      // React component test files
        '**/*.spec.ts',       // Spec files
        '**/*.spec.tsx',      // React spec files
        'tests/e2e/**',       // E2E tests
      ],
      /** Minimum coverage thresholds - build fails if not met */
      thresholds: {
        global: {
          /** 80% minimum branch coverage (if/else paths) */
          branches: 80,
          /** 80% minimum function coverage */
          functions: 80,
          /** 80% minimum line coverage */
          lines: 80,
          /** 80% minimum statement coverage */
          statements: 80,
        },
      },
    },
  },
})
