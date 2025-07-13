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
    // Files to which the rules will apply
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.app.json', // Point to correct tsconfig
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
      
      // Ensure React is in scope for JSX
      'react/react-in-jsx-scope': 'off', // Not needed with modern React/Vite
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  },
  // This must be the last configuration.
  eslintConfigPrettier 
)
