import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
	...nextVitals,
	...nextTypeScript,
	{
		settings: {
			next: { rootDir: "apps/web/" },
			react: { version: "19.2" },
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
		},
	},
	prettier,
	globalIgnores([
		"**/.next/**",
		"**/.pnpm-store/**",
		"**/.vercel/**",
		"**/.wrangler/**",
		"**/coverage/**",
		"**/dist/**",
		"**/node_modules/**",
		"tmp/**",
		"**/.secrets.json",
		"apps/api/worker-configuration.d.ts",
		"apps/web/next-env.d.ts",
	]),
]);
