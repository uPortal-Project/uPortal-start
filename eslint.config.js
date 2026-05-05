import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import unicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';
import noJquery from 'eslint-plugin-no-jquery';

export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // Configuration for all TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      // Test files run a mix of Node (Playwright runner) and browser code
      // (callbacks passed to page.evaluate / page.waitForFunction execute in
      // the browser). Declare both global namespaces so ESLint's no-undef
      // rule doesn't flag legitimate uses of `window`, `document`, etc.
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        NodeListOf: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      unicorn,
      playwright,
      sonarjs,
      'no-jquery': noJquery,
    },
    rules: {
      // Include TypeScript ESLint recommended rules
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,

      // Include Unicorn plugin recommended rules
      ...unicorn.configs.recommended.rules,

      // Include Playwright plugin recommended rules
      ...playwright.configs.recommended.rules,

      // Include SonarJS plugin recommended rules
      ...sonarjs.configs.recommended.rules,

      // Include no-jquery plugin rules to ban all uses of jQuery
      ...noJquery.configs.all.rules,
    },
  },
];
