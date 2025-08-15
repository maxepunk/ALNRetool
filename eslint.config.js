import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    // Global ignores
    ignores: ['dist', 'node_modules', '.DS_Store'],
  },
  {
    // Files to which the rules will apply - src files
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginReactRefresh,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Start with recommended rules from our plugins
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      // Custom rule adjustments for MVP pragmatism
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for MVP flexibility
      
      // Quality improvements
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      
      // Ensure React is in scope for JSX
      'react/react-in-jsx-scope': 'off', // Not needed with modern React/Vite
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  },
  {
    // Files to which the rules will apply - server only
    files: ['server/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.server.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Start with recommended rules from TypeScript
      ...tseslint.configs.recommendedTypeChecked.rules,
      
      // Custom rule adjustments for server
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    },
  },
  {
    // Scripts get basic TypeScript linting without project-aware rules
    files: ['scripts/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Basic TypeScript rules without type checking
      ...tseslint.configs.recommended.rules,
      
      // Custom rule adjustments for scripts
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Relaxed rules for test files and demos
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/test-*.{ts,tsx}', '**/*Demo.{ts,tsx}', '**/mock*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      'react-refresh/only-export-components': 'off', // Allow mixed exports in test utilities
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in tests for readability
    },
  },
  // This must be the last configuration.
  eslintConfigPrettier 
)
