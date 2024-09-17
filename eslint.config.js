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
