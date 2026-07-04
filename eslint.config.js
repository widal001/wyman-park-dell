// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

// Flat config (ESLint 10). Prettier owns formatting, so `eslint-config-prettier`
// is last to switch off any stylistic rules that would conflict with it.
export default tseslint.config(
  {
    ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'public/'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs['flat/recommended'],
  astro.configs['flat/jsx-a11y-recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Allow the `_`-prefixed convention, incl. the `const _exhaustive: never`
      // exhaustiveness-check idiom.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Presentational block components are under an edit freeze (see project
    // notes). Surface their remaining minor issues as warnings rather than
    // editing the files or failing CI.
    files: ['src/components/blocks/**/*.astro'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      // TS in Astro frontmatter references DOM lib globals (e.g.
      // HTMLElementTagNameMap). TypeScript already checks these, so core
      // no-undef only produces false positives here.
      'no-undef': 'off',
      // `role="list"` on a styled <ul>/<ol> is intentional: `list-style: none`
      // strips list semantics in Safari/VoiceOver and the explicit role
      // restores them. (These live in blocks/* and must not change anyway.)
      'astro/jsx-a11y/no-redundant-roles': 'off',
    },
  },
  prettier,
);
