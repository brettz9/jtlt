import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      'dist',
      'coverage',
      'demo/vendor',
      'demo/codemirror.esm.js'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        IDBKeyRange: 'readonly'
      }
    }
  },
  ...ashNazg(['sauron']),
  {
    rules: {
      'jsdoc/reject-any-type': 0,

      // Temporary only:
      'no-unused-vars': 0,
      'unicorn/prefer-private-class-fields': 0,
      'unicorn/no-undeclared-class-members': 0,

      // AI was frequently making egregious mistakes here, so make fixable
      'jsdoc/check-alignment': 'error',

      // We frequently use callbacks for nested interactions
      'promise/prefer-await-to-callbacks': 0,

      // A strong basis of this library is being able to reference `this`
      'unicorn/no-this-outside-of-class': 0
    }
  },
  {
    files: ['**/*.md/*.js'],
    rules: {
      'import/unambiguous': 'off',
      'import/no-unresolved': 'off',
      'no-console': 'off',
      'no-undef': 'off',
      'sonarjs/no-global-this': 'off'
    }
  },
  {
    files: ['test/**/*.js', 'test.js'],
    rules: {
      'unicorn/prefer-https': 0, // Old namespaces
      // Too many are JSON properties called "children"
      'unicorn/better-dom-traversing': 0,
      'mocha/handle-done-callback': 0, // Buggy?
      'mocha/no-done-twice': 0,
      'mocha/no-code-after-done': 0 // Buggy
    }
  }
];
