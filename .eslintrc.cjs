module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    // Disable strict rules that might cause issues during development
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "warn",
  },
};
