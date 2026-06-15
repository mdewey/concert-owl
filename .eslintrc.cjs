module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
    'jest': true,
  },
  'extends': 'google',
  'overrides': [
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'rules': {
    'semi': [1, 'always'],
    'max-len': [1, { 'code': 90 }],
    'no-var': 2,
    'no-undef': 2,
    'object-curly-spacing': [1, 'always'],
    'indent': [1, 2],
    'linebreak-style': 0,
    'require-jsdoc': 0,
    'valid-jsdoc': 0,
  },
};
