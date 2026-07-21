// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      eqeqeq: ["error", "always"],       // == 금지, === 강제
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",  // request: any 워크어라운드 있으니 error 아닌 warn으로
    },
  },
  {
    ignores: ["src/generated/**", "dist/**", "node_modules/**"],
  },
  eslintConfigPrettier,
);