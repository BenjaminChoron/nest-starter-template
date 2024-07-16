module.exports = {
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: 'tsconfig.json',
      },
    },
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:jest/recommended',
    'plugin:jest-formatting/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', , 'import', 'jest', 'jest-formatting', 'regex'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-base-to-string': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/member-ordering': ['error'],
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: ['class', 'interface', 'typeParameter'], format: ['PascalCase'] },
      { selector: 'classMethod', format: ['camelCase'] },
      {
        selector: 'classProperty',
        format: ['camelCase', 'UPPER_CASE'],
        filter: { regex: '^_(id|brand)$', match: false },
      },
      {
        selector: 'variableLike',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        filter: { regex: '^_$', match: false },
      },
      {
        selector: ['accessor', 'classProperty', 'parameter', 'typeProperty', 'variable'],
        types: ['boolean'],
        format: ['PascalCase'],
        prefix: [
          'are',
          'can',
          'did',
          'does',
          'do',
          'has',
          'have',
          'is',
          'should',
          'wants',
          'want',
          'was',
          'were',
          'will',
          'would',
        ],
      },
    ],
    complexity: ['error', 8],
    'prefer-const': 'error',
    // List of quotes from https://www.cl.cam.ac.uk/~mgk25/ucs/quotes.html
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/\u0060|\u00B4|\u2018|\u2019|\u201C|\u201D/]',
        message: 'Special quote characters are not allowed',
      },
    ],
    //#region Empty lines
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: '*',
        next: ['break', 'return', 'throw', 'try'],
      },
      { blankLine: 'always', prev: '*', next: 'block-like' },
      { blankLine: 'always', prev: 'block-like', next: '*' },
    ],
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 1 }],
    //#endregion Empty lines
    //#region Imports
    'import/newline-after-import': ['error', { count: 1 }],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['*[A-Z]*'],
            caseSensitive: true,
            message: 'Uppercase letters in imports filenames are not allowed',
          },
        ],
      },
    ],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    'regex/invalid': [
      'error',
      [
        {
          id: 'EmptyImport',
          message: 'Cannot accept empty import',
          regex: 'import(.*{\\s*}.*)from',
          replacement: {
            function:
              "return $[1].replace(/\\s/g, '') !== '{}' ? $[0].replace(/,?\\s{\\s*},?\\s/, ' ') : $[0]",
          },
        },
      ],
    ],
    //#endregion Imports
    //#region Tests
    'jest/expect-expect': [
      'error',
      {
        assertFunctionNames: ['expect', '**.expect'],
      },
    ],
    'jest/valid-title': [
      'error',
      {
        ignoreTypeOfDescribeName: true,
      },
    ],
    'jest/no-restricted-matchers': [
      // https://github.com/andredesousa/javascript-unit-testing-best-practices?tab=readme-ov-file#avoid-tobetruthy-or-tobefalsy
      'error',
      {
        toBeTruthy: 'Avoid "toBeTruthy"',
        toBeFalsy: 'Avoid "toBeFalsy"',
      },
    ],
    //#endregion Tests
  },
};
