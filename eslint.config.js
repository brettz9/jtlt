import ashNazg from 'eslint-config-ash-nazg';

export default [
  {
    ignores: [
      'dist'
    ]
  },
  ...ashNazg(['sauron']),
  {
    rules: {
      // Temporary only:
      'no-unused-vars': 0,
      'jsdoc/check-types': 0,
      'jsdoc/reject-any-type': 0,
      'jsdoc/reject-function-type': 0,

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
      'no-undef': 'off'
    }
  }
];
