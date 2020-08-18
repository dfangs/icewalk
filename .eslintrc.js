module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    'no-unused-vars': 1,
    'react/prop-types': 0, // Disable PropTypes
  },
  settings: {
    // Consult plugin's GitHub for more options
    react: {
      version: 'detect',
    },
  },
};
