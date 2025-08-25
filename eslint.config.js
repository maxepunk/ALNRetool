/**
 * ESLint configuration for ALNRetool - Flat config format (ESLint v9+)
 * 
 * This configuration enforces code quality and consistency across:
 * - Frontend React TypeScript code (src/*)
 * - Backend Express TypeScript code (server/*)
 * - Debug/utility scripts (scripts/*)
 * - Test files with relaxed rules
 * 
 * Key features:
 * - TypeScript type-aware linting for better type safety
 * - React and React Hooks best practices enforcement
 * - Security rule preventing direct process.env access (must use config module)
 * - Prettier integration to avoid style conflicts
 * - Different rule sets for different parts of the codebase
 * 
 * Dependencies imported:
 * - globals: Environment-specific global variables
 * - typescript-eslint: TypeScript linting rules and parser
 * - eslint-plugin-react: React-specific linting rules
 * - eslint-plugin-react-hooks: React Hooks rules (dependencies, exhaustive deps)
 * - eslint-plugin-react-refresh: Fast Refresh compatibility rules
 * - eslint-config-prettier: Disables ESLint rules that conflict with Prettier
 * 
 * Called by:
 * - npm run lint command
 * - VS Code ESLint extension (real-time linting)
 * - Pre-commit hooks (if configured)
 * - CI/CD pipeline for code quality checks
 */
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'

/**
 * ESLint flat configuration export
 * Configurations are applied in order, with later configs overriding earlier ones
 */
export default tseslint.config(
  /**
   * Configuration 1: Global ignore patterns
   * Files and directories that should never be linted
   */
  {
    /** Patterns for files/folders to completely ignore during linting */
    ignores: [
      'dist',         // Build output directory
      'node_modules', // Third-party dependencies
      '.DS_Store'     // macOS system files
    ],
  },
  
  /**
   * Configuration 2: Frontend React TypeScript files
   * Applies to all source files in src directory
   */
  {
    /** Target all TypeScript and TypeScript React files in src */
    files: ['src/**/*.{ts,tsx}'],
    
    /** Language configuration for parsing and environment */
    languageOptions: {
      /** Available global variables from both browser and Node.js environments */
      globals: { ...globals.browser, ...globals.node },
      /** Use TypeScript ESLint parser for proper TS/TSX parsing */
      parser: tseslint.parser,
      /** Parser options for type-aware linting */
      parserOptions: {
        /** TypeScript config file for frontend code */
        project: './tsconfig.app.json',
        /** Root directory for resolving tsconfig paths */
        tsconfigRootDir: import.meta.dirname,
      },
    },
    
    /** ESLint plugins providing additional rules */
    plugins: {
      react: pluginReact,                          // React-specific rules
      'react-hooks': pluginReactHooks,             // React Hooks rules
      'react-refresh': pluginReactRefresh,         // Fast Refresh compatibility
      '@typescript-eslint': tseslint.plugin,       // TypeScript rules
    },
    
    /** Linting rules configuration */
    rules: {
      /** Base recommended rules from TypeScript ESLint with type checking */
      ...tseslint.configs.recommendedTypeChecked.rules,
      /** React recommended rules for JSX and component best practices */
      ...pluginReact.configs.recommended.rules,
      /** React Hooks rules for dependency arrays and exhaustive deps */
      ...pluginReactHooks.configs.recommended.rules,

      /** React Fast Refresh: Ensure components are exported correctly for HMR */
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }, // Allow const exports alongside components
      ],
      
      /** TypeScript: Warn on unused variables, ignore underscore-prefixed args */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }, // Common convention for intentionally unused params
      ],
      
      /** TypeScript: Warn on 'any' type usage (pragmatic for MVP development) */
      '@typescript-eslint/no-explicit-any': 'warn',
      
      /** Code quality: Prefer ?? over || for null/undefined checks */
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      /** Code quality: Prefer ?. for optional chaining */
      '@typescript-eslint/prefer-optional-chain': 'warn',
      /** Code quality: Remove unnecessary type assertions */
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      
      /** React: Disable requirement for React import (auto-injected by Vite) */
      'react/react-in-jsx-scope': 'off',
    },
    
    /** Plugin-specific settings */
    settings: {
      react: {
        /** Automatically detect installed React version for version-specific rules */
        version: 'detect',
      },
    },
  },
  /**
   * Configuration 3: Backend Express TypeScript files
   * Server-side Node.js code with stricter security rules
   */
  {
    /** Target all TypeScript files in server directory */
    files: ['server/**/*.{ts,tsx}'],
    
    /** Language configuration for Node.js environment */
    languageOptions: {
      /** Node.js global variables only (no browser globals) */
      globals: { ...globals.node },
      /** TypeScript ESLint parser */
      parser: tseslint.parser,
      /** Parser options for server TypeScript config */
      parserOptions: {
        /** TypeScript config file for backend code */
        project: './tsconfig.server.json',
        /** Root directory for resolving tsconfig paths */
        tsconfigRootDir: import.meta.dirname,
      },
    },
    
    /** Plugins for server-side linting */
    plugins: {
      '@typescript-eslint': tseslint.plugin, // TypeScript-specific rules
    },
    
    /** Server-specific linting rules */
    rules: {
      /** TypeScript recommended rules with type checking */
      ...tseslint.configs.recommendedTypeChecked.rules,
      
      /** TypeScript: Warn on unused variables, ignore underscore-prefixed */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      /** TypeScript: Pragmatic 'any' usage for server code */
      '@typescript-eslint/no-explicit-any': 'warn',
      /** Code quality: Prefer nullish coalescing operator */
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      /** Code quality: Prefer optional chaining */
      '@typescript-eslint/prefer-optional-chain': 'warn',
      /** Code quality: Remove unnecessary type assertions */
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      
      /**
       * SECURITY RULE: Prevent direct process.env access
       * All environment variables must be accessed through the centralized
       * config module (server/config/index.js) which provides validation,
       * type safety, and centralized management of all configuration.
       * 
       * This rule uses AST selectors to detect process.env.* access patterns
       * and throws an error to enforce the architectural decision.
       */
      'no-restricted-syntax': [
        'error',
        {
          /** AST selector matching process.env.* access */
          selector: 'MemberExpression[object.object.name="process"][object.property.name="env"]',
          /** Error message shown when violation detected */
          message: 'Direct process.env access is forbidden. Use the config module from server/config/index.js instead.',
        },
      ],
    },
  },
  /**
   * Configuration 4: Config module exemption
   * Special exception for configuration files that need process.env access
   */
  {
    /** Config files are the only place allowed to access process.env directly */
    files: ['server/config/**/*.{ts,tsx}'],
    rules: {
      /** Disable the process.env restriction for config modules only */
      'no-restricted-syntax': 'off',
    },
  },
  
  /**
   * Configuration 5: Utility scripts
   * Debug scripts and tools with relaxed type checking
   */
  {
    /** Target TypeScript files in scripts directory */
    files: ['scripts/**/*.{ts,tsx}'],
    
    /** Language configuration for Node.js scripts */
    languageOptions: {
      /** Node.js globals for script environment */
      globals: { ...globals.node },
      /** TypeScript parser */
      parser: tseslint.parser,
      /** Basic parser options without type-aware linting */
      parserOptions: {
        /** Use latest ECMAScript features */
        ecmaVersion: 'latest',
        /** ES modules syntax */
        sourceType: 'module',
      },
    },
    
    /** TypeScript plugin for basic rules */
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    
    /** Script-specific rules (no type checking for performance) */
    rules: {
      /** Basic TypeScript rules without type information */
      ...tseslint.configs.recommended.rules,
      
      /** TypeScript: Warn on unused variables */
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      /** TypeScript: Allow 'any' in utility scripts */
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  
  /**
   * Configuration 6: Test files and demos
   * Relaxed rules for test code, mocks, and demo components
   */
  {
    /** Match all test-related files across the codebase */
    files: [
      '**/*.test.{ts,tsx}',        // Test files with .test extension
      '**/__tests__/**/*.{ts,tsx}', // Files in __tests__ directories
      '**/test-*.{ts,tsx}',         // Files prefixed with test-
      '**/*Demo.{ts,tsx}',          // Demo components
      '**/mock*.{ts,tsx}'           // Mock files and utilities
    ],
    
    /** Relaxed rules for test code */
    rules: {
      /** Allow 'any' type in tests for flexibility */
      '@typescript-eslint/no-explicit-any': 'off',
      /** Allow mixed exports in test utilities and fixtures */
      'react-refresh/only-export-components': 'off',
      /** Allow unused variables in tests for better readability */
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  
  /**
   * Configuration 7: Prettier compatibility
   * MUST BE LAST - Disables all ESLint rules that conflict with Prettier
   * This ensures formatting is handled by Prettier, not ESLint
   */
  eslintConfigPrettier 
)
