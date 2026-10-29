import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // 464 occurrences of `any` remain across the app. They are a real debt
      // item but not a build blocker, and a rule that is always red is a rule
      // nobody reads. Tracked as warnings so new code is visible in the diff.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-ignore": "allow-with-description" }],
    },
  },
  {
    // Build/tooling configs legitimately use CommonJS require().
    files: ["*.config.{js,ts}", "scripts/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // The backend is CommonJS (ts-node-dev / tsc → CJS). Dynamic require() is
    // intentional for optional deps (pdf-parse, firebase-admin credentials).
    files: ["backend/**/*.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
