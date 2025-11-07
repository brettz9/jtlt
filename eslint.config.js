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
      'sonarjs/public-static-readonly': 'off', // Until ash-nazg disables
      'jsdoc/check-types': 0,
      'jsdoc/reject-any-type': 0,
      'jsdoc/reject-function-type': 0,
      'no-unused-vars': 0,
      'promise/prefer-await-to-callbacks': 0
    }
  },
  {
    files: ['**/*.md/*.js'],
    rules: {
      'import/no-unresolved': 'off',
      'no-console': 'off',
      'no-undef': 'off'
    }
  }
];
