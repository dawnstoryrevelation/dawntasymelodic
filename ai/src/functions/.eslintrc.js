module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2021, // Keep this for modern syntax
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "comma-dangle": ["error", "always-multiline"],
    // Enforce Unix linebreaks (LF)
    "linebreak-style": ["error", "unix"],
    // Relax max-len slightly and ignore common long items
    "max-len": ["error", {
      "code": 100, // Increased from 80 to 100
      "ignoreComments": true,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
      "ignoreRegExpLiterals": true,
    }],
    // Keep this if you plan to use admin later, otherwise remove admin import
    // "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};