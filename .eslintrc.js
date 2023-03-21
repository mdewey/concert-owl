module.exports = {
    'env': {
        'browser': true,
        'commonjs': true,
        'es2021': true,
        'node': true,
    },
    'extends': 'google',
    'overrides': [
    ],
    'parserOptions': {
        'ecmaVersion': 'latest',
    },
    'rules': {
        'rules': {
            'semi': [1, 'always'],
            'max-len': [1, { 'code': 80 }],
            'no-var': 2,
            'no-undeclared': 2,
        },
    },
};
