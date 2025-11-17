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
  ...ashNazg(['sauron']),
  {
    rules: {
      'jsdoc/reject-any-type': 0,

      // Temporary only:
      'no-unused-vars': 0,

      // AI was frequently making egregious mistakes here, so make fixable
      'jsdoc/check-alignment': 'error',

      // We frequently use callbacks for nested interactions
      'promise/prefer-await-to-callbacks': 0
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
  }
];
