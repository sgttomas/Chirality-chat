module.exports = {
  extends: ["next/core-web-vitals"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Disable strict rules that might cause issues during development
    "@typescript-eslint/no-unused-vars": "warn",
    "@next/next/no-img-element": "warn",
  },
};
