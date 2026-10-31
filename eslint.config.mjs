import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["node_modules/**/*", ".next/**/*", ".vercel/**/*", "dist/**/*", "out/**/*", "scripts/legacy/**/*", "scripts/setup-demo-accounts.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "off"
    },
  },
  {
    // Node scripts (database tooling, test stack, importer): Node globals instead of browser ones
    files: ["db/**/*.mjs", "e2e/**/*.mjs", "scripts/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", URL: "readonly", fetch: "readonly", Buffer: "readonly" },
    },
  },
  {
    // One data path (docs/ENGINEERING.md): pages and components read and write through the API
    // routes, never with the browser Supabase client. Only sign-in/sign-up and sign-out use it.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    ignores: ["app/auth/**", "components/sidebar.tsx", "lib/supabase/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/lib/supabase/client", "**/lib/supabase/client"],
          message: "Use the API routes (requireRole + zod) for data, or lib/supabase/server in server code. See docs/ENGINEERING.md.",
        }],
      }],
    },
  },
];
